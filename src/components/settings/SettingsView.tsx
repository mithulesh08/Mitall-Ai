import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Brain,
  Volume2,
  Shield,
  Download,
  Trash2,
  Check,
  AlertTriangle,
  Globe,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { UserSettings, AIProviderType, PersonalityType, ProviderStatus } from '../../types/index';
import { api } from '../../services/api';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (updated: UserSettings) => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onClearAllData,
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'memory' | 'voice' | 'privacy'>('ai');
  const [testResult, setTestResult] = useState<ProviderStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSaving(true);
    if (formData.geminiApiKey) {
      localStorage.setItem('mitall_gemini_api_key', formData.geminiApiKey);
    }
    const updated = await api.updateSettings(formData);
    onUpdateSettings(updated);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await api.testConnection(formData.activeProvider, formData);
    setTestResult(result);
    setIsTesting(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 bg-[#0b0f17] text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950/70 border border-indigo-700/50 text-indigo-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">System Settings</h1>
              <p className="text-xs md:text-sm text-slate-400">
                Configure MITALL's AI models, persistent memory, voice, and data privacy.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            )}
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1">
          {[
            { id: 'ai', label: 'AI Provider & Models', icon: <Cpu className="w-4 h-4" /> },
            { id: 'general', label: 'Persona & Language', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'memory', label: 'Long-Term Memory', icon: <Brain className="w-4 h-4" /> },
            { id: 'voice', label: 'Voice & Speech', icon: <Volume2 className="w-4 h-4" /> },
            { id: 'privacy', label: 'Data & Privacy', icon: <Shield className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* AI Provider Settings */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Select Active AI Provider
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'gemini',
                    title: 'MITALL Intelligence',
                    desc: 'MITALL 3.8 Flash high-performance server integration',
                    badge: 'Recommended',
                  },
                  {
                    id: 'ollama',
                    title: 'Ollama (Local)',
                    desc: 'Private offline models (Llama 3.2, Mistral, DeepSeek)',
                    badge: 'Local / Offline',
                  },
                  {
                    id: 'openai_compatible',
                    title: 'OpenAI-Compatible',
                    desc: 'Custom hosted endpoints or local vLLM',
                    badge: 'Custom URL',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, activeProvider: item.id as AIProviderType })}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.activeProvider === item.id
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Configuration Details */}
            {formData.activeProvider === 'gemini' && (
              <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">MITALL Intelligence Configuration</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    MITALL Model
                  </label>
                  <select
                    value={formData.geminiModel}
                    onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="gemini-4-hydrogen">mitall-4-hydrogen (Fast, smart, balanced - Default)</option>
                    <option value="gemini-3.1-flash-lite">mitall-3.1-flash-lite (Ultra low latency)</option>
                    <option value="gemini-4-argon">mitall-4-argon (Complex reasoning & math)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gemini API Key (Optional override, defaults to process.env.GEMINI_API_KEY)
                  </label>
                  <input
                    type="password"
                    value={formData.geminiApiKey || ''}
                    onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy... (leave blank to use environment key)"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>API Key Security: Never sent to client JavaScript or browser logs.</span>
                  <span className="text-emerald-400 font-semibold text-[11px]">Server-Side Protected</span>
                </div>
              </div>
            )}

            {formData.activeProvider === 'ollama' && (
              <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Local Ollama Configuration</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ollama Server Endpoint
                  </label>
                  <input
                    type="text"
                    value={formData.ollamaEndpoint}
                    onChange={(e) => setFormData({ ...formData, ollamaEndpoint: e.target.value })}
                    placeholder="http://127.0.0.1:11434"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Default is http://127.0.0.1:11434</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ollama Model Name
                  </label>
                  <input
                    type="text"
                    value={formData.ollamaModel}
                    onChange={(e) => setFormData({ ...formData, ollamaModel: e.target.value })}
                    placeholder="llama3.2 or deepseek-coder"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}

            {formData.activeProvider === 'openai_compatible' && (
              <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">OpenAI-Compatible Endpoint Configuration</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Base URL Endpoint
                  </label>
                  <input
                    type="text"
                    value={formData.openaiEndpoint}
                    onChange={(e) => setFormData({ ...formData, openaiEndpoint: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Model Identifier
                  </label>
                  <input
                    type="text"
                    value={formData.openaiModel}
                    onChange={(e) => setFormData({ ...formData, openaiModel: e.target.value })}
                    placeholder="gpt-4o or meta-llama/llama-3"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    API Key (Stored only in server runtime)
                  </label>
                  <input
                    type="password"
                    value={formData.openaiApiKey}
                    onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Test Connection Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing...' : 'Test Provider Connection'}</span>
              </button>

              {testResult && (
                <div
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                    testResult.available
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
                  }`}
                >
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* General Persona & Language */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">MITALL Personality & Language</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assistant Name
                  </label>
                  <input
                    type="text"
                    value={formData.aiName}
                    onChange={(e) => setFormData({ ...formData, aiName: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Default Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="English">English</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="French">French (Français)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Personality Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  {[
                    { id: 'friendly_mentor', title: 'Friendly Mentor', desc: 'Patient, encouraging, highly articulate.' },
                    { id: 'technical_expert', title: 'Technical Expert', desc: 'Code-first, rigorous, detailed edge cases.' },
                    { id: 'concise_assistant', title: 'Concise Assistant', desc: 'Direct, clear, actionable, no fluff.' },
                    { id: 'socratic_tutor', title: 'Socratic Tutor', desc: 'Guides with probing questions and insights.' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, personality: p.id as PersonalityType })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.personality === p.id
                          ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-white">{p.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Technical Explanation Level
                </label>
                <select
                  value={formData.technicalExplanationLevel}
                  onChange={(e) => setFormData({ ...formData, technicalExplanationLevel: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="beginner">Beginner (Simple analogies, step-by-step guidance)</option>
                  <option value="intermediate">Intermediate (Standard engineering depth)</option>
                  <option value="advanced">Advanced (Deep systems architecture, memory, math)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Memory Settings */}
        {activeTab === 'memory' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Persistent Long-Term Memory</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When enabled, MITALL extracts user preferences and injects them into future prompts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.memoryEnabled}
                  onChange={(e) => setFormData({ ...formData, memoryEnabled: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
                You can inspect, edit, or delete any stored memory item individually in the <strong>Long-Term Memory</strong> panel in the sidebar.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Web Search Tool Integration</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Allow MITALL to retrieve web information for questions regarding current topics and facts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.webSearchEnabled}
                  onChange={(e) => setFormData({ ...formData, webSearchEnabled: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Voice & Speech */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Text-to-Speech (Audio Readout)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Allow MITALL to speak responses aloud via your browser voice synthesis engine.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.voiceEnabled}
                  onChange={(e) => setFormData({ ...formData, voiceEnabled: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Speech Rate: {formData.speechSpeed}x
                </label>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={formData.speechSpeed}
                  onChange={(e) => setFormData({ ...formData, speechSpeed: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Data & Privacy */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#131b2a] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Export Personal Data</h3>
              <p className="text-xs text-slate-400">
                Download a complete JSON archive of all your conversations, messages, personal memories, tasks, and notes.
              </p>
              <a
                href="/api/export"
                download="mitall_data_export.json"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Data Export (.json)</span>
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-rose-300">Reset All Personal Data</h3>
                  <p className="text-xs text-rose-400/80 mt-1">
                    Permanently delete conversations, uploaded knowledge documents, and custom memories, restoring default settings.
                  </p>
                </div>
              </div>

              {!showClearConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset All Data</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-300 font-semibold">Are you absolutely sure?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllData();
                      setShowClearConfirm(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Yes, Reset Everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
