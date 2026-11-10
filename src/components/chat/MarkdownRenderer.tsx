import React, { useState } from 'react';
import { Copy, Check, Play, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onRunCode?: (code: string, language: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onRunCode }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Helper to parse code blocks and regular markdown sections
  const renderFormatted = () => {
    if (!content) return null;

    // Split content by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(renderTextMarkdown(textBefore, `text-${lastIndex}`));
      }

      const lang = match[1] || 'text';
      const code = match[2];
      const blockId = `code-${match.index}`;

      parts.push(
        <div key={blockId} className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-[#0d121c] shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/60 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/80" />
              <span className="uppercase font-semibold tracking-wider text-indigo-300">{lang}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {onRunCode && (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'python' || lang === 'py') && (
                <button
                  onClick={() => onRunCode(code, lang)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition-colors cursor-pointer"
                  title="Run in Sandbox"
                >
                  <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                  <span>Run Sandbox</span>
                </button>
              )}
              <button
                onClick={() => handleCopyCode(code, blockId)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedCodeId === blockId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-slate-200 leading-relaxed bg-[#0b0f17]/90 selection:bg-indigo-500/40">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    const textRemaining = content.substring(lastIndex);
    if (textRemaining) {
      parts.push(renderTextMarkdown(textRemaining, `text-${lastIndex}`));
    }

    return parts;
  };

  const renderTextMarkdown = (text: string, keyPrefix: string) => {
    // Process lines for headers, lists, blockquotes, and paragraphs
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`${keyPrefix}-h3-${i}`} className="text-base font-bold text-indigo-300 mt-4 mb-2">
            {formatInline(line.substring(4))}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`${keyPrefix}-h2-${i}`} className="text-lg font-bold text-slate-100 mt-5 mb-2 pb-1 border-b border-slate-700/50">
            {formatInline(line.substring(3))}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`${keyPrefix}-h1-${i}`} className="text-xl font-extrabold text-white mt-6 mb-3">
            {formatInline(line.substring(2))}
          </h1>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={`${keyPrefix}-li-${i}`} className="ml-4 list-disc text-slate-200 my-0.5 leading-relaxed">
            {formatInline(line.substring(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const itemText = line.replace(/^\d+\.\s/, '');
        elements.push(
          <li key={`${keyPrefix}-oli-${i}`} className="ml-4 list-decimal text-slate-200 my-0.5 leading-relaxed">
            {formatInline(itemText)}
          </li>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`${keyPrefix}-quote-${i}`} className="border-l-4 border-indigo-500/80 pl-3 my-2 text-slate-300 italic bg-indigo-950/20 py-1 rounded-r">
            {formatInline(line.substring(2))}
          </blockquote>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={`${keyPrefix}-br-${i}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`${keyPrefix}-p-${i}`} className="text-slate-200 my-1 leading-relaxed">
            {formatInline(line)}
          </p>
        );
      }
    }

    return <div key={keyPrefix}>{elements}</div>;
  };

  // Helper for bold, italic, inline code, and links
  const formatInline = (str: string): React.ReactNode => {
    // Replace inline code `code`
    const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs border border-slate-700/60">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="italic text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return <div className="text-sm md:text-[15px] space-y-1">{renderFormatted()}</div>;
};
