// src/app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LayoutDashboard, Calendar, Users, IndianRupee, LogOut, Loader2, ShieldAlert, Instagram, UserSquare2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'ADMIN' | 'TREASURER' | 'SOCIAL_MEDIA' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.data()?.role;

        // 1. Are they allowed in the backend portal at all?
        if (role !== 'ADMIN' && role !== 'TREASURER' && role !== 'SOCIAL_MEDIA') {
          alert("Unauthorized access. Staff only.");
          router.push('/');
          return;
        }

        // 2. THE BOUNCERS: Keep specific roles in their specific lanes
        if (role === 'TREASURER' && pathname !== '/admin/finance') {
          router.push('/admin/finance');
          return;
        }
        
        if (role === 'SOCIAL_MEDIA' && pathname !== '/admin/socials') {
          router.push('/admin/socials');
          return;
        }

        setUserRole(role);
      } catch (error) {
        console.error("Auth Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Verifying Security Clearance...</p>
      </div>
    );
  }

  if (!userRole) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 🚀 SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <span className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className={
              userRole === 'ADMIN' ? 'text-purple-600' : 
              userRole === 'SOCIAL_MEDIA' ? 'text-pink-600' : 'text-green-600'
            } size={24}/>
            {userRole === 'ADMIN' ? 'Admin Portal' : 
             userRole === 'SOCIAL_MEDIA' ? 'Media Portal' : 'Finance Portal'}
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {userRole === 'ADMIN' && (
            <>
              <Link href="/admin/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === '/admin/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <LayoutDashboard size={20} /> Dashboard
              </Link>
              <Link href="/admin/events" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname.includes('/admin/events') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Calendar size={20} /> Manage Events
              </Link>
              <Link href="/admin/users" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname.includes('/admin/users') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Users size={20} /> Users & Roles
              </Link>
            </>
          )}

          {/* Show Content section to both ADMIN and SOCIAL_MEDIA */}
{/* Show Content section to both ADMIN and SOCIAL_MEDIA */}
          {(userRole === 'ADMIN' || userRole === 'SOCIAL_MEDIA') && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content</p>
              
              <Link href="/admin/socials" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname.includes('/admin/socials') ? 'bg-pink-50 text-pink-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Instagram size={20} /> Social Gallery
              </Link>
              
              {/* Only Admin can manage the CESA Team & Sponsors */}
              {userRole === 'ADMIN' && (
                <>
                  <Link href="/admin/team" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname.includes('/admin/team') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <UserSquare2 size={20} /> CESA Team
                  </Link>
                  {/* NEW SPONSORS LINK */}
                  <Link href="/admin/sponsors" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname.includes('/admin/sponsors') ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <ShieldAlert size={20} /> Event Sponsors
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Show Finance section only to ADMIN and TREASURER */}
          {(userRole === 'ADMIN' || userRole === 'TREASURER') && (
            <div className="pt-4 mt-4 border-t border-gray-100">
               <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Finance</p>
              <Link href="/admin/finance" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname.includes('/admin/finance') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <IndianRupee size={20} /> Treasurer Tools
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-red-600 hover:bg-red-50 transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* 🖥️ MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="md:hidden bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <span className="font-bold text-gray-900">
            {userRole === 'ADMIN' ? 'Admin Portal' : 
             userRole === 'SOCIAL_MEDIA' ? 'Media Portal' : 'Finance Portal'}
          </span>
          <button onClick={handleLogout} className="p-2 text-red-600 bg-red-50 rounded-lg">
            <LogOut size={18} />
          </button>
        </header>

        {children}
      </main>
    </div>
  );
}