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
} from '../types/index';

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

  // Chat Streaming via SSE
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
    const url = `/api/chat/stream?conversationId=${encodeURIComponent(conversationId)}&prompt=${encodeURIComponent(prompt)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chunk' && data.text) {
          callbacks.onChunk(data.text);
        } else if (data.type === 'tools' && data.tools) {
          callbacks.onTools?.(data.tools);
        } else if (data.type === 'memory' && data.memory) {
          callbacks.onMemory?.(data.memory);
        } else if (data.type === 'sources' && data.sources) {
          callbacks.onSources?.(data.sources);
        } else if (data.type === 'done' && data.message) {
          callbacks.onDone?.(data.message);
          eventSource.close();
        } else if (data.type === 'error') {
          callbacks.onError?.(data.error || 'Unknown error occurred');
          eventSource.close();
        }
      } catch (err) {
        console.error('SSE JSON parse error:', err);
      }
    };

    eventSource.onerror = () => {
      callbacks.onError?.('Network connection interrupted while streaming response.');
      eventSource.close();
    };

    // Return cleanup abort handle
    return () => {
      eventSource.close();
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
};
