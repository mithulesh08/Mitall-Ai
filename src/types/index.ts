export type AIProviderType = 'gemini' | 'ollama' | 'openai_compatible';

export type PersonalityType = 
  | 'friendly_mentor' 
  | 'technical_expert' 
  | 'concise_assistant' 
  | 'socratic_tutor';

export interface UserSettings {
  aiName: string;
  theme: 'dark' | 'light';
  language: string;
  personality: PersonalityType;
  temperature: number;
  maxTokens: number;
  activeProvider: AIProviderType;
  geminiModel: string;
  geminiApiKey?: string;
  ollamaEndpoint: string;
  ollamaModel: string;
  openaiEndpoint: string;
  openaiModel: string;
  openaiApiKey: string;
  memoryEnabled: boolean;
  webSearchEnabled: boolean;
  voiceEnabled: boolean;
  speechSpeed: number;
  voiceGender: 'female' | 'male' | 'default';
  technicalExplanationLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface Memory {
  id: string;
  content: string;
  category: 'preferences' | 'learning_goals' | 'project_info' | 'habits' | 'user_notes';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  previewUrl?: string;
}

export interface ToolInvocation {
  tool: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | string;
  status: 'running' | 'success' | 'error';
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  attachments?: Attachment[];
  toolInvocations?: ToolInvocation[];
  sources?: Array<{ docId: string; title: string; excerpt: string; score: number }>;
  memoryUpdates?: string[];
  createdAt: string;
  modelUsed?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  pinned: boolean;
  messagesCount: number;
  lastMessagePreview?: string;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  content: string;
  chunkIndex: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  chunkCount: number;
  charCount: number;
  summary?: string;
  tags: string[];
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskCategory = 'coding' | 'learning' | 'work' | 'personal' | 'research';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  reminderTime?: string;
}

export interface PersonalNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderStatus {
  provider: AIProviderType;
  available: boolean;
  model: string;
  message?: string;
}
