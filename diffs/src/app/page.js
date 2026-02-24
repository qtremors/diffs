"use client";

import { useState } from 'react';
import InputPanel from '@/components/InputPanel';
import DiffViewer from '@/components/DiffViewer';
import { GitCompare } from 'lucide-react';

export default function Home() {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex items-center justify-center p-2 rounded-md bg-sky-500/10 border border-sky-500/20">
          <GitCompare className="text-sky-400" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Side-by-Side <span className="text-sky-400">Diff</span> Viewer
          </h1>
          <p className="text-xs text-slate-500">
            GitHub-style comparison with character-level highlighting.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <section className="glass-panel p-6">
          <InputPanel 
            oldText={oldText} 
            setOldText={setOldText} 
            newText={newText} 
            setNewText={setNewText} 
          />
        </section>

        {(oldText || newText) && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DiffViewer oldText={oldText} newText={newText} />
          </section>
        )}
      </div>

      <footer className="mt-12 text-center text-xs text-slate-600 border-t border-slate-800 pt-6">
        Designed to match GitHub Desktop's diff aesthetic.
      </footer>
    </main>
  );
}
