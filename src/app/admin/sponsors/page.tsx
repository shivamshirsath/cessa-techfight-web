// src/app/admin/sponsors/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getSponsors, addSponsor, deleteSponsor } from '@/lib/content';
import { Sponsor, SponsorCategory, SponsorType } from '@/types';
import { Loader2, Plus, Trash2, UploadCloud, CheckCircle2, Award } from 'lucide-react';

export default function ManageSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SponsorCategory>('TECHNICAL');
  const [type, setType] = useState<SponsorType>('CO_SPONSOR');
  const [displayOrder, setDisplayOrder] = useState('10');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchSponsors = async () => {
    setLoading(true);
    const res = await getSponsors();
    if (res.success) setSponsors(res.sponsors || []);
    setLoading(false);
  };

  useEffect(() => { fetchSponsors(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return setError("Please upload a logo.");

    setIsSubmitting(true);
    setError('');

    const res = await addSponsor(name, category, type, imageFile, parseInt(displayOrder, 10));
    
    if (res.success) {
      setName(''); setDisplayOrder('10'); setImageFile(null);
      setIsAdding(false);
      fetchSponsors(); 
    } else {
      setError(res.error || "Failed to add sponsor.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this sponsor?")) return;
    const res = await deleteSponsor(id);
    if (res.success) setSponsors(sponsors.filter(s => s.id !== id));
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Award className="text-amber-500" size={32} /> Event Sponsors
          </h1>
          <p className="text-gray-600 mt-1">Manage official sponsors for TechFight 2026.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition flex items-center gap-2 shadow-md">
          {isAdding ? 'Cancel' : <><Plus size={20} /> Add Sponsor</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-amber-100 mb-8 max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sponsor Name</label>
                <input type="text" required placeholder="e.g. Google, RedBull" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-amber-500 outline-none" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Display Order (1 shows first)</label>
                <input type="number" required min="1" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-amber-500 outline-none" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sponsor Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as SponsorCategory)} className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-amber-500 outline-none">
                  <option value="TECHNICAL">Technical Sponsor</option>
                  <option value="NON_TECHNICAL">Non-Technical Sponsor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sponsor Type (Hierarchy)</label>
                <select value={type} onChange={(e) => setType(e.target.value as SponsorType)} className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-amber-500 outline-none">
                  <option value="TITLE">Title Sponsor (Huge Logo)</option>
                  <option value="CO_SPONSOR">Co-Sponsor (Medium Logo)</option>
                  <option value="ASSOCIATE">Associate Sponsor (Small Logo)</option>
                  <option value="OTHER">Other / Partner</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sponsor Logo</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 hover:bg-amber-50 transition text-center cursor-pointer bg-gray-50">
                <input type="file" accept="image/*" required onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {imageFile ? (
                  <div className="text-amber-600 font-medium flex items-center justify-center gap-2 text-sm"><CheckCircle2 size={18}/> {imageFile.name}</div>
                ) : (
                  <div className="text-gray-500 flex flex-col items-center text-sm"><UploadCloud size={20} className="mb-1"/> Upload Transparent PNG Logo</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition flex items-center gap-2 disabled:opacity-70">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Save Sponsor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-amber-500" /></div>
      ) : sponsors.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No sponsors added yet. Click "Add Sponsor" to display them on the homepage.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-semibold w-16 text-center">Order</th>
                <th className="p-4 font-semibold">Sponsor Details</th>
                <th className="p-4 font-semibold">Hierarchy / Type</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 text-center font-mono text-gray-500 font-bold">{sponsor.displayOrder}</td>
                  <td className="p-4 flex items-center gap-4">
                    <img src={sponsor.logoUrl} alt={sponsor.name} className="w-16 h-16 object-contain bg-gray-50 rounded border border-gray-200 p-1" />
                    <div>
                      <p className="font-bold text-gray-900">{sponsor.name}</p>
                      <p className="text-xs text-amber-600 font-bold uppercase mt-1">{sponsor.category.replace('_', ' ')}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded border border-gray-200">{sponsor.type.replace('_', ' ')}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(sponsor.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove Sponsor">
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