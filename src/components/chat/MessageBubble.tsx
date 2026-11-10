import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Trash2,
  Cpu,
  Bookmark,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Calculator,
  Clock,
  Code2,
} from 'lucide-react';
import { ChatMessage, ToolInvocation } from '../../types/index';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
  onDelete?: (id: string) => void;
  onRegenerate?: (message: ChatMessage) => void;
  onRunCode?: (code: string, language: string) => void;
  speechSpeed?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onDelete,
  onRegenerate,
  onRunCode,
  speechSpeed = 1.0,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showToolsDetail, setShowToolsDetail] = useState(false);
  const [showSourcesDetail, setShowSourcesDetail] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const plain = message.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*_`]/g, '')
      .replace(/\[Source:.*?\]/g, '');

    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = speechSpeed || 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'calculator':
        return <Calculator className="w-3.5 h-3.5 text-blue-400" />;
      case 'dateTime':
        return <Clock className="w-3.5 h-3.5 text-emerald-400" />;
      case 'webSearch':
        return <Search className="w-3.5 h-3.5 text-amber-400" />;
      case 'codeRunner':
        return <Code2 className="w-3.5 h-3.5 text-violet-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div
      className={`group flex gap-3.5 md:gap-4 my-4 transition-all ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 ring-1 ring-white/10">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/30">
            <Sparkles className="w-4 h-4 animate-pulse text-indigo-100" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0b0f17]" />
          </div>
        )}
      </div>

      {/* Bubble Content Area */}
      <div className={`max-w-[85%] md:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Header line for Assistant */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">MITALL</span>
            {message.modelUsed && (
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono border border-slate-700/50">
                {message.modelUsed}
              </span>
            )}
            <span className="text-[10px] text-slate-500">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Tool Invocations Badge / Card */}
        {!isUser && message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="mb-2 w-full max-w-lg">
            <button
              onClick={() => setShowToolsDetail(!showToolsDetail)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-700/40 text-xs text-indigo-300 transition-colors w-full text-left"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">
                Used {message.toolInvocations.length} {message.toolInvocations.length === 1 ? 'Tool' : 'Tools'}:{' '}
                {message.toolInvocations.map((t) => t.tool).join(', ')}
              </span>
              <span className="ml-auto">
                {showToolsDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </button>

            {showToolsDetail && (
              <div className="mt-1.5 p-3 rounded-lg bg-slate-900/90 border border-slate-700/60 text-xs space-y-2">
                {message.toolInvocations.map((inv: ToolInvocation, i: number) => (
                  <div key={i} className="border-b border-slate-800 pb-1.5 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
                      {getToolIcon(inv.tool)}
                      <span>{inv.tool}</span>
                      <span className={`ml-auto text-[10px] px-1.5 rounded ${
                        inv.status === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : 'bg-rose-950 text-rose-300'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded max-h-32 overflow-y-auto">
                      {typeof inv.output === 'object' ? JSON.stringify(inv.output, null, 2) : String(inv.output)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Memory Update Notification */}
        {!isUser && message.memoryUpdates && message.memoryUpdates.length > 0 && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-700/40 text-[11px] text-emerald-300">
            <Bookmark className="w-3 h-3 text-emerald-400" />
            <span>Saved to Long-Term Memory: "{message.memoryUpdates[0]}"</span>
          </div>
        )}

        {/* Knowledge Base Source Citations */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mb-2 w-full max-w-lg">
            <button
              onClick={() => setShowSourcesDetail(!showSourcesDetail)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/40 hover:bg-blue-900/40 border border-blue-700/30 text-[11px] text-blue-300 transition-colors"
            >
              <FileText className="w-3 h-3 text-blue-400" />
              <span>
                Citing {message.sources.length} {message.sources.length === 1 ? 'Source' : 'Sources'} from Knowledge Base
              </span>
              {showSourcesDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showSourcesDetail && (
              <div className="mt-1.5 p-2.5 rounded-lg bg-slate-900/95 border border-slate-700/50 text-xs space-y-2">
                {message.sources.map((s, idx) => (
                  <div key={idx} className="bg-slate-950/80 p-2 rounded border border-slate-800">
                    <div className="flex items-center justify-between text-blue-300 font-medium text-[11px] mb-1">
                      <span>📄 {s.title}</span>
                      <span className="text-[10px] text-slate-400">Score: {s.score.toFixed(1)}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic line-clamp-3">"{s.excerpt}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bubble Surface */}
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-md ${
            isUser
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-sm'
              : 'bg-[#131b2a] text-slate-100 rounded-tl-sm border border-slate-700/60'
          }`}
        >
          {isUser ? (
            <div className="text-sm md:text-[15px] whitespace-pre-wrap leading-relaxed">{message.content}</div>
          ) : (
            <MarkdownRenderer content={message.content} onRunCode={onRunCode} />
          )}
        </div>

        {/* Action Toolbar */}
        <div
          className={`flex items-center gap-1 mt-1.5 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {!isUser && (
            <button
              onClick={handleSpeak}
              className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                isSpeaking ? 'text-indigo-400 bg-indigo-950/60' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isSpeaking ? 'Stop speech' : 'Read aloud'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {!isUser && onRegenerate && (
            <button
              onClick={() => onRegenerate(message)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Regenerate response"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
