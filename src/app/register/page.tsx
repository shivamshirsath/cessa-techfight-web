// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerStandardUser } from '@/lib/auth';
import { User, Mail, Lock, Loader2, ArrowRight, ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await registerStandardUser(email, password, fullName);

    if (result.success) {
      // Send them to the homepage to browse events!
      router.push('/');
    } else {
      setError(result.error || 'Failed to register. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#FFF6F8] to-transparent -z-10"></div>
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-pink-100/50 rounded-full blur-3xl -z-10"></div>

      {/* Back to Home Navigation */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <ArrowLeft size={16} /> Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <UserPlus className="text-[#9E1B42]" size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            Join <span className="text-[#9E1B42]">TechFight 2026</span>
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Create your student account to register for events.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-10 px-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:rounded-[2rem] sm:px-12 border border-gray-100">
          <form className="space-y-5" onSubmit={handleRegister}>
            
            {/* Full Name Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name (As Per Certificate)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" required placeholder="Full Name As You Want on Certificate" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#9E1B42] focus:ring-4 focus:ring-[#9E1B42]/10 outline-none transition bg-gray-50/50 text-gray-900 font-medium" 
                  value={fullName} onChange={(e) => setFullName(e.target.value)} 
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" required placeholder="student@college.edu" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#9E1B42] focus:ring-4 focus:ring-[#9E1B42]/10 outline-none transition bg-gray-50/50 text-gray-900 font-medium" 
                  value={email} onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" required minLength={6} placeholder="••••••••" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#9E1B42] focus:ring-4 focus:ring-[#9E1B42]/10 outline-none transition bg-gray-50/50 text-gray-900 font-medium" 
                  value={password} onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 mt-2">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3">
              <button 
                type="submit" disabled={isLoading} 
                className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-[0_8px_25px_rgba(158,27,66,0.25)] text-sm font-bold text-white bg-[#9E1B42] hover:bg-[#801433] hover:shadow-[0_12px_35px_rgba(158,27,66,0.35)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none uppercase tracking-wide"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>Create Account <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#9E1B42] hover:text-[#801433] transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
        
        {/* Footer Credit */}
        <p className="text-center text-xs text-gray-400 mt-8 font-medium">
          Secure Registration Portal • CESA Sandip Institute
        </p>
      </div>
    </div>
  );
}