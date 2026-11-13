import fs from 'fs';
import path from 'path';
import {
  UserSettings,
  Memory,
  ChatMessage,
  Conversation,
  KnowledgeDocument,
  DocumentChunk,
  TaskItem,
  PersonalNote,
  ToolInvocation,
} from '../src/types/index';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin: string;
}

interface DatabaseSchema {
  settings: UserSettings;
  conversations: Conversation[];
  messages: ChatMessage[];
  memories: Memory[];
  documents: KnowledgeDocument[];
  documentChunks: DocumentChunk[];
  tasks: TaskItem[];
  notes: PersonalNote[];
  toolLogs: Array<ToolInvocation & { id: string }>;
  users: UserRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mitall_db.json');

const defaultSettings: UserSettings = {
  aiName: 'MITALL',
  theme: 'dark',
  language: 'English',
  personality: 'friendly_mentor',
  temperature: 0.7,
  maxTokens: 4096,
  activeProvider: 'gemini',
  geminiModel: 'gemini-4-hydrogen',
  geminiApiKey: '',
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
};

const defaultConversations: Conversation[] = [
  {
    id: 'conv-welcome',
    title: 'Welcome to MITALL Personal Intelligence',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isArchived: false,
    pinned: true,
    messagesCount: 2,
    lastMessagePreview: 'Hello! I am MITALL, your personal AI assistant.',
  },
];

const defaultMessages: ChatMessage[] = [
  {
    id: 'msg-w1',
    conversationId: 'conv-welcome',
    role: 'user',
    content: 'Who are you and what can you help me with?',
    createdAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'msg-w2',
    conversationId: 'conv-welcome',
    role: 'assistant',
    content: `Hello! I am **MITALL**, your general-purpose personal AI assistant.

I can discuss and help with virtually any legitimate topic, including:
- 🔬 **Science & Math**: Physics, astronomy, biology, chemistry, calculus, and statistics.
- 🌍 **History, Geography & Culture**: World events, historical civilizations, and global knowledge.
- 💡 **Philosophy & Learning**: Deep concepts explained in simple language or technical depth.
- ✍️ **Creative Writing & Ideas**: Stories, essays, brainstorming, and translation.
- 💻 **Software Engineering & Technology**: Full-stack development, algorithms, system design, and debugging.
- ⚡ **Personal Productivity**: Managing tasks, in-app reminders, personal memories, and document research.

What would you like to explore or discuss right now?`,
    createdAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash',
  },
];

const defaultMemories: Memory[] = [
  {
    id: 'mem-1',
    content: 'User prefers clean, modular code with strong TypeScript types and clear explanations.',
    category: 'preferences',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    content: 'Primary goal is mastering full-stack AI orchestration, algorithms, and high-performance systems.',
    category: 'learning_goals',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-3',
    content: 'Current project: MITALL Personal Intelligence Assistant with multi-provider AI support.',
    category: 'project_info',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultTasks: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Explore MITALL Knowledge Base upload',
    description: 'Upload a PDF or markdown document to test semantic RAG search.',
    category: 'research',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Test Coding Assistant & Safe Sandbox',
    description: 'Run Python/JavaScript algorithms and inspect complexity breakdown.',
    category: 'coding',
    priority: 'medium',
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Configure AI Provider settings',
    description: 'Verify Gemini 3.8 Flash, or connect local Ollama if installed.',
    category: 'work',
    priority: 'low',
    completed: true,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const defaultNotes: PersonalNote[] = [
  {
    id: 'note-1',
    title: 'MITALL Architecture Notes',
    content: `# MITALL Personal Intelligence Architecture

MITALL operates through a modular AI orchestration pipeline:
1. **Frontend**: React + TypeScript + Tailwind CSS with dark/light themes.
2. **Backend**: Express + Vite dev server full-stack with REST & SSE endpoints.
3. **AI Engine**: Multi-provider support (Gemini 3.8 Flash, Ollama, OpenAI-compatible).
4. **Memory**: Two-tier memory (Short-term conversation context + Persistent long-term user memories).
5. **RAG Knowledge Base**: Document chunking and TF-IDF / vector similarity retrieval.
6. **Tool Suite**: Calculator, Web Search, Code Analysis, Task & Note managers.`,
    tags: ['Architecture', 'MITALL', 'AI'],
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultUsers: UserRecord[] = [
  {
    id: 'user-default',
    name: 'Mithulesh Ganesan',
    email: 'mithuleshganesan08@gmail.com',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // default admin hash
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const loadedSettings = { ...defaultSettings, ...(parsed.settings || {}) };
        if (
          !loadedSettings.geminiModel ||
          loadedSettings.geminiModel === 'gemini-3.8-flash' ||
          loadedSettings.geminiModel.startsWith('gemini-2.') ||
          loadedSettings.geminiModel.startsWith('gemini-1.')
        ) {
          loadedSettings.geminiModel = 'gemini-4-hydrogen';
        }
        return {
          settings: loadedSettings,
          conversations: parsed.conversations || defaultConversations,
          messages: parsed.messages || defaultMessages,
          memories: parsed.memories || defaultMemories,
          documents: parsed.documents || [],
          documentChunks: parsed.documentChunks || [],
          tasks: parsed.tasks || defaultTasks,
          notes: parsed.notes || defaultNotes,
          toolLogs: parsed.toolLogs || [],
          users: parsed.users && parsed.users.length > 0 ? parsed.users : defaultUsers,
        };
      }
    } catch (err) {
      console.error('Error reading database file, using defaults:', err);
    }

    const initial: DatabaseSchema = {
      settings: defaultSettings,
      conversations: defaultConversations,
      messages: defaultMessages,
      memories: defaultMemories,
      documents: [],
      documentChunks: [],
      tasks: defaultTasks,
      notes: defaultNotes,
      toolLogs: [],
      users: defaultUsers,
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema) {
    try {
      this.ensureDirectory();
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  // Settings
  getSettings(): UserSettings {
    return this.data.settings;
  }

  updateSettings(patch: Partial<UserSettings>): UserSettings {
    this.data.settings = { ...this.data.settings, ...patch };
    this.persist();
    return this.data.settings;
  }

  // Conversations
  getConversations(): Conversation[] {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return [...this.data.conversations]
      .filter((c) => c.messagesCount > 0 || new Date(c.createdAt).getTime() > fiveMinutesAgo || c.id === 'conv-welcome')
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  getConversation(id: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id);
  }

  createConversation(title?: string): Conversation {
    const conv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
      pinned: false,
      messagesCount: 0,
      lastMessagePreview: '',
    };
    this.data.conversations.unshift(conv);
    this.persist();
    return conv;
  }

  updateConversation(id: string, patch: Partial<Conversation>): Conversation | undefined {
    const idx = this.data.conversations.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data.conversations[idx] = {
      ...this.data.conversations[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.conversations[idx];
  }

  deleteConversation(id: string): boolean {
    const initialLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter((c) => c.id !== id);
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
    if (this.data.conversations.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Messages
  getMessages(conversationId: string): ChatMessage[] {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
    const fullMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.messages.push(fullMsg);

    // Update conversation metadata
    const conv = this.getConversation(msg.conversationId);
    if (conv) {
      conv.messagesCount += 1;
      conv.lastMessagePreview = msg.content.substring(0, 100);
      conv.updatedAt = new Date().toISOString();
      if (conv.title === 'New Conversation' && msg.role === 'user') {
        conv.title = msg.content.substring(0, 36) + (msg.content.length > 36 ? '...' : '');
      }
    }
    this.persist();
    return fullMsg;
  }

  deleteMessage(id: string): boolean {
    const msg = this.data.messages.find((m) => m.id === id);
    if (!msg) return false;
    this.data.messages = this.data.messages.filter((m) => m.id !== id);
    const conv = this.getConversation(msg.conversationId);
    if (conv) {
      conv.messagesCount = Math.max(0, conv.messagesCount - 1);
    }
    this.persist();
    return true;
  }

  // Memories
  getMemories(): Memory[] {
    return [...this.data.memories].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getActiveMemories(): Memory[] {
    return this.data.memories.filter((m) => m.isActive);
  }

  addMemory(content: string, category: Memory['category'] = 'preferences'): Memory {
    const mem: Memory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      content: content.trim(),
      category,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.memories.unshift(mem);
    this.persist();
    return mem;
  }

  updateMemory(id: string, patch: Partial<Memory>): Memory | undefined {
    const idx = this.data.memories.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    this.data.memories[idx] = {
      ...this.data.memories[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.memories[idx];
  }

  deleteMemory(id: string): boolean {
    const len = this.data.memories.length;
    this.data.memories = this.data.memories.filter((m) => m.id !== id);
    if (this.data.memories.length !== len) {
      this.persist();
      return true;
    }
    return false;
  }

  // Documents & RAG
  getDocuments(): KnowledgeDocument[] {
    return [...this.data.documents].sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  getDocument(id: string): KnowledgeDocument | undefined {
    return this.data.documents.find((d) => d.id === id);
  }

  addDocument(doc: KnowledgeDocument, chunks: DocumentChunk[]) {
    this.data.documents.unshift(doc);
    this.data.documentChunks.push(...chunks);
    this.persist();
  }

  deleteDocument(id: string): boolean {
    const len = this.data.documents.length;
    this.data.documents = this.data.documents.filter((d) => d.id !== id);
    this.data.documentChunks = this.data.documentChunks.filter((c) => c.docId !== id);
    if (this.data.documents.length !== len) {
      this.persist();
      return true;
    }
    return false;
  }

  getDocumentChunks(docId?: string): DocumentChunk[] {
    if (docId) {
      return this.data.documentChunks.filter((c) => c.docId === docId);
    }
    return this.data.documentChunks;
  }

  // Tasks
  getTasks(): TaskItem[] {
    return [...this.data.tasks].sort((a, b) => {
      if (a.completed === b.completed) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.completed ? 1 : -1;
    });
  }

  addTask(task: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem {
    const item: TaskItem = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.tasks.unshift(item);
    this.persist();
    return item;
  }

  updateTask(id: string, patch: Partial<TaskItem>): TaskItem | undefined {
    const idx = this.data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    if (patch.completed !== undefined && patch.completed && !this.data.tasks[idx].completed) {
      patch.completedAt = new Date().toISOString();
    } else if (patch.completed === false) {
      patch.completedAt = undefined;
    }
    this.data.tasks[idx] = { ...this.data.tasks[idx], ...patch };
    this.persist();
    return this.data.tasks[idx];
  }

  deleteTask(id: string): boolean {
    const len = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    if (this.data.tasks.length !== len) {
      this.persist();
      return true;
    }
    return false;
  }

  // Notes
  getNotes(): PersonalNote[] {
    return [...this.data.notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  addNote(note: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt'>): PersonalNote {
    const item: PersonalNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.notes.unshift(item);
    this.persist();
    return item;
  }

  updateNote(id: string, patch: Partial<PersonalNote>): PersonalNote | undefined {
    const idx = this.data.notes.findIndex((n) => n.id === id);
    if (idx === -1) return undefined;
    this.data.notes[idx] = {
      ...this.data.notes[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.notes[idx];
  }

  deleteNote(id: string): boolean {
    const len = this.data.notes.length;
    this.data.notes = this.data.notes.filter((n) => n.id !== id);
    if (this.data.notes.length !== len) {
      this.persist();
      return true;
    }
    return false;
  }

  // Tool Logs
  logTool(tool: ToolInvocation) {
    this.data.toolLogs.unshift({
      ...tool,
      id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    });
    if (this.data.toolLogs.length > 100) {
      this.data.toolLogs = this.data.toolLogs.slice(0, 100);
    }
    this.persist();
  }

  getToolLogs() {
    return this.data.toolLogs;
  }

  // User Authentication & Profile
  getUsers(): UserRecord[] {
    return this.data.users || [];
  }

  getUserByEmail(email: string): UserRecord | undefined {
    return (this.data.users || []).find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  getUserById(id: string): UserRecord | undefined {
    return (this.data.users || []).find((u) => u.id === id);
  }

  createUser(name: string, email: string, passwordHash: string): UserRecord {
    if (!this.data.users) this.data.users = [];
    const newUser: UserRecord = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUserLastLogin(id: string): void {
    const user = this.getUserById(id);
    if (user) {
      user.lastLogin = new Date().toISOString();
      this.persist();
    }
  }

  updateUserProfile(id: string, updates: Partial<UserRecord>): UserRecord | null {
    const user = this.getUserById(id);
    if (!user) return null;
    if (updates.name) user.name = updates.name.trim();
    if (updates.avatar) user.avatar = updates.avatar;
    this.persist();
    return user;
  }

  // Export & Clear
  exportAll() {
    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      data: this.data,
    };
  }

  clearAllData() {
    this.data = {
      settings: defaultSettings,
      conversations: defaultConversations,
      messages: defaultMessages,
      memories: defaultMemories,
      documents: [],
      documentChunks: [],
      tasks: defaultTasks,
      notes: defaultNotes,
      toolLogs: [],
      users: defaultUsers,
    };
    this.persist();
    return true;
  }
}

export const db = new Database();
