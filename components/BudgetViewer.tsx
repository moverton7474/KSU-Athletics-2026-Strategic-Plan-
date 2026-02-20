
import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, DollarSign, TrendingUp, TrendingDown, BarChart3, Loader2, X, Brain, Mic } from 'lucide-react';
import { BudgetSummary, BudgetLineItem, parseBudgetExcel } from '../lib/notebookLmSync';
import { GoogleGenAI } from '@google/genai';

interface BudgetViewerProps {
  budgetData?: BudgetSummary;
  onBudgetParsed: (summary: BudgetSummary) => void;
  knowledgeBase: any;
}

export const BudgetViewer: React.FC<BudgetViewerProps> = ({ budgetData, onBudgetParsed, knowledgeBase }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'expenses' | 'capital'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const summary = await parseBudgetExcel(file);
      onBudgetParsed(summary);
    } catch (err) {
      console.error('Budget parse failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const runAiAnalysis = async () => {
    if (!budgetData) return;
    setIsAnalyzing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `You are the KSU Athletics CFO/Strategic Analyst. Analyze this FY 2026 budget data and provide executive insights:

BUDGET SUMMARY:
- Total Revenue: $${budgetData.totalRevenue.toLocaleString()}
- Total Expenses: $${budgetData.totalExpenses.toLocaleString()}
- Net Position: $${budgetData.netPosition.toLocaleString()}
- Capital Projects: ${budgetData.capitalProjects.length} items

TOP REVENUE CATEGORIES:
${Object.entries(budgetData.revenueByCategory).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 10).map(([k,v]) => `- ${k}: $${(v as number).toLocaleString()}`).join('\n')}

TOP EXPENSE CATEGORIES:
${Object.entries(budgetData.expenseByCategory).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 10).map(([k,v]) => `- ${k}: $${(v as number).toLocaleString()}`).join('\n')}

STRATEGIC CONTEXT:
${JSON.stringify(knowledgeBase?.coreObjectives || [])}

Provide: 1) 3-sentence executive summary, 2) Top 3 risk areas, 3) Alignment with the $10M revenue pipeline goal, 4) Key budget gaps that need attention. Be specific with dollar amounts.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiAnalysis(response.text || 'Analysis unavailable.');
    } catch {
      setAiAnalysis('AI analysis failed. Check API key configuration.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  // ── Upload State ─────────────────────────────────────────────
  if (!budgetData) {
    return (
      <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center hover:border-yellow-500 transition-all">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-6">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight mb-2">
          {isUploading ? 'Parsing Budget...' : 'Upload FY 2026 Budget'}
        </h3>
        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-6">
          FY 2026 Budget FINAL 061325.xlsx
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-black text-yellow-500 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Select Excel File
        </button>
      </div>
    );
  }

  // ── Budget Dashboard ─────────────────────────────────────────
  const topRevenue = Object.entries(budgetData.revenueByCategory).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 8);
  const topExpenses = Object.entries(budgetData.expenseByCategory).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] hover:border-green-500 transition-all">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Revenue</span>
          <h4 className="text-3xl font-black text-green-600">{formatCurrency(budgetData.totalRevenue)}</h4>
          <span className="text-[9px] text-gray-400 font-bold">{budgetData.fiscalYear}</span>
        </div>
        <div className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] hover:border-red-500 transition-all">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Expenses</span>
          <h4 className="text-3xl font-black text-red-600">{formatCurrency(budgetData.totalExpenses)}</h4>
          <span className="text-[9px] text-gray-400 font-bold">{budgetData.lineItems.length} line items</span>
        </div>
        <div className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] hover:border-yellow-500 transition-all">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Net Position</span>
          <h4 className={`text-3xl font-black ${budgetData.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(budgetData.netPosition)}
          </h4>
          {budgetData.netPosition >= 0 ? <TrendingUp className="w-4 h-4 text-green-500 inline" /> : <TrendingDown className="w-4 h-4 text-red-500 inline" />}
        </div>
        <div className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] hover:border-blue-500 transition-all">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Capital Projects</span>
          <h4 className="text-3xl font-black text-blue-600">{budgetData.capitalProjects.length}</h4>
          <span className="text-[9px] text-gray-400 font-bold">Active</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl w-fit">
        {(['overview', 'revenue', 'expenses', 'capital'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
              activeTab === tab ? 'bg-black text-yellow-500 shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-tight">Budget Overview</h3>
              <button
                onClick={runAiAnalysis}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 bg-black text-yellow-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                <span>{isAnalyzing ? 'Analyzing...' : 'AI Budget Analysis'}</span>
              </button>
            </div>

            {aiAnalysis && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="w-4 h-4 text-yellow-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">AI Strategic Analysis</span>
                </div>
                <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Top Revenue Sources</h4>
                <div className="space-y-2">
                  {topRevenue.map(([name, amount], i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-[11px] font-bold text-gray-700 truncate max-w-[200px]">{name}</span>
                      <span className="text-[11px] font-black text-green-600">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Top Expense Categories</h4>
                <div className="space-y-2">
                  {topExpenses.map(([name, amount], i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-[11px] font-bold text-gray-700 truncate max-w-[200px]">{name}</span>
                      <span className="text-[11px] font-black text-red-600">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="p-8">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6">Revenue Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(budgetData.revenueByCategory).sort(([,a],[,b]) => (b as number) - (a as number)).map(([name, amount], i) => {
                const amt = amount as number;
                const pct = budgetData.totalRevenue > 0 ? (amt / budgetData.totalRevenue) * 100 : 0;
                return (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-gray-700">{name}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-[9px] text-gray-400 font-bold">{pct.toFixed(1)}%</span>
                        <span className="text-[11px] font-black text-green-600">{formatCurrency(amt)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="p-8">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6">Expense Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(budgetData.expenseByCategory).sort(([,a],[,b]) => (b as number) - (a as number)).map(([name, amount], i) => {
                const amt = amount as number;
                const pct = budgetData.totalExpenses > 0 ? (amt / budgetData.totalExpenses) * 100 : 0;
                return (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-gray-700">{name}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-[9px] text-gray-400 font-bold">{pct.toFixed(1)}%</span>
                        <span className="text-[11px] font-black text-red-600">{formatCurrency(amt)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'capital' && (
          <div className="p-8">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6">Capital Projects</h3>
            {budgetData.capitalProjects.length === 0 ? (
              <p className="text-[11px] text-gray-400 font-bold">No capital projects detected in budget file.</p>
            ) : (
              <div className="space-y-3">
                {budgetData.capitalProjects.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div>
                      <span className="text-[11px] font-black text-gray-800">{item.subcategory}</span>
                      <span className="block text-[9px] text-gray-400 font-bold">{item.category}</span>
                    </div>
                    <span className="text-[13px] font-black text-blue-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync Info */}
      <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold uppercase tracking-widest">
        <span>Source: {budgetData.source}</span>
        <span>Synced: {new Date(budgetData.lastSynced).toLocaleString()}</span>
      </div>
    </div>
  );
};
