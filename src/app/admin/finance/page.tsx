// src/app/admin/finance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAllRegistrations, updateRegistrationStatus } from '@/lib/finance';
import { RegistrationStatus, UserProfile, Event } from '@/types';
import { Loader2, CheckCircle, XCircle, Clock, Search, IndianRupee, ShieldCheck } from 'lucide-react';

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [events, setEvents] = useState<Record<string, Event>>({});
  
  const [activeTab, setActiveTab] = useState<RegistrationStatus>('UNDER_REVIEW');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Fetch Users & Events to map IDs to actual Names
        const [userSnap, eventSnap, regRes] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'events')),
          getAllRegistrations()
        ]);

        const userMap: Record<string, UserProfile> = {};
        userSnap.forEach(doc => { userMap[doc.id] = doc.data() as UserProfile; });
        setUsers(userMap);

        const eventMap: Record<string, Event> = {};
        eventSnap.forEach(doc => { eventMap[doc.id] = doc.data() as Event; });
        setEvents(eventMap);

        if (regRes.success && regRes.registrations) {
          // Sort newest first
          const sorted = regRes.registrations.sort((a, b) => b.submittedAt - a.submittedAt);
          setRegistrations(sorted);
        }
      } catch (error) {
        console.error("Error fetching finance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

const handleStatusUpdate = async (regId: string, newStatus: RegistrationStatus) => {
    if (newStatus === 'REJECTED') {
      const confirm = window.confirm("Are you sure you want to REJECT this payment? The student will be notified via email.");
      if (!confirm) return;
    } else if (newStatus === 'ACCEPTED') {
      const confirm = window.confirm("Approve this payment? An official receipt will be emailed to the student.");
      if (!confirm) return;
    }

    setProcessingId(regId);
    
    // 1. Update Firestore Status
    const res = await updateRegistrationStatus(regId, newStatus);
    
    if (res.success) {
      // 2. Update UI instantly
      setRegistrations(prev => prev.map(reg => reg.id === regId ? { ...reg, status: newStatus } : reg));

      // 3. 📧 Trigger "Accepted" or "Rejected" Email
      const regToEmail = registrations.find(r => r.id === regId);
      if (regToEmail) {
        const userToEmail = users[regToEmail.userId];
        const eventToEmail = events[regToEmail.eventId];
        
        if (userToEmail && eventToEmail) {
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: newStatus, // 'ACCEPTED' or 'REJECTED'
              email: userToEmail.email,
              name: userToEmail.fullName,
              eventName: eventToEmail.title,
              utr: regToEmail.utrNumber,
              amount: eventToEmail.registrationFee
            })
          }).catch(err => console.error("Failed to trigger email API", err));
        }
      }
    } else {
      alert("Failed to update status in database.");
    }
    setProcessingId(null);
  };

  // Filter registrations based on active tab
  const filteredRegs = registrations.filter(reg => reg.status === activeTab);

  // Calculate Stats
  const pendingCount = registrations.filter(r => r.status === 'UNDER_REVIEW').length;
  const approvedCount = registrations.filter(r => r.status === 'ACCEPTED').length;
  const totalRevenue = registrations
    .filter(r => r.status === 'ACCEPTED')
    .reduce((sum, reg) => sum + (events[reg.eventId]?.registrationFee || 0), 0);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-blue-600" /></div>;

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Treasurer Tools</h1>
        <p className="text-gray-600 mt-1">Verify UTR numbers and manage event revenue.</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-xl"><Clock size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Pending Verifications</p>
            <p className="text-3xl font-extrabold text-gray-900">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-xl"><ShieldCheck size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Approved Registrations</p>
            <p className="text-3xl font-extrabold text-gray-900">{approvedCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl"><IndianRupee size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Total Collected</p>
            <p className="text-3xl font-extrabold text-gray-900">₹{totalRevenue}</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button onClick={() => setActiveTab('UNDER_REVIEW')} className={`pb-3 px-4 font-bold text-sm transition ${activeTab === 'UNDER_REVIEW' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Pending Review ({pendingCount})
        </button>
        <button onClick={() => setActiveTab('ACCEPTED')} className={`pb-3 px-4 font-bold text-sm transition ${activeTab === 'ACCEPTED' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Approved
        </button>
        <button onClick={() => setActiveTab('REJECTED')} className={`pb-3 px-4 font-bold text-sm transition ${activeTab === 'REJECTED' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Rejected
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredRegs.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No registrations found in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Participant</th>
                  <th className="p-4 font-semibold">Event Details</th>
                  <th className="p-4 font-semibold">UTR / Transaction No.</th>
                  <th className="p-4 font-semibold">Date Submitted</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegs.map((reg) => {
                  const user = users[reg.userId];
                  const event = events[reg.eventId];

                  return (
                    <tr key={reg.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{user?.fullName || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{event?.title || 'Unknown Event'}</p>
                        <p className="text-sm text-blue-600 font-semibold">Fee: ₹{event?.registrationFee || 0}</p>
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md font-mono text-sm border border-gray-200 shadow-inner">
                          {reg.utrNumber}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-medium">
                        {new Date(reg.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        {activeTab === 'UNDER_REVIEW' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleStatusUpdate(reg.id, 'ACCEPTED')}
                              disabled={processingId === reg.id}
                              className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition border border-green-200 disabled:opacity-50"
                              title="Approve Payment"
                            >
                              {processingId === reg.id ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(reg.id, 'REJECTED')}
                              disabled={processingId === reg.id}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition border border-red-200 disabled:opacity-50"
                              title="Reject Payment"
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeTab === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {activeTab}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}