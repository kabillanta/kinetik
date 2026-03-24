'use client';

import { useState } from 'react';
import { X, Loader2, Calendar as CalendarIcon, MapPin, Briefcase, Sparkles, NotebookPen, Target } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/api-config';

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
    skills: [] as string[]
  });
  const [currentSkill, setCurrentSkill] = useState('');

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter') || e.type === 'blur') {
      e.preventDefault();
      if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
        setFormData({ ...formData, skills: [...formData.skills, currentSkill.trim()] });
        setCurrentSkill('');
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken() || ''}`,
        },
        body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            role_needed: formData.role_needed,
            location: formData.location,
            date: formData.date,
            skills: formData.skills
        })
      });

      if (!res.ok) throw new Error('Failed to create event');

      if (onSuccess) onSuccess();
      onClose();
      
    } catch (error) {
      console.error(error);
      alert('Error creating event. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop - Explicitly z-40 so it goes BEHIND the z-50 sidebar */}
      <div 
        className="fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Alignment Container - Points are none so we can click sidebar */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center md:pl-64 pointer-events-none">
        
        {/* Modal Window - Re-enable pointers */}
        <div className="relative pointer-events-auto w-full max-w-2xl rounded-[2rem] border border-white/40 bg-white/70 backdrop-blur-2xl p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-in zoom-in-95 fade-in duration-300 flex flex-col md:mx-4 max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100/50 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Create Opportunity</h2>
                </div>
                <p className="text-zinc-500 font-medium">Post a new role to find the perfect volunteers for your initiative.</p>
              </div>
              <button onClick={onClose} className="p-2.5 rounded-full bg-white/50 hover:bg-white text-zinc-400 hover:text-zinc-900 transition-all shadow-sm border border-black/[0.03]">
                  <X className="h-5 w-5" />
              </button>
          </div>

          {/* Form Container */}
          <div className="overflow-y-auto pr-2 -mr-2">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-6 bg-white/40 rounded-3xl p-6 border border-white/50 shadow-sm">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                          <label className="flex items-center gap-2 text-sm font-bold text-zinc-800 mb-2">
                            <Target className="h-4 w-4 text-emerald-500" />
                            Opportunity Title
                          </label>
                          <input 
                              required
                              type="text" 
                              placeholder="e.g. Climate Hackathon 2026"
                              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-zinc-200/80 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-zinc-900 font-medium text-[15px] shadow-sm"
                              value={formData.title}
                              onChange={e => setFormData({...formData, title: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-zinc-800 mb-2">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                            Role Needed
                          </label>
                          <input 
                              required
                              type="text" 
                              placeholder="e.g. Lead Mentor"
                              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-zinc-200/80 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-zinc-900 font-medium text-[15px] shadow-sm"
                              value={formData.role_needed}
                              onChange={e => setFormData({...formData, role_needed: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-zinc-800 mb-2">
                            <MapPin className="h-4 w-4 text-rose-500" />
                            Location
                          </label>
                          <input 
                              required
                              type="text" 
                              placeholder="e.g. Remote or San Francisco"
                              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-zinc-200/80 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-zinc-900 font-medium text-[15px] shadow-sm"
                              value={formData.location}
                              onChange={e => setFormData({...formData, location: e.target.value})}
                          />
                      </div>

                      <div className="md:col-span-2">
                          <label className="flex items-center gap-2 text-sm font-bold text-zinc-800 mb-2">
                            <NotebookPen className="h-4 w-4 text-purple-500" />
                            Description
                          </label>
                          <textarea 
                              required
                              rows={3}
                              placeholder="Briefly describe what the volunteer will do and why it matters..."
                              className="w-full p-5 rounded-2xl bg-white border border-zinc-200/80 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-zinc-900 font-medium text-[15px] shadow-sm resize-none"
                              value={formData.description}
                              onChange={e => setFormData({...formData, description: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-zinc-800 mb-2">
                            <CalendarIcon className="h-4 w-4 text-orange-500" />
                            Date
                          </label>
                          <input 
                              type="date" 
                              required 
                              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-zinc-200/80 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-zinc-900 font-medium text-[15px] shadow-sm"
                              value={formData.date}
                              onChange={e => setFormData({...formData, date: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-zinc-800 mb-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            Skills Needed
                          </label>
                          <input 
                              type="text" 
                              placeholder="Type a skill and press Enter..."
                              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-zinc-200/80 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-zinc-900 font-medium text-[15px] shadow-sm"
                              value={currentSkill}
                              onChange={e => setCurrentSkill(e.target.value)}
                              onKeyDown={handleAddSkill}
                              onBlur={handleAddSkill}
                          />
                          {formData.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 p-1">
                              {formData.skills.map((skill) => (
                                <div key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm font-medium animate-in zoom-in-50">
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => removeSkill(skill)}
                                    className="ml-1 h-4 w-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                   </div>
                </div>

                <div className="pt-2 flex gap-4">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 text-[15px] font-bold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-2xl transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 text-[15px] font-bold text-white hover:bg-black transition-all disabled:opacity-50 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 fill-white/20" />}
                        {isLoading ? "Posting Opportunity..." : "Publish to Network"}
                    </button>
                </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
