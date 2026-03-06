'use client';

import { useState } from 'react';
import { X, Loader2, Plus, Code2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    role_needed: '',
    location: '',
    date: '',
    skills: '' // We will split this string into an array later
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Convert comma-separated string to array
      const skillArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

      // 2. Send to Backend
      const res = await fetch('http://localhost:8000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.uid || '', // Critical for linking event to organizer
        },
        body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            role_needed: formData.role_needed,
            location: formData.location,
            date: formData.date,
            skills: skillArray
        })
      });

      if (!res.ok) throw new Error('Failed to create event');

      // 3. Success!
      alert('Event Created Successfully!');
      if (onSuccess) onSuccess();
      onClose();
      // Optional: Trigger a refresh of the dashboard here
      
    } catch (error) {
      console.error(error);
      alert('Error creating event. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-black/[0.04] bg-white p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/[0.04]">
            <div>
              <h2 className="text-2xl font-bold text-black tracking-tight">Post New Opportunity</h2>
              <p className="text-sm text-zinc-500 font-medium mt-1">Create an event and find the perfect volunteers.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-black mt-[-10px]">
                <X className="h-5 w-5" />
            </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto pr-2 -mr-2">
          <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-1">Event Title</label>
                  <input 
                      required
                      type="text" 
                      placeholder="e.g. Climate Hackathon 2026"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                  />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                      <label className="block text-sm font-semibold text-black mb-1.5 ml-1">Role Needed</label>
                      <input 
                          required
                          type="text" 
                          placeholder="e.g. Mentor"
                          className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                          value={formData.role_needed}
                          onChange={e => setFormData({...formData, role_needed: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-black mb-1.5 ml-1">Location</label>
                      <input 
                          required
                          type="text" 
                          placeholder="e.g. Remote or San Francisco"
                          className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                          value={formData.location}
                          onChange={e => setFormData({...formData, location: e.target.value})}
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-1">Required Skills (Comma separated)</label>
                  <div className="relative">
                      <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                      <input 
                          required
                          type="text" 
                          placeholder="React, Python, AWS"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                          value={formData.skills}
                          onChange={e => setFormData({...formData, skills: e.target.value})}
                      />
                  </div>
              </div>
              
              <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-1">Description</label>
                  <textarea 
                      required
                      rows={3}
                      placeholder="Briefly describe what the volunteer will do..."
                      className="w-full p-4 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm resize-none"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                  />
              </div>
              
              <div>
                  <label className="block text-sm font-semibold text-black mb-1.5 ml-1">Date</label>
                  <input 
                      type="date" 
                      required 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-black/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-black font-medium text-sm"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                  />
              </div>

              <div className="pt-4 border-t border-black/[0.04]">
                  <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-sm font-bold text-white hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-md"
                  >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                      {isLoading ? "Posting Event..." : "Post Event to Network"}
                  </button>
              </div>
          </form>
        </div>
      </div>
    </div>
  );
}