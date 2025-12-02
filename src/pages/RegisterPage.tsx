import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { useHemmeligStore } from '../store/hemmeligStore';
import { apiRaw } from '../lib/api';
import { authClient } from '../lib/auth';
import { getPasswordStrength } from '../utils/date';
import { SocialLoginButtons } from '../components/SocialLoginButtons';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useHemmeligStore();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [inviteCodeError, setInviteCodeError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t('register_page.password_mismatch_alert'));
      setIsErrorModalOpen(true);
      return;
    }

    // Validate invite code if required
    if (settings.requireInviteCode) {
      if (!formData.inviteCode) {
        setInviteCodeError('Invite code is required');
        return;
      }
      try {
        const res = await apiRaw.invites.public.validate.$post({
          json: { code: formData.inviteCode },
        });
        const result = await res.json();
        if (!result.valid) {
          setInviteCodeError('error' in result ? result.error : 'Invalid invite code');
          return;
        }
      } catch {
        setInviteCodeError('Failed to validate invite code');
        return;
      }
    }

    setIsLoading(true);
    setInviteCodeError('');

    try {
      let registrationError: string | null = null;
      
      const { data, error } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        name: formData.username
      }, {
        onError: (ctx) => {
          // Access error details from the context
          const errorDetails = ctx.error as { error?: { message?: string }; message?: string; body?: { message?: string } };
          console.log('Registration onError:', errorDetails);
          
          // Try to get error message from various locations
          const errorMessage = 
            errorDetails?.error?.message ||
            errorDetails?.message ||
            errorDetails?.body?.message ||
            '';
          
          if (errorMessage && errorMessage.includes('restricted to')) {
            registrationError = errorMessage;
          } else if (errorMessage) {
            registrationError = errorMessage;
          }
        }
      });

      if (error || registrationError) {
        // Handle specific error codes with user-friendly messages
        let userMessage = registrationError || 'An unexpected error occurred';
        
        if (!registrationError && error) {
          // Debug: log the full error structure
          console.log('Registration error:', error);
          
          // Get error details from various possible locations
          const errorObj = error as { 
            code?: string; 
            message?: string; 
            statusText?: string;
            error?: { code?: string; message?: string; cause?: { message?: string } };
            cause?: { message?: string };
          };
          const errorCode = errorObj.code || errorObj.error?.code || '';
          const errorMsg = errorObj.message || errorObj.error?.message || '';
          const causeMsg = errorObj.cause?.message || errorObj.error?.cause?.message || '';
          const statusText = errorObj.statusText || '';
          
          // Combine all error info for checking
          const allErrorText = `${errorCode} ${errorMsg} ${causeMsg} ${statusText}`.toLowerCase();
          
          // Check for email domain restriction
          if (allErrorText.includes('email_domain_not_allowed') || 
              allErrorText.includes('email domain') ||
              allErrorText.includes('domain not allowed') ||
              allErrorText.includes('restricted to') ||
              allErrorText.includes('forbidden')) {
            userMessage = 'Email domain not allowed';
          } else if (allErrorText.includes('already exists') || errorCode === 'USER_ALREADY_EXISTS') {
            userMessage = 'An account with this email already exists. Please sign in instead.';
          } else if (causeMsg && causeMsg.length > 0) {
            userMessage = causeMsg;
          } else if (errorMsg && errorMsg.length > 0 && errorMsg !== 'Internal Server Error') {
            userMessage = errorMsg;
          } else if (statusText && statusText.length > 0 && statusText !== 'Internal Server Error') {
            userMessage = statusText;
          }
        }
        
        setErrorMessage(userMessage);
        setIsErrorModalOpen(true);
      } else if (data) {
        console.log('Registration successful', data);
        
        // If invite code was used, mark it as used and link to user
        if (formData.inviteCode && data?.user?.id) {
          try {
            await apiRaw.invites.public.use.$post({
              json: { code: formData.inviteCode, userId: data.user.id },
            });
          } catch (e) {
            console.error('Failed to mark invite code as used:', e);
          }
        }
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="min-h-screen bg-light-800 dark:bg-dark-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span>{t('register_page.back_to_hemmelig')}</span>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('register_page.create_account_button')}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('register_page.join_hemmelig')}</p>
        </div>

        {/* Register Form */}
        <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Invite Code Field (conditional) */}
            {settings.requireInviteCode && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                  Invite Code
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.inviteCode}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, inviteCode: e.target.value.toUpperCase() }));
                      setInviteCodeError('');
                    }}
                    placeholder="Enter your invite code"
                    className={`w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700/50 border ${inviteCodeError ? 'border-red-500' : 'border-gray-300 dark:border-dark-500/50'} text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300`}
                    required
                  />
                </div>
                {inviteCodeError && (
                  <p className="text-xs text-red-400">{inviteCodeError}</p>
                )}
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                {t('register_page.username_label')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder={t('register_page.username_placeholder')}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                {t('register_page.email_label')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('register_page.email_placeholder')}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                {t('register_page.password_label')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t('register_page.password_placeholder')}
                  className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300 transition-colors duration-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-300 dark:bg-dark-600'
                          }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength >= 3 ? 'text-green-400' : passwordStrength >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {t('register_page.password_strength_label')}: {t(`register_page.password_strength_levels.${strengthLabels[passwordStrength - 1].toLowerCase().replace(' ', '_')}`)}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                {t('register_page.confirm_password_label')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder={t('register_page.confirm_password_placeholder')}
                  className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300 transition-colors duration-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="flex items-center space-x-2">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">{t('register_page.passwords_match')}</span>
                    </>
                  ) : (
                    <span className="text-xs text-red-400">{t('register_page.passwords_do_not_match')}</span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || formData.password !== formData.confirmPassword}
              className={`
        w-full flex items-center justify-center space-x-3 py-2.5 px-4 font-semibold transition-all duration-300 transform
        ${isLoading || formData.password !== formData.confirmPassword
                  ? 'bg-dark-600 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-gray-900 dark:text-white hover:scale-105 hover:shadow-2xl shadow-teal-500/25'
                }
        focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-white dark:ring-offset-dark-800
       `}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('register_page.creating_account_button')}</span>
                </>
              ) : (
                <span>{t('register_page.create_account_button')}</span>
              )}
            </button>
          </form>

          {/* Social Login Buttons */}
          <SocialLoginButtons mode="register" />

          {/* Sign In Link */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200 dark:border-dark-600">
            <p className="text-gray-500 dark:text-slate-400">
              {t('register_page.already_have_account_question')}{' '}
              <Link
                to="/login"
                className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-300"
              >
                {t('register_page.sign_in_link')}
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="Registration Error"
        confirmText="OK"
        onConfirm={() => setIsErrorModalOpen(false)}
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
}
