// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerStandardUser } from '@/lib/auth';
import { User, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join TechFight <span className="text-blue-600">2026</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">Create your student account to participate</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-md">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                <input type="text" required className="w-full pl-10 py-3 rounded-md border bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input type="email" required className="w-full pl-10 py-3 rounded-md border bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="student@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input type="password" required minLength={6} className="w-full pl-10 py-3 rounded-md border bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-70">
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Create Account <ArrowRight className="ml-2 h-5 w-5" /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">Already have an account? <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition">Sign in here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}