import React, { useState } from 'react';
import { PlusCircle, Star, Tag, Search, Settings, Video, Globe, FileText, ChevronDown } from 'lucide-react';
import { NoteType, Note } from '../types';

interface SidebarProps {
  onCreateClick: (type: NoteType) => void;
  onSettingsClick?: () => void;
  pinnedNotes?: Note[];
  onNoteClick?: (note: Note) => void;
}

export default function Sidebar({ onCreateClick, onSettingsClick, pinnedNotes = [], onNoteClick }: SidebarProps) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 bg-white/30 backdrop-blur-xl border-r border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col py-8 px-6 z-20">
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-primary tracking-tight">Digital Zen</h1>
        <p className="text-sm text-on-surface-variant opacity-70 mt-1">Personal Workspace</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        <div className="relative relative-group">
          <button 
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-on-surface-variant hover:bg-surface-variant/50 group"
          >
            <div className="flex items-center gap-4">
              <PlusCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium text-[15px]">创建卡片</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showCreateMenu && (
            <div className="flex flex-col space-y-1 mt-1 pl-4 border-l-2 border-primary/20 ml-6 pb-2">
              <button onClick={() => { onCreateClick('normal'); setShowCreateMenu(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-surface-variant/40 rounded-lg text-sm text-on-surface-variant w-full">
                <FileText className="w-4 h-4" /> 文本笔记
              </button>
              <button onClick={() => { onCreateClick('video'); setShowCreateMenu(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-surface-variant/40 rounded-lg text-sm text-on-surface-variant w-full">
                <Video className="w-4 h-4" /> 视频笔记
              </button>
              <button onClick={() => { onCreateClick('webpage'); setShowCreateMenu(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-surface-variant/40 rounded-lg text-sm text-on-surface-variant w-full">
                <Globe className="w-4 h-4" /> 网页收藏
              </button>
            </div>
          )}
        </div>

        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-on-surface hover:bg-surface-variant/50 bg-surface-variant/30 font-medium">
          <Star className="w-5 h-5 text-tertiary" fill="currentColor" />
          <span className="text-[15px]">收藏集合</span>
        </button>

        {pinnedNotes.length > 0 && (
          <div className="mt-4 px-2 space-y-1 py-2 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40 border border-slate-100/50 dark:border-white/5">
            <div className="flex items-center gap-1.5 px-2 pb-1.5 border-b border-black/5 dark:border-white/5">
              <Star className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">钉固区域 ({pinnedNotes.length})</span>
            </div>
            <div className="max-h-[160px] overflow-y-auto space-y-0.5 pt-1.5 creative-scrollbar scroll-smooth">
              {pinnedNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => onNoteClick?.(note)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-850 text-xs text-slate-600 dark:text-slate-350 hover:text-primary dark:hover:text-primary transition-all flex items-center justify-between group"
                >
                  <span className="truncate font-medium flex-1 pr-1">{note.title || '无标题文字'}</span>
                  <span className="text-[9px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">编辑</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-on-surface-variant hover:bg-surface-variant/50">
          <Tag className="w-5 h-5" />
          <span className="font-medium text-[15px]">标签筛选</span>
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-on-surface-variant hover:bg-surface-variant/50">
          <Search className="w-5 h-5" />
          <span className="font-medium text-[15px]">搜索</span>
        </button>
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/30">
        <button 
          onClick={onSettingsClick}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-on-surface-variant hover:bg-surface-variant/50 cursor-pointer"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium text-[15px]">设置</span>
        </button>
        
        <div className="mt-6 flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
            DZ
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-sm truncate text-on-surface">Admin User</p>
            <p className="text-xs text-on-surface-variant truncate opacity-80">Workspace Pro</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
