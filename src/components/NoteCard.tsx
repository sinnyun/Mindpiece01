import React from 'react';
import { Note } from '../types';
import { Edit2, Trash2, MoveRight, Pin, PinOff, Play, Globe, FolderPlus, LogOut, Video } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onTogglePin?: (id: string, e: React.MouseEvent) => void;
  onJoinGroup?: (id: string, folderId: string) => void;
  onLeaveGroup?: (id: string, e: React.MouseEvent) => void;
  allFolders?: { id: string; name: string }[];
}

export default function NoteCard({ 
  note, 
  onClick, 
  onDelete, 
  onTogglePin, 
  onJoinGroup, 
  onLeaveGroup, 
  allFolders = [] 
}: NoteCardProps) {
  
  const isPinned = note.isPinned || false;

  // 1. Maintain gorgeous crisp light/dark mode card wrappers strictly matching the screenshot details
  const bgClass = "bg-white border-[#E5E9F0] dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-100";
  
  // Custom Badge category styles
  let badgeClass = "bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-950/40 dark:text-blue-400";
  let categoryLabel: string = note.category;

  if (note.noteType === 'video') {
    badgeClass = "bg-purple-50 text-purple-600 border border-purple-100/50 dark:bg-purple-950/40 dark:text-purple-400";
    categoryLabel = "视频";
  } else if (note.noteType === 'webpage') {
    badgeClass = "bg-teal-50 text-teal-600 border border-teal-100/50 dark:bg-teal-950/40 dark:text-teal-400";
    categoryLabel = "网页";
  } else if (note.category === '灵感') {
    badgeClass = "bg-[#fffbeb] text-amber-600 border border-amber-100/50 dark:bg-amber-950/40 dark:text-amber-400";
    categoryLabel = "灵感";
  } else if (note.category === '待办') {
    badgeClass = "bg-[#f0f9ff] text-sky-650 border border-sky-100/50 dark:bg-sky-950/40 dark:text-sky-400";
    categoryLabel = "待办";
  } else if (note.category === '随笔') {
    badgeClass = "bg-[#fff5f5] text-rose-600 border border-rose-100/50 dark:bg-rose-950/40 dark:text-rose-400";
    categoryLabel = "随笔";
  }

  // Fallback high-quality mock thumbnails if none assigned
  const mockWebpageThumb = "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600";

  return (
    <div 
      className={`border rounded-[28px] p-6 flex flex-col h-[320px] cursor-pointer group shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${bgClass}`}
      onClick={() => onClick(note)}
    >
      {/* 2. Top visual thumbnail if type is video or webpage */}
      {note.noteType === 'video' && (
        <div className="-mx-6 -mt-6 mb-3 h-28 overflow-hidden rounded-t-[26px] relative select-none group/thumb flex items-center justify-center">
          {/* Authentic purple wavy gradient mimicking the second video card in the screenshot */}
          <div 
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{
              background: `radial-gradient(at 0% 0%, #c084fc 0px, transparent 50%), radial-gradient(at 100% 100%, #3b82f6 0px, transparent 50%), linear-gradient(135deg, #7c3aed 0%, #1d4ed8 100%)`
            }}
          />
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shadow-lg backdrop-blur-[4px] border border-white/30 transition-transform duration-300 group-hover/thumb:scale-115">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
          <span className="absolute bottom-2 right-3 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-mono text-white tracking-wider font-bold">14:28</span>
        </div>
      )}

      {note.noteType === 'webpage' && (
        <div className="-mx-6 -mt-6 mb-3 h-28 overflow-hidden rounded-t-[26px] relative bg-slate-50 border-b border-[#E5E9F0] dark:border-slate-800 dark:bg-slate-900 group/thumb flex flex-col">
          {/* Mini browser mock header bar */}
          <div className="h-7 px-3 bg-slate-100/80 dark:bg-slate-800/80 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            <div className="flex-1 max-w-[140px] h-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-md mx-auto flex items-center justify-center text-[8px] text-slate-400 font-mono truncate px-1.5 select-none scale-90">
              {note.webpageUrl || 'https://vitejs.dev/'}
            </div>
          </div>
          <div className="flex-1 w-full bg-slate-900/5 overflow-hidden relative">
            <img 
              src={note.imageUrl || note.webpageScreenshotUrl || "https://images.unsplash.com/photo-1541462608141-27b2c74530a2?auto=format&fit=crop&q=80&w=600"} 
              alt="webpage snapshot visual" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* 3. Header Action Ribbon */}
      <div className="flex justify-between items-start mb-2.5 relative z-10">
        <div className="flex items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${badgeClass}`}>
            {categoryLabel}
          </span>
          {note.parentId && note.parentId !== 'root' && (() => {
            const parentFolder = allFolders.find(f => f.id === note.parentId);
            return (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400 font-mono flex items-center gap-1 font-bold border border-slate-200/50 dark:border-slate-750">
                <span>📁</span>
                <span className="max-w-[70px] truncate">{parentFolder ? parentFolder.name : '堆栈'}</span>
              </span>
            );
          })()}
        </div>
        
        <div className="flex gap-1.5 items-center">
          {/* Pinned Icon Button matching screenshot */}
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onTogglePin?.(note.id, e); }}
            title={isPinned ? "取消固定" : "固定到左侧侧边栏"}
            className={`p-1.5 rounded-lg transition-all hover:scale-105 ${isPinned ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20' : 'text-slate-400 hover:text-amber-500'}`}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
          </button>

          {/* Delete Button (visible on hover) */}
          <button 
            type="button"
            title="删除此笔记"
            className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all text-slate-400 opacity-0 group-hover:opacity-100"
            onClick={onDelete ? (e) => onDelete(note.id, e) : undefined}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Title & Tags info */}
      <h3 className="text-sm font-black mb-1.5 text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">{note.title || '无标题记录'}</h3>
      
      {/* Show Tag badges under title */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 max-h-5 overflow-hidden">
          {note.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/50 text-[9px] text-slate-500 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400 font-bold">#{tag}</span>
          ))}
        </div>
      )}

      {/* Styled Checklist preview content */}
      <div 
        className="flex-1 overflow-hidden relative mt-1" 
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
      >
        <div className="prose prose-sm prose-primary max-w-none text-slate-500 dark:text-slate-400 text-[12px] leading-relaxed pb-2 font-medium">
          {note.content ? (
            <Markdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, children}) => <p className="m-0 leading-relaxed font-bold text-slate-500/90 dark:text-slate-400/90">{children}</p>,
                ul: ({node, children}) => <ul className="pl-0 my-1 list-none space-y-1">{children}</ul>,
                ol: ({node, children}) => <ol className="pl-4 my-1 list-decimal space-y-1">{children}</ol>,
                li: ({node, children, ...props}) => {
                  return (
                    <li className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300" {...props}>
                      {children}
                    </li>
                  );
                },
                input: ({node, ...props}) => {
                  if (props.type === 'checkbox') {
                    return (
                      <input 
                        type="checkbox" 
                        {...props} 
                        className="w-3.5 h-3.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500/25 pointer-events-none mr-1.5 cursor-not-allowed shrink-0 mt-0.5 flex" 
                      />
                    );
                  }
                  return <input {...props} />;
                }
              }}
            >
              {note.content.length > 130 ? note.content.slice(0, 130) + '...' : note.content}
            </Markdown>
          ) : (
            <p className="italic text-slate-400 dark:text-slate-500">点击进入编辑文档内容并在 Yjs 空间实现静默保存...</p>
          )}
        </div>
      </div>

      {/* 5. Footer Actions: Date and Group Join dropdown */}
      <div className="mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold">{note.date}</span>
        
        <div className="flex gap-2 items-center">
          {/* Exit Group trigger */}
          {note.parentId && note.parentId !== 'root' && (
            <button 
              type="button"
              title="移出此堆栈组"
              onClick={(e) => { e.stopPropagation(); onLeaveGroup?.(note.id, e); }}
              className="flex items-center gap-1.5 p-1 px-2 rounded-lg border border-slate-200/50 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/20 text-[9px] font-bold text-slate-500 dark:text-slate-400 transition-all active:scale-95"
            >
              <LogOut className="w-2.5 h-2.5 text-rose-500" />
              <span>移出组</span>
            </button>
          )}

          {/* Join Group Selector input style */}
          {(!note.parentId || note.parentId === 'root') && allFolders.length > 0 && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <select 
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onJoinGroup?.(note.id, e.target.value);
                  }
                }}
                className="text-[9px] font-bold cursor-pointer bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border border-slate-200 dark:border-slate-750 rounded-lg px-1.5 py-0.5 text-slate-500 hover:text-blue-500 outline-none transition-all max-w-[110px]"
              >
                <option value="" disabled>📁 加入组...</option>
                {allFolders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          <button className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 text-[10px] font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
            <MoveRight className="w-3 h-3" /> 编辑
          </button>
        </div>
      </div>
    </div>
  );
}
