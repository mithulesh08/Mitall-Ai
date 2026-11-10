import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  AlertCircle,
  Tag,
  Search,
  Clock,
  Bell,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskItem, TaskPriority, TaskCategory } from '../../types/index';
import { api } from '../../services/api';

export const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('coding');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const loadTasks = () => {
    api.getTasks().then(setTasks);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await api.addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      dueDate: dueDate || undefined,
      reminderTime: reminderTime || undefined,
      completed: false,
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setReminderTime('');
    setShowAddModal(false);
    loadTasks();
  };

  const handleToggleTask = async (task: TaskItem) => {
    const willComplete = !task.completed;
    if (willComplete) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    await api.updateTask(task.id, { completed: willComplete });
    loadTasks();
  };

  const handleDeleteTask = async (id: string) => {
    await api.deleteTask(id);
    loadTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'pending' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 bg-[#0b0f17] text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-violet-950/70 border border-violet-700/50 text-violet-400">
                <ListTodo className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white">Task Management & Reminders</h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              Organize development sprints, study goals, research tasks, and in-app reminders.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm transition-all shadow-md shadow-indigo-600/30 cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['all', 'pending', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="ml-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-[#131b2a] border border-slate-800 text-slate-500 text-sm">
              No tasks found. Click "Create Task" to organize your priorities!
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                  task.completed
                    ? 'bg-slate-950/60 border-slate-800/50 opacity-60'
                    : 'bg-[#131b2a] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="uppercase px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                        {task.category}
                      </span>

                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Due {task.dueDate}</span>
                        </span>
                      )}

                      {task.reminderTime && (
                        <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                          <Bell className="w-3 h-3" />
                          <span>Reminder: {task.reminderTime}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      task.priority === 'urgent'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        : task.priority === 'high'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        : task.priority === 'medium'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {task.priority}
                  </span>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Task Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#131b2a] rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-violet-400" />
                  <span>Create New Task</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Implement binary search tree with deletion method"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional context or requirements..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TaskCategory)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="coding">Coding & Software</option>
                      <option value="learning">Learning & STEM</option>
                      <option value="work">Work</option>
                      <option value="research">Research</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Reminder Time (In-App)
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                  >
                    Create Task
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
