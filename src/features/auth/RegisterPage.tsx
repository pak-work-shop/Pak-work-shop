import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { useAuth } from './useAuth';
import { createRegisterSchema, type RegisterFormValues } from '../../lib/validators';
import { Button, Card, Input } from '../../components/ui';
import { Seo } from '../../components/common/Seo';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredNote, setRegisteredNote] = useState<boolean>(false);

  const schema = createRegisterSchema(t);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    const { errorCode, profile } = await signUp({
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      password: values.password,
    });

    if (errorCode) {
      const msg = t(`auth.errors.${errorCode}`);
      setServerError(msg);
      toast.error(msg);
      return;
    }

    toast.success(t('auth.registerConfirmNote'));
    if (profile) {
      navigate('/account', { replace: true });
    } else {
      setRegisteredNote(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-industrial-grid">
      <Seo title={t('auth.registerTitle')} />
      <Card className="w-full max-w-md p-6 sm:p-8 border-white/15 shadow-2xl">
        <div className="mb-6 text-start">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-2">
            {t('auth.registerTitle')}
          </h1>
          <p className="text-sm text-[#8A93A3]">{t('auth.registerSubtitle')}</p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-5 rounded-md bg-[#DC2626]/15 border border-[#DC2626]/40 p-3.5 text-xs text-red-300 text-start"
          >
            {serverError}
          </div>
        )}

        {registeredNote ? (
          <div className="space-y-5 text-start">
            <div className="rounded-md bg-[#16A34A]/15 border border-[#16A34A]/40 p-4 text-sm text-emerald-300">
              {t('auth.registerConfirmNote')}
            </div>
            <Link to="/login" className="block">
              <Button className="w-full">{t('auth.signInButton')}</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label={t('auth.fullNameLabel')}
              type="text"
              autoComplete="name"
              placeholder={t('auth.fullNamePlaceholder')}
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label={t('auth.phoneLabel')}
              type="tel"
              autoComplete="tel"
              placeholder={t('auth.phonePlaceholder')}
              hint={t('auth.phoneHint')}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label={t('auth.emailLabel')}
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label={t('auth.passwordLabel')}
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
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="w-full mt-2"
            >
              {isSubmitting ? t('auth.registering') : t('auth.registerButton')}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-sm text-[#8A93A3]">
          <span>{t('auth.haveAccountPrompt')} </span>
          <Link to="/login" className="font-semibold text-[#FF6A00] hover:underline">
            {t('auth.signInButton')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
