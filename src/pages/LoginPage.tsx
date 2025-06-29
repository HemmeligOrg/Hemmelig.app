import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Lock, Github, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo.tsx';

import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({ baseURL: "http://localhost:5173" });

export function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await authClient.signIn.email({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                alert(`Login failed: ${error.message}`);
            } else {
                console.log('Login successful', data);
                // Handle successful login, e.g., redirect to dashboard
            }
        } catch (error) {
            console.error('An error occurred:', error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubLogin = () => {
        console.log('GitHub OAuth login');
        // Implement GitHub OAuth
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Back to Home */}
                <Link
                    to="/"
                    className="inline-flex items-center space-x-2 text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>Back to Hemmelig</span>
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                            <Logo className="w-12 h-12 sm:w-12 sm:h-12 fill-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
                    <p className="text-slate-400">Sign in to your Hemmelig account</p>
                </div>

                {/* Login Form */}
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
                                    type="text"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter your email"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Enter your password"
                                    className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-teal-400 hover:text-teal-300 transition-colors duration-300"
                            >
                                Forgot your password?
                            </Link>
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
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-600/50"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-800/50 text-slate-400">Or continue with</span>
                        </div>
                    </div>

                    {/* GitHub Login */}
                    <button
                        onClick={handleGithubLogin}
                        className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/50 rounded-xl text-slate-100 font-medium transition-all duration-300 hover:scale-105"
                    >
                        <Github className="w-5 h-5" />
                        <span>Continue with GitHub</span>
                    </button>

                    {/* Sign Up Link */}
                    <div className="text-center mt-8 pt-6 border-t border-slate-700/50">
                        <p className="text-slate-400">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-300"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
