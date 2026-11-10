import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Play,
  Sparkles,
  Bug,
  TrendingUp,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  RotateCcw,
  Clock,
  Layers,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Trash2,
  Monitor,
} from 'lucide-react';
import { api } from '../../services/api';
import { MarkdownRenderer } from '../chat/MarkdownRenderer';

interface CodingAssistantProps {
  initialCode?: string;
  initialLang?: string;
  onAskMitall?: (prompt: string) => void;
}

const CODE_PRESETS = [
  {
    id: 'linked_list_py',
    label: 'Linked List - Middle Element (Python)',
    lang: 'python',
    code: `# Floyd's Tortoise and Hare Algorithm to find the middle element
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def find_middle_node(head: ListNode) -> ListNode:
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

def create_linked_list(values):
    dummy = ListNode(0)
    curr = dummy
    for v in values:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

# Test with odd and even length lists
list1 = create_linked_list([10, 20, 30, 40, 50])
print(f"List 1: [10, 20, 30, 40, 50] -> Middle value: {find_middle_node(list1).val}")

list2 = create_linked_list([1, 2, 3, 4, 5, 6])
print(f"List 2: [1, 2, 3, 4, 5, 6] -> Middle value: {find_middle_node(list2).val}")
`,
  },
  {
    id: 'linked_list_ts',
    label: 'Linked List - Middle Element (TypeScript)',
    lang: 'typescript',
    code: `// Linked List Middle Element in TypeScript (Fast & Slow Pointers)
interface ListNode<T> {
  val: T;
  next?: ListNode<T>;
}

function findMiddle<T>(head: ListNode<T> | undefined): T | undefined {
  let slow: ListNode<T> | undefined = head;
  let fast: ListNode<T> | undefined = head;

  while (fast && fast.next) {
    slow = slow?.next;
    fast = fast.next.next;
  }
  return slow?.val;
}

// Build a sample linked list: 1 -> 2 -> 3 -> 4 -> 5
const head: ListNode<number> = {
  val: 1,
  next: {
    val: 2,
    next: {
      val: 3,
      next: {
        val: 4,
        next: {
          val: 5,
        },
      },
    },
  },
};

console.log("List: 1 -> 2 -> 3 -> 4 -> 5");
console.log("Middle element value is:", findMiddle(head));
`,
  },
  {
    id: 'quicksort_ts',
    label: 'QuickSort with Lomuto Partition (TypeScript)',
    lang: 'typescript',
    code: `// QuickSort with Lomuto Partition Scheme in TypeScript
function quickSort(arr: number[], low = 0, high = arr.length - 1): number[] {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr: number[], low: number, high: number): number {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

// Test runner
const numbers = [38, 27, 43, 3, 9, 82, 10];
console.log("Original array:", numbers);
console.log("Sorted array:", quickSort([...numbers]));
`,
  },
  {
    id: 'sql_in_memory',
    label: 'SQL Table & Analytics Query (SQL)',
    lang: 'sql',
    code: `-- Interactive In-Memory SQLite Table & Analytical Query
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL,
  years_experience INTEGER NOT NULL
);

INSERT INTO employees VALUES 
  (1, 'Alice Chen', 'Engineering', 145000, 6),
  (2, 'Bob Smith', 'Engineering', 160000, 8),
  (3, 'Charlie Roy', 'Product', 130000, 4),
  (4, 'Diana Vance', 'Data Science', 155000, 7),
  (5, 'Ethan Miller', 'Marketing', 95000, 3);

-- Retrieve departments with average salary > 100k
SELECT 
  department, 
  COUNT(*) as total_employees, 
  ROUND(AVG(salary), 2) as avg_salary,
  MAX(salary) as max_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
`,
  },
  {
    id: 'factorial_py',
    label: 'Factorial & Recursion (Python)',
    lang: 'python',
    code: `# Python Factorial with Iterative, Recursive, and Memoized Approaches
import time

def factorial_recursive(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial_recursive(n - 1)

def factorial_iterative(n: int) -> int:
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

# Verification
for n in [5, 7, 10]:
    r = factorial_recursive(n)
    i = factorial_iterative(n)
    print(f"{n}! -> Recursive: {r} | Iterative: {i} | Match: {r == i}")
`,
  },
];

