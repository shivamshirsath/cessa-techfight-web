// src/app/admin/events/[id]/participants/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, CheckCircle2, Clock, XCircle, Users } from 'lucide-react';
import Link from 'next/link';

export default function ParticipantsPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [eventData, setEventData] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACCEPTED' | 'UNDER_REVIEW' | 'REJECTED'>('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchParticipantsData = async () => {
      try {
        // 1. Fetch the Event Details
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) throw new Error("Event not found.");
        setEventData({ id: eventDoc.id, ...eventDoc.data() });

        // 2. Fetch all Registrations for THIS event
        const q = query(collection(db, 'registrations'), where('eventId', '==', eventId));
        const snap = await getDocs(q);
        const regs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by newest first
        setRegistrations(regs.sort((a: any, b: any) => b.submittedAt - a.submittedAt));

        // 3. Fetch all Users to map IDs to Real Names
        const userSnap = await getDocs(collection(db, 'users'));
        const uMap: Record<string, any> = {};
        userSnap.forEach(doc => { uMap[doc.id] = doc.data(); });
        setUsersMap(uMap);

      } catch (error: any) {
        console.error("Error fetching participants:", error);
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipantsData();
  }, [eventId]);

  if (loading) return <div className="p-10 text-center flex flex-col items-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-3" /><p className="text-gray-500 text-sm">Loading participants list...</p></div>;
  if (errorMsg) return <div className="p-10 text-center text-red-600 font-bold">{errorMsg}</div>;

  const filteredRegs = activeTab === 'ALL' ? registrations : registrations.filter(reg => reg.status === activeTab);

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      {/* 🚀 Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/events" className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" /> Participants List
          </h1>
          <p className="text-gray-600 text-sm mt-1">Viewing registrations for: <span className="font-bold text-blue-600">{eventData?.title}</span></p>
        </div>
      </div>

      {/* 📊 Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Applied</p>
          <p className="text-3xl font-extrabold text-gray-900">{registrations.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm">
          <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Accepted</p>
          <p className="text-3xl font-extrabold text-green-600">{registrations.filter(r => r.status === 'ACCEPTED').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-orange-200 shadow-sm">
          <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">Pending Review</p>
          <p className="text-3xl font-extrabold text-orange-600">{registrations.filter(r => r.status === 'UNDER_REVIEW').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm">
          <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Rejected</p>
          <p className="text-3xl font-extrabold text-red-600">{registrations.filter(r => r.status === 'REJECTED').length}</p>
        </div>
      </div>

      {/* 📑 Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>
        <button onClick={() => setActiveTab('ACCEPTED')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'ACCEPTED' ? 'bg-green-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Accepted</button>
        <button onClick={() => setActiveTab('UNDER_REVIEW')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'UNDER_REVIEW' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Under Review</button>
        <button onClick={() => setActiveTab('REJECTED')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'REJECTED' ? 'bg-red-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Rejected</button>
      </div>

      {/* 📋 Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-semibold">Registered By</th>
                <th className="p-4 font-semibold">Payment Status</th>
                <th className="p-4 font-semibold">Team Details</th>
                <th className="p-4 font-semibold text-right">Date Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRegs.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-sm text-gray-500 font-medium">No participants found in this category.</td></tr>
              ) : (
                filteredRegs.map((reg) => {
                  const user = usersMap[reg.userId] || { fullName: 'Unknown User', email: 'N/A' };
                  return (
                    <tr key={reg.id} className="hover:bg-gray-50/50 transition">
                      {/* 1. Account Info */}
                      <td className="p-4">
                        <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </td>

                      {/* 2. Status & UTR */}
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-1">
                          {reg.status === 'ACCEPTED' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1"><CheckCircle2 size={12}/> ACCEPTED</span>}
                          {reg.status === 'UNDER_REVIEW' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1"><Clock size={12}/> REVIEWING</span>}
                          {reg.status === 'REJECTED' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1"><XCircle size={12}/> REJECTED</span>}
                          <span className="text-[10px] text-gray-400 font-mono mt-1">UTR: {reg.utrNumber}</span>
                        </div>
                      </td>

                      {/* 3. Team Details */}
                      <td className="p-4">
                        {reg.teamDetails && reg.teamDetails.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {reg.teamDetails.map((member: any, i: number) => (
                              <div key={i} className="text-[11px] bg-gray-50 px-2 py-1 rounded border border-gray-200 whitespace-nowrap">
                                <span className="font-semibold text-gray-700">{member.name}</span> <span className="text-gray-400">({member.phone})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-gray-100">Solo Participant</span>
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
  );
}