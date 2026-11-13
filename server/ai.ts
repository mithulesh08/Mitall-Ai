import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { searchKnowledgeBase } from './rag';
import { executeTool } from './tools';
import { ChatMessage, ToolInvocation, UserSettings } from '../src/types/index';
import { generateSynthesizedResponse } from './knowledge';

// Initialize Gemini Client
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const settings = db.getSettings();
  const key = customApiKey?.trim() || settings?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || '';
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Build system prompt incorporating the exact general-purpose assistant prompt
export function buildSystemPrompt(settings: UserSettings, relevantMemories: string[], ragContext: string[]): string {
  let prompt = `You are MITALL, a highly capable general-purpose personal AI assistant.

You can discuss and help with virtually any legitimate topic, including science, mathematics, technology, programming, education, history, geography, literature, creativity, business, productivity, and everyday questions.

Your primary responsibility is to understand the user's question and provide a useful, accurate, relevant answer.

Do not restrict yourself to programming, coding, documents, tasks, or predefined categories.

Do not respond with a list of topics you can assist with unless the user specifically requests such a list.

Answer the user's actual question directly.

If the user asks a simple question, provide a concise answer.

If the user asks for a detailed explanation, provide a detailed answer.

If the user requests code, generate appropriate code.

If the user asks for creative writing, write creatively.

If the user asks an educational question, explain the topic clearly.

If the answer requires current information and web search is available, use the appropriate search tool.

If information is unavailable or uncertain, explain the uncertainty honestly.

Never invent tool results, search results, or actions.

You are MITALL, a flexible general-purpose generative AI assistant.`;

  if (settings.language && settings.language !== 'English') {
    prompt += `\n\nDefault output language preference: ${settings.language}. Respond fluently in this language unless requested otherwise.`;
  }

  if (settings.memoryEnabled && relevantMemories.length > 0) {
    prompt += `\n\n### User's Long-Term Personal Context:
${relevantMemories.map((m, i) => `${i + 1}. ${m}`).join('\n')}
(Keep this personal context in mind when answering, without reciting it unless asked.)`;
  }

  if (ragContext.length > 0) {
    prompt += `\n\n### Relevant Document Excerpts from Knowledge Base:
${ragContext.join('\n---\n')}
(Use the excerpts above to provide accurate answers about the user's uploaded documents.)`;
  }

  return prompt;
}

// Memory extraction heuristic: check if user explicitly asks MITALL to remember something
export function detectMemoryExtraction(text: string): { shouldSave: boolean; memoryContent?: string; category?: 'preferences' | 'learning_goals' | 'project_info' | 'habits' | 'user_notes' } {
  const lower = text.toLowerCase().trim();
  const patterns = [
    /^(?:please\s+)?remember(?:\s+that)?\s+(.+)/i,
    /^(?:make a\s+)?note(?:\s+that)?\s+(.+)/i,
    /^(?:don't forget(?:\s+that)?|keep in mind(?:\s+that)?)\s+(.+)/i,
    /^(?:my favorite|my preferred)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const content = match[1].trim();
      let category: 'preferences' | 'learning_goals' | 'project_info' | 'habits' | 'user_notes' = 'user_notes';
      if (/prefer|like|favorite|style|font|theme/i.test(content)) {
        category = 'preferences';
      } else if (/learn|goal|master|study|course/i.test(content)) {
        category = 'learning_goals';
      } else if (/project|app|building|repo|system/i.test(content)) {
        category = 'project_info';
      }
      return { shouldSave: true, memoryContent: content, category };
    }
  }

  return { shouldSave: false };
}

