// src/app/coordinator/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Users, CheckCircle2, Clock, XCircle, LogOut } from 'lucide-react';
import { logoutUser } from '@/lib/auth';

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [eventData, setEventData] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACCEPTED' | 'UNDER_REVIEW' | 'REJECTED'>('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');

      try {
        // 1. Get Coordinator's assigned Event ID
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userData?.role !== 'COORDINATOR' || !userData?.assignedEventId) {
          throw new Error("You are not assigned to any event. Contact the Admin.");
        }

        const eventId = userData.assignedEventId;

        // 2. Fetch the Event Details
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) throw new Error("Assigned event no longer exists.");
        setEventData({ id: eventDoc.id, ...eventDoc.data() });

        // 3. Fetch All Registrations for THIS specific event
        const q = query(collection(db, 'registrations'), where("eventId", "==", eventId));
        const regSnap = await getDocs(q);
        const regs = regSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRegistrations(regs.sort((a: any, b: any) => b.submittedAt - a.submittedAt));

        // 4. Fetch all Users to get their Names and Emails
        const userSnap = await getDocs(collection(db, 'users'));
        const uMap: Record<string, any> = {};
        userSnap.forEach(doc => { uMap[doc.id] = doc.data(); });
        setUsersMap(uMap);

      } catch (error: any) {
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  if (loading) return <div className="p-10 text-center flex flex-col items-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-3" /><p className="text-gray-500 text-sm">Loading Coordinator Space...</p></div>;
  if (errorMsg) return <div className="p-10 text-center text-red-600 text-sm font-bold bg-red-50 rounded-lg m-8 border border-red-200">{errorMsg}</div>;

  const filteredRegs = activeTab === 'ALL' ? registrations : registrations.filter(reg => reg.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Compact Header */}
        <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coordinator Portal</h1>
            <p className="text-gray-600 text-sm mt-1">Managing: <span className="font-bold text-blue-600">{eventData?.title}</span></p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium transition bg-red-50 px-4 py-2 rounded-lg border border-red-100">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Applied</p>
            <p className="text-2xl font-extrabold text-gray-900">{registrations.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
            <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Accepted</p>
            <p className="text-2xl font-extrabold text-green-600">{registrations.filter(r => r.status === 'ACCEPTED').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
            <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">Pending UTRs</p>
            <p className="text-2xl font-extrabold text-orange-600">{registrations.filter(r => r.status === 'UNDER_REVIEW').length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('ALL')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>
          <button onClick={() => setActiveTab('ACCEPTED')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'ACCEPTED' ? 'bg-green-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Accepted</button>
          <button onClick={() => setActiveTab('UNDER_REVIEW')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'UNDER_REVIEW' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Under Review</button>
          <button onClick={() => setActiveTab('REJECTED')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'REJECTED' ? 'bg-red-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Rejected</button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Registered By</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Team Details</th>
                  <th className="p-4 font-semibold text-right">Date Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegs.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-sm text-gray-500">No participants found in this category.</td></tr>
                ) : (
                  filteredRegs.map((reg) => {
                    const user = usersMap[reg.userId] || { fullName: 'Unknown', email: 'N/A' };
                    return (
                      <tr key={reg.id} className="hover:bg-gray-50/50 transition">
                        {/* 1. Account Info */}
                        <td className="p-4">
                          <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>

                        {/* 2. Status Badge */}
                        <td className="p-4">
                          {reg.status === 'ACCEPTED' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 w-max"><CheckCircle2 size={12}/> ACCEPTED</span>}
                          {reg.status === 'UNDER_REVIEW' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 w-max"><Clock size={12}/> REVIEWING</span>}
                          {reg.status === 'REJECTED' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 w-max"><XCircle size={12}/> REJECTED</span>}
                        </td>

                        {/* 3. Team Details (If applicable) */}
                        <td className="p-4">
                          {reg.teamDetails && reg.teamDetails.length > 0 ? (
                            <div className="space-y-1">
                              {reg.teamDetails.map((member: any, i: number) => (
                                <div key={i} className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block mr-1 mb-1">
                                  <span className="font-semibold text-gray-700">{member.name}</span> <span className="text-gray-400">({member.phone})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Solo Registration</span>
                          )}
                        </td>

                        {/* 4. Date */}
                        <td className="p-4 text-right text-xs text-gray-600 font-medium">
                          {new Date(reg.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}