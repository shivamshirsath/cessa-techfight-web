// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getUserRegistrations } from '@/lib/events';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Loader2, ArrowLeft, CheckCircle2, Clock, XCircle, ArrowRight, CalendarDays, Ticket, Download } from 'lucide-react';
import Link from 'next/link';
import { RegistrationStatus, UserProfile } from '@/types';
import jsPDF from 'jspdf'; // Import the PDF library

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, any>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | RegistrationStatus>('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // 1. Fetch User Profile (Needed for the name on the receipt)
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }

        // 2. Fetch User Registrations
        const regRes = await getUserRegistrations(user.uid);
        if (regRes.success && regRes.registrations) {
          setRegistrations(regRes.registrations);
        }

        // 3. Fetch Events
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

  // ==========================================
  // PDF GENERATION LOGIC
  // ==========================================
  const generateReceipt = (reg: any, event: any) => {
    const pdf = new jsPDF();
    const userName = userProfile?.fullName || 'Participant';
    const userEmail = userProfile?.email || '';
    const dateStr = new Date(reg.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const receiptNo = `TF26-${reg.id.substring(0, 8).toUpperCase()}`;

    // Brand Colors
    const primaryColor: [number, number, number] = [158, 27, 66]; // #9E1B42
    
    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(...primaryColor);
    pdf.text("SANDIP INSTITUTE OF ENGINEERING AND MANAGEMENT", 105, 25, { align: "center" });
    
    pdf.setFontSize(14);
    pdf.setTextColor(50, 50, 50);
    pdf.text("CESA - TechFight 2026", 105, 33, { align: "center" });

    // Title & Line
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(...primaryColor);
    pdf.rect(20, 45, 170, 10, 'F');
    pdf.text("OFFICIAL PAYMENT RECEIPT", 105, 52, { align: "center" });

    // Meta Info
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text("Receipt No:", 25, 70);
    pdf.setFont("helvetica", "normal");
    pdf.text(receiptNo, 55, 70);
    
    pdf.setFont("helvetica", "bold");
    pdf.text("Date:", 140, 70);
    pdf.setFont("helvetica", "normal");
    pdf.text(dateStr, 152, 70);

    // Box for Details
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(250, 250, 250);
    pdf.roundedRect(20, 80, 170, 80, 3, 3, 'FD');

    // Participant Details
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Participant Information", 25, 90);
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Name:", 25, 100);
    pdf.setFont("helvetica", "normal");
    pdf.text(userName, 65, 100);
    
    pdf.setFont("helvetica", "bold");
    pdf.text("Email:", 25, 108);
    pdf.setFont("helvetica", "normal");
    pdf.text(userEmail, 65, 108);

    // Event Details
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Registration Details", 25, 122);
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Event Name:", 25, 132);
    pdf.setFont("helvetica", "normal");
    pdf.text(event.title, 65, 132);
    
    pdf.setFont("helvetica", "bold");
    pdf.text("Transaction UTR:", 25, 140);
    pdf.setFont("helvetica", "normal");
    pdf.text(reg.utrNumber, 65, 140);

    pdf.setFont("helvetica", "bold");
    pdf.text("Amount Paid:", 25, 148);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(22, 163, 74); // Green color for amount
    pdf.text(`INR ${event.registrationFee}.00`, 65, 148);

    // Status Stamp
    pdf.setTextColor(22, 163, 74);
    pdf.setFontSize(16);
    pdf.text("VERIFIED & ACCEPTED", 105, 180, { align: "center" });

    // Footer
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("This is a computer-generated receipt and does not require a physical signature.", 105, 270, { align: "center" });
    pdf.text("For any queries, please contact the CESA organizing committee.", 105, 275, { align: "center" });

    // Trigger Download
    pdf.save(`TechFight26_Receipt_${event.title.replace(/\s+/g, '_')}.pdf`);
  };
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#9E1B42] mb-4" />
        <p className="text-gray-500 font-medium uppercase tracking-widest text-sm">Loading Dashboard...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-md text-center shadow-sm">
          <XCircle className="h-10 w-10 mx-auto mb-3 text-red-500" />
          <h3 className="font-bold text-lg mb-1">Something went wrong</h3>
          <p className="text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const filteredRegs = activeTab === 'ALL' 
    ? registrations 
    : registrations.filter(reg => reg?.status === activeTab);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* 🌟 Premium Header Area */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2.5 bg-gray-50 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">My Applications</h1>
              <p className="text-gray-500 text-sm mt-1 font-medium">Track your event registrations and payment statuses.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* 📱 Modern iOS-Style Segmented Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar mb-8 pb-2">
          <div className="flex bg-gray-200/50 p-1.5 rounded-2xl gap-1 border border-gray-200/50 w-max">
            {[
              { id: 'ALL', label: `All (${registrations.length})` },
              { id: 'ACCEPTED', label: 'Accepted' },
              { id: 'UNDER_REVIEW', label: 'Under Review' },
              { id: 'REJECTED', label: 'Rejected' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-white text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.06)]' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 Application Cards */}
        {filteredRegs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center max-w-2xl mx-auto mt-12">
            <div className="h-20 w-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
              <Ticket size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500 mb-8 max-w-sm">
              {activeTab === 'ALL' 
                ? "You haven't applied for any events yet. Discover amazing competitions and register today!" 
                : `You don't have any ${activeTab.toLowerCase().replace('_', ' ')} applications at the moment.`}
            </p>
            <Link 
              href="/#events" 
              className="px-8 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-[#9E1B42] transition-colors shadow-lg shadow-gray-200"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRegs.map((reg) => {
              const event = eventsMap[reg.eventId];
              if (!event) return null;

              return (
                <div 
                  key={reg.id} 
                  className="group bg-white rounded-3xl border border-gray-100 p-5 flex flex-col sm:flex-row gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-300"
                >
                  {/* Poster Image - Full width on mobile, square on desktop */}
                  <div className="w-full sm:w-32 h-48 sm:h-32 shrink-0 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                    <img 
                      src={event.posterUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h2 className="text-lg font-bold text-gray-900 truncate tracking-tight">{event.title}</h2>
                      
                      {/* Status Badges */}
                      <div className="shrink-0">
                        {reg.status === 'ACCEPTED' && (
                          <span className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 size={14}/> Accepted
                          </span>
                        )}
                        {reg.status === 'UNDER_REVIEW' && (
                          <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            <Clock size={14}/> Reviewing
                          </span>
                        )}
                        {reg.status === 'REJECTED' && (
                          <span className="bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            <XCircle size={14}/> Rejected
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-medium">
                      <CalendarDays size={16} className="text-gray-400" />
                      Applied on {new Date(reg.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    
                    {/* Actions / UTR Receipt Block */}
                    <div className="mt-auto bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">Transaction UTR</p>
                        <p className="font-mono text-sm font-bold text-gray-700 tracking-wider truncate max-w-[150px] sm:max-w-[180px]">
                          {reg.utrNumber}
                        </p>
                      </div>

                      {/* Download Receipt Action */}
                      {reg.status === 'ACCEPTED' && (
                        <button 
                          onClick={() => generateReceipt(reg, event)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white text-[#9E1B42] border border-[#9E1B42]/30 text-xs font-bold rounded-lg hover:bg-[#9E1B42] hover:text-white transition-colors shadow-sm"
                        >
                          <Download size={14} /> Receipt
                        </button>
                      )}

                      {/* Re-apply Action (Only visible if rejected) */}
                      {reg.status === 'REJECTED' && (
                        <Link 
                          href={`/apply/${reg.eventId}`} 
                          className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition shadow-md shadow-red-200"
                        >
                          Re-apply <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global style to hide scrollbar for the tabs on mobile but keep functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}