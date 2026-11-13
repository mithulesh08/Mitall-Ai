import {
  Conversation,
  ChatMessage,
  Memory,
  KnowledgeDocument,
  TaskItem,
  PersonalNote,
  UserSettings,
  ToolInvocation,
  ProviderStatus,
  UserProfile,
  AuthResponse,
} from '../types/index';
import { generateClientFallback, streamDirectGeminiClient } from '../utils/clientFallback';

export const api = {
  // Health
  async getHealth(): Promise<{
    status: string;
    activeProvider: string;
    providers: {
      gemini: ProviderStatus;
      ollama: ProviderStatus;
      openai: ProviderStatus;
    };
  }> {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<UserSettings> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return res.json();
  },

  async testConnection(provider: string, config: Partial<UserSettings>): Promise<ProviderStatus> {
    const res = await fetch('/api/settings/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, ...config }),
    });
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch('/api/conversations');
    return res.json();
  },

  async createConversation(title?: string): Promise<Conversation> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return res.json();
  },

  async updateConversation(id: string, patch: Partial<Conversation>): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return res.json();
  },

  async deleteConversation(id: string): Promise<boolean> {
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Messages
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    return res.json();
  },

  async addMessage(
    conversationId: string,
    message: Partial<ChatMessage>
  ): Promise<ChatMessage> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return res.json();
  },

  async deleteMessage(id: string): Promise<boolean> {
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Chat Streaming via Fetch + ReadableStream with graceful client fallback
  streamChat(
    conversationId: string,
    prompt: string,
    callbacks: {
      onChunk: (text: string) => void;
      onTools?: (tools: ToolInvocation[]) => void;
      onMemory?: (memory: string) => void;
      onSources?: (sources: Array<{ docId: string; title: string; excerpt: string; score: number }>) => void;
      onDone?: (message: ChatMessage) => void;
      onError?: (error: string) => void;
    }
  ): () => void {
    const controller = new AbortController();
    let isCancelled = false;

    const streamClientFallback = () => {
      const fallbackText = generateClientFallback(prompt);
      const words = fallbackText.split(/(\s+)/);
      let index = 0;
      let accumulated = '';

      const interval = setInterval(() => {
        if (isCancelled) {
          clearInterval(interval);
          return;
        }

        if (index < words.length) {
          const chunk = words.slice(index, index + 3).join('');
          index += 3;
          accumulated += chunk;
          callbacks.onChunk(chunk);
        } else {
          clearInterval(interval);
          const finalMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: accumulated,
            createdAt: new Date().toISOString(),
            modelUsed: 'mitall-3.8-flash (client-mode)',
          };
          callbacks.onDone?.(finalMsg);
        }
      }, 40);
    };

    (async () => {
      const url = `/api/chat/stream?conversationId=${encodeURIComponent(conversationId)}&prompt=${encodeURIComponent(prompt)}`;

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'text/event-stream' },
        });

        if (!res.ok) {
          console.warn(`[MITALL API] /api/chat/stream returned HTTP ${res.status}. Checking for client direct API key...`);
          const clientKey = localStorage.getItem('mitall_gemini_api_key') || localStorage.getItem('gemini_api_key');
          if (clientKey) {
            try {
              let fullText = '';
              await streamDirectGeminiClient(
                prompt,
                clientKey,
                (chunk) => {
                  fullText += chunk;
                  callbacks.onChunk(chunk);
                },
                controller.signal
              );
              callbacks.onDone?.({
                id: `msg-${Date.now()}`,
                conversationId,
                role: 'assistant',
                content: fullText,
                createdAt: new Date().toISOString(),
                modelUsed: 'gemini-2.5-flash (client-direct)',
              });
              return;
            } catch (directErr) {
              console.warn('[MITALL API] Direct client Gemini API failed:', directErr);
            }
          }
          streamClientFallback();
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          streamClientFallback();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let hasReceivedChunk = false;

        let hasCompletedDone = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                if (data.type === 'chunk' && data.text) {
                  hasReceivedChunk = true;
                  callbacks.onChunk(data.text);
                } else if (data.type === 'tools' && data.tools) {
                  callbacks.onTools?.(data.tools);
                } else if (data.type === 'memory' && data.memory) {
                  callbacks.onMemory?.(data.memory);
                } else if (data.type === 'sources' && data.sources) {
                  callbacks.onSources?.(data.sources);
                } else if (data.type === 'done' && data.message) {
                  hasCompletedDone = true;
                  callbacks.onDone?.(data.message);
                } else if (data.type === 'error') {
                  if (!hasReceivedChunk) {
                    streamClientFallback();
                    return;
                  } else {
                    // If some chunks were already emitted, finalize nicely
                    callbacks.onDone?.({
                      id: `msg-${Date.now()}`,
                      conversationId,
                      role: 'assistant',
                      content: buffer || 'Response complete.',
                      createdAt: new Date().toISOString(),
                      modelUsed: 'mitall-intelligence',
                    });
                    return;
                  }
                }
              } catch (parseErr) {
                console.error('SSE JSON parse error:', parseErr);
              }
            }
          }
        }

        // If the stream closed without delivering any chunks or done event, engage client fallback
        if (!hasReceivedChunk && !hasCompletedDone) {
          streamClientFallback();
        }
      } catch (err: unknown) {
        if (controller.signal.aborted || isCancelled) return;
        console.warn('[MITALL API] Network request failed. Engaging client fallback mode.', err);
        streamClientFallback();
      }
    })();

    // Return cleanup abort handle
    return () => {
      isCancelled = true;
      controller.abort();
    };
  },

  // Memories
  async getMemories(): Promise<Memory[]> {
    const res = await fetch('/api/memories');
    return res.json();
  },

  async addMemory(content: string, category: Memory['category'] = 'preferences'): Promise<Memory> {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, category }),
    });
    return res.json();
  },

  async updateMemory(id: string, patch: Partial<Memory>): Promise<Memory> {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return res.json();
  },

  async deleteMemory(id: string): Promise<boolean> {
    const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Documents
  async getDocuments(): Promise<KnowledgeDocument[]> {
    const res = await fetch('/api/documents');
    return res.json();
  },

  async uploadDocument(filename: string, content: string, tags?: string[]): Promise<{ success: boolean; document: KnowledgeDocument }> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content, tags }),
    });
    return res.json();
  },

  async deleteDocument(id: string): Promise<boolean> {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  async searchDocuments(query: string, topK: number = 3): Promise<Array<{ docId: string; title: string; excerpt: string; score: number }>> {
    const res = await fetch('/api/documents/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK }),
    });
    return res.json();
  },

  // Tasks
  async getTasks(): Promise<TaskItem[]> {
    const res = await fetch('/api/tasks');
    return res.json();
  },

  async addTask(task: Partial<TaskItem>): Promise<TaskItem> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return res.json();
  },

  async updateTask(id: string, patch: Partial<TaskItem>): Promise<TaskItem> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return res.json();
  },

  async deleteTask(id: string): Promise<boolean> {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Notes
  async getNotes(): Promise<PersonalNote[]> {
    const res = await fetch('/api/notes');
    return res.json();
  },

  async addNote(note: Partial<PersonalNote>): Promise<PersonalNote> {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return res.json();
  },

  async updateNote(id: string, patch: Partial<PersonalNote>): Promise<PersonalNote> {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return res.json();
  },

  async deleteNote(id: string): Promise<boolean> {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Code Sandbox
  async runCode(code: string, language: string = 'javascript'): Promise<{ output: string; executionTimeMs: number; status: 'success' | 'error' }> {
    const res = await fetch('/api/code/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });
    return res.json();
  },

  // Direct Tool Execution
  async executeTool(name: string, input: Record<string, unknown>): Promise<ToolInvocation> {
    const res = await fetch('/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, input }),
    });
    return res.json();
  },

  // Data Export & Reset
  async clearAllData(): Promise<boolean> {
    const res = await fetch('/api/clear-all', { method: 'POST' });
    const data = await res.json();
    return data.success;
  },

  // Authentication & Session
  getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('mitall_auth_token');
  },

  setStoredToken(token: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mitall_auth_token', token);
    }
  },

  clearStoredToken() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('mitall_auth_token');
    }
  },

  async registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    this.setStoredToken(data.token);
    return data;
  },

  async loginUser(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Invalid email or password' }));
      throw new Error(err.error || 'Invalid email or password');
    }
    const data = await res.json();
    this.setStoredToken(data.token);
    return data;
  },

  async getCurrentUser(): Promise<UserProfile> {
    const token = this.getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/auth/me', { headers });
    const data = await res.json();
    return data.user;
  },

  async updateUserProfile(name: string, avatar?: string): Promise<UserProfile> {
    const token = this.getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name, avatar }),
    });
    const data = await res.json();
    return data.user;
  },

  async syncAll(): Promise<{ status: string; timestamp: string }> {
    const res = await fetch('/api/sync', { method: 'POST' });
    return res.json();
  },
};
