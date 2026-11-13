import React from 'react';
import {
  Sparkles,
  MessageSquare,
  Code2,
  Brain,
  FileText,
  CheckSquare,
  BookOpen,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
  Terminal,
  Activity,
  Cpu,
} from 'lucide-react';
import { UserProfile, UserSettings } from '../../types/index';

interface HomeViewProps {
  user: UserProfile;
  settings: UserSettings;
  counts: { memories: number; tasks: number; documents: number };
  onNavigate: (view: 'chat' | 'coding' | 'knowledge' | 'memory' | 'tasks' | 'notes' | 'settings' | 'profile' | 'live') => void;
  onStartNewChat: (initialPrompt?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  settings,
  counts,
  onNavigate,
  onStartNewChat,
}) => {
  const quickStarters = [
    {
      title: 'Fibonacci Series in Python & TS',
      category: 'Code & Algorithms',
      prompt: 'Provide complete Python and TypeScript implementations of the Fibonacci series with iterative, dynamic programming, and complexity analysis.',
      icon: <Code2 className="w-5 h-5 text-indigo-400" />,
    },
    {
      title: 'Analyze & Summarize Documents',
      category: 'Knowledge RAG',
      prompt: 'How does MITALL parse, chunk, and index documents for semantic retrieval in the knowledge base?',
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'System Architecture Design',
      category: 'Engineering',
      prompt: 'Explain the principles of high-scale microservices, caching layers, and database sharding with trade-offs.',
      icon: <Cpu className="w-5 h-5 text-amber-400" />,
    },
    {
      title: 'General-Purpose Scientific Query',
      category: 'Science & Physics',
      prompt: 'Explain how gravitational waves are detected and what they reveal about neutron star mergers.',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 bg-[#0b0f17] text-slate-100">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-[#0e1422] border border-indigo-500/20 p-6 md:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Universal Personal AI Platform</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Online</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">{user.name}</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              **MITALL** is your unified cross-platform intelligence companion. Seamlessly synchronized across Web and native Android with multi-provider AI, persistent memory, and real-time code execution.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onStartNewChat()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Start New AI Chat</span>
              </button>

              <button
                onClick={() => onNavigate('coding')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-sm transition-all cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Code Sandbox</span>
              </button>

              <button
                onClick={() => onNavigate('live')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 font-medium text-sm transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>Live Voice Agent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cross-Platform Ecosystem Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-700/40 text-indigo-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Android & Capacitor</div>
              <div className="text-sm font-bold text-white">com.mitall.app</div>
              <div className="text-xs text-slate-400">Synchronized with Web</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/40 text-emerald-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Long-Term Memory</div>
              <div className="text-sm font-bold text-white">{counts.memories} Active Memories</div>
              <div className="text-xs text-slate-400">Cross-device persistent</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-700/40 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Active Engine</div>
              <div className="text-sm font-bold text-white">{settings.activeProvider.toUpperCase()}</div>
              <div className="text-xs text-slate-400">{settings.geminiModel}</div>
            </div>
          </div>
        </div>

        {/* Quick Conversation Prompts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Suggested Prompts & Exploration</h2>
            </div>
            <span className="text-xs text-slate-400">Click any card to start chat</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickStarters.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onStartNewChat(item.prompt)}
                className="group p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/80 hover:border-indigo-500/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs font-semibold text-slate-400">{item.category}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {item.prompt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Platform Modules Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Workspace Modules</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { id: 'chat', label: 'AI Chat', desc: 'Streaming general conversations', icon: <MessageSquare className="w-5 h-5 text-indigo-400" /> },
              { id: 'coding', label: 'Code Assistant', desc: 'Python, TS & SQL sandbox', icon: <Code2 className="w-5 h-5 text-emerald-400" /> },
              { id: 'knowledge', label: 'Knowledge Base', desc: `${counts.documents} RAG documents`, icon: <FileText className="w-5 h-5 text-blue-400" /> },
              { id: 'memory', label: 'Memories', desc: `${counts.memories} persistent facts`, icon: <Brain className="w-5 h-5 text-purple-400" /> },
              { id: 'tasks', label: 'Task Planner', desc: `${counts.tasks} active tasks`, icon: <CheckSquare className="w-5 h-5 text-amber-400" /> },
              { id: 'notes', label: 'Personal Notes', desc: 'Markdown note repository', icon: <BookOpen className="w-5 h-5 text-rose-400" /> },
              { id: 'settings', label: 'System Settings', desc: 'AI models & configuration', icon: <Zap className="w-5 h-5 text-cyan-400" /> },
              { id: 'profile', label: 'User Profile', desc: 'Account & device sync', icon: <ShieldCheck className="w-5 h-5 text-violet-400" /> },
            ].map((module) => (
              <button
                key={module.id}
                onClick={() => onNavigate(module.id as any)}
                className="p-4 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 text-left transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-slate-800/70 w-fit group-hover:scale-105 transition-transform mb-2">
                  {module.icon}
                </div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {module.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {module.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