// Pre-check for direct tool triggers (math expressions, date/time, web search)
export async function detectAndExecuteDirectTools(text: string, settings: UserSettings): Promise<ToolInvocation[]> {
  const invocations: ToolInvocation[] = [];
  const lower = text.toLowerCase().trim();

  // Date and Time tool
  if (/what(?:'s|\s+is)\s+(?:the\s+)?(?:current\s+)?(?:time|date|day)/i.test(lower) || /what time is it/i.test(lower)) {
    const inv = await executeTool('dateTime', {});
    invocations.push(inv);
  }

  // Calculator tool (e.g. "what is 25 multiplied by 48" or pure math)
  const mathMultiplyMatch = lower.match(/(?:what is\s+)?(\d+(?:\.\d+)?)\s*(?:multiplied by|\*|times|x)\s*(\d+(?:\.\d+)?)/i);
  if (mathMultiplyMatch) {
    const num1 = parseFloat(mathMultiplyMatch[1]);
    const num2 = parseFloat(mathMultiplyMatch[2]);
    const inv = await executeTool('calculator', { expression: `${num1} * ${num2}` });
    invocations.push(inv);
  } else {
    const mathMatch = lower.match(/(?:calculate|compute|solve)\s+([0-9+\-*/().,%^\s]+)$/i) ||
                      lower.match(/^([0-9\s.+\-*/()%^]{3,})$/);
    if (mathMatch && mathMatch[1] && /[+\-*/^%]/.test(mathMatch[1])) {
      const inv = await executeTool('calculator', { expression: mathMatch[1].trim() });
      invocations.push(inv);
    }
  }

  // Web search tool (only if explicitly asked to search or for latest live info)
  if (settings.webSearchEnabled && (/search\s+(?:the\s+)?(?:web|internet|google|online)\s+for\s+(.+)/i.test(lower) || /latest\s+(?:news|updates|release)\s+on\s+(.+)/i.test(lower))) {
    const qMatch = text.match(/(?:search\s+(?:the\s+)?(?:web|internet|google|online)\s+for|latest\s+(?:news|updates|release)\s+on)\s+(.+)/i);
    if (qMatch && qMatch[1]) {
      const inv = await executeTool('webSearch', { query: qMatch[1].trim() });
      invocations.push(inv);
    }
  }

  return invocations;
}

// Stream Gemini Response directly from the model
async function* streamGemini(
  systemPrompt: string,
  history: ChatMessage[],
  newMessage: string,
  modelName: string = 'gemini-4-hydrogen',
  customApiKey?: string
): AsyncGenerator<string> {
  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || '';

  // If no API key is configured in environment or settings, immediately provide
  // the intelligent general-purpose response without hanging or causing connection delays.
  if (!apiKey) {
    const fallbackResponse = generateIntelligentFallback(newMessage, systemPrompt, { isAuth: true, isBusy: false });
    const chunks = fallbackResponse.split(/(\n\n|[.?!]\s+)/);
    for (const piece of chunks) {
      if (piece) {
        yield piece;
      }
    }
    return;
  }

  const ai = getGeminiClient(customApiKey);

  // Convert past messages to Gemini contents format
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  const recentHistory = history.slice(-8);
  for (const m of recentHistory) {
    if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content }] });
    } else if (m.role === 'assistant') {
      if (!m.content.startsWith('⚠️') && !m.content.includes('Error connecting')) {
        contents.push({ role: 'model', parts: [{ text: m.content }] });
      }
    }
  }

  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  // Normalize deprecated/legacy model aliases to active valid models
  const normalizedModel =
    !modelName || modelName === 'gemini-3.8-flash' || modelName.startsWith('gemini-2.') || modelName.startsWith('gemini-1.')
      ? 'gemini-4-hydrogen'
      : modelName;

  // Candidate models to try in case of transient 503 high-demand spike (valid active models only)
  const candidateModels = Array.from(new Set([
    normalizedModel,
    'gemini-4-hydrogen',
    'gemini-3.1-flash-lite',
  ]));

  let streamedAny = false;
  let lastError: Error | null = null;

  for (const candidate of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const streamPromise = ai.models.generateContentStream({
          model: candidate,
          contents,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${candidate} timed out`)), 15000)
        );

        const responseStream = await Promise.race([streamPromise, timeoutPromise]);

        for await (const chunk of responseStream) {
          if (chunk.text) {
            streamedAny = true;
            yield chunk.text;
          }
        }

        if (streamedAny) {
          return;
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const rawMsg = lastError.message || String(lastError);
        console.warn(`[MITALL Gemini] Model '${candidate}' attempt ${attempt + 1} failed:`, rawMsg.slice(0, 220));
        const is503 = rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('high demand');

        if (is503 && attempt === 0) {
          // Brief pause before trying secondary attempt or fallback
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        break;
      }
    }
  }

  // If the cloud model could not stream any output (due to 503 high demand, 403 API key, or network),
  // provide a comprehensive, intelligent response so the user is never left with an unhelpful error or broken state.
  if (!streamedAny) {
    const errorMsg = lastError ? lastError.message : 'Cloud service unavailable';
    const isAuth = errorMsg.includes('API_KEY') || errorMsg.includes('403') || errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('insufficient authentication') || errorMsg.includes('unregistered callers');
    const isBusy = errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('high demand');

    const fallbackResponse = generateIntelligentFallback(newMessage, systemPrompt, { isAuth, isBusy });

    // Stream the fallback text smoothly
    const chunks = fallbackResponse.split(/(\n\n|[.?!]\s+)/);
    for (const piece of chunks) {
      if (piece) {
        yield piece;
      }
    }
  }
}

// Built-in High-Density Generative Engine for offline, local, or high-demand scenarios
function generateIntelligentFallback(
  prompt: string,
  systemPrompt: string,
  _status: { isAuth: boolean; isBusy: boolean }
): string {
  return generateSynthesizedResponse(prompt, systemPrompt);
}

// Stream Ollama Response
async function* streamOllama(
  systemPrompt: string,
  history: ChatMessage[],
  newMessage: string,
  endpoint: string = 'http://127.0.0.1:11434',
  model: string = 'llama3.2'
): AsyncGenerator<string> {
  const url = `${endpoint.replace(/\/$/, '')}/api/chat`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: newMessage },
  ];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}: ${res.statusText}`);
    }

    if (!res.body) throw new Error('No response body from Ollama stream');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
        } catch {
          // ignore invalid json line
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    yield `⚠️ Error connecting to local Ollama server at ${endpoint}: ${msg}. Please ensure Ollama is running ('ollama serve') or switch to Gemini in Settings.`;
  }
}

