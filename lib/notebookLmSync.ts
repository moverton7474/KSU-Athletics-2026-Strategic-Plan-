/**
 * ============================================================
 * OPTION 2: NotebookLM Sync Pipeline
 * ============================================================
 *
 * Synchronizes NotebookLM notebook content into the StratOS
 * knowledge base (Supabase strategic_knowledge table).
 *
 * This module handles:
 * 1. Manual sync via the "Notebook Sync" button in the UI
 * 2. Budget data ingestion from Excel uploads
 * 3. Structured extraction from NotebookLM responses
 * 4. Merge strategy with existing knowledge base
 *
 * BUDGET FILE PATH (User's local):
 *   C:\Users\moverton\Documents\Dropbox\KSU Budget\_ FY 2026 Budget FINAL 061325.xlsx
 *
 * NOTEBOOK:
 *   https://notebooklm.google.com/notebook/21aca734-f2a0-456e-9212-8d23bd325025
 */

import { supabase } from './supabase';
import { notebookLmClient, NotebookLmResponse } from './notebookLmMcp';

const KB_KEY = 'ksu_strategic_knowledge';

// ── Budget Data Types ────────────────────────────────────────────

export interface BudgetLineItem {
  category: string;
  subcategory: string;
  amount: number;
  budgetType: 'revenue' | 'expense' | 'capital';
  notes?: string;
  fiscalYear: string;
}

export interface BudgetSummary {
  fiscalYear: string;
  totalRevenue: number;
  totalExpenses: number;
  netPosition: number;
  revenueByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
  capitalProjects: BudgetLineItem[];
  lineItems: BudgetLineItem[];
  lastSynced: string;
  source: string;
}

export interface NotebookSyncResult {
  success: boolean;
  itemsSynced: number;
  budgetItemsIngested: number;
  notebookAnswers: number;
  timestamp: string;
  errors: string[];
}

// ── Extended Knowledge Base Schema ───────────────────────────────

export interface ExtendedKnowledgeBase {
  // Original fields
  projectTitle: string;
  organization: string;
  mission: string;
  coreObjectives: Array<{ title: string; details: string; priority: string }>;
  strategicPhilosophies: Record<string, string>;
  revenueTargets: Record<string, string>;

  // NEW: Budget Intelligence (from Excel upload)
  budgetIntelligence?: BudgetSummary;

  // NEW: NotebookLM Synced Content
  notebookSyncData?: {
    lastSynced: string;
    notebookId: string;
    notebookUrl: string;
    extractedInsights: Array<{
      question: string;
      answer: string;
      citations: Array<{ text: string; sourceTitle: string }>;
    }>;
    budgetNarrative: string;
    strategicNarrative: string;
  };

  // NEW: Recent manual ingests
  recentIngest?: string;
  lastVoiceSync?: string;
}

// ── Excel Budget Parser ──────────────────────────────────────────
//
// Uses SheetJS (xlsx) to parse the FY 2026 Budget Excel file.
// The file is uploaded via the browser's File API.

export async function parseBudgetExcel(file: File): Promise<BudgetSummary> {
  // Dynamic import of SheetJS
  const XLSX = await import('xlsx');

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const lineItems: BudgetLineItem[] = [];
  let totalRevenue = 0;
  let totalExpenses = 0;
  const revenueByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};
  const capitalProjects: BudgetLineItem[] = [];

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) continue;

    // Heuristic: detect header row and parse accordingly
    const headers = rows[0] as string[];
    const amountColIdx = headers?.findIndex((h: string) =>
      typeof h === 'string' && /amount|budget|total|fy|2026/i.test(h)
    );
    const categoryColIdx = headers?.findIndex((h: string) =>
      typeof h === 'string' && /category|department|account|description/i.test(h)
    );

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const category = String(row[categoryColIdx >= 0 ? categoryColIdx : 0] || '').trim();
      const amountRaw = row[amountColIdx >= 0 ? amountColIdx : 1];
      const amount = typeof amountRaw === 'number' ? amountRaw : parseFloat(String(amountRaw || '0').replace(/[$,]/g, ''));

      if (!category || isNaN(amount) || amount === 0) continue;

      const isRevenue = /revenue|income|ticket|sponsor|donation|contribution|fund|media|rights/i.test(category) ||
                        /revenue|income/i.test(sheetName);
      const isCapital = /capital|facility|complex|construction|wellstar/i.test(category) ||
                        /capital/i.test(sheetName);

      const budgetType: BudgetLineItem['budgetType'] = isCapital ? 'capital' : isRevenue ? 'revenue' : 'expense';

      const item: BudgetLineItem = {
        category: sheetName,
        subcategory: category,
        amount,
        budgetType,
        fiscalYear: 'FY 2026',
      };

      lineItems.push(item);

      if (budgetType === 'revenue') {
        totalRevenue += amount;
        revenueByCategory[category] = (revenueByCategory[category] || 0) + amount;
      } else if (budgetType === 'expense') {
        totalExpenses += amount;
        expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
      } else {
        capitalProjects.push(item);
      }
    }
  }

  return {
    fiscalYear: 'FY 2026',
    totalRevenue,
    totalExpenses,
    netPosition: totalRevenue - totalExpenses,
    revenueByCategory,
    expenseByCategory,
    capitalProjects,
    lineItems,
    lastSynced: new Date().toISOString(),
    source: 'FY 2026 Budget FINAL 061325.xlsx',
  };
}

// ── NotebookLM Content Extraction ────────────────────────────────

