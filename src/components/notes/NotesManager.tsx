import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit,
  Search,
  Tag,
  Sparkles,
  MessageSquare,
  Check,
  X,
} from 'lucide-react';
import { PersonalNote } from '../../types/index';
import { api } from '../../services/api';
import { MarkdownRenderer } from '../chat/MarkdownRenderer';

interface NotesManagerProps {
  onAskMitallAboutNote?: (prompt: string) => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({ onAskMitallAboutNote }) => {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  const loadNotes = () => {
    api.getNotes().then((data) => {
      setNotes(data);
      if (data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      } else if (selectedNote) {
        const found = data.find((n) => n.id === selectedNote.id);
        if (found) setSelectedNote(found);
      }
    });
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleStartCreate = () => {
    setSelectedNote(null);
    setEditTitle('Untitled Note');
    setEditContent('');
    setEditTags('Development, Knowledge');
    setIsEditing(true);
  };

  const handleStartEdit = (note: PersonalNote) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    const tagsArray = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (selectedNote && selectedNote.id) {
      const updated = await api.updateNote(selectedNote.id, {
        title: editTitle.trim(),
        content: editContent,
        tags: tagsArray,
      });
      setSelectedNote(updated);
    } else {
      const created = await api.addNote({
        title: editTitle.trim(),
        content: editContent,
        tags: tagsArray,
        pinned: false,
      });
      setSelectedNote(created);
    }

    setIsEditing(false);
    loadNotes();
  };

  const handleTogglePin = async (note: PersonalNote) => {
    await api.updateNote(note.id, { pinned: !note.pinned });
    loadNotes();
  };

  const handleDelete = async (id: string) => {
    await api.deleteNote(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
    loadNotes();
  };

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-[#0b0f17] overflow-hidden">
      {/* Sidebar Note List */}
      <div className="w-full md:w-80 border-r border-slate-800 bg-[#0d121c] flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Personal Knowledge</h2>
          </div>
          <button
            onClick={handleStartCreate}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            title="Create note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes & tags..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Note List Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">No notes found.</div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setIsEditing(false);
                }}
                className={`p-3 rounded-xl transition-all cursor-pointer border text-left group ${
                  selectedNote?.id === note.id
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold truncate max-w-[170px]">{note.title}</span>
                  <div className="flex items-center gap-1">
                    {note.pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(note);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-amber-400 transition-opacity"
                      title={note.pinned ? 'Unpin' : 'Pin note'}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {note.content || 'Empty note...'}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/50 text-[10px] text-slate-500">
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  {note.tags.length > 0 && (
                    <span className="truncate max-w-[100px] text-indigo-400/80">#{note.tags[0]}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Note Reader / Editor */}
      <div className="flex-1 flex flex-col h-full bg-[#0b0f17] overflow-hidden">
        {selectedNote || isEditing ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Note Toolbar */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#0d121c]">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Note Title"
                  />
                ) : (
                  <h1 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedNote?.title}</span>
                    {selectedNote?.pinned && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                        Pinned
                      </span>
                    )}
                  </h1>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        onAskMitallAboutNote?.(
                          `Please review and summarize my note titled "${selectedNote?.title}":\n\n${selectedNote?.content}`
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-700/50 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
                      title="Ask MITALL to explain or summarize"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask MITALL</span>
                    </button>

                    <button
                      onClick={() => selectedNote && handleStartEdit(selectedNote)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {selectedNote && (
                      <button
                        onClick={() => handleDelete(selectedNote.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Note Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <div className="space-y-4 max-w-3xl mx-auto">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="e.g. Algorithms, Research, Roadmap"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Markdown Body</label>
                    <textarea
                      rows={18}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="# Heading\n\nWrite your thoughts, technical notes, or code..."
                      className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-xs md:text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  {selectedNote?.tags && selectedNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNote.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-indigo-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="prose prose-invert max-w-none text-slate-200">
                    <MarkdownRenderer content={selectedNote?.content || '*No content.*'} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select a note or create a new one to begin.
          </div>
        )}
      </div>
    </div>
  );
};