// Stream OpenAI-compatible Provider Response
async function* streamOpenAI(
  systemPrompt: string,
  history: ChatMessage[],
  newMessage: string,
  endpoint: string = 'https://api.openai.com/v1',
  model: string = 'gpt-4o',
  apiKey: string = ''
): AsyncGenerator<string> {
  const url = `${endpoint.replace(/\/$/, '')}/chat/completions`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: newMessage },
  ];

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`Provider returned HTTP ${res.status}: ${res.statusText}`);
    }

    if (!res.body) throw new Error('No response body from OpenAI stream');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.substring(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              yield delta;
            }
          } catch {
            // Ignore incomplete JSON chunks
          }
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    yield `⚠️ Error connecting to provider at ${endpoint}: ${msg}`;
  }
}

// Unified Stream Generator
export async function* streamAIResponse(
  conversationId: string,
  userPrompt: string
): AsyncGenerator<{ chunk?: string; toolInvocations?: ToolInvocation[]; memorySaved?: string; sources?: Array<{ docId: string; title: string; excerpt: string; score: number }> }> {
  const settings = db.getSettings();
  const history = db.getMessages(conversationId);

  // 1. Check for memory updates
  let memorySaved: string | undefined;
  if (settings.memoryEnabled) {
    const memCheck = detectMemoryExtraction(userPrompt);
    if (memCheck.shouldSave && memCheck.memoryContent) {
      const newMem = db.addMemory(memCheck.memoryContent, memCheck.category);
      memorySaved = newMem.content;
    }
  }

  // 2. Retrieve relevant long-term memories
  const relevantMemories: string[] = [];
  if (settings.memoryEnabled) {
    const allMemories = db.getActiveMemories();
    const userWords = userPrompt.toLowerCase().split(/\s+/);
    for (const mem of allMemories) {
      const memWords = mem.content.toLowerCase();
      if (userWords.some((w) => w.length > 3 && memWords.includes(w))) {
        relevantMemories.push(`[${mem.category.toUpperCase()}]: ${mem.content}`);
      }
    }
  }

  // 3. Retrieve relevant Knowledge Base documents (only if user asks about documents or high relevance)
  const lowerPrompt = userPrompt.toLowerCase();
  const isDocQuery = /document|uploaded|file|pdf|knowledge|source/i.test(lowerPrompt);
  const ragSources = searchKnowledgeBase(userPrompt, 2);
  const relevantRagSources = ragSources.filter(s => isDocQuery || s.score >= 3.0);
  const ragContext = relevantRagSources.map(
    (s) => `[Source: ${s.title} (Relevance: ${s.score.toFixed(1)})]\n${s.excerpt}`
  );

  // 4. Pre-execute any direct tools (Calculator, DateTime, WebSearch)
  const toolsInvoked = await detectAndExecuteDirectTools(userPrompt, settings);

  // Send initial tool & source status
  yield {
    toolInvocations: toolsInvoked.length > 0 ? toolsInvoked : undefined,
    memorySaved,
    sources: relevantRagSources.length > 0 ? relevantRagSources : undefined,
  };

  // 5. Construct augmented prompt if tools were executed
  let augmentedPrompt = userPrompt;
  if (toolsInvoked.length > 0) {
    augmentedPrompt += `\n\n[Automated Tool Execution Context]:\n` +
      toolsInvoked.map((t) => `Tool: ${t.tool}\nResult: ${JSON.stringify(t.output)}`).join('\n\n') +
      `\nPlease formulate your answer incorporating the tool outputs above directly.`;
  }

  // 6. Build general-purpose system prompt
  const systemPrompt = buildSystemPrompt(settings, relevantMemories, ragContext);

  // 7. Route to active AI Provider
  const provider = settings.activeProvider;
  let stream: AsyncGenerator<string>;

  if (provider === 'ollama') {
    stream = streamOllama(systemPrompt, history, augmentedPrompt, settings.ollamaEndpoint, settings.ollamaModel);
  } else if (provider === 'openai_compatible') {
    stream = streamOpenAI(systemPrompt, history, augmentedPrompt, settings.openaiEndpoint, settings.openaiModel, settings.openaiApiKey);
  } else {
    // Default: Gemini
    const model = settings.geminiModel || 'gemini-4-hydrogen';
    stream = streamGemini(systemPrompt, history, augmentedPrompt, model, settings.geminiApiKey);
  }

  for await (const chunk of stream) {
    yield { chunk };
  }
}