export async function extractNotebookContent(): Promise<{
  insights: Array<{ question: string; answer: string; citations: any[] }>;
  budgetNarrative: string;
  strategicNarrative: string;
}> {
  // Check if MCP proxy is available
  const health = await notebookLmClient.checkHealth();

  if (health.status !== 'ok') {
    throw new Error(
      'NotebookLM MCP proxy is not running. Start it with: npx ts-node server/notebookLmProxy.ts'
    );
  }

  // Select the KSU Athletics notebook
  await notebookLmClient.selectNotebook();

  // Extract comprehensive content via targeted queries
  const queries = [
    // Budget queries
    'What is the total FY 2026 athletics budget and how is it allocated?',
    'Break down all revenue sources and their projected amounts for FY 2026.',
    'What are the top 10 expense categories and their budgeted amounts?',
    'What is the Owls Fund budget and fundraising gap?',
    'What are the NIL pool allocations and transfer portal costs?',
    'What is the Wellstar Champions Complex budget and timeline?',
    'What are the student-athlete meals and nutrition program costs?',
    // Strategic queries
    'Summarize the Taking Flight to 2026 strategic plan in detail.',
    'What are the key performance indicators for each strategic pillar?',
    'What competitive benchmarks does KSU Athletics track against Power Four schools?',
  ];

  const responses = await notebookLmClient.batchQuery(queries);

  const insights = queries.map((q, i) => ({
    question: q,
    answer: responses[i]?.answer || 'No response available',
    citations: responses[i]?.citations || [],
  }));

  // Build narratives
  const budgetResponses = responses.slice(0, 7);
  const strategicResponses = responses.slice(7);

  const budgetNarrative = budgetResponses
    .map(r => r.answer)
    .filter(Boolean)
    .join('\n\n');

  const strategicNarrative = strategicResponses
    .map(r => r.answer)
    .filter(Boolean)
    .join('\n\n');

  return { insights, budgetNarrative, strategicNarrative };
}

// ── Sync Pipeline ────────────────────────────────────────────────

export async function syncNotebookToKnowledgeBase(
  existingKb: ExtendedKnowledgeBase,
  budgetFile?: File
): Promise<{ updatedKb: ExtendedKnowledgeBase; result: NotebookSyncResult }> {
  const errors: string[] = [];
  let budgetItemsIngested = 0;
  let notebookAnswers = 0;

  const updatedKb: ExtendedKnowledgeBase = { ...existingKb };

  // Step 1: Parse budget Excel if provided
  if (budgetFile) {
    try {
      const budgetSummary = await parseBudgetExcel(budgetFile);
      updatedKb.budgetIntelligence = budgetSummary;
      budgetItemsIngested = budgetSummary.lineItems.length;

      // Auto-update revenue targets from budget data
      if (budgetSummary.totalRevenue > 0) {
        updatedKb.revenueTargets = {
          ...updatedKb.revenueTargets,
          totalBudgetedRevenue: `$${(budgetSummary.totalRevenue / 1_000_000).toFixed(1)}M (FY 2026 Budget)`,
          totalBudgetedExpenses: `$${(budgetSummary.totalExpenses / 1_000_000).toFixed(1)}M (FY 2026 Budget)`,
          netBudgetPosition: `$${(budgetSummary.netPosition / 1_000_000).toFixed(1)}M`,
        };
      }
    } catch (e: any) {
      errors.push(`Budget parse error: ${e.message}`);
    }
  }

  // Step 2: Extract from NotebookLM (if MCP is available)
  try {
    const { insights, budgetNarrative, strategicNarrative } = await extractNotebookContent();
    notebookAnswers = insights.length;

    updatedKb.notebookSyncData = {
      lastSynced: new Date().toISOString(),
      notebookId: '21aca734-f2a0-456e-9212-8d23bd325025',
      notebookUrl: 'https://notebooklm.google.com/notebook/21aca734-f2a0-456e-9212-8d23bd325025',
      extractedInsights: insights,
      budgetNarrative,
      strategicNarrative,
    };
  } catch (e: any) {
    errors.push(`NotebookLM sync: ${e.message}`);
  }

  // Step 3: Persist to Supabase
  if (supabase) {
    try {
      await supabase.from('strategic_knowledge').upsert({
        kb_key: KB_KEY,
        content: updatedKb,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'kb_key' });
    } catch (e: any) {
      errors.push(`Supabase sync error: ${e.message}`);
    }
  }

  const result: NotebookSyncResult = {
    success: errors.length === 0,
    itemsSynced: budgetItemsIngested + notebookAnswers,
    budgetItemsIngested,
    notebookAnswers,
    timestamp: new Date().toISOString(),
    errors,
  };

  return { updatedKb, result };
}

// ── Budget-Only Sync (for Excel upload without NotebookLM) ───────

export async function syncBudgetOnly(
  existingKb: ExtendedKnowledgeBase,
  budgetFile: File
): Promise<{ updatedKb: ExtendedKnowledgeBase; summary: BudgetSummary }> {
  const summary = await parseBudgetExcel(budgetFile);

  const updatedKb: ExtendedKnowledgeBase = {
    ...existingKb,
    budgetIntelligence: summary,
    revenueTargets: {
      ...existingKb.revenueTargets,
      totalBudgetedRevenue: `$${(summary.totalRevenue / 1_000_000).toFixed(1)}M (FY 2026 Budget)`,
      totalBudgetedExpenses: `$${(summary.totalExpenses / 1_000_000).toFixed(1)}M (FY 2026 Budget)`,
    },
  };

  // Persist
  if (supabase) {
    await supabase.from('strategic_knowledge').upsert({
      kb_key: KB_KEY,
      content: updatedKb,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'kb_key' });
  }

  return { updatedKb, summary };
}
