// src/app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, adminCreateUser, updateUserDetails } from '@/lib/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserPlus, Edit, Loader2, X } from 'lucide-react';
import { UserProfile, Event, UserRole } from '@/types';

export default function UsersRolesPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [editUid, setEditUid] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [assignedEventId, setAssignedEventId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const userRes = await getAllUsers();
    if (userRes.success) setUsers(userRes.users!);

    const eventSnap = await getDocs(collection(db, 'events'));
    const fetchedEvents: Event[] = [];
    eventSnap.forEach(doc => fetchedEvents.push({ id: doc.id, ...doc.data() } as Event));
    setEvents(fetchedEvents);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Open Modal for CREATING
  const openCreateModal = () => {
    setModalMode('CREATE');
    setFullName(''); setEmail(''); setPassword(''); setRole('USER'); setAssignedEventId('');
    setError(''); setIsModalOpen(true);
  };

  // Open Modal for EDITING
  const openEditModal = (user: UserProfile) => {
    setModalMode('EDIT');
    setEditUid(user.uid);
    setFullName(user.fullName);
    setEmail(user.email); // Read-only in edit mode
    setRole(user.role);
    setAssignedEventId(user.assignedEventId || '');
    setError(''); setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); setError('');

    if (role === 'COORDINATOR' && !assignedEventId) {
      setError("You must assign an event to a Coordinator.");
      setIsSaving(false); return;
    }

    if (modalMode === 'CREATE') {
      const res = await adminCreateUser(email, password, fullName, role, assignedEventId);
      if (res.success) {
        setIsModalOpen(false);
        fetchData(); // Refresh list
      } else setError(res.error || "Failed to create user.");
    } 
    else {
      const res = await updateUserDetails(editUid, fullName, role, assignedEventId);
      if (res.success) {
        setIsModalOpen(false);
        fetchData(); // Refresh list
      } else setError(res.error || "Failed to update user.");
    }
    
    setIsSaving(false);
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-blue-600" /></div>;

  return (
    <div className="p-8 lg:p-12 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-600 mt-1">Manage accounts and Coordinator permissions.</p>
        </div>
        <button onClick={openCreateModal} className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-md">
          <UserPlus size={20} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
              <th className="p-4 font-semibold">Name & Email</th>
              <th className="p-4 font-semibold">Account Role</th>
              <th className="p-4 font-semibold">Assigned Event</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.uid} className="hover:bg-gray-50/50 transition">
                <td className="p-4">
                  <p className="font-bold text-gray-900">{user.fullName}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </td>
 <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'COORDINATOR' ? 'bg-blue-100 text-blue-700' :
                    user.role === 'TREASURER' ? 'bg-green-100 text-green-700' :
                    user.role === 'SOCIAL_MEDIA' ? 'bg-pink-100 text-pink-700' : // <-- NEW COLOR
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600 font-medium">
                  {user.role === 'COORDINATOR' && user.assignedEventId 
                    ? events.find(e => e.id === user.assignedEventId)?.title || "Unknown Event"
                    : "-"}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => openEditModal(user)} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition">
                    <Edit size={16} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">{modalMode === 'CREATE' ? 'Create New User' : 'Edit User'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" required disabled={modalMode === 'EDIT'} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 disabled:opacity-60" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              {modalMode === 'CREATE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" required minLength={6} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              )}

<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium">
                  <option value="USER">Standard User</option>
                  <option value="COORDINATOR">Head Coordinator</option>
                  <option value="TREASURER">Treasurer</option>
                  <option value="SOCIAL_MEDIA">Social Media Head</option> {/* NEW OPTION */}
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>

              {role === 'COORDINATOR' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Event</label>
                  <select required value={assignedEventId} onChange={(e) => setAssignedEventId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                    <option value="" disabled>-- Select an Event --</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}

              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-70">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}