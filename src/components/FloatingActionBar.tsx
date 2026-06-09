import React from 'react';
import { Plus, Type, Image as ImageIcon, CheckCircle, Video, Globe } from 'lucide-react';
import { NoteType } from '../types';

interface FloatingActionBarProps {
  onCreateClick: (type: NoteType) => void;
}

export default function FloatingActionBar({ onCreateClick }: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full glass-panel border border-white/50 z-30 shadow-2xl">
      <button 
        onClick={() => onCreateClick('normal')}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>
      <div className="h-6 w-[1px] bg-outline-variant/40 mx-2"></div>
      <button 
        onClick={() => onCreateClick('normal')}
        className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="文本笔记"
      >
        <Type className="w-5 h-5" />
      </button>
      <button 
        onClick={() => onCreateClick('video')}
        className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="视频笔记"
      >
        <Video className="w-5 h-5" />
      </button>
      <button 
        onClick={() => onCreateClick('webpage')}
        className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="网页收藏"
      >
        <Globe className="w-5 h-5" />
      </button>
      <div className="h-6 w-[1px] bg-outline-variant/40 mx-2"></div>
      <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
        <CheckCircle className="w-5 h-5" />
      </button>
    </div>
  );
}
