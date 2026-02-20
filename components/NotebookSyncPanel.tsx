
import React, { useState } from 'react';
import { BookOpen, Loader2, CheckCircle, AlertCircle, RefreshCw, Database, Wifi, WifiOff, ExternalLink, FileSpreadsheet, Upload } from 'lucide-react';
import { NOTEBOOKLM_CONFIG, notebookLmClient } from '../lib/notebookLmMcp';
import { syncNotebookToKnowledgeBase, syncBudgetOnly, NotebookSyncResult, ExtendedKnowledgeBase } from '../lib/notebookLmSync';
import { enterpriseClient } from '../lib/notebookLmEnterprise';

interface NotebookSyncPanelProps {
  knowledgeBase: ExtendedKnowledgeBase;
  onKbUpdated: (kb: ExtendedKnowledgeBase) => void;
  onNotification: (msg: string, type: 'success' | 'info' | 'action') => void;
}

type ConnectionStatus = 'checking' | 'mcp' | 'enterprise' | 'offline';

export const NotebookSyncPanel: React.FC<NotebookSyncPanelProps> = ({
  knowledgeBase,
  onKbUpdated,
  onNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<NotebookSyncResult | null>(null);
  const [budgetFile, setBudgetFile] = useState<File | null>(null);

  const checkConnection = async () => {
    setConnectionStatus('checking');

    // Try Enterprise API first
    try {
      if (await enterpriseClient.isAvailable()) {
        setConnectionStatus('enterprise');
        return;
      }
    } catch { /* continue */ }

    // Try MCP proxy
    try {
      const health = await notebookLmClient.checkHealth();
      if (health.status === 'ok') {
        setConnectionStatus('mcp');
        return;
      }
    } catch { /* continue */ }

    setConnectionStatus('offline');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    onNotification('Syncing NotebookLM...', 'action');

    try {
      const { updatedKb, result } = await syncNotebookToKnowledgeBase(
        knowledgeBase,
        budgetFile || undefined
      );

      onKbUpdated(updatedKb);
      setLastResult(result);

      if (result.success) {
        onNotification(
          `Synced: ${result.budgetItemsIngested} budget items, ${result.notebookAnswers} notebook insights`,
          'success'
        );
      } else {
        onNotification(`Partial sync: ${result.errors.join('; ')}`, 'info');
      }
    } catch (e: any) {
      onNotification(`Sync failed: ${e.message}`, 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBudgetOnly = async () => {
    if (!budgetFile) return;
    setIsSyncing(true);
    onNotification('Parsing budget file...', 'action');

    try {
      const { updatedKb, summary } = await syncBudgetOnly(knowledgeBase, budgetFile);
      onKbUpdated(updatedKb);
      onNotification(
        `Budget ingested: ${summary.lineItems.length} items, ${Object.keys(summary.revenueByCategory).length} revenue categories`,
        'success'
      );
    } catch (e: any) {
      onNotification(`Budget parse failed: ${e.message}`, 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); checkConnection(); }}
        className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>Notebook Sync</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[55] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-4xl max-w-lg w-full max-h-[80vh] overflow-y-auto border-2 border-gray-100">
        {/* Header */}
        <div className="bg-black text-white px-8 py-6 rounded-t-[2.5rem] border-b-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-500 p-2 rounded-xl text-black">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="font-black uppercase text-[11px] tracking-widest">NotebookLM Sync</h2>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Knowledge Base Intelligence Pipeline
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white text-lg">&times;</button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between bg-gray-50 px-5 py-4 rounded-2xl">
            <div className="flex items-center space-x-3">
              {connectionStatus === 'checking' && <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />}
              {connectionStatus === 'mcp' && <Wifi className="w-4 h-4 text-green-500" />}
              {connectionStatus === 'enterprise' && <Database className="w-4 h-4 text-blue-500" />}
              {connectionStatus === 'offline' && <WifiOff className="w-4 h-4 text-gray-400" />}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {connectionStatus === 'checking' && 'Checking connection...'}
                  {connectionStatus === 'mcp' && 'MCP Proxy Connected'}
                  {connectionStatus === 'enterprise' && 'Enterprise API Connected'}
                  {connectionStatus === 'offline' && 'Offline (Budget-Only Mode)'}
                </span>
                <span className="block text-[8px] text-gray-400 font-bold">
                  {connectionStatus === 'offline' && 'Start proxy: npx ts-node server/notebookLmProxy.ts'}
                </span>
              </div>
            </div>
            <button onClick={checkConnection} className="p-2 text-gray-400 hover:text-black">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notebook Link */}
          <a
            href={NOTEBOOKLM_CONFIG.notebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-blue-50 px-5 py-4 rounded-2xl border border-blue-100 hover:border-blue-300 transition-colors group"
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">KSU Athletics Notebook</span>
              <span className="block text-[8px] text-blue-400 font-bold mt-0.5">
                {NOTEBOOKLM_CONFIG.notebookId.slice(0, 8)}...
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
          </a>

          {/* Budget File Upload */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
              Budget File (Excel)
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex-1 flex items-center space-x-3 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-yellow-500 px-5 py-4 rounded-2xl cursor-pointer transition-colors">
                <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500">
                  {budgetFile ? budgetFile.name : 'Select FY 2026 Budget FINAL 061325.xlsx'}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setBudgetFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full bg-black text-yellow-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{isSyncing ? 'Syncing...' : 'Full Sync (Notebook + Budget)'}</span>
            </button>

            {budgetFile && (
              <button
                onClick={handleBudgetOnly}
                disabled={isSyncing}
                className="w-full bg-gray-100 text-black py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Budget Only (No NotebookLM)</span>
              </button>
            )}
          </div>

          {/* Last Sync Result */}
          {lastResult && (
            <div className={`px-5 py-4 rounded-2xl border ${lastResult.success ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
              <div className="flex items-center space-x-2 mb-2">
                {lastResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {lastResult.success ? 'Sync Complete' : 'Partial Sync'}
                </span>
              </div>
              <div className="text-[9px] text-gray-600 font-bold space-y-1">
                <p>Budget items: {lastResult.budgetItemsIngested}</p>
                <p>Notebook insights: {lastResult.notebookAnswers}</p>
                <p>Total synced: {lastResult.itemsSynced}</p>
                {lastResult.errors.length > 0 && (
                  <p className="text-red-500">Errors: {lastResult.errors.join('; ')}</p>
                )}
              </div>
            </div>
          )}

          {/* Current KB Status */}
          <div className="bg-gray-50 px-5 py-4 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
              Knowledge Base Status
            </span>
            <div className="grid grid-cols-2 gap-3 text-[9px] font-bold text-gray-600">
              <div>
                <span className="text-gray-400">Core Objectives:</span> {knowledgeBase.coreObjectives?.length || 0}
              </div>
              <div>
                <span className="text-gray-400">Budget Loaded:</span>{' '}
                {knowledgeBase.budgetIntelligence ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="text-gray-400">Notebook Synced:</span>{' '}
                {knowledgeBase.notebookSyncData ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="text-gray-400">Last Sync:</span>{' '}
                {knowledgeBase.notebookSyncData?.lastSynced
                  ? new Date(knowledgeBase.notebookSyncData.lastSynced).toLocaleDateString()
                  : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
