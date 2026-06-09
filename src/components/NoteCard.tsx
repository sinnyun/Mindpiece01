import React from 'react';
import { Note } from '../types';
import { Edit2, Trash2, MoveRight, Pin, PinOff, Play, Globe, FolderPlus, LogOut } from 'lucide-react';
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

  // 1. Determine background colors based on category/type
  let bgClass = "bg-white border-slate-200/60 dark:bg-slate-900 border-slate-800/60 text-slate-800 dark:text-slate-200";
  let badgeClass = "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-container";
  
  if (note.noteType === 'video') {
    bgClass = "bg-[#f5f3ff]/90 border-purple-200/70 dark:bg-purple-950/40 dark:border-purple-800/60 text-purple-950 dark:text-purple-200";
    badgeClass = "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300";
  } else if (note.noteType === 'webpage') {
    bgClass = "bg-[#f0fdfa]/90 border-teal-200/70 dark:bg-teal-950/40 dark:border-teal-800/60 text-teal-950 dark:text-teal-200";
    badgeClass = "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300";
  } else if (note.category === '灵感') {
    bgClass = "bg-[#fffbeb]/90 border-amber-200/70 dark:bg-amber-950/40 dark:border-amber-800/60 text-amber-900 dark:text-amber-200";
    badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300";
  } else if (note.category === '待办') {
    bgClass = "bg-[#f0f9ff]/90 border-sky-200/70 dark:bg-sky-950/40 dark:border-sky-800/60 text-sky-900 dark:text-sky-200";
    badgeClass = "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300";
  } else if (note.category === '随笔') {
    bgClass = "bg-[#fff5f5]/90 border-rose-200/70 dark:bg-rose-950/40 dark:border-rose-800/60 text-rose-900 dark:text-rose-200";
    badgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300";
  }

  // Fallback high-quality mock thumbnails if none assigned
  const mockVideoThumb = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600";
  const mockWebpageThumb = "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600";

  return (
    <div 
      className={`glass-card border rounded-3xl p-6 flex flex-col h-[320px] cursor-pointer group shadow-[0_2px_12px_rgba(0,0,0,0.015)] hover:shadow-xl transition-all relative overflow-hidden ${bgClass}`}
      onClick={() => onClick(note)}
    >
      {/* 2. Top visual thumbnail if type is video or webpage */}
      {note.noteType === 'video' && (
        <div className="-mx-6 -mt-6 mb-3 h-28 overflow-hidden rounded-t-3xl relative bg-slate-950 group/thumb">
          <img 
            src={note.imageUrl || mockVideoThumb} 
            alt="video duration thumbnail" 
            className="w-full h-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-650 flex items-center justify-center text-white shadow-lg backdrop-blur-[2px] transition-transform duration-300 group-hover/thumb:scale-110">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
          <span className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-mono text-white tracking-widest font-bold">14:28</span>
          <div className="absolute bottom-0 left-0 h-1 bg-red-650 w-2/3"></div> {/* Video play line */}
        </div>
      )}

      {note.noteType === 'webpage' && (
        <div className="-mx-6 -mt-6 mb-3 h-28 overflow-hidden rounded-t-3xl relative bg-slate-50 border-b border-black/5 dark:border-white/5 dark:bg-slate-900 group/thumb">
          {/* Mini browser mock header bar */}
          <div className="h-6 px-3 bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5 border-b border-black/5 dark:border-white/5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <div className="flex-1 max-w-[130px] h-4 bg-white/70 dark:bg-slate-900/70 border border-black/5 dark:border-white/5 rounded-full mx-auto flex items-center justify-center text-[8px] text-slate-400 font-mono truncate px-1">
              {note.webpageUrl || 'zen.collect'}
            </div>
          </div>
          <img 
            src={note.imageUrl || note.webpageScreenshotUrl || mockWebpageThumb} 
            alt="webpage snapshot visual" 
            className="w-full h-[calc(100%-24px)] object-cover transition-transform duration-500 group-hover:scale-105" 
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* 3. Header Action Ribbon */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
            {note.noteType === 'video' ? '📺 视频' : note.noteType === 'webpage' ? '🌐 网页' : note.category}
          </span>
          {note.parentId && note.parentId !== 'root' && (() => {
            const parentFolder = allFolders.find(f => f.id === note.parentId);
            return (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-mono flex items-center gap-1 font-bold">
                <span>📁</span>
                <span className="max-w-[70px] truncate">{parentFolder ? parentFolder.name : '组内'}</span>
              </span>
            );
          })()}
        </div>
        
        <div className="flex gap-1.5 items-center">
          {/* Pin Trigger */}
          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePin?.(note.id, e); }}
            title={isPinned ? "取消侧边栏固定" : "固定到左侧侧边栏"}
            className={`p-1.5 rounded-full transition-all hover:scale-110 ${isPinned ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-850 text-slate-500 hover:text-amber-500 dark:text-slate-400'}`}
          >
            {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          {/* Delete Button (visible on hover) */}
          <button 
            title="删除笔记卡片"
            className="p-1.5 bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-850 dark:hover:bg-rose-600 rounded-full transition-all text-slate-500 opacity-0 group-hover:opacity-100"
            onClick={onDelete ? (e) => onDelete(note.id, e) : undefined}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Title & Content */}
      <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">{note.title || '无标题记录'}</h3>
      
      {/* Tags line */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 max-h-5 overflow-hidden">
          {note.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">#{tag}</span>
          ))}
        </div>
      )}

      <div 
        className="flex-1 overflow-hidden relative" 
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
      >
        <div className="prose prose-sm prose-primary max-w-none text-slate-600 dark:text-slate-350 text-[13px] leading-relaxed pb-2">
          {note.content ? (
            <Markdown remarkPlugins={[remarkGfm]}>
              {note.content.length > 130 ? note.content.slice(0, 130) + '...' : note.content}
            </Markdown>
          ) : (
            <p className="italic text-slate-400 dark:text-slate-600">点击进入编辑文档内容并在 Yjs 空间实现静默保存...</p>
          )}
        </div>
      </div>

      {/* 5. Footer Actions: Date and Group Join Select Menu */}
      <div className="mt-2 pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center relative z-10">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono font-medium">{note.date}</span>
        
        <div className="flex gap-2 items-center">
          {/* Exit Group trigger */}
          {note.parentId && note.parentId !== 'root' && (
            <button 
              title="退出并移出当前组"
              onClick={(e) => { e.stopPropagation(); onLeaveGroup?.(note.id, e); }}
              className="flex items-center gap-1.5 p-1 px-2.5 rounded-lg border border-slate-200/60 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-850 text-[10px] font-bold text-slate-500 dark:text-slate-400 transition-all"
            >
              <LogOut className="w-3 h-3 text-rose-500" />
              <span>退出组</span>
            </button>
          )}

          {/* Join Group Selector */}
          {(!note.parentId || note.parentId === 'root') && allFolders.length > 0 && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <select 
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onJoinGroup?.(note.id, e.target.value);
                  }
                }}
                className="text-[10px] font-bold cursor-pointer bg-white/90 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-lg px-2 py-1 text-slate-500 hover:text-primary outline-none transition-all max-w-[124px]"
              >
                <option value="" disabled>📂 加入组合...</option>
                {allFolders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          <button className="flex items-center gap-1 text-primary text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
            <MoveRight className="w-3 h-3" /> 编辑
          </button>
        </div>
      </div>
    </div>
  );
}
