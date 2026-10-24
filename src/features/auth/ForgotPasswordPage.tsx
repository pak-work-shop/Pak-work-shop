import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { useAuth } from './useAuth';
import { createForgotPasswordSchema, type ForgotPasswordFormValues } from '../../lib/validators';
import { Button, Card, Input } from '../../components/ui';
import { Seo } from '../../components/common/Seo';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = createForgotPasswordSchema(t);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null);
    const { errorCode } = await resetPassword(values.email);
    if (errorCode) {
      const msg = t(`auth.errors.${errorCode}`);
      setServerError(msg);
      toast.error(msg);
      return;
    }

    // Do not reveal whether the email exists
    setSubmitted(true);
    toast.success(t('auth.forgotSuccessNote'));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-industrial-grid">
      <Seo title={t('auth.forgotTitle')} />
      <Card className="w-full max-w-md p-6 sm:p-8 border-white/15 shadow-2xl">
        <div className="mb-6 text-start">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-2">
            {t('auth.forgotTitle')}
          </h1>
          <p className="text-sm text-[#8A93A3]">{t('auth.forgotSubtitle')}</p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-5 rounded-md bg-[#DC2626]/15 border border-[#DC2626]/40 p-3.5 text-xs text-red-300 text-start"
          >
            {serverError}
          </div>
        )}

        {submitted ? (
          <div className="space-y-5 text-start">
            <div className="rounded-md bg-[#16A34A]/15 border border-[#16A34A]/40 p-4 text-sm text-emerald-300">
              {t('auth.forgotSuccessNote')}
            </div>
            <Link to="/login" className="block">
              <Button variant="secondary" className="w-full">
                {t('auth.backToLogin')}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label={t('auth.emailLabel')}
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<Mail className="w-4 h-4" />}
              className="w-full mt-2"
            >
              {isSubmitting ? t('auth.sendingReset') : t('auth.sendResetButton')}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-sm">
          <Link to="/login" className="font-semibold text-[#FF6A00] hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