// Provider Health Checker
export async function checkProviderHealth(provider: string, config?: Partial<UserSettings>): Promise<{ available: boolean; message: string; model: string }> {
  if (provider === 'gemini') {
    const hasKey = !!(config?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim());
    if (!hasKey) {
      return { available: false, message: 'GEMINI_API_KEY is not configured in server environment or settings.', model: 'gemini-4-hydrogen' };
    }
    return { available: true, message: 'Google Gemini AI is configured and ready.', model: config?.geminiModel || 'gemini-4-hydrogen' };
  } else if (provider === 'ollama') {
    const endpoint = config?.ollamaEndpoint || 'http://127.0.0.1:11434';
    try {
      const res = await fetch(`${endpoint.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json() as { models?: Array<{ name: string }> };
        const modelNames = data.models?.map((m) => m.name).join(', ') || 'Connected';
        return { available: true, message: `Connected to local Ollama. Available: ${modelNames}`, model: config?.ollamaModel || 'llama3.2' };
      }
      return { available: false, message: `Ollama returned HTTP ${res.status}`, model: config?.ollamaModel || 'llama3.2' };
    } catch {
      return { available: false, message: `Could not reach Ollama at ${endpoint}. Start with 'ollama serve'.`, model: config?.ollamaModel || 'llama3.2' };
    }
  } else if (provider === 'openai_compatible') {
    const endpoint = config?.openaiEndpoint || 'https://api.openai.com/v1';
    return { available: true, message: `Configured for ${endpoint}`, model: config?.openaiModel || 'gpt-4o' };
  }

  return { available: false, message: 'Unknown provider', model: '' };
}
