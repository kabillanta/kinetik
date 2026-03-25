'use client';

import { useState } from 'react';
import { X, Loader2, Calendar as CalendarIcon, MapPin, Briefcase, Sparkles, NotebookPen, Target, Users } from 'lucide-react';
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
    skills: [] as string[],
    volunteers_needed: 5
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
            skills: formData.skills,
            volunteers_needed: formData.volunteers_needed
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
      {/* Mobile Backdrop - clicking outside closes it just in case */}
      <div 
        className="fixed inset-0 z-40 bg-zinc-900/40 md:bg-transparent transition-opacity" 
        onClick={onClose}
      />

      {/* Main Container - aligned right of sidebar */}
      <div className="fixed inset-0 z-[60] flex md:pl-64 pointer-events-none">
        
        {/* Full Screen Slide Over Panel */}
        <div className="relative pointer-events-auto w-full h-full bg-[#fcfcfc] animate-in slide-in-from-bottom-8 md:slide-in-from-right-16 fade-in duration-500 shadow-2xl flex flex-col md:border-l border-black/[0.04]">
          
          {/* Top Sticky Header */}
          <div className="bg-white px-6 sm:px-10 py-5 flex items-center justify-between border-b border-black/[0.04] sticky top-0 z-20 shadow-sm shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md shrink-0 hidden sm:flex">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight leading-tight">Create Opportunity</h2>
                  <p className="text-[13px] sm:text-sm text-zinc-500 font-medium mt-0.5">Post a new role to find the perfect volunteers.</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-100/80 hover:bg-zinc-200 text-zinc-700 transition-all font-semibold text-sm shrink-0"
              >
                  <span className="hidden sm:inline">Discard</span>
                  <X className="h-4 w-4" />
              </button>
          </div>

          {/* Scrolling Content Area */}
          <div className="flex-1 overflow-y-auto w-full px-4 sm:px-10 py-8 lg:py-12 relative">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-8 pb-4 sm:pb-12">
                
                <div className="space-y-8 bg-white/60 backdrop-blur-3xl rounded-[2rem] p-6 sm:p-10 border border-black/[0.03] shadow-sm">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                            <Users className="h-4 w-4 text-indigo-500" />
                            Volunteers Needed
                          </label>
                          <input 
                              type="number" 
                              required
                              min={1}
                              max={500}
                              placeholder="5"
                              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-zinc-200/80 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all text-zinc-900 font-medium text-[15px] shadow-sm"
                              value={formData.volunteers_needed}
                              onChange={e => setFormData({...formData, volunteers_needed: Math.max(1, parseInt(e.target.value) || 1)})}
                          />
                          <p className="text-xs text-zinc-400 mt-1.5 ml-1">How many volunteers do you need for this event?</p>
                      </div>

                      <div className="md:col-span-2">
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

                <div className="pt-6 sm:hidden flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-4 text-[15px] font-bold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-2xl transition-all shadow-sm">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-black py-4 text-[15px] font-bold text-white transition-all disabled:opacity-50">Publish</button>
                </div>
            </form>
            </div>
          </div>
          
          {/* Fixed Desktop Bottom Action Bar */}
          <div className="hidden sm:flex shrink-0 bg-white/90 backdrop-blur-3xl border-t border-black/[0.04] py-4 px-6 lg:px-10 items-center justify-end gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-20">
             <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-bold text-zinc-600 bg-white hover:bg-zinc-50 border border-transparent hover:border-black/[0.04] transition-all">
                Discard Draft
             </button>
             <button type="submit" disabled={isLoading} onClick={handleSubmit} className="px-6 py-2.5 flex items-center justify-center gap-2 rounded-full bg-black text-sm font-bold text-white hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-md">
                 {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 fill-white/20" />}
                 {isLoading ? "Publishing..." : "Publish Opportunity"}
             </button>
          </div>
        </div>
      </div>
    </>
  );
}
