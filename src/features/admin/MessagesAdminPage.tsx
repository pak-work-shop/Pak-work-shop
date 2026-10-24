import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  FlaskConical,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { notifyAdminMessagesUpdated } from './AdminSidebar';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Skeleton,
} from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { cn } from '../../lib/utils';
import type {
  ContactMessageRow,
  ContactMessageStatus,
} from '../../types/database';
import type { BadgeVariant } from '../../components/ui/Badge';

const STATUS_FILTERS: ReadonlyArray<ContactMessageStatus | 'all'> = [
  'all',
  'new',
  'read',
  'replied',
  'archived',
];

const STATUS_OPTIONS: ReadonlyArray<ContactMessageStatus> = [
  'new',
  'read',
  'replied',
  'archived',
];

const STATUS_BADGE_MAP: Record<ContactMessageStatus, BadgeVariant> = {
  new: 'accent',
  read: 'info',
  replied: 'success',
  archived: 'default',
};

export default function MessagesAdminPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [loading, setLoading] = useState<boolean>(env.isConfigured);
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | 'all'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessageRow | null>(null);
  const [deletingMessage, setDeletingMessage] =
    useState<ContactMessageRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMessages(data as ContactMessageRow[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const handleStatusChange = async (
    msg: ContactMessageRow,
    nextStatus: ContactMessageStatus,
    silent = false
  ) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: nextStatus })
      .eq('id', msg.id);

    if (error) {
      if (!silent) toast.error(t('common.errorDescription'));
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, status: nextStatus } : m))
    );
    setSelectedMessage((prev) =>
      prev?.id === msg.id ? { ...prev, status: nextStatus } : prev
    );
    notifyAdminMessagesUpdated();

    if (!silent) {
      toast.success(t('admin.messagesAdmin.statusUpdated'));
    }
  };

  const handleOpenMessage = (msg: ContactMessageRow) => {
    setSelectedMessage(msg);
    if (msg.status === 'new') {
      void handleStatusChange(msg, 'read', true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMessage) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', deletingMessage.id);

      if (error) {
        toast.error(t('common.errorDescription'));
        return;
      }

      setMessages((prev) => prev.filter((m) => m.id !== deletingMessage.id));
      if (selectedMessage?.id === deletingMessage.id) {
        setSelectedMessage(null);
      }
      setDeletingMessage(null);
      notifyAdminMessagesUpdated();
      toast.success(t('admin.messagesAdmin.deletedSuccess'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return messages.filter((msg) => {
      if (statusFilter !== 'all' && msg.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        msg.name.toLowerCase().includes(q) ||
        msg.phone.toLowerCase().includes(q) ||
        (msg.subject || '').toLowerCase().includes(q) ||
        msg.message.toLowerCase().includes(q)
      );
    });
  }, [messages, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 text-start pb-16">
      <Seo title={t('admin.messagesAdmin.seoTitle')} />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold font-heading text-white heading-accent mb-3">
          {t('admin.messagesAdmin.title')}
        </h1>
        <p className="text-sm text-[#8A93A3]">
          {t('admin.messagesAdmin.subtitle')}
        </p>
      </div>

      {/* Search & Status Filters */}
      <Card className="p-4 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#8A93A3] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.messagesAdmin.searchPlaceholder')}
            className="w-full rounded-md ps-10 pe-4 py-2 text-sm bg-[#0E1013] text-[#F5F6F8] placeholder:text-[#8A93A3]/70 border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-3 py-1 rounded text-xs font-semibold transition-colors',
                  active
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                )}
              >
                {t(`admin.messagesAdmin.statuses.${st}`)}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Messages Inbox List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredMessages.length === 0 ? (
        <EmptyState
          title={t('admin.messagesAdmin.emptyTitle')}
          description={t('admin.messagesAdmin.emptyDesc')}
        />
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((msg) => {
            const isUnread = msg.status === 'new';
            return (
              <Card
                key={msg.id}
                onClick={() => handleOpenMessage(msg)}
                className={cn(
                  'p-4 sm:p-5 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  isUnread
                    ? 'border-[#FF6A00] bg-[#1B1F26]'
                    : 'hover:border-white/25'
                )}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_BADGE_MAP[msg.status]}>
                      {t(`admin.messagesAdmin.statuses.${msg.status}`)}
                    </Badge>
                    {msg.is_demo && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                        <FlaskConical className="w-3 h-3" />
                        <span>{t('demo.badge')}</span>
                      </span>
                    )}
                    <h2
                      className={cn(
                        'text-base sm:text-lg font-heading',
                        isUnread ? 'font-bold text-white' : 'font-semibold text-[#F5F6F8]'
                      )}
                    >
                      {msg.name}
                    </h2>
                    <span
                      dir="ltr"
                      className="text-xs text-[#FF6A00] font-semibold tabular-nums"
                    >
                      {msg.phone}
                    </span>
                    <span className="text-xs text-[#8A93A3]">
                      · {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white">
                    {msg.subject || t('admin.messagesAdmin.noSubject')}
                  </p>
                  <p className="text-xs text-[#8A93A3] line-clamp-2">
                    {msg.message}
                  </p>
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingMessage(msg)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    {t('admin.shared.deleteBtn')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Message Detail Modal */}
      <Modal
        isOpen={Boolean(selectedMessage)}
        onClose={() => setSelectedMessage(null)}
        title={t('admin.messagesAdmin.detailTitle')}
        className="max-w-2xl"
        footer={
          selectedMessage && (
            <>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setDeletingMessage(selectedMessage)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                {t('admin.shared.deleteBtn')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedMessage(null)}
              >
                {t('common.close')}
              </Button>
            </>
          )
        }
      >
        {selectedMessage && (
          <div className="space-y-5 text-start text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0E1013] p-4 rounded-lg border border-white/10">
              <div>
                <span className="text-xs text-[#8A93A3] block">
                  {t('admin.messagesAdmin.senderName')}
                </span>
                <p className="font-semibold text-white">{selectedMessage.name}</p>
              </div>

              <div>
                <span className="text-xs text-[#8A93A3] block">
                  {t('admin.messagesAdmin.senderPhone')}
                </span>
                <p dir="ltr" className="font-semibold text-[#FF6A00] tabular-nums">
                  {selectedMessage.phone}
                </p>
              </div>

              {selectedMessage.email && (
                <div>
                  <span className="text-xs text-[#8A93A3] block">
                    {t('admin.messagesAdmin.senderEmail')}
                  </span>
                  <p className="text-white break-all">{selectedMessage.email}</p>
                </div>
              )}

              <div>
                <span className="text-xs text-[#8A93A3] block">
                  {t('admin.messagesAdmin.receivedAt')}
                </span>
                <p className="text-white">
                  {new Date(selectedMessage.created_at).toLocaleString()} (
                  {selectedMessage.language})
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#8A93A3] block mb-1">
                {t('admin.messagesAdmin.subject')}
              </span>
              <p className="font-semibold text-white">
                {selectedMessage.subject || t('admin.messagesAdmin.noSubject')}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#8A93A3] block mb-1">
                {t('admin.messagesAdmin.messageBody')}
              </span>
              <div className="p-4 rounded-lg bg-[#0E1013] border border-white/10 text-[#F5F6F8] whitespace-pre-wrap leading-relaxed">
                {selectedMessage.message}
              </div>
            </div>

            {/* Quick Reply Actions: Call & WhatsApp */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href={`tel:${selectedMessage.phone}`}>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Phone className="w-4 h-4" />}
                >
                  {t('admin.messagesAdmin.callSender')}
                </Button>
              </a>

              <a
                href={buildWhatsAppUrl(selectedMessage.phone)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
                >
                  {t('admin.messagesAdmin.whatsappSender')}
                </Button>
              </a>

              {selectedMessage.email && (
                <a href={`mailto:${selectedMessage.email}`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Mail className="w-4 h-4" />}
                  >
                    {selectedMessage.email}
                  </Button>
                </a>
              )}
            </div>

            {/* Status Switcher */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#8A93A3] me-1">
                {t('admin.messagesAdmin.markAs')}
              </span>
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => void handleStatusChange(selectedMessage, st)}
                  className={cn(
                    'px-3 py-1 rounded text-xs font-semibold transition-colors',
                    selectedMessage.status === st
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/15'
                  )}
                >
                  {t(`admin.messagesAdmin.statuses.${st}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingMessage)}
        onClose={() => setDeletingMessage(null)}
        title={t('admin.shared.confirmDeleteTitle')}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeletingMessage(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              {isDeleting
                ? t('admin.shared.deleting')
                : t('admin.shared.deleteBtn')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#F5F6F8]">
          {t('admin.messagesAdmin.deleteConfirmText', {
            name: deletingMessage?.name || '',
          })}
        </p>
      </Modal>
    </div>
  );
}
