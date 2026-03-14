// src/app/admin/events/edit/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getEventById, updateEvent } from '@/lib/events';
import { UploadCloud, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  // Basic Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('');
  const [existingPoster, setExistingPoster] = useState('');
  const [newPoster, setNewPoster] = useState<File | null>(null);

  // Event Type
  const [eventType, setEventType] = useState<'SINGLE' | 'TEAM'>('SINGLE');
  const [teamSize, setTeamSize] = useState('2');

  // Coordinator Details
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorContact, setCoordinatorContact] = useState('');
  const [staffCoordinatorName, setStaffCoordinatorName] = useState(''); // NEW
  const [staffCoordinatorContact, setStaffCoordinatorContact] = useState(''); // NEW

  // Payment Details
  const [existingQr, setExistingQr] = useState('');
  const [newQrFile, setNewQrFile] = useState<File | null>(null);
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing event data
  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getEventById(eventId);
      if (result.success && result.event) {
        const data = result.event as any;
        setTitle(data.title || '');
        setDescription(data.description || '');
        setFee(data.registrationFee?.toString() || '');
        setExistingPoster(data.posterUrl || '');
        setEventType(data.eventType || 'SINGLE');
        setTeamSize(data.teamSize?.toString() || '2');
        
        // Populate Student & Staff details
        setCoordinatorName(data.coordinatorName || '');
        setCoordinatorContact(data.coordinatorContact || '');
        setStaffCoordinatorName(data.staffCoordinatorName || '');
        setStaffCoordinatorContact(data.staffCoordinatorContact || '');

        setExistingQr(data.paymentQrUrl || '');
        setUpiId(data.upiId || '');
        setBankDetails(data.bankDetails || '');
      } else {
        setError('Could not load event data.');
      }
      setIsFetching(false);
    };
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Call Update function with all new fields
    const result = await updateEvent(
      eventId, title, description, parseInt(fee, 10), newPoster, existingPoster,
      eventType, parseInt(teamSize, 10), 
      coordinatorName, coordinatorContact,
      staffCoordinatorName, staffCoordinatorContact,
      newQrFile, existingQr, upiId, bankDetails
    );

    if (result.success) {
      router.push('/admin/events');
    } else {
      setError(result.error || 'Failed to update event');
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-blue-600" /></div>;

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/events" className="p-2 bg-white rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition"><ArrowLeft size={20} /></Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

        {/* SECTION 1: Event Basics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">1. Event Basics</h2>
          <input type="text" required placeholder="Event Title" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea required rows={4} placeholder="Description & Rules" className="w-full px-4 py-3 rounded-xl border bg-gray-50 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition" value={description} onChange={(e) => setDescription(e.target.value)} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => setEventType('SINGLE')} className={`flex-1 py-3 rounded-xl border font-medium transition ${eventType === 'SINGLE' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>Single Person</button>
                <button type="button" onClick={() => setEventType('TEAM')} className={`flex-1 py-3 rounded-xl border font-medium transition ${eventType === 'TEAM' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>Team Event</button>
              </div>
            </div>
            {eventType === 'TEAM' && (
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Max Team Size</label>
                 <input type="number" required min="2" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Update Poster (Optional)</label>
            <div className="flex items-center gap-6">
              {existingPoster && <img src={existingPoster} alt="Current" className="h-24 w-24 object-cover rounded-xl border border-gray-200 shadow-sm" />}
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl px-6 py-4 hover:bg-blue-50 transition text-center cursor-pointer flex-1 bg-gray-50">
                <input type="file" accept="image/*" onChange={(e) => setNewPoster(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center justify-center space-y-1">
                  {newPoster ? <span className="text-blue-600 font-medium">{newPoster.name}</span> : <span className="text-sm text-gray-600">Upload new image to replace current</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Coordinators (Student & Staff) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">2. Coordinator Details</h2>
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Student Coordinator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" required placeholder="Student Name" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={coordinatorName} onChange={(e) => setCoordinatorName(e.target.value)} />
              <input type="text" required placeholder="Phone Number" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={coordinatorContact} onChange={(e) => setCoordinatorContact(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Staff / Faculty Coordinator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" required placeholder="Staff Name" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={staffCoordinatorName} onChange={(e) => setStaffCoordinatorName(e.target.value)} />
              <input type="text" required placeholder="Phone Number" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={staffCoordinatorContact} onChange={(e) => setStaffCoordinatorContact(e.target.value)} />
            </div>
          </div>
        </div>

        {/* SECTION 3: Payment */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">3. Payment Details</h2>
          <input type="number" required placeholder="Registration Fee (₹)" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={fee} onChange={(e) => setFee(e.target.value)} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" required placeholder="UPI ID" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
            <input type="text" required placeholder="Bank Details" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Update QR Code (Optional)</label>
            <div className="flex items-center gap-6">
              {existingQr && <img src={existingQr} alt="Current QR" className="h-24 w-24 object-cover rounded-xl border border-gray-200 shadow-sm" />}
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl px-6 py-4 hover:bg-blue-50 transition text-center cursor-pointer flex-1 bg-gray-50">
                <input type="file" accept="image/*" onChange={(e) => setNewQrFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center justify-center space-y-1">
                  {newQrFile ? <span className="text-blue-600 font-medium">{newQrFile.name}</span> : <span className="text-sm text-gray-600">Upload new QR to replace current</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-70 text-lg">
          {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}