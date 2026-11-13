import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  LayoutDashboard,
  Brain,
  FileText,
  Code2,
  ListTodo,
  StickyNote,
  Settings,
  Search,
  Pin,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Radio,
  X,
  Clock,
  Check,
  Home,
  User,
} from 'lucide-react';
import { Conversation, UserSettings } from '../../types/index';
import { groupConversationsByDate } from '../../utils/dateGrouping';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: any) => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onPinConversation?: (id: string, pinned: boolean) => void;
  settings: UserSettings;
  counts: {
    memories: number;
    tasks: number;
    documents: number;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onPinConversation,
  settings,
  counts,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = groupConversationsByDate(filteredConversations);

  const handleStartRename = (conv: Conversation) => {
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
  };

  const handleFinishRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingConvId(null);
  };

  const toolNavItems = [
    { id: 'home', label: 'Home Overview', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'coding', label: 'Coding Studio', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'memory', label: 'Long-Term Memory', icon: <Brain className="w-3.5 h-3.5" />, count: counts.memories },
    { id: 'knowledge', label: 'Knowledge Base', icon: <FileText className="w-3.5 h-3.5" />, count: counts.documents },
    { id: 'tasks', label: 'Tasks & Reminders', icon: <ListTodo className="w-3.5 h-3.5" />, count: counts.tasks },
    { id: 'notes', label: 'Notes & PKM', icon: <StickyNote className="w-3.5 h-3.5" /> },
    { id: 'profile', label: 'Profile & Sync', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#0d121c] border-r border-slate-800 transition-all duration-300 select-none z-30 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800/80">
        <div
          onClick={() => onNavigate('chat')}
          className="flex items-center gap-2.5 cursor-pointer group overflow-hidden"
          title="MITALL AI"
        >
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 flex-shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0d121c]" />
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">MITALL</span>
                <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Personal Intelligence</p>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer hidden md:flex"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Actions: New Chat & Live Agent */}
      <div className="p-3 space-y-1.5 border-b border-slate-800/70">
        <button
          onClick={onNewChat}
          className={`flex items-center justify-between w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/25 cursor-pointer ${
            isCollapsed ? 'px-0 justify-center' : 'px-3'
          }`}
          title="New Chat (Ctrl+K)"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </div>
          {!isCollapsed && (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono text-indigo-200">
              Ctrl K
            </kbd>
          )}
        </button>

        {/* Live MITALL Agent Shortcut */}
        <button
          onClick={() => onNavigate('live')}
          className={`flex items-center justify-between w-full py-2 rounded-xl transition-all cursor-pointer ${
            currentView === 'live'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
              : 'bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
          } ${isCollapsed ? 'px-0 justify-center' : 'px-3'}`}
          title="Live Voice & Video MITALL Agent"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
            {!isCollapsed && <span className="text-xs truncate">Live MITALL Agent</span>}
          </div>
          {!isCollapsed && (
            <span className="px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/30 text-emerald-300">
              LIVE
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {!isCollapsed ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Recent Chats Header & Search */}
          <div className="px-3 pt-3 pb-1.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Recent Chats
                </span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700/60">
                {conversations.length}
              </span>
            </div>

            {/* Search Input with Clear Button */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-7 pr-6 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* ChatGPT / Gemini Style Chronologically Grouped Scrollable Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-3 custom-scrollbar pr-1.5 pb-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-[11px] text-slate-500">
                {searchQuery ? `No chats matching "${searchQuery}"` : 'No conversations yet'}
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.id} className="space-y-0.5">
                  {/* Date Section Header */}
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{group.label}</span>
                    <span className="text-[9px] text-slate-400">{group.conversations.length}</span>
                  </div>

                  {/* Conversation Items */}
                  {group.conversations.map((conv) => {
                    const isActive = activeConversationId === conv.id && currentView === 'chat';
                    const isEditing = editingConvId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          onSelectConversation(conv.id);
                          onNavigate('chat');
                        }}
                        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-950/70 to-slate-900 text-white border-l-2 border-indigo-500 shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border-l-2 border-transparent'
                        }`}
                        title={conv.title}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isActive ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                          ) : conv.pinned ? (
                            <Pin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                          )}

                          {isEditing ? (
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={() => handleFinishRename(conv.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFinishRename(conv.id);
                                if (e.key === 'Escape') setEditingConvId(null);
                              }}
                              autoFocus
                              className="bg-slate-950 text-white px-1 py-0.5 rounded text-xs w-full focus:outline-none ring-1 ring-indigo-500"
                            />
                          ) : (
                            <span className="truncate text-[12px]">{conv.title}</span>
                          )}
                        </div>

                        {/* Hover Action Buttons */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
                          {/* Pin Toggle */}
                          {onPinConversation && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPinConversation(conv.id, !conv.pinned);
                              }}
                              className={`p-1 hover:text-amber-400 rounded transition-colors ${
                                conv.pinned ? 'text-amber-400' : 'text-slate-500'
                              }`}
                              title={conv.pinned ? 'Unpin chat' : 'Pin to top'}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                          )}

                          {/* Rename */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(conv);
                            }}
                            className="p-1 hover:text-indigo-300 text-slate-500 rounded transition-colors"
                            title="Rename chat"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                            className="p-1 hover:text-rose-400 text-slate-500 rounded transition-colors"
                            title="Delete chat"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Collapsible Workspace Tools Accordion */}
          <div className="border-t border-slate-800/80 bg-[#0b0f17]">
            <button
              onClick={() => setIsToolsExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Workspace Modules</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                  isToolsExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isToolsExpanded && (
              <div className="px-2 pb-2 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                {toolNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      currentView === item.id
                        ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={currentView === item.id ? 'text-indigo-400' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-slate-800 text-slate-400">
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Collapsed Icon Bar */
        <div className="flex-1 flex flex-col items-center py-3 space-y-2 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => onNavigate('chat')}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
              currentView === 'chat'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Chat Workspace"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {toolNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                currentView === item.id
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Profile / AI Engine Info */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0a0e17]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-indigo-300 font-bold">
                M
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">mithuleshganesan</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate">
                    {settings.activeProvider === 'gemini'
                      ? settings.geminiModel.replace(/gemini/gi, 'mitall')
                      : settings.ollamaModel}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('settings')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
