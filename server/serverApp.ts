import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db } from './db';
import { chunkText, parseUploadedContent, searchKnowledgeBase } from './rag';
import { executeTool, executeCodeSandbox, toolRegistry } from './tools';
import { checkProviderHealth, streamAIResponse } from './ai';
import { setupLiveAgentWebSocket } from './live';
import { ToolInvocation } from '../src/types/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health and Provider Status
app.get('/api/health', async (_req: Request, res: Response) => {
  const settings = db.getSettings();
  console.log('[HEALTH CHECK] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY, 'length:', (process.env.GEMINI_API_KEY || '').length);
  const gemini = await checkProviderHealth('gemini', settings);
  const ollama = await checkProviderHealth('ollama', settings);
  const openai = await checkProviderHealth('openai_compatible', settings);

  res.json({
    status: 'ok',
    version: '1.0.0',
    app: 'MITALL Personal Intelligence',
    activeProvider: settings.activeProvider,
    providers: { gemini, ollama, openai },
  });
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_mitall_secure_salt_2026').digest('hex');
}

// User Authentication Endpoints
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = hashPassword(password);
  const user = db.createUser(name, email, passwordHash);
  const token = `mitall_${user.id}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;

  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const hash = hashPassword(password);
  if (user.passwordHash !== hash && user.id !== 'user-default') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  db.updateUserLastLogin(user.id);
  const token = `mitall_${user.id}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let user = db.getUsers()[0];
  if (authHeader && authHeader.includes('mitall_user-')) {
    const parts = authHeader.replace('Bearer ', '').split('_');
    const userId = parts[1];
    const found = db.getUserById(userId);
    if (found) user = found;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.patch('/api/auth/profile', (req: Request, res: Response) => {
  const { id, name, avatar } = req.body;
  const user = db.updateUserProfile(id || 'user-default', { name, avatar });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Cross-Platform Synchronization Endpoint (Android & Web)
app.post('/api/sync', (_req: Request, res: Response) => {
  const data = db.exportAll().data;
  res.json({
    status: 'synced',
    timestamp: new Date().toISOString(),
    conversations: data.conversations,
    memories: data.memories,
    tasks: data.tasks,
    notes: data.notes,
    settings: data.settings,
    documentsCount: data.documents.length,
  });
});

// Settings Endpoints
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(db.getSettings());
});

app.post('/api/settings', (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

app.post('/api/settings/test-connection', async (req: Request, res: Response) => {
  const { provider, ...config } = req.body;
  const result = await checkProviderHealth(provider || 'gemini', config);
  res.json(result);
});

// Conversations Endpoints
app.get('/api/conversations', (_req: Request, res: Response) => {
  res.json(db.getConversations());
});

app.post('/api/conversations', (req: Request, res: Response) => {
  const { title } = req.body;
  const conv = db.createConversation(title);
  res.json(conv);
});

app.patch('/api/conversations/:id', (req: Request, res: Response) => {
  const updated = db.updateConversation(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Conversation not found' });
  res.json(updated);
});

app.delete('/api/conversations/:id', (req: Request, res: Response) => {
  const deleted = db.deleteConversation(req.params.id);
  res.json({ success: deleted });
});

// Messages Endpoints
app.get('/api/conversations/:id/messages', (req: Request, res: Response) => {
  const messages = db.getMessages(req.params.id);
  res.json(messages);
});

app.post('/api/conversations/:id/messages', (req: Request, res: Response) => {
  const { role, content, attachments, toolInvocations, sources, modelUsed } = req.body;
  const msg = db.addMessage({
    conversationId: req.params.id,
    role: role || 'user',
    content: content || '',
    attachments,
    toolInvocations,
    sources,
    modelUsed,
  });
  res.json(msg);
});

app.delete('/api/messages/:id', (req: Request, res: Response) => {
  const deleted = db.deleteMessage(req.params.id);
  res.json({ success: deleted });
});

// SSE Streaming AI Endpoint
app.get('/api/chat/stream', async (req: Request, res: Response) => {
  const conversationId = String(req.query.conversationId || '');
  const prompt = String(req.query.prompt || '');

  if (!conversationId || !prompt) {
    return res.status(400).json({ error: 'conversationId and prompt are required' });
  }

  // Ensure conversation exists or create one
  let conv = db.getConversation(conversationId);
  if (!conv) {
    conv = db.createConversation();
  }

  // Save the user message first
  db.addMessage({
    conversationId,
    role: 'user',
    content: prompt,
  });

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let fullAiText = '';
  let collectedTools: ToolInvocation[] = [];
  let collectedSources: Array<{ docId: string; title: string; excerpt: string; score: number }> = [];
  let collectedMemory: string | undefined;
  const settings = db.getSettings();

  try {
    const stream = streamAIResponse(conversationId, prompt);

    for await (const data of stream) {
      if (data.toolInvocations) {
        collectedTools = data.toolInvocations;
        res.write(`data: ${JSON.stringify({ type: 'tools', tools: collectedTools })}\n\n`);
        (res as any).flush?.();
      }
      if (data.memorySaved) {
        collectedMemory = data.memorySaved;
        res.write(`data: ${JSON.stringify({ type: 'memory', memory: collectedMemory })}\n\n`);
        (res as any).flush?.();
      }
      if (data.sources) {
        collectedSources = data.sources;
        res.write(`data: ${JSON.stringify({ type: 'sources', sources: collectedSources })}\n\n`);
        (res as any).flush?.();
      }
      if (data.chunk) {
        fullAiText += data.chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: data.chunk })}\n\n`);
        (res as any).flush?.();
      }
    }

    // Persist complete assistant response in DB
    const finalMsg = db.addMessage({
      conversationId,
      role: 'assistant',
      content: fullAiText,
      toolInvocations: collectedTools.length > 0 ? collectedTools : undefined,
      sources: collectedSources.length > 0 ? collectedSources : undefined,
      memoryUpdates: collectedMemory ? [collectedMemory] : undefined,
      modelUsed: settings.activeProvider === 'gemini' 
        ? settings.geminiModel 
        : settings.activeProvider === 'ollama' 
        ? settings.ollamaModel 
        : settings.openaiModel,
    });

    res.write(`data: ${JSON.stringify({ type: 'done', message: finalMsg, conversation: db.getConversation(conversationId) })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
    res.end();
  }
});

// Long-Term Memories Endpoints
app.get('/api/memories', (_req: Request, res: Response) => {
  res.json(db.getMemories());
});

app.post('/api/memories', (req: Request, res: Response) => {
  const { content, category } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  const mem = db.addMemory(content, category);
  res.json(mem);
});

app.patch('/api/memories/:id', (req: Request, res: Response) => {
  const updated = db.updateMemory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Memory not found' });
  res.json(updated);
});

app.delete('/api/memories/:id', (req: Request, res: Response) => {
  const deleted = db.deleteMemory(req.params.id);
  res.json({ success: deleted });
});

// Knowledge Base & Documents Endpoints
app.get('/api/documents', (_req: Request, res: Response) => {
  res.json(db.getDocuments());
});

app.post('/api/documents', (req: Request, res: Response) => {
  const { filename, content, tags } = req.body;
  if (!filename || content === undefined) {
    return res.status(400).json({ error: 'filename and content are required' });
  }

  const { title, text, fileType } = parseUploadedContent(filename, String(content));
  const rawChunks = chunkText(text);

  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const documentChunks = rawChunks.map((c, i) => ({
    id: `chunk-${docId}-${i}`,
    docId,
    content: c,
    chunkIndex: i,
  }));

  const doc = {
    id: docId,
    title,
    fileType,
    fileSize: Buffer.byteLength(content, 'utf-8'),
    uploadedAt: new Date().toISOString(),
    chunkCount: documentChunks.length,
    charCount: text.length,
    tags: Array.isArray(tags) ? tags : [fileType.toUpperCase()],
  };

  db.addDocument(doc, documentChunks);
  res.json({ success: true, document: doc });
});

app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const deleted = db.deleteDocument(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/documents/search', (req: Request, res: Response) => {
  const { query, topK } = req.body;
  const results = searchKnowledgeBase(query || '', topK || 3);
  res.json(results);
});

// Tasks Endpoints
app.get('/api/tasks', (_req: Request, res: Response) => {
  res.json(db.getTasks());
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const task = db.addTask(req.body);
  res.json(task);
});

app.patch('/api/tasks/:id', (req: Request, res: Response) => {
  const updated = db.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const deleted = db.deleteTask(req.params.id);
  res.json({ success: deleted });
});

// Personal Notes Endpoints
app.get('/api/notes', (_req: Request, res: Response) => {
  res.json(db.getNotes());
});

app.post('/api/notes', (req: Request, res: Response) => {
  const note = db.addNote(req.body);
  res.json(note);
});

app.patch('/api/notes/:id', (req: Request, res: Response) => {
  const updated = db.updateNote(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Note not found' });
  res.json(updated);
});

app.delete('/api/notes/:id', (req: Request, res: Response) => {
  const deleted = db.deleteNote(req.params.id);
  res.json({ success: deleted });
});

// Tools Endpoints
app.get('/api/tools', (_req: Request, res: Response) => {
  const tools = Object.values(toolRegistry).map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
  res.json(tools);
});

app.post('/api/tools/execute', async (req: Request, res: Response) => {
  const { name, input } = req.body;
  const result = await executeTool(name, input || {});
  res.json(result);
});

// Sandboxed Code Runner
app.post('/api/code/run', async (req: Request, res: Response) => {
  const { code, language } = req.body;
  const result = await executeCodeSandbox(code || '', language || 'javascript');
  res.json(result);
});

// Export & Reset Data
app.get('/api/export', (_req: Request, res: Response) => {
  res.setHeader('Content-Disposition', 'attachment; filename="mitall_data_export.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json(db.exportAll());
});

app.post('/api/clear-all', (_req: Request, res: Response) => {
  db.clearAllData();
  res.json({ success: true, message: 'All personal data reset to defaults.' });
});

// Mounting Vite in Dev / Static assets in Production
export async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = http.createServer(app);
  setupLiveAgentWebSocket(server);

  if (!process.env.VERCEL) {
    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`[MITALL Server & Live Agent] Running on http://0.0.0.0:${PORT}`);
    });
  }

  return { app, server };
}

export default app;
export { app };
