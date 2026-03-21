// src/app/admin/team/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getTeamMembers, addTeamMember, deleteTeamMember } from '@/lib/content';
import { TeamMember } from '@/types';
import { Loader2, Plus, Trash2, UserSquare2, UploadCloud, CheckCircle2 } from 'lucide-react';

export default function ManageTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [displayOrder, setDisplayOrder] = useState('10');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchTeam = async () => {
    setLoading(true);
    const res = await getTeamMembers();
    if (res.success) setMembers(res.members || []);
    setLoading(false);
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError("Please upload an image for the team member.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await addTeamMember(name, role, imageFile, parseInt(displayOrder, 10));
    
    if (res.success) {
      // Reset form
      setName(''); setRole(''); setDisplayOrder('10'); setImageFile(null);
      setIsAdding(false);
      fetchTeam(); // Refresh list
    } else {
      setError(res.error || "Failed to add team member.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this member from the CESA Team page?")) return;
    
    const res = await deleteTeamMember(id);
    if (res.success) {
      setMembers(members.filter(m => m.id !== id));
    } else {
      alert("Failed to delete member.");
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserSquare2 className="text-indigo-600" size={32} /> CESA Team Members
          </h1>
          <p className="text-gray-600 mt-1">Add committee members to be displayed on the public website.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-md">
          {isAdding ? 'Cancel' : <><Plus size={20} /> Add Member</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-100 mb-8 animate-in fade-in slide-in-from-top-4 max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input type="text" required placeholder="e.g. John Doe" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role / Position</label>
                <input type="text" required placeholder="e.g. President, Event Head" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Display Order (1 shows first)</label>
                <input type="number" required min="1" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">Use 1 for President, 2 for VP, etc.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Profile Photo (Square recommended)</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 hover:bg-indigo-50 transition text-center cursor-pointer bg-gray-50">
                  <input type="file" accept="image/*" required onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {imageFile ? (
                    <div className="text-indigo-600 font-medium flex items-center justify-center gap-2 text-sm"><CheckCircle2 size={18}/> {imageFile.name}</div>
                  ) : (
                    <div className="text-gray-500 flex flex-col items-center text-sm"><UploadCloud size={20} className="mb-1"/> Upload Photo</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-70">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Save Team Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-indigo-600" /></div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No team members added yet. Click "Add Member" to build your roster.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-semibold w-16 text-center">Order</th>
                <th className="p-4 font-semibold">Member Details</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 text-center font-mono text-gray-500 font-bold">{member.displayOrder}</td>
                  <td className="p-4 flex items-center gap-4">
                    <img src={member.imageUrl} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                      <p className="font-bold text-gray-900">{member.name}</p>
                      <p className="text-sm text-indigo-600 font-semibold">{member.role}</p>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(member.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove Member">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}