import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertCircle,
  Bot,
  Brain,
  Car,
  Check,
  Edit2,
  Eye,
  FileText,
  History,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { getLocalized } from '../../i18n/helpers';
import type {
  ChatbotKnowledgeCategory,
  ChatbotKnowledgeRow,
  ChatbotSettingsRow,
  ChatMessageRow,
  ChatSessionRow,
  LocalizedText,
} from '../../types/database';

type AdminTab = 'settings' | 'knowledge' | 'sessions';

const CATEGORIES: Array<{ key: ChatbotKnowledgeCategory; label: string }> = [
  { key: 'troubleshooting', label: 'Troubleshooting & Symptoms' },
  { key: 'services', label: 'Workshop Services' },
  { key: 'parts', label: 'Spare Parts' },
  { key: 'booking_delivery', label: 'Booking & Delivery' },
  { key: 'workshop_info', label: 'Workshop Info' },
];

export default function ChatbotAdminPage() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'ur' | 'ur-roman') || 'en';

  const [activeTab, setActiveTab] = useState<AdminTab>('settings');
  const [loading, setLoading] = useState(true);

  // Settings state
  const [settings, setSettings] = useState<ChatbotSettingsRow | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Knowledge base state
  const [knowledgeList, setKnowledgeList] = useState<ChatbotKnowledgeRow[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKnowledge, setEditingKnowledge] = useState<Partial<ChatbotKnowledgeRow> | null>(null);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [savingKnowledge, setSavingKnowledge] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<ChatSessionRow[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSessionRow | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

  // Load data
  const fetchData = async () => {
    if (!env.isConfigured) return;
    setLoading(true);

    try {
      // 1. Settings
      const { data: sData, error: sErr } = await supabase
        .from('chatbot_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (sErr) throw sErr;
      if (sData) setSettings(sData as ChatbotSettingsRow);

      // 2. Knowledge
      const { data: kData, error: kErr } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (kErr) throw kErr;
      setKnowledgeList((kData as ChatbotKnowledgeRow[]) || []);

      // 3. Sessions
      const { data: sessData, error: sessErr } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (sessErr) throw sessErr;
      setSessions((sessData as ChatSessionRow[]) || []);
    } catch (err: any) {
      toast.error('Failed to load chatbot data', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);

    try {
      const { error } = await supabase
        .from('chatbot_settings')
        .update({
          enabled: settings.enabled,
          engine_mode: settings.engine_mode,
          welcome_message: settings.welcome_message,
          quick_replies: settings.quick_replies,
          disclaimer: settings.disclaimer,
          max_messages_per_session: settings.max_messages_per_session,
          logging_enabled: settings.logging_enabled,
        })
        .eq('id', 1);

      if (error) throw error;
      toast.success('Chatbot settings saved successfully');
    } catch (err: any) {
      toast.error('Failed to update settings', { description: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle active status of knowledge item
  const handleToggleKnowledgeActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('chatbot_knowledge')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      setKnowledgeList((prev) =>
        prev.map((k) => (k.id === id ? { ...k, is_active: !currentState } : k))
      );
      toast.success('Status updated');
    } catch (err: any) {
      toast.error('Failed to toggle status', { description: err.message });
    }
  };

  // Delete knowledge item
  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge article?')) return;

    try {
      const { error } = await supabase.from('chatbot_knowledge').delete().eq('id', id);
      if (error) throw error;
      setKnowledgeList((prev) => prev.filter((k) => k.id !== id));
      toast.success('Knowledge article deleted');
    } catch (err: any) {
      toast.error('Failed to delete', { description: err.message });
    }
  };

  // Save knowledge item
  const handleSaveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKnowledge) return;
    setSavingKnowledge(true);

    try {
      if (editingKnowledge.id) {
        // Update
        const { error } = await supabase
          .from('chatbot_knowledge')
          .update({
            title: editingKnowledge.title,
            content: editingKnowledge.content,
            category: editingKnowledge.category,
            keywords: editingKnowledge.keywords,
            sort_order: editingKnowledge.sort_order || 0,
            is_active: editingKnowledge.is_active ?? true,
          })
          .eq('id', editingKnowledge.id);

        if (error) throw error;
        toast.success('Knowledge article updated');
      } else {
        // Insert
        const { data, error } = await supabase
          .from('chatbot_knowledge')
          .insert({
            title: editingKnowledge.title || { en: '', ur: '', 'ur-roman': '' },
            content: editingKnowledge.content || { en: '', ur: '', 'ur-roman': '' },
            category: editingKnowledge.category || 'troubleshooting',
            keywords: editingKnowledge.keywords || { en: [], ur: [], 'ur-roman': [] },
            sort_order: editingKnowledge.sort_order || 0,
            is_active: editingKnowledge.is_active ?? true,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('Knowledge article created');
      }

      setIsKnowledgeModalOpen(false);
      setEditingKnowledge(null);
      void fetchData();
    } catch (err: any) {
      toast.error('Failed to save knowledge article', { description: err.message });
    } finally {
      setSavingKnowledge(false);
    }
  };

  // View session transcript
  const handleViewTranscript = async (sess: ChatSessionRow) => {
    setSelectedSession(sess);
    setIsTranscriptModalOpen(true);
    setLoadingMessages(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sess.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSessionMessages((data as ChatMessageRow[]) || []);
    } catch (err: any) {
      toast.error('Failed to load messages', { description: err.message });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (id: string) => {
    if (!confirm('Delete this chat session and its transcript?')) return;
    try {
      const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
      if (error) throw error;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Session deleted');
    } catch (err: any) {
      toast.error('Failed to delete session', { description: err.message });
    }
  };

  // Filtered knowledge
  const filteredKnowledge = knowledgeList.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch =
      (item.title?.en || '').toLowerCase().includes(query) ||
      (item.title?.ur || '').toLowerCase().includes(query) ||
      (item.title?.['ur-roman'] || '').toLowerCase().includes(query);
    const kwMatch =
      JSON.stringify(item.keywords).toLowerCase().includes(query);
    return titleMatch || kwMatch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2B2F3A] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-amber-500 text-white shadow-md">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                AI Chatbot & Knowledge Base
              </h1>
              <p className="text-xs text-gray-400">
                Configure Gemini AI engine, manage vehicle troubleshooting articles, and inspect live conversation logs.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B1F27] border border-[#2B2F3A] px-3.5 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#232732] transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#232732]">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'settings'
              ? 'border-[#FF6A00] text-[#FF6A00]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Settings2 className="h-4 w-4" />
          Settings & Engine Mode
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'knowledge'
              ? 'border-[#FF6A00] text-[#FF6A00]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Brain className="h-4 w-4" />
          Knowledge Base ({knowledgeList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'sessions'
              ? 'border-[#FF6A00] text-[#FF6A00]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <History className="h-4 w-4" />
          Chat Sessions & Logs ({sessions.length})
        </button>
      </div>

      {/* TAB 1: SETTINGS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {/* General Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#14171E] border border-[#232732] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Chatbot Widget</h3>
                  <p className="text-xs text-gray-400">
                    Enable or disable the floating chat widget on public pages.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6A00]"></div>
                </label>
              </div>
            </div>

            <div className="rounded-xl bg-[#14171E] border border-[#232732] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Privacy Audit Logging</h3>
                  <p className="text-xs text-gray-400">
                    Store masked transcripts (7+ digit numbers automatically scrubbed).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.logging_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, logging_enabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6A00]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Engine Mode Selection */}
          <div className="rounded-xl bg-[#14171E] border border-[#232732] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF6A00]" />
                Dual Engine Architecture
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Select how visitor messages are processed. Both engines strictly follow workshop grounding and never invent prices or parts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  settings.engine_mode === 'auto'
                    ? 'border-[#FF6A00] bg-[#FF6A00]/5'
                    : 'border-[#262B36] bg-[#161922] hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="engine_mode"
                  value="auto"
                  checked={settings.engine_mode === 'auto'}
                  onChange={() => setSettings({ ...settings, engine_mode: 'auto' })}
                  className="mt-1 text-[#FF6A00] focus:ring-[#FF6A00]"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Auto (AI with Local Fallback)</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                    Queries Gemini through the Supabase Edge Function when configured, and falls back automatically to zero-setup local engine if offline or key is missing.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  settings.engine_mode === 'local_only'
                    ? 'border-[#FF6A00] bg-[#FF6A00]/5'
                    : 'border-[#262B36] bg-[#161922] hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="engine_mode"
                  value="local_only"
                  checked={settings.engine_mode === 'local_only'}
                  onChange={() => setSettings({ ...settings, engine_mode: 'local_only' })}
                  className="mt-1 text-[#FF6A00] focus:ring-[#FF6A00]"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Local Rule Engine Only</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                      Zero Setup
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                    100% deterministic local pattern engine. Zero external API calls, instantaneous response, works completely offline.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Session limits */}
          <div className="rounded-xl bg-[#14171E] border border-[#232732] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Rate Limits & Protection</h3>
            <div className="flex items-center gap-4">
              <label className="text-xs text-gray-300 whitespace-nowrap">
                Max Messages per Visitor Session:
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={settings.max_messages_per_session}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_messages_per_session: parseInt(e.target.value, 10) || 30,
                  })
                }
                className="w-24 rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-1.5 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
              />
              <span className="text-xs text-gray-500">
                (Standard default is 30 messages; IP hourly cap is 60 messages)
              </span>
            </div>
          </div>

          {/* Trilingual Welcome Messages */}
          <div className="rounded-xl bg-[#14171E] border border-[#232732] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Welcome Message (Trilingual)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">English</label>
                <textarea
                  rows={2}
                  value={settings.welcome_message.en}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      welcome_message: { ...settings.welcome_message, en: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Urdu (اردو رسم الخط)
                </label>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={settings.welcome_message.ur}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      welcome_message: { ...settings.welcome_message, ur: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Roman Urdu</label>
                <textarea
                  rows={2}
                  value={settings.welcome_message['ur-roman'] || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      welcome_message: { ...settings.welcome_message, 'ur-roman': e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Trilingual Disclaimer */}
          <div className="rounded-xl bg-[#14171E] border border-[#232732] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              Safety & Physical Inspection Disclaimer
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">English</label>
                <input
                  type="text"
                  value={settings.disclaimer.en}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      disclaimer: { ...settings.disclaimer, en: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Urdu</label>
                <input
                  type="text"
                  dir="rtl"
                  value={settings.disclaimer.ur}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      disclaimer: { ...settings.disclaimer, ur: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Roman Urdu</label>
                <input
                  type="text"
                  value={settings.disclaimer['ur-roman'] || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      disclaimer: { ...settings.disclaimer, 'ur-roman': e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Replies Manager */}
          <div className="rounded-xl bg-[#14171E] border border-[#232732] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Quick Reply Chips</h3>
                <p className="text-xs text-gray-400">
                  Instant prompt buttons displayed in the visitor chat window.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSettings({
                    ...settings,
                    quick_replies: [
                      ...settings.quick_replies,
                      {
                        label: { en: 'New Topic', ur: 'نیا موضوع', 'ur-roman': 'Naya Topic' },
                        prompt: { en: 'Tell me more', ur: 'مزید بتائیں', 'ur-roman': 'Mazeed batayein' },
                      },
                    ],
                  });
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-[#242934] px-2.5 py-1 text-xs text-white hover:bg-[#2D3342]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Chip
              </button>
            </div>

            <div className="space-y-3">
              {settings.quick_replies.map((qr, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0E1013] border border-[#242832]"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    <input
                      type="text"
                      placeholder="Label (EN)"
                      value={qr.label.en}
                      onChange={(e) => {
                        const copy = [...settings.quick_replies];
                        copy[idx].label.en = e.target.value;
                        setSettings({ ...settings, quick_replies: copy });
                      }}
                      className="rounded bg-[#161922] border border-[#2A2F3B] px-2.5 py-1 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Prompt triggered (EN)"
                      value={qr.prompt.en}
                      onChange={(e) => {
                        const copy = [...settings.quick_replies];
                        copy[idx].prompt.en = e.target.value;
                        setSettings({ ...settings, quick_replies: copy });
                      }}
                      className="rounded bg-[#161922] border border-[#2A2F3B] px-2.5 py-1 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const copy = settings.quick_replies.filter((_, i) => i !== idx);
                      setSettings({ ...settings, quick_replies: copy });
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6A00] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[#E05600] disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              {savingSettings ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: KNOWLEDGE BASE */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          {/* Action & Filter bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg bg-[#14171E] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
              >
                <option value="all">All Categories ({knowledgeList.length})</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute start-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles & keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-[#14171E] border border-[#2B2F3A] ps-9 pe-3 py-2 text-xs text-white placeholder-gray-500 focus:border-[#FF6A00] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingKnowledge({
                  category: 'troubleshooting',
                  sort_order: (knowledgeList.length + 1) * 1,
                  is_active: true,
                  title: { en: '', ur: '', 'ur-roman': '' },
                  content: { en: '', ur: '', 'ur-roman': '' },
                  keywords: { en: [], ur: [], 'ur-roman': [] },
                });
                setIsKnowledgeModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF6A00] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#E05600] transition"
            >
              <Plus className="h-4 w-4" />
              Add Knowledge Article
            </button>
          </div>

          {/* Knowledge Table */}
          <div className="rounded-xl border border-[#232732] bg-[#14171E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs text-gray-300">
                <thead className="border-b border-[#232732] bg-[#171A23] text-[11px] uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-start">Title & Topics</th>
                    <th className="px-4 py-3 text-start">Category</th>
                    <th className="px-4 py-3 text-start">Keywords</th>
                    <th className="px-4 py-3 text-center">Order</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F232D]">
                  {filteredKnowledge.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        No knowledge articles found.
                      </td>
                    </tr>
                  ) : (
                    filteredKnowledge.map((item) => (
                      <tr key={item.id} className="hover:bg-[#181C25] transition">
                        <td className="px-4 py-3 max-w-sm">
                          <div className="font-semibold text-white">
                            {getLocalized(item.title, currentLang)}
                          </div>
                          <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                            {getLocalized(item.content, currentLang)}
                          </div>
                          {item.is_demo && (
                            <span className="inline-block mt-1 text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
                              Demo Sample
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md bg-[#212631] px-2 py-0.5 text-[10px] font-medium text-gray-300">
                            {item.category}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(item.keywords?.en || []).slice(0, 3).map((kw, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-[#0E1013] border border-[#2B2F3A] px-1.5 py-0.5 rounded text-gray-300"
                              >
                                {kw}
                              </span>
                            ))}
                            {(item.keywords?.en?.length || 0) > 3 && (
                              <span className="text-[10px] text-gray-500">
                                +{(item.keywords?.en?.length || 0) - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center font-mono text-gray-400">
                          {item.sort_order}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleKnowledgeActive(item.id, item.is_active)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.is_active
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {item.is_active ? 'Active' : 'Hidden'}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-end">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKnowledge(item);
                                setIsKnowledgeModalOpen(true);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#252A36]"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKnowledge(item.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-[#252A36]"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHAT SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#232732] bg-[#14171E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs text-gray-300">
                <thead className="border-b border-[#232732] bg-[#171A23] text-[11px] uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-start">Started At</th>
                    <th className="px-4 py-3 text-start">Language</th>
                    <th className="px-4 py-3 text-start">Vehicle</th>
                    <th className="px-4 py-3 text-center">Engine</th>
                    <th className="px-4 py-3 text-center">Messages</th>
                    <th className="px-4 py-3 text-end">Transcript</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F232D]">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        No recorded chat sessions yet.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((sess) => {
                      const veh = sess.vehicle as { make?: string; model?: string; year?: number } | null;
                      return (
                        <tr key={sess.id} className="hover:bg-[#181C25] transition">
                          <td className="px-4 py-3 font-mono text-gray-300">
                            {new Date(sess.started_at).toLocaleString()}
                            {sess.is_demo && (
                              <span className="ms-2 text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded">
                                Sample
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 uppercase font-semibold text-gray-400">
                            {sess.language}
                          </td>

                          <td className="px-4 py-3">
                            {veh?.make ? (
                              <span className="inline-flex items-center gap-1 text-white">
                                <Car className="h-3 w-3 text-[#FF6A00]" />
                                {veh.make} {veh.model || ''} {veh.year || ''}
                              </span>
                            ) : (
                              <span className="text-gray-500">Not specified</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                sess.engine_used === 'ai'
                                  ? 'bg-blue-500/15 text-blue-300'
                                  : 'bg-emerald-500/15 text-emerald-300'
                              }`}
                            >
                              {sess.engine_used === 'ai' ? 'Gemini AI' : 'Local Engine'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center font-mono">
                            {sess.message_count}
                          </td>

                          <td className="px-4 py-3 text-end">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleViewTranscript(sess)}
                                className="inline-flex items-center gap-1 rounded bg-[#202530] px-2.5 py-1 text-xs text-white hover:bg-[#2C3240] transition"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(sess.id)}
                                className="p-1 rounded text-gray-500 hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT KNOWLEDGE */}
      {isKnowledgeModalOpen && editingKnowledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-[#14171E] border border-[#2B2F3A] p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232732] pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingKnowledge.id ? 'Edit Knowledge Article' : 'New Knowledge Article'}
              </h3>
              <button
                type="button"
                onClick={() => setIsKnowledgeModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKnowledge} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={editingKnowledge.category || 'troubleshooting'}
                    onChange={(e) =>
                      setEditingKnowledge({
                        ...editingKnowledge,
                        category: e.target.value as ChatbotKnowledgeCategory,
                      })
                    }
                    className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={editingKnowledge.sort_order ?? 0}
                    onChange={(e) =>
                      setEditingKnowledge({
                        ...editingKnowledge,
                        sort_order: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                  />
                </div>
              </div>

              {/* Title Fields */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-200">Article Title</label>
                <input
                  type="text"
                  placeholder="English title"
                  value={editingKnowledge.title?.en || ''}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      title: { ...(editingKnowledge.title || { en: '', ur: '', 'ur-roman': '' }), en: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
                <input
                  type="text"
                  dir="rtl"
                  placeholder="اردو عنوان"
                  value={editingKnowledge.title?.ur || ''}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      title: { ...(editingKnowledge.title || { en: '', ur: '', 'ur-roman': '' }), ur: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Roman Urdu title"
                  value={editingKnowledge.title?.['ur-roman'] || ''}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      title: {
                        ...(editingKnowledge.title || { en: '', ur: '', 'ur-roman': '' }),
                        'ur-roman': e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
              </div>

              {/* Content Fields */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-200">
                  Article Content / Guidance
                </label>
                <textarea
                  rows={3}
                  placeholder="English guidance (safe for customers)..."
                  value={editingKnowledge.content?.en || ''}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      content: { ...(editingKnowledge.content || { en: '', ur: '', 'ur-roman': '' }), en: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
                <textarea
                  rows={3}
                  dir="rtl"
                  placeholder="اردو رہنمائی..."
                  value={editingKnowledge.content?.ur || ''}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      content: { ...(editingKnowledge.content || { en: '', ur: '', 'ur-roman': '' }), ur: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
                <textarea
                  rows={3}
                  placeholder="Roman Urdu rehnumai..."
                  value={editingKnowledge.content?.['ur-roman'] || ''}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      content: {
                        ...(editingKnowledge.content || { en: '', ur: '', 'ur-roman': '' }),
                        'ur-roman': e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-200">
                  Trigger Keywords (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="English keywords: brake, squeak, grinding..."
                  value={(editingKnowledge.keywords?.en || []).join(', ')}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      keywords: {
                        ...(editingKnowledge.keywords || { en: [], ur: [], 'ur-roman': [] }),
                        en: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
                <input
                  type="text"
                  dir="rtl"
                  placeholder="اردو الفاظ: بریک، آواز، شور..."
                  value={(editingKnowledge.keywords?.ur || []).join(', ')}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      keywords: {
                        ...(editingKnowledge.keywords || { en: [], ur: [], 'ur-roman': [] }),
                        ur: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Roman Urdu keywords: brake, break, awaz, ragad..."
                  value={(editingKnowledge.keywords?.['ur-roman'] || []).join(', ')}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      keywords: {
                        ...(editingKnowledge.keywords || { en: [], ur: [], 'ur-roman': [] }),
                        'ur-roman': e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  className="w-full rounded-lg bg-[#0E1013] border border-[#2B2F3A] px-3 py-2 text-xs text-white focus:border-[#FF6A00] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#232732]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={editingKnowledge.is_active ?? true}
                    onChange={(e) =>
                      setEditingKnowledge({ ...editingKnowledge, is_active: e.target.checked })
                    }
                    className="rounded text-[#FF6A00] focus:ring-[#FF6A00]"
                  />
                  Publish / Active in Bot
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsKnowledgeModalOpen(false)}
                    className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingKnowledge}
                    className="rounded-lg bg-[#FF6A00] px-4 py-2 text-xs font-bold text-white hover:bg-[#E05600] disabled:opacity-50"
                  >
                    {savingKnowledge ? 'Saving...' : 'Save Article'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SESSION TRANSCRIPT */}
      {isTranscriptModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-[#14171E] border border-[#2B2F3A] p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232732] pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#FF6A00]" />
                  Chat Transcript
                </h3>
                <p className="text-[11px] text-gray-400">
                  {new Date(selectedSession.started_at).toLocaleString()} • Engine:{' '}
                  <span className="font-semibold text-white uppercase">
                    {selectedSession.engine_used}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTranscriptModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Transcript Messages Body */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
              {loadingMessages ? (
                <div className="py-8 text-center text-gray-500">Loading transcript...</div>
              ) : sessionMessages.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No logged messages for this session (logging was either disabled or empty).
                </div>
              ) : (
                sessionMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
                    >
                      <div className="text-[10px] text-gray-500 px-1">
                        {isUser ? 'Visitor' : 'Assistant'} •{' '}
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-[#FF6A00] text-white rounded-tr-xs'
                            : 'bg-[#1C2028] text-gray-100 border border-[#2A2E39] rounded-tl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-[#232732] pt-3 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsTranscriptModalOpen(false)}
                className="rounded-lg bg-[#202530] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2A303D]"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
