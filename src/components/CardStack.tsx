import React, { useState } from 'react';
import { Note } from '../types';
import { MoreHorizontal, Pin, PinOff, Trash2, FolderOpen, Layers, Undo2 } from 'lucide-react';

interface CardStackProps {
  note: Note;
  onClick: (note: Note) => void;
  onDisband?: (id: string, e: React.MouseEvent) => void;
  onTogglePin?: (id: string, e: React.MouseEvent) => void;
  onRename?: (id: string, title: string) => void;
  onDeleteGroupFully?: (id: string, e: React.MouseEvent) => void;
}

export default function CardStack({ note, onClick, onDisband, onTogglePin, onRename, onDeleteGroupFully }: CardStackProps) {
  const isPinned = note.isPinned || false;
  const childNotes = note.children || [];
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div 
      className="relative h-[320px] group cursor-pointer pl-3 pb-3"
      onClick={() => onClick(note)}
    >
      {/* Visual layered deck layout simulating folder stacks of files underneath */}
      <div className="absolute top-6 left-6 right-[-0.75rem] bottom-[-0.75rem] rounded-[36px] bg-[#e2e8f0]/40 dark:bg-slate-800/20 -z-30 transition-transform duration-500 group-hover:translate-x-1.5 group-hover:translate-y-1.5 border border-slate-205/30 dark:border-slate-800/10"></div>
      <div className="absolute top-3 left-3 right-[-0.25rem] bottom-[-0.25rem] rounded-[36px] bg-[#cbd5e1]/60 dark:bg-slate-800/40 -z-10 transition-transform duration-500 shadow-sm group-hover:-translate-x-1 group-hover:-translate-y-1 border border-slate-300/30 dark:border-slate-750/20"></div>
      
      {/* Top Main Folder Frame Card */}
      <div className="absolute inset-0 rounded-[32px] p-6 flex flex-col justify-between bg-[#f8fafc] dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-750 shadow-lg z-0 transition-all duration-500 group-hover:-translate-y-2 group-hover:-translate-x-2">
        <div>
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-3 relative z-10">
            <span className="px-3 py-1 bg-gradient-to-r from-teal-500/10 to-primary/10 text-primary dark:from-teal-500/20 dark:to-primary/20 dark:text-teal-300 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>卡片堆栈组</span>
            </span>
            
            <div className="flex gap-1.5 items-center relative">
              {/* Pin trigger */}
              <button 
                onClick={(e) => { e.stopPropagation(); onTogglePin?.(note.id, e); }}
                title={isPinned ? "取消侧边栏固定" : "固定到左侧侧边栏"}
                className={`p-1.5 rounded-full transition-all hover:scale-110 ${isPinned ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-amber-500 dark:text-slate-400'}`}
              >
                {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>

              {/* Dropdown Menu Trigger */}
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                title="更多选项"
                className="p-1.5 bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300/60 dark:hover:bg-slate-700 rounded-full transition-all text-slate-500 relative z-50"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} 
                  />
                  <div className="absolute right-0 top-8 w-44 bg-white dark:bg-slate-800 rounded-2xl border border-black/5 dark:border-white/10 shadow-2xl py-1.5 z-50 text-slate-700 dark:text-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        const newTitle = prompt('请输入新的堆栈组名称：', note.title);
                        if (newTitle && newTitle.trim()) {
                          onRename?.(note.id, newTitle.trim());
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-755 dark:text-slate-200 flex items-center gap-2 transition-colors"
                    >
                      <span>📝 重命名此组</span>
                    </button>
                    
                    {onDisband && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onDisband(note.id, e);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-755 dark:text-slate-200 flex items-center gap-2 transition-colors border-t border-black/5 dark:border-white/5"
                      >
                        <Undo2 className="w-3.5 h-3.5 text-orange-500" />
                        <span>解散组 (保留卡片)</span>
                      </button>
                    )}

                    {onDeleteGroupFully && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onDeleteGroupFully(note.id, e);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold text-red-650 dark:text-red-400 flex items-center gap-2 transition-colors border-t border-black/5 dark:border-white/5"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>彻底删除组及卡片</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <h3 className="text-lg font-extrabold mb-1.5 text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-primary transition-colors">
            <FolderOpen className="w-5 h-5 text-amber-500" />
            <span className="truncate">{note.title}</span>
          </h3>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-3 font-mono">
            内部包含 {childNotes.length} 张卡片
          </p>
          
          {/* List of child card previews */}
          <div className="space-y-1.5 max-h-[120px] overflow-hidden">
            {childNotes.length > 0 ? (
               <div className="space-y-1.5">
                 {childNotes.slice(0, 3).map((child, idx) => (
                   <div 
                     key={child.id || idx} 
                     className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 font-medium truncate flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
                   >
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                     <span className="truncate flex-1">{child.title || '无标题卡片'}</span>
                   </div>
                 ))}
                 {childNotes.length > 3 && (
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 pr-2 text-right">
                     + 还有 {childNotes.length - 3} 张卡片...
                   </p>
                 )}
               </div>
            ) : (
               <div className="h-16 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                 <p className="text-[11px] italic text-slate-400 dark:text-slate-500">空组合 (支持将主页卡片拖放合并于此)</p>
               </div>
            )}
          </div>
        </div>

        {/* Footer info inside stack card */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
             <span>📅 最近同步</span>
             <span>{note.date}</span>
          </div>
          <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">查看组</span>
        </div>
      </div>
    </div>
  );
}
