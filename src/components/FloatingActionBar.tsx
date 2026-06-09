import React from 'react';
import { Plus, Type, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface FloatingActionBarProps {
  onCreateClick: () => void;
}

export default function FloatingActionBar({ onCreateClick }: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full glass-panel border border-white/50 z-30 shadow-2xl">
      <button 
        onClick={onCreateClick}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>
      <div className="h-6 w-[1px] bg-outline-variant/40 mx-2"></div>
      <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-black/5 transition-colors">
        <Type className="w-5 h-5" />
      </button>
      <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-black/5 transition-colors">
        <ImageIcon className="w-5 h-5" />
      </button>
      <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-black/5 transition-colors">
        <CheckCircle className="w-5 h-5" />
      </button>
    </div>
  );
}
