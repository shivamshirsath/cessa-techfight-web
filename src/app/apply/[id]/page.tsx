// src/app/apply/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEventById, submitRegistration, getUserRegistrationForEvent } from '@/lib/events';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, ArrowLeft, IndianRupee, ShieldCheck, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ApplyPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [existingReg, setExistingReg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [utrNumber, setUtrNumber] = useState('');
  const [teamMembers, setTeamMembers] = useState<{name: string, phone: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Fetch Event & Existing Registration at the same time
      const [evRes, regRes] = await Promise.all([
        getEventById(eventId),
        getUserRegistrationForEvent(eventId, user.uid)
      ]);

      if (evRes.success && evRes.event) {
        const eventData = evRes.event as any;
        setEvent(eventData);
        
        // Initialize Team Array if it's a team event
        if (eventData.eventType === 'TEAM') {
          const size = parseInt(eventData.teamSize || '1', 10);
          const initialTeam = Array(size).fill({ name: '', phone: '' });
          initialTeam[0] = { name: user.displayName || '', phone: '' };
          setTeamMembers(initialTeam);
        }
      }

      // Check if they already applied
      if (regRes.success && regRes.registration) {
        setExistingReg(regRes.registration);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, router]);

  const handleTeamMemberChange = (index: number, field: 'name' | 'phone', value: string) => {
    const newTeam = [...teamMembers];
    newTeam[index] = { ...newTeam[index], [field]: value };
    setTeamMembers(newTeam);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const result = await submitRegistration(
      eventId, 
      currentUser.uid, 
      utrNumber, 
      event.eventType === 'TEAM' ? teamMembers : null
    );

    if (result.success) {
      // Temporarily update state to show the success screen instantly
      setExistingReg({ status: 'UNDER_REVIEW' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(result.error || "Failed to submit registration.");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-blue-600" /></div>;
  if (!event) return <div className="p-20 text-center text-red-600 font-bold">Event not found.</div>;

  // 🛑 BLOCK 1: ALREADY UNDER REVIEW
  if (existingReg?.status === 'UNDER_REVIEW') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100">
          <div className="h-24 w-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={48} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Application Under Review</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your UTR number for <strong>{event.title}</strong> is currently being verified by our Treasurer. You will be notified once it is approved.
          </p>
          <Link href="/" className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // 🛑 BLOCK 2: ALREADY ACCEPTED
  if (existingReg?.status === 'ACCEPTED') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100">
          <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Registration Accepted!</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Congratulations! Your payment for <strong>{event.title}</strong> was successfully verified. See you at the event!
          </p>
          <Link href="/" className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // ✅ BLOCK 3: ALLOW FORM (No existing reg, OR existing reg is REJECTED)
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Form</h1>
            <p className="text-gray-600 mt-1">Registering for: <span className="font-bold text-blue-600">{event.title}</span></p>
          </div>
        </div>

        {/* REJECTION BANNER */}
        {existingReg?.status === 'REJECTED' && (
          <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-4 shadow-sm">
            <AlertCircle className="text-red-500 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-red-800 font-bold text-lg">Previous Application Rejected</h3>
              <p className="text-red-700 mt-1">Your previous UTR/transaction was invalid or could not be verified by the Treasurer. Please double-check your payment and apply again.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-medium border border-red-100">{error}</div>}

          {/* SECTION 1: Dynamic Team Details */}
          {event.eventType === 'TEAM' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <Users className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Team Details (Max: {event.teamSize})</h2>
              </div>
              
              {teamMembers.map((member, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-700 mb-4">{index === 0 ? "Team Leader (You)" : `Team Member ${index + 1}`}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                      <input type="text" required value={member.name} onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" placeholder={`Member ${index + 1} Name`} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                      <input type="text" required value={member.phone} onChange={(e) => handleTeamMemberChange(index, 'phone', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10-digit number" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 2: Payment Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
             <div className="flex items-center gap-3 border-b pb-4">
                <IndianRupee className="text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Payment Verification</h2>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <div className="shrink-0 text-center">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-2">Scan to Pay</p>
                  <img src={event.paymentQrUrl} alt="Payment QR" className="w-48 h-48 object-cover rounded-xl border-2 border-blue-200 shadow-sm mb-3" />
                  <p className="font-bold text-2xl text-gray-900">₹{event.registrationFee}</p>
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <p className="text-sm text-gray-500">UPI ID</p>
                    <p className="font-bold text-gray-900 text-lg">{event.upiId}</p>
                  </div>
                  {event.bankDetails && (
                    <div>
                      <p className="text-sm text-gray-500">Bank Details</p>
                      <p className="font-medium text-gray-800 whitespace-pre-wrap">{event.bankDetails}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-blue-200/50">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Enter UTR / Transaction Number</label>
                    <p className="text-xs text-gray-500 mb-2">After paying, enter the 12-digit UTR number from your receipt here.</p>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition font-mono uppercase tracking-widest text-lg" 
                      placeholder="e.g. 312345678901" 
                      value={utrNumber} 
                      onChange={(e) => setUtrNumber(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex justify-center items-center gap-2 shadow-lg shadow-green-200 disabled:opacity-70 text-lg">
            {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><ShieldCheck size={24} /> Submit Application</>}
          </button>
        </form>
      </div>
    </div>
  );
}