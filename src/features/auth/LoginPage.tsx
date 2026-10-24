import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import { useAuth } from './useAuth';
import { createLoginSchema, type LoginFormValues } from '../../lib/validators';
import { Button, Card, Input } from '../../components/ui';
import { Seo } from '../../components/common/Seo';

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = createLoginSchema(t);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    const { errorCode, profile } = await signIn(values.email, values.password);
    if (errorCode) {
      const msg = t(`auth.errors.${errorCode}`);
      setServerError(msg);
      toast.error(msg);
      return;
    }

    toast.success(t('auth.loginSuccess'));
    const redirectTo = searchParams.get('redirectTo');
    if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
      navigate(redirectTo, { replace: true });
      return;
    }

    if (profile?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/account', { replace: true });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-industrial-grid">
      <Seo title={t('auth.loginTitle')} />
      <Card className="w-full max-w-md p-6 sm:p-8 border-white/15 shadow-2xl">
        <div className="mb-6 text-start">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-2">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-sm text-[#8A93A3]">{t('auth.loginSubtitle')}</p>
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
            label={t('auth.emailLabel')}
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1">
            <Input
              label={t('auth.passwordLabel')}
              type="password"
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[#FF6A00] hover:underline"
              >
                {t('auth.forgotPasswordLink')}
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={<LogIn className="w-4 h-4" />}
            className="w-full mt-2"
          >
            {isSubmitting ? t('auth.signingIn') : t('auth.signInButton')}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-sm text-[#8A93A3]">
          <span>{t('auth.noAccountPrompt')} </span>
          <Link to="/register" className="font-semibold text-[#FF6A00] hover:underline">
            {t('auth.registerButton')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
