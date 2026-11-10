import React from 'react';
import {
  Menu,
  Sparkles,
  Download,
  Code2,
  Brain,
  ShieldCheck,
  Radio,
  MessageSquare,
} from 'lucide-react';
import { UserSettings } from '../../types/index';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  activeView: string;
  settings: UserSettings;
  onNewChat: () => void;
  onNavigate: (view: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  activeView,
  settings,
  onNewChat,
  onNavigate,
}) => {
  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Personal Productivity Dashboard';
      case 'coding':
        return 'Coding Studio & Sandbox';
      case 'memory':
        return 'Long-Term Memory Management';
      case 'knowledge':
        return 'Knowledge Base & Document RAG';
      case 'tasks':
        return 'Task Management & Reminders';
      case 'notes':
        return 'Personal Knowledge Notes';
      case 'live':
        return 'MITALL Live Voice & Video Agent';
      case 'settings':
        return 'Configuration & AI Settings';
      default:
        return 'AI Conversation Workspace';
    }
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-[#0d121c]/95 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden cursor-pointer"
          title="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm md:text-base font-bold text-white tracking-tight">
            {getViewTitle()}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Model Badge */}
        <div
          onClick={() => onNavigate('settings')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
          title="Click to configure AI Model"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-indigo-300">
            {settings.activeProvider === 'gemini'
              ? settings.geminiModel.replace(/gemini/gi, 'mitall')
              : settings.activeProvider === 'ollama'
              ? settings.ollamaModel
              : settings.openaiModel}
          </span>
        </div>

        {/* Quick Coding Studio Button */}
        {activeView !== 'coding' && (
          <button
            onClick={() => onNavigate('coding')}
            className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            title="Open Coding Studio"
          >
            <Code2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Sandbox</span>
          </button>
        )}

        {/* Live MITALL Agent Button */}
        {activeView !== 'live' ? (
          <button
            onClick={() => onNavigate('live')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Connect Live with MITALL Agent"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Connect Live Agent</span>
            <span className="sm:hidden">Live</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Chat View</span>
          </button>
        )}

        {/* Quick New Chat Button */}
        {activeView !== 'chat' && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        )}
      </div>
    </header>
  );
};
