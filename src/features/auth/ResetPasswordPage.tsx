import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { useAuth } from './useAuth';
import { createResetPasswordSchema, type ResetPasswordFormValues } from '../../lib/validators';
import { Button, Card, Input } from '../../components/ui';
import { Seo } from '../../components/common/Seo';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = createResetPasswordSchema(t);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null);
    const { errorCode } = await updatePassword(values.password);
    if (errorCode) {
      const msg = t(`auth.errors.${errorCode}`);
      setServerError(msg);
      toast.error(msg);
      return;
    }

    toast.success(t('auth.passwordUpdatedSuccess'));
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-industrial-grid">
      <Seo title={t('auth.resetTitle')} />
      <Card className="w-full max-w-md p-6 sm:p-8 border-white/15 shadow-2xl">
        <div className="mb-6 text-start">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-2">
            {t('auth.resetTitle')}
          </h1>
          <p className="text-sm text-[#8A93A3]">{t('auth.resetSubtitle')}</p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-5 rounded-md bg-[#DC2626]/15 border border-[#DC2626]/40 p-3.5 text-xs text-red-300 text-start"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label={t('auth.newPasswordLabel')}
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.passwordPlaceholder')}
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label={t('auth.confirmPasswordLabel')}
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.confirmPasswordPlaceholder')}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={<KeyRound className="w-4 h-4" />}
            className="w-full mt-2"
          >
            {isSubmitting ? t('auth.updatingPassword') : t('auth.updatePasswordButton')}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-sm">
          <Link to="/login" className="font-semibold text-[#FF6A00] hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
