// src/app/apply/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEventById, submitRegistration, getUserRegistrationForEvent } from '@/lib/events';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, ArrowLeft, IndianRupee, ShieldCheck, Users, Clock, CheckCircle2, AlertCircle, Info, ScanLine, User, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
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
  const [collegeName, setCollegeName] = useState(''); // NEW STATE
  const [utrNumber, setUtrNumber] = useState('');
  const [teamMembers, setTeamMembers] = useState<{name: string, phone: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // UI State for Description
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

    // 🔥 Passed collegeName as the 5th argument!
    const result = await submitRegistration(
      eventId, 
      currentUser.uid, 
      utrNumber, 
      event.eventType === 'TEAM' ? teamMembers : null,
      collegeName
    );

    if (result.success) {
      // 📧 Trigger "Under Review" Email silently in the background
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SUBMITTED',
          email: currentUser.email,
          name: currentUser.displayName || 'Participant',
          eventName: event.title,
          utr: utrNumber,
          amount: event.registrationFee,
          college: collegeName // Passed to email if needed
        })
      }).catch(err => console.error("Failed to trigger email API", err));

      // Update UI instantly
      setExistingReg({ status: 'UNDER_REVIEW' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(result.error || "Failed to submit registration.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin h-10 w-10 text-[#9E1B42] mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Preparing Form...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 max-w-md text-center shadow-sm">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="font-bold text-xl mb-2">Event Not Found</h3>
          <p className="text-sm mb-6">The event you are trying to register for does not exist or has been removed.</p>
          <Link href="/" className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition">Go Back Home</Link>
        </div>
      </div>
    );
  }

  // 🛑 BLOCK 1: ALREADY UNDER REVIEW
  if (existingReg?.status === 'UNDER_REVIEW') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-lg w-full text-center border border-gray-100">
          <div className="h-24 w-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-orange-100">
            <Clock size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Application Under Review</h1>
          <p className="text-gray-500 mb-8 leading-relaxed font-medium">
            Your UTR number for <strong className="text-gray-900">{event.title}</strong> is currently being verified by our Treasurer. You will be notified once it is approved.
          </p>
          <Link href="/dashboard" className="w-full block px-6 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg shadow-gray-200">
            Go to My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 🛑 BLOCK 2: ALREADY ACCEPTED
  if (existingReg?.status === 'ACCEPTED') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-lg w-full text-center border border-gray-100">
          <div className="h-24 w-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-100">
            <CheckCircle2 size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Registration Confirmed!</h1>
          <p className="text-gray-500 mb-8 leading-relaxed font-medium">
            Congratulations! Your payment for <strong className="text-gray-900">{event.title}</strong> was successfully verified. See you at the event!
          </p>
          <Link href="/dashboard" className="w-full block px-6 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg shadow-gray-200">
            View Application details
          </Link>
        </div>
      </div>
    );
  }

  // ✅ BLOCK 3: ALLOW FORM (No existing reg, OR existing reg is REJECTED)
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* 🌟 Premium Header Area */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2.5 bg-gray-50 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Event Registration</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">Complete the form below to secure your spot.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* REJECTION BANNER */}
        {existingReg?.status === 'REJECTED' && (
          <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 shadow-sm">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="text-red-800 font-bold text-lg">Previous Application Rejected</h3>
              <p className="text-red-700/80 mt-1 text-sm font-medium">Your previous UTR/transaction was invalid or could not be verified by the Treasurer. Please double-check your payment details and apply again.</p>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* EVENT DETAILS SUMMARY CARD */}
        {/* ========================================= */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-8 flex flex-col md:flex-row">
          <div className="w-full md:w-2/5 h-64 md:h-auto bg-gray-100 relative">
            <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/60"></div>
          </div>
          
          <div className="p-8 md:w-3/5 flex flex-col justify-center bg-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-[#FFF6F8] text-[#9E1B42] border border-[#9E1B42]/20 rounded-full text-xs font-black uppercase tracking-widest">
                {event.eventType === 'TEAM' ? `Team Event (${event.teamSize} Max)` : 'Solo Event'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">{event.title}</h2>
            
            {/* Description with Expand/Collapse Toggle */}
            <div className="mb-6">
              <p className={`text-gray-500 text-sm leading-relaxed font-medium whitespace-pre-wrap transition-all duration-300 ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                {event.description}
              </p>
              
              {/* Only show toggle if description is reasonably long */}
              {event.description && event.description.length > 100 && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-3 inline-flex items-center gap-1.5 text-[#9E1B42] text-xs font-black uppercase tracking-widest hover:text-[#801433] transition-colors bg-[#FFF6F8] px-3 py-1.5 rounded-lg border border-[#9E1B42]/10"
                >
                  {isDescriptionExpanded ? (
                    <>Read Less <ChevronUp size={14} strokeWidth={3} /></>
                  ) : (
                    <>Read Full Details <ChevronDown size={14} strokeWidth={3} /></>
                  )}
                </button>
              )}
            </div>
            
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Registration Fee</p>
                <p className="text-3xl font-black text-gray-900 flex items-center tracking-tight">
                  <IndianRupee size={24} strokeWidth={2.5} className="mr-0.5 text-gray-400" /> {event.registrationFee}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl font-medium border border-red-100 flex items-center gap-3">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {/* ========================================= */}
          {/* COLLEGE DETAILS SECTION (FOR BOTH) */}
          {/* ========================================= */}
          <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <GraduationCap size={24} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Institute Details</h2>
                <p className="text-sm text-gray-500 font-medium">Which college are you representing?</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">College / Institute Name</label>
              <input 
                type="text" required 
                value={collegeName} 
                onChange={(e) => setCollegeName(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition bg-white text-gray-900 font-medium" 
                placeholder="e.g. Sandip Institute of Engineering and Management" 
              />
            </div>
          </div>

          {/* ========================================= */}
          {/* TEAM DETAILS SECTION */}
          {/* ========================================= */}
          {event.eventType === 'TEAM' && (
            <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Users size={24} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Team Details</h2>
                  <p className="text-sm text-gray-500 font-medium">Enter information for all {event.teamSize} members.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-200 transition-colors focus-within:border-blue-300 focus-within:bg-blue-50/10">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <User size={16} className={index === 0 ? "text-blue-500" : "text-gray-400"} />
                      {index === 0 ? "Team Leader (You)" : `Team Member ${index + 1}`}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        <input 
                          type="text" required 
                          value={member.name} 
                          onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition bg-white text-gray-900 font-medium" 
                          placeholder="John Doe" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                        <input 
                          type="text" required 
                          value={member.phone} 
                          onChange={(e) => handleTeamMemberChange(index, 'phone', e.target.value)} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition bg-white text-gray-900 font-medium" 
                          placeholder="10-digit mobile number" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* SECURE PAYMENT SECTION */}
          {/* ========================================= */}
          <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-8 overflow-hidden relative">
             {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Secure Payment Verification</h2>
                <p className="text-sm text-gray-500 font-medium">Scan the QR code and enter your transaction details.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
              {/* QR Code Column */}
              <div className="shrink-0 flex flex-col items-center p-6 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm w-full md:w-auto">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                  <ScanLine size={18} /> Scan to Pay
                </div>
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
                  <img src={event.paymentQrUrl} alt="Payment QR" className="w-48 h-48 object-cover rounded-lg" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Amount to Pay</p>
                  <p className="font-black text-3xl text-gray-900">₹{event.registrationFee}</p>
                </div>
              </div>
              
              {/* Details & Input Column */}
              <div className="flex-1 space-y-6 w-full pt-2">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Official UPI ID</p>
                    <p className="font-mono text-lg font-bold text-slate-900 select-all">{event.upiId}</p>
                  </div>
                  {event.bankDetails && (
                    <div className="pt-4 border-t border-slate-200/60">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Bank Details (Alternative)</p>
                      <p className="font-medium text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">{event.bankDetails}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Transaction UTR Number</label>
                  <p className="text-xs text-gray-500 font-medium mb-3 flex items-start gap-1.5">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    Enter the 12-digit UTR/Reference number from your payment app receipt.
                  </p>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-mono font-bold">#</span>
                    </div>
                    <input 
                      type="text" required 
                      className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition font-mono uppercase tracking-[0.2em] text-lg text-gray-900 font-bold bg-white" 
                      placeholder="e.g. 312345678901" 
                      value={utrNumber} 
                      onChange={(e) => setUtrNumber(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full py-5 bg-[#9E1B42] text-white font-black rounded-2xl hover:bg-[#801433] transition-all duration-300 flex justify-center items-center gap-2 shadow-[0_8px_25px_rgba(158,27,66,0.25)] hover:shadow-[0_12px_35px_rgba(158,27,66,0.35)] hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none text-lg uppercase tracking-wider"
          >
            {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><ShieldCheck size={24} /> Submit Application</>}
          </button>
          <p className="text-center text-xs text-gray-400 font-medium mt-4">
            By submitting, you confirm that the transaction details are accurate. Fake UTRs will lead to rejection.
          </p>
        </form>
      </div>
    </div>
  );
}