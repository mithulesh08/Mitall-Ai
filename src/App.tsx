import React, { useState, useEffect } from 'react';
import { Conversation, UserSettings } from './types/index';
import { api } from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ChatWorkspace } from './components/chat/ChatWorkspace';
import { Dashboard } from './components/dashboard/Dashboard';
import { MemoryManager } from './components/memory/MemoryManager';
import { KnowledgeBase } from './components/knowledge/KnowledgeBase';
import { CodingAssistant } from './components/coding/CodingAssistant';
import { TaskManager } from './components/tasks/TaskManager';
import { NotesManager } from './components/notes/NotesManager';
import { SettingsView } from './components/settings/SettingsView';
import { LiveAgentView } from './components/live/LiveAgentView';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'chat' | 'live' | 'dashboard' | 'memory' | 'knowledge' | 'coding' | 'tasks' | 'notes' | 'settings'
  >('chat');

  const [settings, setSettings] = useState<UserSettings>({
    aiName: 'MITALL',
    theme: 'dark',
    language: 'English',
    personality: 'friendly_mentor',
    temperature: 0.7,
    maxTokens: 4096,
    activeProvider: 'gemini',
    geminiModel: 'gemini-3.8-flash',
    ollamaEndpoint: 'http://127.0.0.1:11434',
    ollamaModel: 'llama3.2',
    openaiEndpoint: 'https://api.openai.com/v1',
    openaiModel: 'gpt-4o',
    openaiApiKey: '',
    memoryEnabled: true,
    webSearchEnabled: true,
    voiceEnabled: true,
    speechSpeed: 1.0,
    voiceGender: 'default',
    technicalExplanationLevel: 'intermediate',
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-welcome');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Coding studio state passing
  const [sandboxCode, setSandboxCode] = useState<string | undefined>();
  const [sandboxLang, setSandboxLang] = useState<string | undefined>();

  // Counts for badges
  const [counts, setCounts] = useState({
    memories: 0,
    tasks: 0,
    documents: 0,
  });

  // Load initial settings and conversations
  const refreshAppData = async () => {
    try {
      const [fetchedSettings, convList, memList, taskList, docList] = await Promise.all([
        api.getSettings(),
        api.getConversations(),
        api.getMemories(),
        api.getTasks(),
        api.getDocuments(),
      ]);

      setSettings(fetchedSettings);
      setConversations(convList);
      if (convList.length > 0 && !activeConversationId) {
        setActiveConversationId(convList[0].id);
      }
      setCounts({
        memories: memList.filter((m) => m.isActive).length,
        tasks: taskList.filter((t) => !t.completed).length,
        documents: docList.length,
      });
    } catch (err) {
      console.error('Error loading initial app data:', err);
    }
  };

  useEffect(() => {
    refreshAppData();
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewChat = async (initialTitle?: string) => {
    const newConv = await api.createConversation(initialTitle || 'New Conversation');
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setCurrentView('chat');
    setIsMobileMenuOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    await api.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    const updated = await api.updateConversation(id, { title: newTitle });
    if (updated) {
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  };

  const handlePinConversation = async (id: string, pinned: boolean) => {
    const updated = await api.updateConversation(id, { pinned });
    if (updated) {
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  };

  const handleRunCodeInSandbox = (code: string, language: string) => {
    setSandboxCode(code);
    setSandboxLang(language);
    setCurrentView('coding');
  };

  const handleStartDocChat = async (prompt: string) => {
    const newConv = await api.createConversation('Document Discussion');
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setCurrentView('chat');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f17] text-slate-100 font-sans">
      {/* Desktop & Mobile Sidebar */}
      <div
        className={`${
          isMobileMenuOpen ? 'fixed inset-0 z-40 flex' : 'hidden md:flex'
        }`}
      >
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            setCurrentView('chat');
            setIsMobileMenuOpen(false);
          }}
          onNewChat={() => handleNewChat()}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onPinConversation={handlePinConversation}
          settings={settings}
          counts={counts}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          activeView={currentView}
          settings={settings}
          onNewChat={() => handleNewChat()}
          onNavigate={setCurrentView}
        />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {currentView === 'chat' && (
            <ChatWorkspace
              conversationId={activeConversationId || 'conv-welcome'}
              settings={settings}
              conversations={conversations}
              onSelectConversation={(id) => setActiveConversationId(id)}
              onNewChat={() => handleNewChat()}
              onDeleteConversation={handleDeleteConversation}
              onRunCodeInSandbox={handleRunCodeInSandbox}
              onOpenSettings={() => setCurrentView('settings')}
              onRefreshStats={refreshAppData}
              onOpenLiveAgent={() => setCurrentView('live')}
            />
          )}

          {currentView === 'live' && (
            <LiveAgentView
              settings={settings}
              onSaveToChat={async (title, turns) => {
                const conv = await api.createConversation(title);
                for (const t of turns) {
                  await api.addMessage(conv.id, { role: t.role, content: t.content });
                }
                await refreshAppData();
                setActiveConversationId(conv.id);
                setCurrentView('chat');
              }}
              onClose={() => setCurrentView('chat')}
            />
          )}

          {currentView === 'dashboard' && (
            <Dashboard
              settings={settings}
              onNavigate={setCurrentView}
              onNewChat={handleNewChat}
            />
          )}

          {currentView === 'memory' && <MemoryManager />}

          {currentView === 'knowledge' && (
            <KnowledgeBase onStartDocChat={handleStartDocChat} />
          )}

          {currentView === 'coding' && (
            <CodingAssistant
              initialCode={sandboxCode}
              initialLang={sandboxLang}
              onAskMitall={(p) => handleNewChat(p)}
            />
          )}

          {currentView === 'tasks' && <TaskManager />}

          {currentView === 'notes' && (
            <NotesManager
              onAskMitallAboutNote={(p) => handleNewChat(p)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={(updated) => setSettings(updated)}
              onClearAllData={async () => {
                await api.clearAllData();
                refreshAppData();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
