// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Event } from '@/types';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

// Import our new modular components
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import EventCard from '@/components/landing/EventCard';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));

    const fetchActiveEvents = async () => {
      try {
        const q = query(collection(db, 'events'), where('isActive', '==', true));
        const snap = await getDocs(q);
        const fetchedEvents: Event[] = [];
        snap.forEach(doc => fetchedEvents.push({ id: doc.id, ...doc.data() } as Event));
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveEvents();
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-red-600 selection:text-white">
      <Navbar />
      <Hero />

      {/* 📅 EVENTS SECTION */}
      <div id="events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-16">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-3">
            Active <span className="text-red-600">Events</span>
          </h2>
          <div className="w-12 h-1 bg-red-600"></div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-red-600 mb-3" />
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Loading...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 border border-neutral-900 rounded-lg bg-[#050505]">
            <p className="text-neutral-500 font-medium text-sm">No events are currently active.</p>
          </div>
        ) : (
          /* THIS GRID KEEPS CARDS SMALL AND PROFESSIONAL (4 across on large screens) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} currentUser={currentUser} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-black py-6 text-center">
        <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-widest">© 2026 CESSA TechFight.</p>
      </footer>
    </div>
  );
}