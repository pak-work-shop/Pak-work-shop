import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Filter,
  Eye,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { getLocalized } from '../../i18n/helpers';
import { TranslatableField } from '../../components/common/TranslatableField';
import { ImageField } from '../../components/common/ImageField';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import type { GalleryCategory, GalleryItemRow, LocalizedText } from '../../types/database';

const CATEGORIES: Array<{ id: GalleryCategory; label: string }> = [
  { id: 'workshop', label: 'Workshop Floor' },
  { id: 'repairs', label: 'Repairs & Work' },
  { id: 'before_after', label: 'Before & After Pairs' },
  { id: 'parts', label: 'Spare Parts Inventory' },
  { id: 'team', label: 'Technician Team' },
];

export default function GalleryAdminPage() {
  const { t, i18n } = useTranslation();

  const [items, setItems] = useState<GalleryItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory | 'all'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<GalleryItemRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState<GalleryCategory>('workshop');
  const [formTitle, setFormTitle] = useState<LocalizedText>({ en: '', ur: '', 'ur-roman': '' });
  const [formCaption, setFormCaption] = useState<LocalizedText>({ en: '', ur: '', 'ur-roman': '' });
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formBeforeImageUrl, setFormBeforeImageUrl] = useState<string>('');
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchItems = async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) setItems(data);
    } catch (err) {
      console.error('Failed to load gallery items in admin:', err);
      toast.error('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormCategory('workshop');
    setFormTitle({ en: '', ur: '', 'ur-roman': '' });
    setFormCaption({ en: '', ur: '', 'ur-roman': '' });
    setFormImageUrl('');
    setFormBeforeImageUrl('');
    setFormSortOrder(items.length + 1);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEdit = (item: GalleryItemRow) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormTitle(item.title || { en: '', ur: '', 'ur-roman': '' });
    setFormCaption(item.caption || { en: '', ur: '', 'ur-roman': '' });
    setFormImageUrl(item.image_url);
    setFormBeforeImageUrl(item.before_image_url || '');
    setFormSortOrder(item.sort_order);
    setFormIsActive(item.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImageUrl.trim()) {
      toast.error('Main image URL or upload is required');
      return;
    }
    if (formCategory === 'before_after' && !formBeforeImageUrl.trim()) {
      toast.error('Before image is required for Before & After pairs');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        caption: formCaption,
        category: formCategory,
        image_url: formImageUrl.trim(),
        before_image_url: formCategory === 'before_after' ? formBeforeImageUrl.trim() || null : null,
        sort_order: formSortOrder,
        is_active: formIsActive,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('gallery_items')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Gallery item updated');
      } else {
        const { error } = await supabase.from('gallery_items').insert({
          ...payload,
          is_demo: false,
        });
        if (error) throw error;
        toast.success('Gallery item created');
      }

      setIsModalOpen(false);
      void fetchItems();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to save gallery item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const { error } = await supabase.from('gallery_items').delete().eq('id', itemId);
      if (error) throw error;
      toast.success('Gallery item deleted');
      setDeleteConfirmId(null);
      void fetchItems();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete gallery item');
    }
  };

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">
            {t('admin.gallery.title', 'Workshop Gallery & Before/After Showcase')}
          </h1>
          <p className="text-xs sm:text-sm text-[#8A93A3]">
            {t('admin.gallery.subtitle', 'Manage photos of facilities, team, parts, and interactive before/after repair sliders.')}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Gallery Photo
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#FF6A00] text-white'
              : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
          }`}
        >
          All Photos ({items.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = items.filter((i) => i.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-[#1B1F26] border border-white/10 rounded-2xl p-12 text-center text-sm text-[#8A93A3]">
          No photos found in this category. Click "Add Gallery Photo" to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#1B1F26] border border-white/10 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Images preview */}
                <div className="relative aspect-[16/10] bg-[#12151A] overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title.en}
                    className="w-full h-full object-cover"
                  />
                  {item.category === 'before_after' && (
                    <span className="absolute top-2 start-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                      Before & After
                    </span>
                  )}
                  {!item.is_active && (
                    <span className="absolute top-2 end-2 px-2 py-0.5 rounded bg-red-500/80 text-white text-[10px] font-bold">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#8A93A3]">
                    <span className="font-mono">Order: {item.sort_order}</span>
                    <span className="uppercase text-[10px] bg-white/5 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">
                    {item.title.en || 'Untitled'}
                  </h4>
                  {item.caption.en && (
                    <p className="text-xs text-[#8A93A3] line-clamp-2">
                      {item.caption.en}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-0 flex items-center justify-between border-t border-white/5 mt-3 pt-3">
                <span className="text-[11px] text-[#8A93A3]">
                  {item.is_demo ? 'Sample Item' : 'Production Item'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded bg-white/5 text-[#8A93A3] hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1.5 rounded bg-red-500/10 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1B1F26] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-auto">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'Edit Gallery Photo' : 'Add Gallery Photo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A93A3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as GalleryCategory)}
                  className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Caption */}
              <TranslatableField
                label="Photo Title"
                value={formTitle}
                onChange={setFormTitle}
                placeholder={{ en: 'e.g. Engine Overhaul on Toyota Corolla' }}
              />

              <TranslatableField
                label="Photo Caption (Description)"
                multiline
                rows={2}
                value={formCaption}
                onChange={setFormCaption}
                placeholder={{ en: 'A brief explanation of the workshop work shown...' }}
              />

              {/* Main Image */}
              <ImageField
                label={formCategory === 'before_after' ? 'After Image (Final Result)' : 'Gallery Photo'}
                value={formImageUrl}
                onChange={setFormImageUrl}
                folderPrefix="gallery"
                bucketName="site-assets"
              />

              {/* Before Image (for before/after pairs) */}
              {formCategory === 'before_after' && (
                <div className="pt-2 border-t border-white/10">
                  <ImageField
                    label="Before Image (Original Condition)"
                    value={formBeforeImageUrl}
                    onChange={setFormBeforeImageUrl}
                    folderPrefix="gallery"
                    bucketName="site-assets"
                  />
                </div>
              )}

              {/* Sort Order & Active */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded text-[#FF6A00]"
                    />
                    <span>Active (Visible publicly)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={saving}
                >
                  Save Photo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1B1F26] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Delete Gallery Photo?</h3>
            <p className="text-xs text-[#8A93A3] mb-5">
              This will remove this photo from the public gallery immediately.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
