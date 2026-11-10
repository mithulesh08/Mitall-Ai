import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Clock,
  Sparkles,
  GripHorizontal,
  ChevronLeft,
  ChevronRight,
  Pin,
  X,
} from 'lucide-react';
import { Conversation } from '../../types/index';
import { groupConversationsByDate } from '../../utils/dateGrouping';

interface RecentChatsPullDownProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const RecentChatsPullDown: React.FC<RecentChatsPullDownProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
  onToggle,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalRailRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = groupConversationsByDate(filteredConversations);

  // Touch & Mouse Drag Handlers for Pull-Down interaction
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startYRef.current;

    if (!isOpen && deltaY > 0) {
      setDragY(Math.min(deltaY, 120));
    } else if (isOpen && deltaY < 0) {
      setDragY(Math.max(deltaY, -120));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (!isOpen && dragY > 40) {
      onToggle();
    } else if (isOpen && dragY < -40) {
      onClose();
    }
    setDragY(0);
  };

  // Horizontal scroll buttons
  const scrollHorizontal = (direction: 'left' | 'right') => {
    if (horizontalRailRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      horizontalRailRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full z-20 select-none border-b border-slate-800/80 bg-[#0d121c]/95 backdrop-blur-md"
      onMouseMove={isDragging ? handleTouchMove : undefined}
      onMouseUp={isDragging ? handleTouchEnd : undefined}
    >
      {/* Quick Access Top Bar: Recent Chats Pill Rail + Drag Handle */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 gap-2">
        {/* Left: Section Label & Count */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all cursor-pointer"
            title="Click or drag down to see full chat history"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Recent Chats</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-mono border border-indigo-700/50">
              {conversations.length}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Center: Horizontal Scrollable Quick Chats Rail (with visible scrollbar like ChatGPT/Gemini) */}
        <div className="flex-1 flex items-center min-w-0 relative">
          <button
            onClick={() => scrollHorizontal('left')}
            className="hidden sm:flex p-1 text-slate-500 hover:text-white rounded-md hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={horizontalRailRef}
            className="flex items-center gap-1.5 overflow-x-auto horizontal-scrollbar py-1 px-1 scroll-smooth w-full"
          >
            {conversations.slice(0, 10).map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                  title={conv.title}
                >
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ) : conv.pinned ? (
                    <Pin className="w-2.5 h-2.5 text-amber-400" />
                  ) : (
                    <MessageSquare className="w-3 h-3 text-slate-500" />
                  )}
                  <span className="max-w-[140px] truncate">{conv.title}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollHorizontal('right')}
            className="hidden sm:flex p-1 text-slate-500 hover:text-white rounded-md hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Drag Down Trigger Handle */}
        <div
          className="flex items-center gap-1 cursor-pointer flex-shrink-0 text-slate-500 hover:text-slate-300"
          onClick={onToggle}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          title={isOpen ? 'Click or drag up to close' : 'Drag down or click for full recent chats history'}
        >
          <GripHorizontal className="w-4 h-4 text-slate-600" />
          <span className="text-[10px] uppercase font-bold text-slate-400 hidden md:inline">
            {isOpen ? 'Close' : 'Pull Down'}
          </span>
        </div>
      </div>

      {/* Expanded Pull-Down Drawer Panel */}
      {isOpen && (
        <div
          className="w-full bg-[#0d121c] border-b border-indigo-500/30 shadow-2xl shadow-indigo-950/50 animate-in slide-in-from-top-4 duration-200"
          style={{
            transform: dragY < 0 ? `translateY(${dragY}px)` : undefined,
          }}
        >
          <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
            {/* Top Toolbar inside Drawer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recent conversations..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onNewChat();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close recent chats panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recent Chats Chronologically Grouped with Always Visible Scrollbar */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {filteredConversations.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  {searchQuery ? `No chats matching "${searchQuery}"` : 'No recent chats found.'}
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.id} className="space-y-2">
                    {/* Date Section Header */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{group.label}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{group.conversations.length}</span>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {group.conversations.map((conv) => {
                        const isActive = conv.id === activeConversationId;
                        return (
                          <div
                            key={conv.id}
                            onClick={() => {
                              onSelectConversation(conv.id);
                              onClose();
                            }}
                            className={`group relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-950/60'
                                : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                {isActive ? (
                                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                ) : conv.pinned ? (
                                  <Pin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                ) : (
                                  <MessageSquare className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                                )}
                                <h4
                                  className={`text-xs font-semibold truncate ${
                                    isActive ? 'text-indigo-200 font-bold' : 'text-slate-200 group-hover:text-white'
                                  }`}
                                >
                                  {conv.title}
                                </h4>
                              </div>

                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conv.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-all cursor-pointer"
                                title="Delete conversation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Snippet preview */}
                            <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                              {conv.lastMessagePreview || 'Empty conversation'}
                            </p>

                            {/* Footer: Date & messages count */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-600" />
                                {formatTimestamp(conv.updatedAt)}
                              </span>
                              <span className="font-mono">
                                {conv.messagesCount || 0} {conv.messagesCount === 1 ? 'msg' : 'msgs'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Grab Handle to slide back up */}
            <div
              className="flex items-center justify-center pt-2 pb-1 cursor-pointer group"
              onClick={onClose}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-slate-800/80 group-hover:bg-slate-700 text-slate-400 group-hover:text-slate-200 text-[10px] font-medium transition-colors">
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Pull up or click to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
