import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User, Mail, Lock, Building, CreditCard, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().min(2, 'Please specify your department'),
  studentIdNumber: z.string().min(2, 'Please enter your student ID / roll number'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      department: 'Computer Science',
      studentIdNumber: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      await registerUser(data);
      toast.success('Registration successful! Welcome to EVORA.');
      navigate('/student/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Email may already be in use.');
    } finally {
      setIsSubmitting(false);
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
            Create Student Account
          </h1>
          <p className="text-xs text-[#64748B]">
            Sign up to register for college hackathons, workshops, and get QR passes
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-7 shadow-xs">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-[#DC2626] mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="e.g. alex@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-[#DC2626] mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="At least 6 characters"
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

            {/* Department and Student ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    {...register('department')}
                    placeholder="e.g. CS / IT"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
                  />
                </div>
                {errors.department && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.department.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Student Roll / ID
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    {...register('studentIdNumber')}
                    placeholder="e.g. CS2026-042"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
                  />
                </div>
                {errors.studentIdNumber && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.studentIdNumber.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-5 mt-5 border-t border-[#E2E8F0] text-center">
            <p className="text-xs text-[#64748B]">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-[#2563EB] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
