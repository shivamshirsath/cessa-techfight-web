// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getUserRegistrations } from '@/lib/events';
import { collection, getDocs } from 'firebase/firestore';
import { Loader2, ArrowLeft, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { RegistrationStatus } from '@/types';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'ALL' | RegistrationStatus>('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const regRes = await getUserRegistrations(user.uid);
        if (regRes.success && regRes.registrations) {
          setRegistrations(regRes.registrations);
        }

        const eventSnap = await getDocs(collection(db, 'events'));
        const eMap: Record<string, any> = {};
        eventSnap.forEach(doc => { eMap[doc.id] = doc.data(); });
        setEventsMap(eMap);

      } catch (error: any) {
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="p-10 text-center flex flex-col items-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-3" /><p className="text-gray-500 text-sm">Loading dashboard...</p></div>;
  if (errorMsg) return <div className="p-10 text-center text-red-600 text-sm">Error: {errorMsg}</div>;

  const filteredRegs = activeTab === 'ALL' 
    ? registrations 
    : registrations.filter(reg => reg?.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Compact Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
          <Link href="/" className="p-1.5 bg-white rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-500 text-xs mt-0.5">Track your event registrations and UTR verifications.</p>
          </div>
        </div>

        {/* Compact Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('ALL')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            All ({registrations.length})
          </button>
          <button onClick={() => setActiveTab('ACCEPTED')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'ACCEPTED' ? 'bg-green-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Accepted
          </button>
          <button onClick={() => setActiveTab('UNDER_REVIEW')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'UNDER_REVIEW' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Under Review
          </button>
          <button onClick={() => setActiveTab('REJECTED')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'REJECTED' ? 'bg-red-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Rejected
          </button>
        </div>

        {/* Compact List */}
        {filteredRegs.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <h3 className="text-base font-semibold text-gray-800 mb-1">No applications found</h3>
            <p className="text-gray-500 text-sm mb-4">You haven't applied for any events in this category.</p>
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition inline-block">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRegs.map((reg) => {
              const event = eventsMap[reg.eventId];
              
              if (!event) return null;

              return (
                <div key={reg.id} className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4 items-start hover:border-blue-300 transition">
                  {/* Smaller, square image */}
                  <img src={event.posterUrl} alt={event.title} className="w-20 h-20 object-cover rounded border border-gray-100 shrink-0" />
                  
                  {/* Dense Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-base font-bold text-gray-900 truncate">{event.title}</h2>
                      {reg.status === 'ACCEPTED' && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide"><CheckCircle2 size={10}/> Accepted</span>}
                      {reg.status === 'UNDER_REVIEW' && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide"><Clock size={10}/> Reviewing</span>}
                      {reg.status === 'REJECTED' && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide"><XCircle size={10}/> Rejected</span>}
                    </div>
                    
                    <p className="text-[11px] text-gray-500 mb-2">Applied: {new Date(reg.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    
                    <div className="bg-gray-50 px-2 py-1.5 rounded border border-gray-200 inline-block max-w-full">
                      <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 tracking-wider">UTR Number</p>
                      <p className="font-mono text-xs text-gray-800 tracking-wider truncate">{reg.utrNumber}</p>
                    </div>

                    {/* Compact Re-apply Button */}
                    {reg.status === 'REJECTED' && (
                      <div className="mt-3">
                        <Link href={`/apply/${reg.eventId}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-200 hover:bg-red-600 hover:text-white transition">
                          Re-apply <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}