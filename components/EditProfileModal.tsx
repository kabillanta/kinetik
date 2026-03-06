'use client';

import { useState } from 'react';
import { X, Loader2, Save, Code2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Convert string to array
      const skillArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

      // 2. Send to Backend
      const res = await fetch('http://localhost:8000/api/users/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.uid || '', 
        },
        body: JSON.stringify(skillArray)
      });

      if (!res.ok) throw new Error('Failed to update skills');

      alert('Profile Updated! Matching engine refreshing...');
      onClose();
      window.location.reload(); // Reload to see new matches
      
    } catch (error) {
      console.error(error);
      alert('Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Your Skills</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                    What tech stack do you know? (Comma separated)
                </label>
                <div className="relative">
                    <Code2 className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input 
                        required
                        autoFocus
                        type="text" 
                        placeholder="React, TypeScript, Python, Neo4j..."
                        className="w-full rounded-lg bg-black/50 border border-white/10 pl-9 pr-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        value={skills}
                        onChange={e => setSkills(e.target.value)}
                    />
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                    These keywords are used to match you with events.
                </p>
            </div>

            <button 
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 transition-all disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save & Find Matches
            </button>
        </form>
      </div>
    </div>
  );
}