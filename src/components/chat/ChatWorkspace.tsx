import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  Brain,
  FileText,
  X,
  Code2,
  ListTodo,
  FileSearch,
  Languages,
  Radio,
} from 'lucide-react';
import { ChatMessage, ToolInvocation, UserSettings, Conversation } from '../../types/index';
import { MessageBubble } from './MessageBubble';
import { RecentChatsPullDown } from './RecentChatsPullDown';
import { api } from '../../services/api';

interface ChatWorkspaceProps {
  conversationId: string;
  settings: UserSettings;
  conversations?: Conversation[];
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteConversation?: (id: string) => void;
  onRunCodeInSandbox?: (code: string, language: string) => void;
  onOpenSettings?: () => void;
  onRefreshStats?: () => void;
  onOpenLiveAgent?: () => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  conversationId,
  settings,
  conversations = [],
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRunCodeInSandbox,
  onRefreshStats,
  onOpenLiveAgent,
}) => {
  const [isPullDownOpen, setIsPullDownOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingTools, setStreamingTools] = useState<ToolInvocation[]>([]);
  const [streamingSources, setStreamingSources] = useState<Array<{ docId: string; title: string; excerpt: string; score: number }>>([]);
  const [streamingMemory, setStreamingMemory] = useState<string | undefined>();
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; size: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversation messages
  useEffect(() => {
    let isMounted = true;
    api.getMessages(conversationId).then((data) => {
      if (isMounted) setMessages(data);
    });
    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // Auto-scroll on new messages or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, streamingTools]);

  // Adjust textarea height automatically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Send message and initiate streaming
  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend !== undefined ? promptToSend : inputPrompt).trim();
    if (!text && !attachedFile) return;
    if (isStreaming) return;

    let finalPrompt = text;
    if (attachedFile) {
      finalPrompt += `\n\n[Attached File: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content.slice(0, 4000)}\n\`\`\``;
      // also upload file to knowledge base so it stays searchable!
      api.uploadDocument(attachedFile.name, attachedFile.content, ['ATTACHMENT']).catch(console.error);
    }

    // Reset input
    setInputPrompt('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add optimistic user message to local state
    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content: finalPrompt,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    setIsStreaming(true);
    setStreamingText('');
    setStreamingTools([]);
    setStreamingSources([]);
    setStreamingMemory(undefined);

    const abortFn = api.streamChat(conversationId, finalPrompt, {
      onChunk: (chunk) => {
        setStreamingText((prev) => prev + chunk);
      },
      onTools: (tools) => {
        setStreamingTools(tools);
      },
      onSources: (sources) => {
        setStreamingSources(sources);
      },
      onMemory: (mem) => {
        setStreamingMemory(mem);
        onRefreshStats?.();
      },
      onDone: (finalMsg) => {
        setIsStreaming(false);
        setStreamingText('');
        setStreamingTools([]);
        setStreamingSources([]);
        setStreamingMemory(undefined);
        setMessages((prev) => [...prev.filter((m) => m.id !== optimisticUserMsg.id), optimisticUserMsg, finalMsg]);
        onRefreshStats?.();
      },
      onError: (err) => {
        setIsStreaming(false);
        setStreamingText('');
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `⚠️ ${err}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      },
    });

    abortControllerRef.current = abortFn;
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    if (streamingText) {
      setMessages((prev) => [
        ...prev,
        {
          id: `partial-${Date.now()}`,
          conversationId,
          role: 'assistant',
          content: streamingText + '\n\n*(Generation stopped by user)*',
          toolInvocations: streamingTools.length > 0 ? streamingTools : undefined,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setStreamingText('');
    setStreamingTools([]);
  };

  // Voice Speech Recognition
  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = settings.language === 'Tamil' ? 'ta-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInputPrompt(transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsRecording(false);
    }
  };

  // File Upload Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        size: file.size,
        content: text,
      });
    };
    reader.readAsText(file);
  };

  const handleDeleteMessage = async (msgId: string) => {
    await api.deleteMessage(msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  const handleRegenerate = (msg: ChatMessage) => {
    // Find previous user message
    const idx = messages.findIndex((m) => m.id === msg.id);
    if (idx > 0) {
      const previousUserMsg = messages[idx - 1];
      if (previousUserMsg && previousUserMsg.role === 'user') {
        handleDeleteMessage(msg.id);
        handleSendMessage(previousUserMsg.content);
      }
    }
  };

  const quickPrompts = [
    {
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      title: 'What is Artificial Intelligence?',
      prompt: 'Explain what artificial intelligence and modern neural networks are in clear language with everyday analogies.',
    },
    {
      icon: <Globe className="w-4 h-4 text-blue-400" />,
      title: 'Explain the Solar System',
      prompt: 'Explain the solar system, how the planets are organized, and what makes Earth unique.',
    },
    {
      icon: <FileText className="w-4 h-4 text-violet-400" />,
      title: 'Creative Sci-Fi Story',
      prompt: 'Write an engaging short story about a sentient robot who discovers an abandoned library in the year 2350.',
    },
    {
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      title: 'Python Factorial Program',
      prompt: 'Write a Python program to calculate factorial with both iterative and recursive implementations.',
    },
    {
      icon: <Languages className="w-4 h-4 text-amber-400" />,
      title: 'Tamil Dialogue (தமிழ்)',
      prompt: 'வணக்கம் MITALL! செயற்கை நுண்ணறிவு (Artificial Intelligence) பற்றிய எளிய அறிமுகம் தாருங்கள்.',
    },
    {
      icon: <Brain className="w-4 h-4 text-rose-400" />,
      title: 'Explain Quantum Computing',
      prompt: 'Explain quantum computing simply: how do qubits differ from classical bits, and why is superposition important?',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f17] overflow-hidden relative">
      {/* Drag-Down Bar to View and Switch Recent Chats */}
      {conversations.length > 0 && onSelectConversation && (
        <RecentChatsPullDown
          conversations={conversations}
          activeConversationId={conversationId}
          onSelectConversation={onSelectConversation}
          onNewChat={onNewChat || (() => {})}
          onDeleteConversation={onDeleteConversation || (() => {})}
          isOpen={isPullDownOpen}
          onToggle={() => setIsPullDownOpen((prev) => !prev)}
          onClose={() => setIsPullDownOpen(false)}
        />
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-2">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto my-auto pt-10 text-center">
            {/* MITALL Brand Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-violet-600 text-white shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-500/20 mb-6">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Good day! I am <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-violet-400">MITALL</span>
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-400 max-w-lg mx-auto">
              Your general-purpose personal AI assistant for programming, science, mathematics, education, creative writing, and everyday questions.
            </p>

            {/* Quick Suggestions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 text-left max-w-xl mx-auto">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-slate-800/90 group-hover:bg-indigo-950/60 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onDelete={handleDeleteMessage}
                onRegenerate={handleRegenerate}
                onRunCode={onRunCodeInSandbox}
                speechSpeed={settings.speechSpeed}
              />
            ))}

            {/* Live Streaming Message */}
            {isStreaming && (
              <MessageBubble
                message={{
                  id: 'streaming-live',
                  conversationId,
                  role: 'assistant',
                  content: streamingText || 'Thinking...',
                  toolInvocations: streamingTools.length > 0 ? streamingTools : undefined,
                  sources: streamingSources.length > 0 ? streamingSources : undefined,
                  memoryUpdates: streamingMemory ? [streamingMemory] : undefined,
                  createdAt: new Date().toISOString(),
                  modelUsed: settings.activeProvider === 'gemini' 
                    ? settings.geminiModel.replace(/gemini/gi, 'mitall')
                    : settings.activeProvider === 'ollama' 
                    ? settings.ollamaModel 
                    : settings.openaiModel,
                }}
                onRunCode={onRunCodeInSandbox}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar Area */}
      <div className="p-4 md:px-8 border-t border-slate-800/80 bg-[#0d121c]/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          {/* File Attachment Chip */}
          {attachedFile && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-xs text-indigo-200 w-fit">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium truncate max-w-xs">{attachedFile.name}</span>
              <span className="text-[10px] text-slate-400">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
              <button
                onClick={() => setAttachedFile(null)}
                className="hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="relative flex flex-col bg-slate-900/90 rounded-2xl border border-slate-700/70 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-xl transition-all">
            <textarea
              ref={textareaRef}
              value={inputPrompt}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${settings.aiName || 'MITALL'}... (Press Enter to send, Shift+Enter for newline)`}
              rows={1}
              className="w-full px-4 pt-3.5 pb-2 bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-[15px] resize-none focus:outline-none max-h-48"
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-slate-400 text-xs">
              <div className="flex items-center gap-1.5">
                {/* File Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".txt,.md,.pdf,.json,.csv,.py,.js,.ts,.cpp,.java,.html"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Attach document or code file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Voice Input Button */}
                <button
                  onClick={toggleVoiceRecording}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600/30 text-rose-400 ring-2 ring-rose-500/50 animate-pulse'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isRecording ? 'Listening... click to stop' : 'Voice input (Speech to Text)'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Connect Live Agent Button */}
                {onOpenLiveAgent && (
                  <button
                    onClick={onOpenLiveAgent}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                    title="Connect Live Voice & Video MITALL Agent"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="hidden sm:inline">MITALL Live Agent</span>
                  </button>
                )}

                {/* Feature Status Badges */}
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-[11px] text-slate-300 font-medium">
                  <Brain className="w-3 h-3 text-emerald-400" />
                  <span>Memory {settings.memoryEnabled ? 'On' : 'Off'}</span>
                </span>

                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-[11px] text-slate-300 font-medium">
                  <Globe className="w-3 h-3 text-blue-400" />
                  <span>Web {settings.webSearchEnabled ? 'Active' : 'Off'}</span>
                </span>
              </div>

              {/* Send / Stop Generation Button */}
              <div>
                {isStreaming ? (
                  <button
                    onClick={handleStopStreaming}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-all shadow-md shadow-rose-600/30 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputPrompt.trim() && !attachedFile}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 transition-all shadow-md shadow-indigo-600/30 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span>
              {settings.activeProvider === 'gemini'
                ? `⚡ Connected to MITALL ${settings.geminiModel.replace(/gemini/gi, 'mitall')}`
                : settings.activeProvider === 'ollama'
                ? `🖥️ Local Ollama (${settings.ollamaModel})`
                : `🌐 Custom Provider (${settings.openaiModel})`}
            </span>
            <span className="hidden md:inline">Shift + Enter for new line • Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