export const CodingAssistant: React.FC<CodingAssistantProps> = ({
  initialCode,
  initialLang,
  onAskMitall,
}) => {
  const [code, setCode] = useState(initialCode || CODE_PRESETS[0].code);
  const [language, setLanguage] = useState(initialLang || CODE_PRESETS[0].lang);
  const [activeTab, setActiveTab] = useState<'sandbox' | 'analysis'>('sandbox');
  const [mobileView, setMobileView] = useState<'editor' | 'terminal'>('editor');
  const [analysisText, setAnalysisText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<{
    output: string;
    executionTimeMs: number;
    status: 'success' | 'error';
    language?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when initialCode or initialLang changes from chat/props
  useEffect(() => {
    if (initialCode !== undefined) {
      setCode(initialCode);
      if (initialLang) setLanguage(initialLang);
      setActiveTab('sandbox');
      // Auto-run sandbox when code is sent from chat
      runSandboxCode(initialCode, initialLang || language);
    }
  }, [initialCode, initialLang]);

  const runSandboxCode = async (codeToRun: string, langToRun: string) => {
    setIsRunning(true);
    setActiveTab('sandbox');
    try {
      const res = await api.runCode(codeToRun, langToRun);
      setSandboxResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSandboxResult({
        output: `Execution failed: ${msg}`,
        executionTimeMs: 0,
        status: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSandbox = () => {
    runSandboxCode(code, language);
  };

  // Keyboard shortcut: Tab inserts 2 spaces, Ctrl/Cmd + Enter runs code
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunSandbox();
    }
  };

  const handleExplainCode = async () => {
    setActiveTab('analysis');
    setIsAnalyzing(true);
    setAnalysisText('MITALL is analyzing code structure and syntax...');

    try {
      const res = await fetch(
        `/api/chat/stream?conversationId=code-temp&prompt=${encodeURIComponent(
          `Please provide a comprehensive explanation of this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\nExplain what it does, the logic flow, and edge cases.`
        )}`
      );

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const str = decoder.decode(value);
          const lines = str.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6));
                if (json.type === 'chunk' && json.text) full += json.text;
              } catch {}
            }
          }
        }
      }
      setAnalysisText(full || 'Code explanation generated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalysisText(`Error generating explanation: ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeComplexity = async () => {
    setActiveTab('analysis');
    setIsAnalyzing(true);
    setAnalysisText('Analyzing algorithmic Big-O complexity (Time & Space)...');

    try {
      const res = await fetch(
        `/api/chat/stream?conversationId=code-temp&prompt=${encodeURIComponent(
          `Analyze the Time Complexity and Space Complexity of this code in Big-O notation:\n\`\`\`${language}\n${code}\n\`\`\`\nProvide best case, worst case, average case, and explain the memory stack overhead.`
        )}`
      );

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const str = decoder.decode(value);
          const lines = str.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6));
                if (json.type === 'chunk' && json.text) full += json.text;
              } catch {}
            }
          }
        }
      }
      setAnalysisText(full || 'Complexity breakdown completed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalysisText(`Error: ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDebugCode = async () => {
    setActiveTab('analysis');
    setIsAnalyzing(true);
    setAnalysisText('Scanning for potential bugs, edge cases, and runtime pitfalls...');

    try {
      const res = await fetch(
        `/api/chat/stream?conversationId=code-temp&prompt=${encodeURIComponent(
          `Debug and review this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\nIdentify any logical errors, memory leaks, off-by-one bugs, or missing checks, and provide the corrected code.`
        )}`
      );

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const str = decoder.decode(value);
          const lines = str.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6));
                if (json.type === 'chunk' && json.text) full += json.text;
              } catch {}
            }
          }
        }
      }
      setAnalysisText(full || 'Review completed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalysisText(`Error: ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPreset = (presetId: string) => {
    const found = CODE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setCode(found.code);
      setLanguage(found.lang);
      runSandboxCode(found.code, found.lang);
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f17] overflow-hidden">
      {/* Top Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-slate-800 bg-[#0d121c]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-800/60 text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight">
                Coding Studio & Sandboxed Terminal
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Native Execution
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real Python 3.10, TypeScript & ESNext compilation, in-memory SQLite, and interactive terminal
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Preset Algorithms Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => handleSelectPreset(e.target.value)}
              defaultValue=""
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              title="Load example algorithm"
            >
              <option value="" disabled>
                📂 Load Preset / Algorithm
              </option>
              {CODE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-indigo-300 font-mono font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="python">Python 3.10</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript (ES2024)</option>
            <option value="sql">SQL (SQLite)</option>
            <option value="cpp">C++ (Simulation)</option>
            <option value="java">Java (Simulation)</option>
          </select>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Copy</span>
          </button>

          <button
            onClick={handleRunSandbox}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Execute code in sandboxed terminal (Ctrl+Enter)"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Sandbox'}</span>
            <kbd className="hidden md:inline-block px-1 py-0.2 rounded bg-black/30 text-[9px] font-mono text-emerald-200">
              Ctrl↵
            </kbd>
          </button>
        </div>
      </div>

      {/* Mobile View Toggle Bar (Only visible on small screens) */}
      <div className="flex lg:hidden items-center justify-between px-4 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMobileView('editor')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              mobileView === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Code Editor ({language})
          </button>
          <button
            onClick={() => setMobileView('terminal')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              mobileView === 'terminal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Terminal Output {sandboxResult && `(${sandboxResult.status})`}
          </button>
        </div>
        <span className="text-[10px] text-slate-500">{lineCount} lines</span>
      </div>

      {/* Main Studio Dual Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Code Editor */}
        <div
          className={`w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#090d14] ${
            mobileView === 'terminal' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-400 select-none">
            <div className="flex items-center gap-2">
              <span className="font-mono text-indigo-300 uppercase tracking-wider font-semibold">
                {language}
              </span>
              <span className="text-[10px] text-slate-500">• {lineCount} lines</span>
              <span className="text-[10px] text-slate-500">• Tab indents 2 spaces</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCode('')}
                className="hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                title="Clear code editor"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Code Textarea with line numbers */}
          <div className="flex-1 flex relative overflow-hidden">
            {/* Simple line number gutter */}
            <div className="w-10 py-4 bg-[#070a10] border-r border-slate-800/80 text-right pr-2 text-[11px] font-mono text-slate-600 select-none hidden sm:block overflow-hidden">
              {Array.from({ length: Math.min(lineCount, 500) }).map((_, i) => (
                <div key={i} className="leading-relaxed">
                  {i + 1}
                </div>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 w-full p-4 bg-transparent text-slate-200 font-mono text-xs md:text-sm leading-relaxed resize-none focus:outline-none selection:bg-indigo-500/30 overflow-y-auto custom-scrollbar"
              placeholder="// Write or paste code here... Press Ctrl+Enter to execute in Sandbox"
            />
          </div>

          {/* AI Assistance Quick Actions Bar */}
          <div className="p-2.5 border-t border-slate-800 bg-[#0d121c] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={handleExplainCode}
                disabled={isAnalyzing}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
                title="Explain code structure, logic, and edge cases"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain</span>
              </button>

              <button
                onClick={handleDebugCode}
                disabled={isAnalyzing}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 border border-rose-700/50 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                title="Detect bugs, edge cases, and runtime issues"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Debug & Fix</span>
              </button>

              <button
                onClick={handleAnalyzeComplexity}
                disabled={isAnalyzing}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/50 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
                title="Calculate Big-O Time & Space complexity"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Big-O</span>
              </button>
            </div>

            {onAskMitall && (
              <button
                onClick={() =>
                  onAskMitall(
                    `Here is my ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\nPlease assist me with this program.`
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                title="Send code into main chat workspace"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Ask in Chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Pane: Terminal Output & AI Analysis */}
        <div
          className={`w-full lg:w-1/2 flex flex-col bg-[#080c14] ${
            mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Tabs */}
          <div className="flex items-center justify-between px-4 border-b border-slate-800 bg-[#0d121c]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('sandbox')}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'sandbox'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Sandboxed Terminal</span>
              </button>

              <button
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'analysis'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>MITALL Code Intelligence</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Timeout: 6000ms</span>
              </span>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'sandbox' ? (
              <div className="h-full flex flex-col">
                {/* Terminal Window Frame */}
                <div className="flex-1 flex flex-col rounded-xl bg-[#05080f] border border-slate-800 shadow-2xl overflow-hidden font-mono">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 select-none">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono ml-2">
                        mitall@sandbox:~ ({language})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {sandboxResult && (
                        <>
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{sandboxResult.executionTimeMs} ms</span>
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sandboxResult.status === 'success'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                                : 'bg-rose-950 text-rose-300 border border-rose-800/80'
                            }`}
                          >
                            {sandboxResult.status === 'success' ? 'EXIT 0' : 'ERROR'}
                          </span>
                        </>
                      )}

                      {sandboxResult && (
                        <button
                          onClick={() => setSandboxResult(null)}
                          className="text-slate-500 hover:text-slate-300 text-[11px] px-1 transition-colors cursor-pointer"
                          title="Clear terminal output"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Terminal Body */}
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar text-xs md:text-sm leading-relaxed">
                    <div className="text-slate-500 mb-2 select-none">
                      mitall@sandbox:~$ run --lang={language}
                    </div>

                    {isRunning ? (
                      <div className="flex items-center gap-2 text-emerald-400 py-4 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Compiling and executing code in sandbox...</span>
                      </div>
                    ) : sandboxResult ? (
                      <pre
                        className={`whitespace-pre-wrap select-text font-mono ${
                          sandboxResult.status === 'error' ? 'text-rose-300' : 'text-slate-100'
                        }`}
                      >
                        {sandboxResult.output}
                      </pre>
                    ) : (
                      <div className="text-slate-500 py-10 text-center select-none">
                        <Terminal className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p>No active execution.</p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Click <strong className="text-emerald-400">"Run Sandbox"</strong> or press{' '}
                          <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400">Ctrl+Enter</kbd> to execute.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-200">
                {isAnalyzing ? (
                  <div className="flex items-center gap-2.5 text-indigo-400 text-xs p-4 bg-indigo-950/20 border border-indigo-800/30 rounded-xl">
                    <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>{analysisText}</span>
                  </div>
                ) : analysisText ? (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <MarkdownRenderer content={analysisText} />
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    Click <strong>Explain</strong>, <strong>Debug & Fix</strong>, or{' '}
                    <strong>Big-O Complexity</strong> to generate instant AI code intelligence.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
