import React, { useState } from 'react';
import { PlusCircle, Star, Tag, Search, Settings, Video, Globe, FileText, ChevronDown, Bell, Sun, Moon } from 'lucide-react';
import { NoteType, Note } from '../types';

interface SidebarProps {
  onCreateClick: (type: NoteType) => void;
  onSettingsClick?: () => void;
  pinnedNotes?: Note[];
  onNoteClick?: (note: Note) => void;
  allTags?: string[];
  activeTag?: string | null;
  onTagClick?: (tag: string | null) => void;
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export default function Sidebar({ 
  onCreateClick, 
  onSettingsClick, 
  pinnedNotes = [], 
  onNoteClick,
  allTags = [],
  activeTag = null,
  onTagClick,
  theme = 'light',
  setTheme
}: SidebarProps) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Combine seed tags with any custom tags to match the image precisely
  const seedTags = ['全部', '学习', '效率', '编程', 'React', '工具', '前端', '计划'];
  const displayTags = Array.from(new Set([...seedTags, ...allTags]));

  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#F9FAFC] dark:bg-slate-950 border-r border-[#E5E9F0] dark:border-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col py-8 px-5 z-20 font-sans">
      {/* Brand Header */}
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tight">Digital Zen</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">Personal Workspace</p>
      </div>
      
      {/* Primary Navigation Content */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
        <nav className="space-y-4">
          <div className="relative">
            <button 
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-850/80 transition-all duration-200 group shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-105 text-primary flex items-center justify-center dark:bg-blue-950/40">
                  <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">创建卡片</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showCreateMenu && (
              <div className="flex flex-col space-y-1 mt-1.5 pl-3 border-l-2 border-blue-500/20 ml-5 py-1 text-xs font-bold animate-in fade-in duration-200">
                <button onClick={() => { onCreateClick('normal'); setShowCreateMenu(false); }} className="flex items-center gap-2.5 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900 rounded-lg text-left w-full transition-colors">
                  <FileText className="w-3.5 h-3.5 text-blue-500" /> 文本笔记
                </button>
                <button onClick={() => { onCreateClick('video'); setShowCreateMenu(false); }} className="flex items-center gap-2.5 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900 rounded-lg text-left w-full transition-colors">
                  <Video className="w-3.5 h-3.5 text-purple-500" /> 视频笔记
                </button>
                <button onClick={() => { onCreateClick('webpage'); setShowCreateMenu(false); }} className="flex items-center gap-2.5 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900 rounded-lg text-left w-full transition-colors">
                  <Globe className="w-3.5 h-3.5 text-teal-500" /> 网页收藏
                </button>
              </div>
            )}
          </div>

          {/* Pinned Subscribed Area */}
          <div className="space-y-1.5 bg-white/60 dark:bg-slate-900/20 border border-slate-150 dark:border-slate-900 p-3 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.015)]">
            <div className="flex items-center gap-1.5 pb-1 px-1 border-b border-slate-100 dark:border-slate-900">
              <Star className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">
                订阅区域 ({pinnedNotes.length})
              </span>
            </div>
            {pinnedNotes.length > 0 ? (
              <div className="max-h-[160px] overflow-y-auto space-y-0.5 pt-1 scroll-smooth no-scrollbar">
                {pinnedNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => onNoteClick?.(note)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-850 text-[12px] text-slate-600 dark:text-slate-300 font-bold transition-all flex items-center justify-between group shadow-sm shadow-transparent hover:shadow-[0_2px_8px_rgba(0,0,0,0.015)]"
                  >
                    <span className="truncate pr-1 flex-1">{note.title || '无标题文字'}</span>
                    <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">点击</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] italic text-slate-400 dark:text-slate-600 py-2.5 text-center px-1">
                暂无订阅卡片（点击卡片钉子图标即可订阅）
              </p>
            )}
          </div>
        </nav>

        {/* Dynamic Tag Grid Section at the bottom of Nav panel */}
        <div className="mt-6 py-4 border-t border-slate-150 dark:border-slate-900">
          <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>标签:</span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 px-1 max-h-[160px] overflow-y-auto no-scrollbar">
            {displayTags.map(tag => {
              const matchesSelected = (tag === '全部' && activeTag === null) || (activeTag === tag);
              return (
                <button
                  key={tag}
                  onClick={() => onTagClick?.(tag === '全部' ? null : tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 transform active:scale-95 whitespace-nowrap border ${
                    matchesSelected 
                      ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-955 dark:border-blue-900/60 dark:text-blue-400 font-black shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-755 dark:hover:text-slate-200'
                  }`}
                >
                  {tag === '全部' ? '全部' : `#${tag}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="pt-4 border-t border-slate-150 dark:border-slate-900 mt-auto shrink-0">
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button 
            id="settings-btn"
            onClick={onSettingsClick}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 px-3 text-xs font-extrabold text-slate-600 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-sm shadow-black/5 cursor-pointer active:scale-95"
            title="高级设置"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>设置</span>
          </button>
          
          {/* Dark Mode toggle */}
          <button 
            onClick={() => setTheme?.(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-550 dark:text-slate-400 hover:text-amber-500 transition-all shadow-sm active:scale-95 cursor-pointer"
            title={theme === 'dark' ? '切换亮色外观' : '切换暗色外观'}
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          
          {/* Notification Alert Bell */}
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-550 dark:text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
            title="通知中心"
          >
            <Bell className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
