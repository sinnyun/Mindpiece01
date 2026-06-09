import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './components/SortableItem';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import NoteCard from './components/NoteCard';
import CardStack from './components/CardStack';
import EditPanel from './components/EditPanel';
import FloatingActionBar from './components/FloatingActionBar';
import { mockNotes } from './data';
import { Note, Category, NoteType } from './types';
import { Plus, CheckSquare, X } from 'lucide-react';

export default function App() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [defaultNoteType, setDefaultNoteType] = useState<NoteType>('normal');
  
  const [activeFilter, setActiveFilter] = useState<Category | '全部笔记'>('全部笔记');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [stackPath, setStackPath] = useState<Note[]>([]);

  // Selection mode for grouping
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filters: (Category | '全部笔记')[] = ['全部笔记', '灵感', '待办', '随笔', '堆栈'];
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentStackId = stackPath.length > 0 ? stackPath[stackPath.length - 1].id : undefined;

  const currentLevelNotes = notes.filter(n => n.parentId === currentStackId);

  const filteredNotes = currentLevelNotes.filter(n => {
    const matchesFilter = activeFilter === '全部笔记' ? true : n.category === activeFilter;
    if (!matchesFilter) return false;
    
    if (activeTag && !n.tags.includes(activeTag)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const displayedNotes = filteredNotes.map(n => {
    if (n.isStack) {
      const children = notes.filter(child => child.parentId === n.id);
      return { ...n, children, childCount: children.length };
    }
    return n;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Reordering works visually inside the context, but state updating with flat array can be complex.
      // We will reorder inside notes array
      setNotes((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveNote = (updatedNote: Note) => {
    if (!updatedNote.id) {
      setNotes([{ ...updatedNote, id: Date.now().toString(), parentId: currentStackId }, ...notes]);
    } else {
      setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
    }
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // if stack, should we delete children? For now yes.
    setNotes(notes.filter(n => n.id !== id && n.parentId !== id));
  };

  const handleCardClick = (note: Note | null, defaultType: NoteType = 'normal') => {
    if (!note) {
      setSelectedNote(null);
      setDefaultNoteType(defaultType);
      setIsPanelOpen(true);
      return;
    }

    if (isSelectionMode) {
      toggleSelection(note.id);
      return;
    }

    if (note.isStack) {
      setStackPath([...stackPath, note]);
    } else {
      setSelectedNote(note);
      setIsPanelOpen(true);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGroupSelected = () => {
    if (selectedIds.length < 2) return;
    
    const newGroupId = Date.now().toString();
    const newGroup: Note = {
      id: newGroupId,
      title: '新建卡片组',
      content: '多张卡片组合',
      category: '堆栈',
      date: new Date().toLocaleDateString('zh-CN'),
      tags: [],
      isStack: true,
      parentId: currentStackId
    };
    
    setNotes(prev => {
      const updated = prev.map(n => selectedIds.includes(n.id) ? { ...n, parentId: newGroupId } : n);
      return [newGroup, ...updated];
    });
    
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  return (
    <div className="flex min-h-screen text-on-surface">
      <Sidebar onCreateClick={(type) => handleCardClick(null, type)} />
      
      <main className="flex-1 ml-[280px] relative">
        <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        
        <div className="pt-32 px-10 pb-24 max-w-7xl mx-auto">
          
          {/* Stack Breadcrumb */}
          {stackPath.length > 0 && (
            <div className="flex items-center gap-2 mb-6 text-sm font-medium text-on-surface-variant relative z-10">
              <button onClick={() => setStackPath([])} className="hover:text-primary transition-colors">所有笔记</button>
              {stackPath.map((stack, idx) => (
                <React.Fragment key={stack.id}>
                  <span className="text-outline-variant">/</span>
                  <button 
                    onClick={() => setStackPath(stackPath.slice(0, idx + 1))}
                    className={`hover:text-primary transition-colors ${idx === stackPath.length - 1 ? 'text-on-surface' : ''}`}
                  >
                    {stack.title}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Filters & Actions */}
          <div className="flex flex-col gap-4 mb-10 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-3">
                {filters.map(filter => (
                  <button 
                    key={filter}
                    onClick={() => { setActiveFilter(filter); setIsSelectionMode(false); setSelectedIds([]); }}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                      activeFilter === filter 
                        ? 'bg-primary text-white shadow-primary/20' 
                        : 'bg-white/60 hover:bg-white/90 text-on-surface-variant border border-white/50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                {isSelectionMode ? (
                  <>
                    <button 
                      onClick={handleGroupSelected}
                      disabled={selectedIds.length < 2}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedIds.length >= 2 ? 'bg-primary text-white shadow-sm' : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'}`}
                    >
                      组合 ({selectedIds.length})
                    </button>
                    <button 
                      onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                      className="p-2 rounded-full bg-white/60 hover:bg-white/90 text-on-surface-variant border border-white/50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsSelectionMode(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium bg-white/60 hover:bg-white/90 text-on-surface-variant border border-white/50 shadow-sm transition-all"
                  >
                    <CheckSquare className="w-4 h-4" /> 选择组合
                  </button>
                )}
              </div>
            </div>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-on-surface-variant mr-1">标签:</span>
                <button
                  onClick={() => setActiveTag(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeTag === null ? 'bg-primary/20 text-primary' : 'bg-white/40 text-on-surface-variant hover:bg-white/60'
                  }`}
                >
                  全部
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      activeTag === tag ? 'bg-primary/20 text-primary' : 'bg-white/40 text-on-surface-variant hover:bg-white/60'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid Layout */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
              <SortableContext
                items={displayedNotes.map(n => n.id)}
                strategy={rectSortingStrategy}
              >
                {displayedNotes.map(note => (
                  <SortableItem key={note.id} id={note.id} disabled={isSelectionMode}>
                    <div className="relative h-full">
                      {isSelectionMode && (
                         <div 
                           className="absolute -top-3 -right-3 z-30"
                           onClick={(e) => { e.stopPropagation(); toggleSelection(note.id); }}
                         >
                           <div className={`w-6 h-6 rounded-inner shadow-sm border-2 flex items-center justify-center rounded-full cursor-pointer transition-colors ${selectedIds.includes(note.id) ? 'bg-primary border-primary text-white' : 'bg-white border-outline-variant text-transparent hover:border-primary/50'}`}>
                             {selectedIds.includes(note.id) && <Plus className="w-4 h-4 rotate-45" />}
                           </div>
                         </div>
                      )}
                      <div className={`h-full transition-all duration-300 ${isSelectionMode ? (selectedIds.includes(note.id) ? 'ring-4 ring-primary ring-offset-2 ring-offset-transparent rounded-3xl scale-[0.98]' : 'opacity-60 scale-95 hover:opacity-100 hover:scale-[0.98] cursor-pointer') : ''}`}
                           onClick={isSelectionMode ? undefined : () => handleCardClick(note)}>
                        {note.isStack ? (
                          <CardStack note={note} onClick={() => isSelectionMode ? toggleSelection(note.id) : handleCardClick(note)} />
                        ) : (
                          <NoteCard note={note} onClick={() => isSelectionMode ? toggleSelection(note.id) : handleCardClick(note)} onDelete={handleDeleteNote} />
                        )}
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>

              {!isSelectionMode && (
                <button 
                  onClick={() => handleCardClick(null)}
                  className="border-2 border-dashed border-outline-variant/40 rounded-3xl p-6 flex flex-col items-center justify-center h-[280px] hover:border-primary/50 hover:bg-primary/5 transition-all group bg-white/20"
                >
                  <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all mb-4 shadow-sm">
                    <Plus className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-bold text-on-surface-variant group-hover:text-primary">点击创建新卡片</p>
                  <p className="text-sm text-on-surface-variant/70 mt-2">记录此时此刻的想法</p>
                </button>
              )}
            </div>
          </DndContext>
        </div>

        {!isSelectionMode && <FloatingActionBar onCreateClick={(type) => handleCardClick(null, type)} />}

        <EditPanel 
          note={selectedNote} 
          isOpen={isPanelOpen} 
          defaultNoteType={defaultNoteType}
          onClose={() => setIsPanelOpen(false)} 
          onSave={handleSaveNote}
        />
      </main>
    </div>
  );
}
