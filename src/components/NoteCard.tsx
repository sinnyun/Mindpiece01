import React from 'react';
import { Note } from '../types';
import { Edit2, Trash2, MoveRight } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

export default function NoteCard({ note, onClick, onDelete }: NoteCardProps) {
  // Determine bg color based on category to match design requests
  let bgClass = "bg-white/60";
  let badgeClass = "bg-primary/10 text-primary";
  
  if (note.category === '灵感') {
    bgClass = "bg-[#e8f5e9]/70"; // Pastel green
    badgeClass = "bg-green-100 text-green-800";
  } else if (note.category === '待办') {
    bgClass = "bg-[#e3f2fd]/70"; // Pastel blue
    badgeClass = "bg-blue-100 text-blue-800";
  } else if (note.category === '随笔') {
    bgClass = "bg-[#fce4ec]/70"; // Pastel pink
    badgeClass = "bg-pink-100 text-pink-800";
  }

  return (
    <div 
      className={`glass-card rounded-3xl p-6 flex flex-col h-[280px] cursor-pointer group ${bgClass}`}
      onClick={() => onClick(note)}
    >
      {note.imageUrl && (
        <div className="-mx-6 -mt-6 mb-4 h-32 overflow-hidden rounded-t-3xl relative">
           <img src={note.imageUrl} alt={note.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
           <div className="absolute top-3 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-white/80 ${badgeClass.split(' ')[1]}`}>
                {note.category}
              </span>
           </div>
        </div>
      )}

      {!note.imageUrl && (
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
            {note.category}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 hover:bg-white/50 rounded-full transition-colors text-on-surface-variant">
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 hover:bg-white/50 rounded-full transition-colors text-on-surface-variant hover:text-error"
              onClick={onDelete ? (e) => onDelete(note.id, e) : undefined}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <h3 className="text-lg font-bold mb-2 text-on-surface line-clamp-1">{note.title}</h3>
      <div 
        className="flex-1 overflow-hidden" 
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}
      >
        <div className="prose prose-sm prose-primary max-w-none text-on-surface-variant text-[15px] leading-relaxed pb-4">
          <Markdown remarkPlugins={[remarkGfm]}>
            {note.content}
          </Markdown>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-center relative z-10">
        <span className="text-xs text-on-surface-variant/70 font-medium">{note.date}</span>
        <div className="flex items-center">
        {note.imageUrl && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-16">
            <button className="p-1 hover:bg-white/50 rounded-full transition-colors text-on-surface-variant">
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              className="p-1 hover:bg-white/50 rounded-full transition-colors text-on-surface-variant hover:text-error"
              onClick={onDelete ? (e) => onDelete(note.id, e) : undefined}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        <button className="flex items-center gap-1 text-primary text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
          <MoveRight className="w-3 h-3" /> 移动
        </button>
        </div>
      </div>
    </div>
  );
}
