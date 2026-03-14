// src/app/admin/events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, Loader2, IndianRupee, Trash2, Edit, Users } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteEvent } from '@/lib/events'; // Imported the new delete function


interface EventData {
  id: string;
  title: string;
  description: string;
  registrationFee: number;
  posterUrl: string;
  isActive: boolean;
}

export default function ManageEventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedEvents: EventData[] = [];
        querySnapshot.forEach((doc) => {
          fetchedEvents.push({ id: doc.id, ...doc.data() } as EventData);
        });
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Handle the delete action
  const handleDelete = async (eventId: string, eventTitle: string) => {
    // 1. Ask for confirmation so Admin doesn't accidentally click it
    const confirmDelete = window.confirm(`Are you sure you want to delete "${eventTitle}"? This cannot be undone.`);
    if (!confirmDelete) return;

    setDeletingId(eventId);
    
    // 2. Delete from database
    const result = await deleteEvent(eventId);
    
    if (result.success) {
      // 3. Remove from the screen instantly without reloading the page
      setEvents(events.filter(event => event.id !== eventId));
    } else {
      alert("Failed to delete event: " + result.error);
    }
    
    setDeletingId(null);
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
          <p className="text-gray-600 mt-1">View, edit, and manage all TechFight competitions.</p>
        </div>
        <Link href="/admin/events/create" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-md">
          <CalendarPlus size={20} />
          Create New Event
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
           <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
           <p className="text-gray-500 mb-6">Click the button above to create your first event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-600 shadow-sm">
                  {event.isActive ? 'Active' : 'Draft'}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-gray-900 font-bold">
                    <IndianRupee size={16} className="mr-1 text-gray-500" />
                    {event.registrationFee}
                  </div>
                  
                  {/* Action Buttons: Edit and Delete */}
                  <div className="flex items-center gap-4">
                    <Link href={`/admin/events/edit/${event.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <Edit size={16} /> Edit
                    </Link>

                    <Link href={`/admin/events/${event.id}/participants`} className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center gap-1">
   <Users size={16} /> Participants
</Link>
                    
                    <button 
                      onClick={() => handleDelete(event.id, event.title)}
                      disabled={deletingId === event.id}
                      className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                    >
                      {deletingId === event.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      Delete
                    </button>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}