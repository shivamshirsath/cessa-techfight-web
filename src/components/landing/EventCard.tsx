// src/components/landing/EventCard.tsx
'use client';

import { Event } from '@/types';
import { Users, User, IndianRupee, ArrowRight, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EventCard({ event, currentUser }: { event: Event, currentUser: any }) {
  const router = useRouter();

  const handleApply = () => {
    if (!currentUser) router.push('/login');
    else router.push(`/apply/${event.id}`);
  };

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-gray-200 hover:border-[#9E1B42]/30 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(158,27,66,0.08)] transition-all duration-500 hover:-translate-y-1.5 overflow-hidden h-full">
      
      {/* 1. IMAGE HERO (With Smooth Zoom Animation) */}
      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
        <img 
          src={event.posterUrl} 
          alt={event.title} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" 
        />
        
        {/* Soft internal gradient for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        
        {/* Premium Pill Badge */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-[#9E1B42] px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5 border border-white/50">
          {event.eventType === 'TEAM' ? (
            <><Users size={14} strokeWidth={2.5}/> Team ({event.teamSize})</>
          ) : (
            <><User size={14} strokeWidth={2.5}/> Solo</>
          )}
        </div>
      </div>
      
      {/* 2. CONTENT AREA */}
      <div className="p-6 flex-1 flex flex-col z-10 bg-white">
        
        {/* Title & Description */}
        <h3 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight mb-2 group-hover:text-[#9E1B42] transition-colors duration-300 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-[14px] text-gray-500 leading-relaxed line-clamp-2 mb-6">
          {event.description}
        </p>

        {/* Coordinators Section - Soft Gray Box */}
        <div className="mt-auto bg-[#F8FAFC] border border-gray-100 rounded-xl p-4 mb-6 transition-colors group-hover:bg-[#FFF6F8]">
          
          {/* Staff Coordinator */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">
                Staff Coordinator
              </p>
              <p className="text-[14px] font-bold text-gray-800">
                {event.staffCoordinatorName || "TBA"}
              </p>
            </div>
            {/* DISPLAY NUMBER AS A BADGE */}
            <a 
              href={`tel:${event.staffCoordinatorContact}`} 
              className="text-[11px] font-bold tracking-wider text-gray-600 hover:text-[#9E1B42] transition-colors flex items-center gap-1.5 bg-white py-1.5 px-2.5 rounded-lg shadow-sm border border-gray-200 hover:border-[#9E1B42]/30"
            >
              <Phone size={12}/>
              {event.staffCoordinatorContact || "N/A"}
            </a>
          </div>
          
          <div className="h-[1px] w-full bg-gray-200/60 mb-3"></div>
          
          {/* Student Coordinator */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">
                Student Coordinator
              </p>
              <p className="text-[14px] font-bold text-gray-800">
                {event.coordinatorName || "TBA"}
              </p>
            </div>
            {/* DISPLAY NUMBER AS A BADGE */}
            <a 
              href={`tel:${event.coordinatorContact}`} 
              className="text-[11px] font-bold tracking-wider text-gray-600 hover:text-[#9E1B42] transition-colors flex items-center gap-1.5 bg-white py-1.5 px-2.5 rounded-lg shadow-sm border border-gray-200 hover:border-[#9E1B42]/30"
            >
              <Phone size={12}/>
              {event.coordinatorContact || "N/A"}
            </a>
          </div>

        </div>

        {/* 3. FOOTER (Price & Animated Button) */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">
              Entry Fee
            </p>
            <p className="text-[20px] font-black text-[#9E1B42] flex items-center tracking-tight">
              <IndianRupee size={20} strokeWidth={2.5} className="mr-0.5 text-gray-900"/> {event.registrationFee}
            </p>
          </div>
          
          {/* Animated "Apply Now" Button */}
          <button 
            onClick={handleApply} 
            className="group/btn relative overflow-hidden bg-gray-900 hover:bg-[#9E1B42] text-white px-6 py-3 rounded-lg text-[13px] font-bold uppercase tracking-wide transition-colors duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_rgba(158,27,66,0.25)] flex items-center gap-2"
          >
            <span className="relative z-10">Apply</span>
            {/* Arrow slides right on hover */}
            <ArrowRight size={16} className="relative z-10 transform group-hover/btn:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

      </div>
    </div>
  );
}