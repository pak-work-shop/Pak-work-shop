import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Image as ImageIcon, Link2, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { resolveDirectImageUrl } from '../../lib/defaultImages';
import { DEMO_ASSET_REGEX } from '../../lib/validators';
import { Button } from '../ui/Button';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface ImageFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (nextUrl: string) => void;
  folderPrefix:
    | 'site'
    | 'services'
    | 'branding'
    | 'categories'
    | 'brands'
    | 'products'
    | 'blog'
    | 'gallery';
  bucketName?: 'site-assets' | 'product-images';
  error?: string;
}

export function ImageField({
  label,
  hint,
  value,
  onChange,
  folderPrefix,
  bucketName = 'site-assets',
  error,
}: ImageFieldProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const msg = t('admin.settings.fields.logoInvalidType');
      setLocalError(msg);
      toast.error(msg);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const msg = t('admin.settings.fields.logoTooLarge');
      setLocalError(msg);
      toast.error(msg);
      e.target.value = '';
      return;
    }

    if (!env.isConfigured) {
      const msg = t('admin.settings.fields.logoUploadError');
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const rand = Math.random().toString(36).slice(2, 8);
      const filePath = `${folderPrefix}/img-${Date.now()}-${rand}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        const msg = t('admin.settings.fields.logoUploadError');
        setLocalError(msg);
        toast.error(msg);
        return;
      }

      const { data: pubData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (pubData?.publicUrl) {
        onChange(pubData.publicUrl);
        setUrlInput('');
        toast.success(t('admin.settings.fields.logoUploadedSuccess'));
      }
    } catch {
      const msg = t('admin.settings.fields.logoUploadError');
      setLocalError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyPastedUrl = () => {
    setLocalError(null);
    const trimmed = resolveDirectImageUrl(urlInput.trim());
    if (!trimmed) return;

    if (DEMO_ASSET_REGEX.test(trimmed)) {
      onChange(trimmed);
      setUrlInput('');
      return;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:') {
        const msg = t('validation.httpsUrlInvalid');
        setLocalError(msg);
        toast.error(msg);
        return;
      }
      onChange(trimmed);
      setUrlInput('');
    } catch {
      const msg = t('validation.httpsUrlInvalid');
      setLocalError(msg);
      toast.error(msg);
    }
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2.5 text-start">
      <label className="block text-sm font-medium text-[#F5F6F8]">{label}</label>
      {hint && <p className="text-xs text-[#8A93A3]">{hint}</p>}

      <div className="p-4 rounded-lg bg-[#0E1013] border border-white/10 space-y-4">
        {/* Image Preview or Empty Indicator */}
        {value ? (
          <div className="relative inline-block">
            <img
              src={value}
              alt={t('admin.shared.imagePreview')}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="max-h-40 w-auto rounded border border-white/15 object-cover bg-[#1B1F26]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#8A93A3] py-2">
            <ImageIcon className="w-4 h-4 text-[#FF6A00]" />
            <span>{t('admin.shared.noImageSet')}</span>
          </div>
        )}

        {/* Upload Button + Remove Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={uploading}
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-4 h-4 text-[#FF6A00]" />}
          >
            {uploading ? t('admin.shared.uploading') : t('admin.shared.uploadFile')}
          </Button>

          {value && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                setLocalError(null);
                onChange('');
              }}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              {t('admin.shared.removeImage')}
            </Button>
          )}
        </div>

        {/* Paste https:// URL option */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-white/10">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-[#8A93A3] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="url"
              dir="ltr"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={t('admin.shared.orPasteUrl')}
              className="w-full rounded-md ps-9 pe-3 py-1.5 text-xs bg-[#1B1F26] text-[#F5F6F8] placeholder:text-[#8A93A3]/70 border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyPastedUrl}
            disabled={!urlInput.trim()}
          >
            {t('admin.shared.applyUrl')}
          </Button>
        </div>
      </div>

      {displayError && (
        <p role="alert" className="text-xs text-[#EF4444]">
          {displayError}
        </p>
      )}
    </div>
  );
}
