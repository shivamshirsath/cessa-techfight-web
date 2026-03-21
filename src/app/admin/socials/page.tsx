// src/app/admin/socials/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getSocialPosts, addSocialPost, deleteSocialPost } from '@/lib/content';
import { SocialPost } from '@/types';
import { Loader2, Plus, Trash2, Instagram, Info } from 'lucide-react';

export default function ManageSocialsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [embedCode, setEmbedCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    const res = await getSocialPosts();
    if (res.success) setPosts(res.posts || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!embedCode.includes('instagram.com')) {
      setError("Please paste a valid Instagram embed code.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await addSocialPost(embedCode);
    if (res.success) {
      setEmbedCode('');
      setIsAdding(false);
      fetchPosts(); // Refresh list
    } else {
      setError(res.error || "Failed to add post.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this post from the gallery?")) return;
    
    const res = await deleteSocialPost(id);
    if (res.success) {
      setPosts(posts.filter(p => p.id !== id));
    } else {
      alert("Failed to delete post.");
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Instagram className="text-pink-600" size={32} /> Social Media Gallery
          </h1>
          <p className="text-gray-600 mt-1">Manage the Instagram reels and posts shown on the home page.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-pink-600 text-white font-medium rounded-xl hover:bg-pink-700 transition flex items-center gap-2 shadow-md">
          {isAdding ? 'Cancel' : <><Plus size={20} /> Add New Post</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3 mb-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
            <Info className="shrink-0 mt-0.5" size={18} />
            <p><strong>How to get Embed Code:</strong> Go to Instagram on a computer, open the reel/post you want to share, click the three dots (...) in the top right, select <strong>"Embed"</strong>, and click "Copy embed code". Paste that exact code below.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">{error}</div>}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Instagram Embed HTML</label>
              <textarea 
                required 
                rows={6}
                placeholder='<blockquote class="instagram-media" data-instgrm-permalink=...'
                className="w-full px-4 py-3 rounded-xl border font-mono text-xs bg-gray-50 focus:ring-2 focus:ring-pink-500 outline-none transition" 
                value={embedCode} 
                onChange={(e) => setEmbedCode(e.target.value)} 
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition flex items-center gap-2 disabled:opacity-70">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Save to Gallery'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-pink-600" /></div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No social posts added yet. Click "Add New Post" to start building your gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative group">
              {/* Note: We dangerouslySetInnerHTML because Instagram provides blockquotes and script tags. 
                  In production, ensure only trusted admins can add this. */}
              <div className="p-4 flex-1 flex justify-center overflow-hidden scale-[0.85] origin-top bg-gray-50 rounded-t-xl" 
                   dangerouslySetInnerHTML={{ __html: post.embedHtml }} 
              />
              
              <div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-500 font-medium">Added {new Date(post.createdAt).toLocaleDateString()}</span>
                <button 
                  onClick={() => handleDelete(post.id)} 
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                  title="Delete Post"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}