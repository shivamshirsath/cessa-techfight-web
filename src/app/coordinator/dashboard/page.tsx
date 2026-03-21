// src/app/coordinator/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Users, CheckCircle2, Clock, XCircle, LogOut, LayoutDashboard, FileText, IndianRupee, GraduationCap } from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const filteredRegs = activeTab === 'ALL' ? registrations : registrations.filter(reg => reg.status === activeTab);

  // ==========================================
  // LANDSCAPE B&W PRINT-OPTIMIZED PDF WITH AMOUNTS & COLLEGE
  // ==========================================
  const generatePDFReport = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4'); 
    
    // Header text (Pure Black for B&W printing)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(`Sandip Institute Of Engineering and Management, CESA : TechFight 2026 - ${eventData.title}`, 14, 15);
    
    // Subheader (Dark Gray)
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80); 
    
    const reportType = activeTab === 'ALL' ? 'Blank Evaluation Sheet' : `${activeTab.replace('_', ' ')} Participants`;
    doc.text(`Report: ${reportType} | Date: ${new Date().toLocaleDateString()}`, 14, 21);

    // Setup Table Data (Added College Column)
    const tableColumns = ["Participant", "College Name", "UTR No", "Amount", "Status", "Team Details", "Rank", "Cert.", "Sign"];
    const tableRows: any[] = [];

    let totalCalculatedAmount = 0;
    const eventFee = Number(eventData.registrationFee) || 0;

    if (activeTab === 'ALL') {
      // Create 25 blank rows for the physical evaluation sheet
      for (let i = 0; i < 25; i++) {
        tableRows.push(["", "", "", "", "", "", "", "", ""]);
      }
    } else {
      // Populate with actual data
      filteredRegs.forEach(reg => {
        const user = usersMap[reg.userId] || { fullName: 'Unknown', email: '' };
        const participantCell = [user.fullName, user.email];
        
        let teamCell: any = 'Solo';
        if (reg.teamDetails && reg.teamDetails.length > 0) {
          teamCell = reg.teamDetails.map((m: any) => `${m.name} (${m.phone})`);
        }

        let displayStatus = '';
        if (reg.status === 'ACCEPTED') displayStatus = 'Accepted';
        else if (reg.status === 'UNDER_REVIEW') displayStatus = 'Under Review';
        else if (reg.status === 'REJECTED') displayStatus = 'Rejected';

        // Add to total
        totalCalculatedAmount += eventFee;

        tableRows.push([
          participantCell,
          reg.college || 'N/A', // College Column
          reg.utrNumber || 'N/A',
          `Rs. ${eventFee}`, // Amount Column
          displayStatus,
          teamCell,
          "", // Blank for Rank
          "", // Blank for Certificate
          ""  // Blank for Sign
        ]);
      });
    }

    // Generate the autoTable with adjusted widths to fit the extra column
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 26,
      theme: 'grid',
      headStyles: { 
        fillColor: [230, 230, 230], // Light Gray
        textColor: [0, 0, 0],       // Pure Black text
        lineColor: [0, 0, 0],       // Solid Black borders
        lineWidth: 0.2,             
        fontStyle: 'bold', 
        fontSize: 8, 
        halign: 'center' 
      }, 
      bodyStyles: { 
        textColor: [0, 0, 0],       
        lineColor: [0, 0, 0],       
        lineWidth: 0.1,             
        fontSize: 8, 
        valign: 'middle', 
        minCellHeight: activeTab === 'ALL' ? 8 : 10 
      },
      columnStyles: {
        0: { cellWidth: 38 }, // Participant Info
        1: { cellWidth: 42 }, // College Name (wider to accommodate long names)
        2: { cellWidth: 25, fontStyle: 'bold', halign: 'center' }, // UTR
        3: { cellWidth: 18, fontStyle: 'bold', halign: 'center' }, // Amount
        4: { cellWidth: 20, fontStyle: 'bold', halign: 'center' }, // Status
        5: { cellWidth: 62 }, // Team Details
        6: { cellWidth: 12 }, // Rank
        7: { cellWidth: 15 }, // Certificate
        8: { cellWidth: 22 }, // Sign
      },
      styles: { cellPadding: 2, overflow: 'linebreak' },
    });

    // Add Total Amount at the bottom of the PDF if we are viewing data
    if (activeTab !== 'ALL' && filteredRegs.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Black
      doc.text(`Total Amount Collected (${activeTab}): Rs. ${totalCalculatedAmount}`, 14, finalY);
    }

    const fileName = activeTab === 'ALL' 
      ? `${eventData.title.replace(/\s+/g, '_')}_Blank_Evaluation_Sheet.pdf`
      : `${eventData.title.replace(/\s+/g, '_')}_${activeTab}_Report.pdf`;
      
    doc.save(fileName);
  };
  // ==========================================

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-4" />
      <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Loading Coordinator Space...</p>
    </div>
  );

  if (errorMsg) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 max-w-md text-center shadow-sm">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="font-bold text-xl mb-2">Access Denied</h3>
        <p className="text-sm mb-6">{errorMsg}</p>
        <button onClick={handleLogout} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition">Return to Login</button>
      </div>
    </div>
  );

  // Calculate Totals for Web UI
  const eventFee = Number(eventData?.registrationFee) || 0;
  const currentTotalAmount = filteredRegs.length * eventFee;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* 🌟 Premium Header Area */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Coordinator Portal</h1>
                <p className="text-gray-500 text-sm mt-0.5 font-medium">Managing: <span className="font-bold text-blue-600">{eventData?.title}</span></p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 font-bold transition px-4 py-2.5 rounded-xl border border-red-100 bg-white shadow-sm w-fit">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* 📊 Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Applied</p>
            <p className="text-3xl font-black text-gray-900">{registrations.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-2 bg-green-500"></div>
            <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Accepted</p>
            <p className="text-3xl font-black text-gray-900">{registrations.filter(r => r.status === 'ACCEPTED').length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-2 bg-orange-400"></div>
            <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">Pending UTRs</p>
            <p className="text-3xl font-black text-gray-900">{registrations.filter(r => r.status === 'UNDER_REVIEW').length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
             <div className="absolute right-0 top-0 h-full w-2 bg-red-500"></div>
            <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Rejected</p>
            <p className="text-3xl font-black text-gray-900">{registrations.filter(r => r.status === 'REJECTED').length}</p>
          </div>
        </div>

        {/* 📱 Controls Bar: Tabs & Export */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          {/* iOS-Style Segmented Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar w-full md:w-auto">
            <div className="flex bg-gray-200/50 p-1.5 rounded-2xl gap-1 border border-gray-200/50 w-max">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'ACCEPTED', label: 'Accepted' },
                { id: 'UNDER_REVIEW', label: 'Under Review' },
                { id: 'REJECTED', label: 'Rejected' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`px-5 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${
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

          {/* Export PDF Button */}
          <button 
            onClick={generatePDFReport}
            disabled={activeTab !== 'ALL' && filteredRegs.length === 0}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
          >
            <FileText size={16} /> 
            {activeTab === 'ALL' ? 'Download Blank Evaluation Sheet' : `Export ${activeTab.replace('_', ' ')} to PDF`}
          </button>
        </div>

        {/* Total Amount Summary Box */}
        {activeTab !== 'ALL' && filteredRegs.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-green-800 uppercase tracking-widest">Total {activeTab.replace('_', ' ')} Amount</p>
              <p className="text-sm text-green-700 font-medium">Calculated from {filteredRegs.length} entries</p>
            </div>
            <div className="text-2xl font-black text-green-700 flex items-center">
              <IndianRupee size={22} strokeWidth={2.5} className="mr-0.5"/> {currentTotalAmount}
            </div>
          </div>
        )}

        {/* 📋 Data Table */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-5 w-[15%]">Participant</th>
                  <th className="p-5 w-[15%]">College</th>
                  <th className="p-5 w-[12%]">UTR Info</th>
                  <th className="p-5 w-[10%]">Amount</th>
                  <th className="p-5 w-[10%]">Status</th>
                  <th className="p-5">Team Details</th>
                  <th className="p-5 text-right w-[12%]">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-16 text-center">
                      <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No participants found in this view.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRegs.map((reg) => {
                    const user = usersMap[reg.userId] || { fullName: 'Unknown', email: 'N/A' };
                    return (
                      <tr key={reg.id} className="hover:bg-blue-50/30 transition-colors">
                        
                        {/* 1. Account Info */}
                        <td className="p-5">
                          <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        </td>

                        {/* 2. College Visibility */}
                        <td className="p-5">
                          <div className="flex items-start gap-1.5">
                            <GraduationCap size={14} className="text-purple-500 mt-0.5 shrink-0" />
                            <p className="text-xs font-bold text-gray-700 leading-tight">
                              {reg.college || <span className="text-gray-400 italic">Not Provided</span>}
                            </p>
                          </div>
                        </td>

                        {/* 3. UTR Visibility */}
                        <td className="p-5">
                           <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                            {reg.utrNumber || 'N/A'}
                           </span>
                        </td>

                        {/* 4. Amount Visibility */}
                        <td className="p-5">
                           <span className="text-sm font-bold text-green-700 flex items-center">
                            <IndianRupee size={14} className="mr-0.5" />{eventFee}
                           </span>
                        </td>

                        {/* 5. Status Badge */}
                        <td className="p-5">
                          {reg.status === 'ACCEPTED' && <span className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max"><CheckCircle2 size={14}/> Accepted</span>}
                          {reg.status === 'UNDER_REVIEW' && <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max"><Clock size={14}/> Reviewing</span>}
                          {reg.status === 'REJECTED' && <span className="bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max"><XCircle size={14}/> Rejected</span>}
                        </td>

                        {/* 6. Team Details */}
                        <td className="p-5">
                          {reg.teamDetails && reg.teamDetails.length > 0 ? (
                            <div className="space-y-1.5 flex flex-wrap gap-2">
                              {reg.teamDetails.map((member: any, i: number) => (
                                <div key={i} className="text-xs bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 inline-block shadow-sm w-max">
                                  <span className="font-bold text-gray-800">{member.name}</span> <span className="text-gray-400 ml-1 font-mono">{member.phone}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-md border border-gray-100">Solo</span>
                          )}
                        </td>

                        {/* 7. Date */}
                        <td className="p-5 text-right text-xs text-gray-500 font-bold">
                          {new Date(reg.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}