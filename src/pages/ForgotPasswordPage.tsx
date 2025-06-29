import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo.tsx';

import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({ baseURL: "http://localhost:5173" });

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await authClient.requestPasswordReset({
                email,
                redirectTo: "/reset-password", // Assuming you'll have a reset-password page
            });

            if (error) {
                alert(`Password reset request failed: ${error.message}`);
            } else {
                console.log('Password reset request successful', data);
                setIsSubmitted(true);
            }
        } catch (error) {
            console.error('An error occurred:', error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Back to Login */}
                    <Link
                        to="/login"
                        className="inline-flex items-center space-x-2 text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                        <span>Back to Sign In</span>
                    </Link>

                    {/* Success Message */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl text-center">
                        <div className="flex items-center justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                <div className="relative bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl shadow-2xl">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-4">Check your email</h1>
                        <p className="text-slate-400 mb-6">
                            We've sent a password reset link to <span className="text-teal-400 font-medium">{email}</span>
                        </p>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">
                                Didn't receive the email? Check your spam folder or try again.
                            </p>

                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-300"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Back to Login */}
                <Link
                    to="/login"
                    className="inline-flex items-center space-x-2 text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>Back to Sign In</span>
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                            <Logo className="w-12 h-12 sm:w-12 sm:h-12 fill-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Forgot password?</h1>
                    <p className="text-slate-400">No worries, we'll send you reset instructions</p>
                </div>

                {/* Reset Form */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-400">
                                Enter the email associated with your account
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`
                w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform
                ${isLoading
                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white hover:scale-105 hover:shadow-2xl shadow-teal-500/25'
                                }
                focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-slate-800
              `}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <span>Reset Password</span>
                            )}
                        </button>
                    </form>

                    {/* Additional Help */}
                    <div className="text-center mt-8 pt-6 border-t border-slate-700/50">
                        <p className="text-slate-400 text-sm">
                            Remember your password?{' '}
                            <Link
                                to="/login"
                                className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-300"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
