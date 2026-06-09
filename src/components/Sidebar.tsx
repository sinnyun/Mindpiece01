import React from 'react';
import { PlusCircle, Star, Tag, Search, Settings } from 'lucide-react';

interface SidebarProps {
  onCreateClick: () => void;
}

export default function Sidebar({ onCreateClick }: SidebarProps) {
  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 bg-white/30 backdrop-blur-xl border-r border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col py-8 px-6 z-20">
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-primary tracking-tight">Digital Zen</h1>
        <p className="text-sm text-on-surface-variant opacity-70 mt-1">Personal Workspace</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        <button 
          onClick={onCreateClick}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-on-surface-variant hover:bg-surface-variant/50 group"
        >
          <PlusCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-medium text-[15px]">创建卡片</span>
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-on-surface hover:bg-surface-variant/50 bg-surface-variant/30 font-medium">
          <Star className="w-5 h-5 text-tertiary" fill="currentColor" />
          <span className="text-[15px]">收藏集合</span>
        </button>
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
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-on-surface-variant hover:bg-surface-variant/50">
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
