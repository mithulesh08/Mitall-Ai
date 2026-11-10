import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Search,
  MessageSquare,
  Sparkles,
  Layers,
  FileCode,
  CheckCircle,
  Eye,
  X,
} from 'lucide-react';
import { KnowledgeDocument } from '../../types/index';
import { api } from '../../services/api';

interface KnowledgeBaseProps {
  onStartDocChat: (prompt: string) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onStartDocChat }) => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ docId: string; title: string; excerpt: string; score: number }>>([]);
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = () => {
    api.getDocuments().then(setDocuments);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      await api.uploadDocument(file.name, text, [file.name.split('.').pop()?.toUpperCase() || 'DOC']);
      setIsUploading(false);
      loadDocuments();
    };

    reader.onerror = () => {
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDelete = async (id: string) => {
    await api.deleteDocument(id);
    loadDocuments();
  };

  const handleSearchTest = async () => {
    if (!searchQuery.trim()) return;
    const res = await api.searchDocuments(searchQuery, 4);
    setSearchResults(res);
  };

  const handlePreview = async (doc: KnowledgeDocument) => {
    setPreviewDoc(doc);
    const res = await api.executeTool('fileReader', { docId: doc.id });
    if (typeof res.output === 'object' && (res.output as any).preview) {
      setPreviewContent((res.output as any).preview);
    } else {
      setPreviewContent('Preview unavailable.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 bg-[#0b0f17] text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-blue-950/70 border border-blue-700/50 text-blue-400">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white">Knowledge Base & RAG</h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              Upload documents, textbooks, research papers, or code files. MITALL chunks, indexes, and retrieves answers using semantic citations.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs md:text-sm transition-all shadow-md shadow-blue-600/30 cursor-pointer w-fit"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Chunking...' : 'Upload Document'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            accept=".txt,.md,.pdf,.json,.csv,.py,.js,.ts,.cpp,.java,.html"
          />
        </div>

        {/* Drag & Drop Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/60 rounded-2xl p-6 text-center bg-[#131b2a]/50 hover:bg-[#131b2a] transition-all cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Click to upload or drag and drop files here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: PDF, Markdown (.md), Plain Text (.txt), CSV, JSON, Python, TypeScript, C++, Java
              </p>
            </div>
          </div>
        </div>

        {/* Semantic Retrieval Search Test Area */}
        <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Semantic RAG Retrieval Tester</h3>
          </div>
          <p className="text-xs text-slate-400">
            Test how MITALL searches and retrieves chunks for questions across your entire knowledge base:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTest()}
              placeholder="Query your knowledge base e.g. 'Explain chapter 3' or 'algorithm performance'..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSearchTest}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Search Chunks
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-slate-300">
                Retrieved {searchResults.length} Relevant Chunks:
              </div>
              {searchResults.map((res, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/60 text-xs space-y-1">
                  <div className="flex items-center justify-between text-blue-300 font-semibold text-[11px]">
                    <span>📄 {res.title}</span>
                    <span className="text-[10px] text-slate-400">Relevance Score: {res.score.toFixed(1)}</span>
                  </div>
                  <p className="text-slate-300 italic text-[11px] leading-relaxed">
                    "{res.excerpt}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Library Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Indexed Documents ({documents.length})
          </h2>

          {documents.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[#131b2a] border border-slate-800 text-slate-500 text-sm">
              No documents in knowledge base yet. Upload a document to enable AI retrieval!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#131b2a] border border-slate-800 hover:border-slate-700 transition-all gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-200 truncate">{doc.title}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="uppercase px-1.5 py-0.2 rounded bg-slate-800 font-mono text-[10px]">
                          {doc.fileType}
                        </span>
                        <span>{doc.chunkCount} Chunks</span>
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Preview chunks"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        onStartDocChat(`Explain the main points and key takeaways from the document "${doc.title}":`)
                      }
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
                      title="Chat about this document"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-[#131b2a] rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white truncate max-w-md">{previewDoc.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed">
                {previewContent}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
