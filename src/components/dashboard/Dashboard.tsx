import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  Brain,
  ListTodo,
  FileText,
  Code2,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Cpu,
  Radio,
} from 'lucide-react';
import { Conversation, TaskItem, PersonalNote, UserSettings, Memory, KnowledgeDocument } from '../../types/index';
import { api } from '../../services/api';

interface DashboardProps {
  settings: UserSettings;
  onNavigate: (view: any) => void;
  onNewChat: (initialPrompt?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  settings,
  onNavigate,
  onNewChat,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      api.getConversations(),
      api.getMemories(),
      api.getTasks(),
      api.getNotes(),
      api.getDocuments(),
    ]).then(([convData, memData, taskData, noteData, docData]) => {
      setConversations(convData);
      setMemories(memData);
      setTasks(taskData);
      setNotes(noteData);
      setDocuments(docData);
    });
  }, []);

  const handleToggleTask = async (task: TaskItem) => {
    const updated = await api.updateTask(task.id, { completed: !task.completed });
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 bg-[#0b0f17] text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-violet-950/40 border border-indigo-700/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                Personal AI Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              Welcome back to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-violet-400">{settings.aiName || 'MITALL'}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              All systems online. Ready to accelerate your software engineering, deep research, task execution, and learning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('live')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Connect Live Agent</span>
            </button>
            <button
              onClick={() => onNewChat()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask MITALL</span>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('chat')}
            className="p-4 rounded-xl bg-[#131b2a] border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Conversations</span>
              <MessageSquare className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{conversations.length}</div>
            <div className="mt-1 text-[11px] text-slate-500">Active chat sessions</div>
          </div>

          <div
            onClick={() => onNavigate('memory')}
            className="p-4 rounded-xl bg-[#131b2a] border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Saved Memories</span>
              <Brain className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-300">{memories.length}</div>
            <div className="mt-1 text-[11px] text-slate-500">User preferences & notes</div>
          </div>

          <div
            onClick={() => onNavigate('tasks')}
            className="p-4 rounded-xl bg-[#131b2a] border border-slate-800 hover:border-violet-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Pending Tasks</span>
              <ListTodo className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold text-violet-300">{pendingTasks.length}</div>
            <div className="mt-1 text-[11px] text-slate-500">{completedTasks.length} completed</div>
          </div>

          <div
            onClick={() => onNavigate('knowledge')}
            className="p-4 rounded-xl bg-[#131b2a] border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Knowledge Base</span>
              <FileText className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-300">{documents.length}</div>
            <div className="mt-1 text-[11px] text-slate-500">Indexed for RAG</div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => onNewChat('Explain this code snippet in detail and suggest improvements:')}
              className="flex flex-col items-start p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Explain Code</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Line-by-line breakdown</span>
            </button>

            <button
              onClick={() => onNewChat('Summarize my uploaded knowledge documents and highlight actionable takeaways:')}
              className="flex flex-col items-start p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Summarize Docs</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Semantic document RAG</span>
            </button>

            <button
              onClick={() => onNavigate('coding')}
              className="flex flex-col items-start p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-violet-950/60 text-violet-400 mb-2 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Code Sandbox</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Safe runner & complexity</span>
            </button>

            <button
              onClick={() => onNavigate('notes')}
              className="flex flex-col items-start p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Personal Notes</span>
              <span className="text-[11px] text-slate-400 mt-0.5">PKM & markdown knowledge</span>
            </button>
          </div>
        </div>

        {/* Dual Column: Pending Tasks & Recent Conversations / Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks Overview */}
          <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-violet-400" />
                <h3 className="font-semibold text-slate-200 text-sm">Prioritized Tasks</h3>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No pending tasks. Great job!
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div className="text-xs font-medium text-slate-200">{task.title}</div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Due {task.dueDate}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        task.priority === 'urgent'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : task.priority === 'high'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Connectivity & Recent Conversations */}
          <div className="space-y-6">
            {/* Active AI Status */}
            <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-slate-200 text-sm">Active AI Engine</h3>
                </div>
                <button
                  onClick={() => onNavigate('settings')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Configure
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <div className="text-xs font-bold text-slate-200 uppercase font-mono">
                      {settings.activeProvider === 'gemini'
                        ? 'MITALL AI Engine'
                        : settings.activeProvider === 'ollama'
                        ? 'Ollama Local'
                        : 'Custom Provider'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Model: {settings.activeProvider === 'gemini' ? settings.geminiModel.replace(/gemini/gi, 'mitall') : settings.ollamaModel}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-emerald-400 font-medium">
                  Streaming SSE Ready
                </div>
              </div>
            </div>

            {/* Recent Notes Snippet */}
            <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-slate-200 text-sm">Recent Notes & PKM</h3>
                </div>
                <button
                  onClick={() => onNavigate('notes')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  All Notes
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs">No notes recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {notes.slice(0, 2).map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onNavigate('notes')}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-slate-200">{note.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">{note.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
