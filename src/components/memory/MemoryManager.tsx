import React, { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Bookmark,
  Sparkles,
  Info,
} from 'lucide-react';
import { Memory } from '../../types/index';
import { api } from '../../services/api';

export const MemoryManager: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Memory['category']>('preferences');

  const loadMemories = () => {
    api.getMemories().then(setMemories);
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    await api.addMemory(newContent.trim(), newCategory);
    setNewContent('');
    setShowAddModal(false);
    loadMemories();
  };

  const handleToggleActive = async (memory: Memory) => {
    await api.updateMemory(memory.id, { isActive: !memory.isActive });
    loadMemories();
  };

  const handleDelete = async (id: string) => {
    await api.deleteMemory(id);
    loadMemories();
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchesQuery = m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const categories = [
    { id: 'all', label: 'All Memories' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'learning_goals', label: 'Learning Goals' },
    { id: 'project_info', label: 'Project Info' },
    { id: 'habits', label: 'Habits' },
    { id: 'user_notes', label: 'User Notes' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 bg-[#0b0f17] text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-700/50 text-emerald-400">
                <Brain className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white">Long-Term Memory</h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              MITALL persists your confirmed preferences, learning milestones, and project context across sessions.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm transition-all shadow-md shadow-indigo-600/30 cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>

        {/* Two-Tier Memory Architecture Info Card */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-950/20 border border-indigo-700/30 text-xs text-slate-300">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-indigo-300">How MITALL Memory Works:</span>
            <p className="text-slate-400 leading-relaxed">
              <strong>Short-term memory</strong> stores recent turns of the conversation context. 
              <strong> Long-term memory</strong> persists approved personal details (e.g. your favorite language, project stacks, response tone). Whenever you chat, relevant memories are retrieved and fed into the AI prompt so MITALL never loses context. You can also teach MITALL dynamically by asking: <em>"Please remember that my favorite language is Rust."</em>
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Categories Tab */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Memory Items List */}
        <div className="space-y-3">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[#131b2a] border border-slate-800 text-slate-500 text-sm">
              No memories found matching your criteria.
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="flex items-start justify-between p-4 rounded-xl bg-[#131b2a] border border-slate-800/80 hover:border-slate-700 transition-all gap-4"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleActive(mem)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                    title={mem.isActive ? 'Active memory (click to disable)' : 'Disabled memory (click to enable)'}
                  >
                    {mem.isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <p className={`text-sm leading-relaxed ${mem.isActive ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                      {mem.content}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {mem.category.replace('_', ' ')}
                      </span>
                      <span>Recorded {new Date(mem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(mem.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Memory Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#131b2a] rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-400" />
                  <span>Store New Memory</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddMemory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Memory['category'])}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="preferences">Preferences</option>
                    <option value="learning_goals">Learning Goals</option>
                    <option value="project_info">Project Information</option>
                    <option value="habits">Habits & Routines</option>
                    <option value="user_notes">User Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Memory Content
                  </label>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="e.g. User prefers functional TypeScript patterns with immutable data structures and explicit error handling."
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Save Memory
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
