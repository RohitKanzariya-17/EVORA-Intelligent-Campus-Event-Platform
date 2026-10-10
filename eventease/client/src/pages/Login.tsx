import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Eye, EyeOff, Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success('Signed in successfully! Welcome back.');

      // Check if redirected from a specific protected page
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        // Retrieve fresh user role from localStorage
        const saved = localStorage.getItem('eventease_user');
        const userObj = saved ? JSON.parse(saved) : null;
        if (userObj?.role === 'organizer') {
          navigate('/organizer/dashboard', { replace: true });
        } else if (userObj?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/student/dashboard', { replace: true });
        }
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (!error.response
          ? 'Unable to reach backend server. Please verify the server is running.'
          : 'Invalid email or password.');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo account fill for judges / testers
  const fillDemoAccount = (role: 'student' | 'organizer' | 'admin') => {
    if (role === 'admin') {
      setValue('email', 'admin@evora.edu');
      setValue('password', 'Password123!');
    } else if (role === 'organizer') {
      setValue('email', 'sarah.organizer@evora.edu');
      setValue('password', 'Password123!');
    } else {
      setValue('email', 'alex.student@evora.edu');
      setValue('password', 'Password123!');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] items-center justify-center text-[#2563EB] shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Sign In to EVORA
          </h1>
          <p className="text-xs text-[#64748B]">
            Access your event tickets, registration pass, or organizer scanner
          </p>
        </div>

        {/* Demo Accounts Pill Box */}
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E40AF] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>1-Click Hackathon Demo Fill:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('student')}
              className="py-1.5 px-2 bg-white hover:bg-[#F8FAFC] text-[#334155] rounded-lg text-xs font-semibold border border-[#DBEAFE] shadow-2xs transition"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('organizer')}
              className="py-1.5 px-2 bg-white hover:bg-[#F8FAFC] text-[#334155] rounded-lg text-xs font-semibold border border-[#DBEAFE] shadow-2xs transition"
            >
              Organizer
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin')}
              className="py-1.5 px-2 bg-white hover:bg-[#F8FAFC] text-[#334155] rounded-lg text-xs font-semibold border border-[#DBEAFE] shadow-2xs transition"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Login Card Form */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-7 shadow-xs">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="e.g. alex.student@evora.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-[#DC2626] mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#DC2626] mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-5 mt-5 border-t border-[#E2E8F0] text-center">
            <p className="text-xs text-[#64748B]">
              Don’t have an account yet?{' '}
              <Link to="/register" className="font-semibold text-[#2563EB] hover:underline">
                Register as Student
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
