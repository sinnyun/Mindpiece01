import React from 'react';
import { Note } from '../types';
import { MoreHorizontal } from 'lucide-react';

interface CardStackProps {
  note: Note;
  onClick: (note: Note) => void;
}

export default function CardStack({ note, onClick }: CardStackProps) {
  return (
    <div 
      className="relative h-[280px] group cursor-pointer pl-2 pb-2"
      onClick={() => onClick(note)}
    >
      {/* Decorative underlying cards */}
      <div className="absolute top-4 left-4 right-[-1rem] bottom-[-1rem] rounded-3xl bg-[#efebec]/60 -z-20 transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1"></div>
      <div className="absolute top-2 left-2 right-[-0.5rem] bottom-[-0.5rem] rounded-3xl bg-[#f5f1f2]/80 -z-10 transition-transform duration-500 shadow-sm group-hover:-translate-x-1 group-hover:-translate-y-1"></div>
      
      {/* Top Card */}
      <div className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-between bg-white shadow-xl z-0 transition-transform duration-500 group-hover:-translate-y-2 group-hover:-translate-x-2">
        <div>
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
              {note.category === '堆栈' ? '精选组合' : note.category}
            </span>
            <button className="text-on-surface-variant hover:bg-black/5 p-1 rounded-full">
               <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-xl font-bold mb-3 text-on-surface">{note.title}</h3>
          
          <div className="text-on-surface-variant text-[15px] leading-relaxed line-clamp-4">
            {note.children && note.children.length > 0 ? (
               <ul className="list-disc pl-4 space-y-1">
                 {note.children.slice(0, 3).map((child, idx) => (
                   <li key={idx} className="truncate">{child.title}</li>
                 ))}
                 {note.children.length > 3 && <li>...</li>}
               </ul>
            ) : (
               note.content
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-none">
          <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
             {note.date}更新
          </div>
        </div>
      </div>

      {/* Outside Stack Title label */}
      {note.stackName && (
        <div className="absolute -bottom-10 left-0 w-full z-10 transition-opacity">
           <h4 className="font-bold text-on-surface text-lg">{note.stackName}</h4>
           <p className="text-xs text-on-surface-variant">{note.childCount || note.children?.length || 0} 张笔记卡片</p>
        </div>
      )}
    </div>
  );
}
