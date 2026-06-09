import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
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
import SettingsModal from './components/SettingsModal';
import FloatingActionBar from './components/FloatingActionBar';
import { Note, Category, NoteType } from './types';
import { Plus, CheckSquare, X, Wifi } from 'lucide-react';

import { useSettingsStore, useWorkspaceStore } from './store';
import { YjsManager } from './core/yjs/YjsManager';

export default function App() {
  const isLoaded = useSettingsStore((state) => state.isLoaded);
  const theme = useSettingsStore((state) => state.theme);
  const nodes = useWorkspaceStore((state) => state.nodes);
  
  const addFile = useWorkspaceStore((state) => state.addFile);
  const addFolder = useWorkspaceStore((state) => state.addFolder);
  const deleteNode = useWorkspaceStore((state) => state.deleteNode);
  const renameNode = useWorkspaceStore((state) => state.renameNode);
  const updateNode = useWorkspaceStore((state) => state.updateNode);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [defaultNoteType, setDefaultNoteType] = useState<NoteType>('normal');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [activeFilter, setActiveFilter] = useState<Category | '全部笔记'>('全部笔记');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [stackPath, setStackPath] = useState<Note[]>([]);

  // Selection mode for grouping
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filters: (Category | '全部笔记')[] = ['全部笔记', '灵感', '待办', '随笔', '堆栈'];

  // Apply dark theme class body-wide dynamically
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Derived notes array mapped directly from our Local-First flat tree
  const rawNotesList: Note[] = Object.values(nodes).map((node) => {
    const isStack = node.type === 'folder';
    const manager = YjsManager.getInstance();
    const page = manager.blocksuiteWorkspace.getPage(node.id);
    
    // Real-time block tree summary extraction for list card face
    let previewContent = '';
    if (page) {
      const blocks = page.getBlockByFlavour('affine:paragraph');
      blocks.forEach((model: any) => {
        if (model.text) {
          previewContent += model.text.toString() + '\n';
        }
      });
      previewContent = previewContent.trim();
    }

    return {
      id: node.id,
      title: node.name,
      content: previewContent,
      category: (node.category || (isStack ? '堆栈' : '随笔')) as Category,
      date: node.date || new Date().toLocaleDateString('zh-CN'),
      tags: node.tags || (isStack ? ['组'] : ['本地笔记']),
      isStack: isStack,
      parentId: node.parentId === 'root' ? undefined : node.parentId,
      noteType: node.noteType || 'normal',
      videoUrl: node.videoUrl,
      webpageUrl: node.webpageUrl,
      webpageScreenshotUrl: node.webpageScreenshotUrl,
      versions: node.versions || [],
      isPinned: node.isPinned || false,
    } as Note;
  });

  // Guarantee key uniqueness of nodes inside notesList to prevent runtime key collisions
  const notesListMap = new Map<string, Note>();
  rawNotesList.forEach(note => {
    if (note.id) {
      notesListMap.set(note.id, note);
    }
  });
  const notesList = Array.from(notesListMap.values());

  const allTags = Array.from(new Set(notesList.flatMap(n => n.tags || [])));

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

  const isFiltering = !!(searchQuery.trim() || activeTag || activeFilter !== '全部笔记');

  const filteredNotes = notesList.filter(n => {
    // If we are currently navigated inside a folder stack, we should only display notes that are inside this stack:
    if (currentStackId !== undefined) {
      if (n.parentId !== currentStackId) return false;
    } else {
      // If we are at the root level (no navigations open) and we are NOT filtering, we only show root level notes (having parentId undefined):
      if (!isFiltering) {
        return n.parentId === undefined;
      }
    }

    // Checking if this node matches:
    const matchesThisNode = (() => {
      if (activeFilter === '堆栈') {
        return n.isStack;
      }
      const matchesFilter = activeFilter === '全部笔记' ? true : n.category === activeFilter;
      if (!matchesFilter) return false;
      
      if (activeTag && !n.tags?.includes(activeTag)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags?.some(t => t.toLowerCase().includes(q));
      }
      return true;
    })();

    if (matchesThisNode) return true;

    // If it's a stack (folder), it also matches if any of its recursive children match!
    if (n.isStack) {
      const children = notesList.filter(child => child.parentId === n.id);
      return children.some(child => {
        const matchesFilter = activeFilter === '全部笔记' ? true : child.category === activeFilter;
        if (!matchesFilter) return false;
        
        if (activeTag && !child.tags?.includes(activeTag)) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return child.title.toLowerCase().includes(q) || child.content.toLowerCase().includes(q) || child.tags?.some(t => t.toLowerCase().includes(q));
        }
        return true;
      });
    }

    return false;
  });

  // Stacks are sorted at top, then simple notes alphabetically to keep cards responsive in tree
  // Map and deduplicate displayedNotes by ID to guarantee NO duplicate keys can ever exist inside DOM
  const rawDisplayedNotes = filteredNotes.map(n => {
    if (n.isStack) {
      const allDirectChildren = notesList.filter(child => child.parentId === n.id);
      // If filtering, we only list matching children inside the folder preview!
      const displayedChildren = isFiltering
        ? allDirectChildren.filter(child => {
            const matchesFilter = activeFilter === '全部笔记' ? true : child.category === activeFilter;
            if (!matchesFilter) return false;
            
            if (activeTag && !child.tags?.includes(activeTag)) return false;

            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              return child.title.toLowerCase().includes(q) || child.content.toLowerCase().includes(q) || child.tags?.some(t => t.toLowerCase().includes(q));
            }
            return true;
          })
        : allDirectChildren;

      return { ...n, children: displayedChildren, childCount: allDirectChildren.length };
    }
    return n;
  });

  const displayedNotesMap = new Map<string, typeof rawDisplayedNotes[number]>();
  rawDisplayedNotes.forEach(note => {
    if (note.id) {
      displayedNotesMap.set(note.id, note);
    }
  });

  const displayedNotes = Array.from(displayedNotesMap.values()).sort((a, b) => {
    if (a.isStack && !b.isStack) return -1;
    if (!a.isStack && b.isStack) return 1;
    return a.title.localeCompare(b.title);
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    if (activeIdStr === overIdStr) return;

    const draggedNode = nodes[activeIdStr];
    const targetNode = nodes[overIdStr];

    // If a node is dragged and dropped onto a stacked folder, auto-join that group!
    if (draggedNode && targetNode && targetNode.type === 'folder' && draggedNode.type === 'file') {
      const confirmJoin = window.confirm(`是否确定将卡片 "${draggedNode.name}" 加入组 "${targetNode.name}"？`);
      if (confirmJoin) {
        updateNode(activeIdStr, { parentId: overIdStr });
      }
    }
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes[id];
    if (node) {
      updateNode(id, { isPinned: !node.isPinned });
    }
  };

  const handleJoinGroup = (id: string, folderId: string) => {
    const node = nodes[id];
    if (node) {
      updateNode(id, { parentId: folderId });
    }
  };

  const handleLeaveGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes[id];
    if (node) {
      updateNode(id, { parentId: 'root' });
    }
  };

  const handleDisbandGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirm = window.confirm('解散此堆栈组后，内部所有的笔记卡片将重新回归主页散贴列表并保留，是否确定？');
    if (isConfirm) {
      Object.values(nodes).forEach(node => {
        if (node.parentId === id) {
          updateNode(node.id, { parentId: 'root' });
        }
      });
      deleteNode(id);
    }
  };

  const handleSaveNote = (updatedNote: Note) => {
    const parentId = currentStackId || 'root';
    if (updatedNote.id && nodes[updatedNote.id]) {
       // Save metadata changes (like title renaming and other parameters)
       updateNode(updatedNote.id, {
         name: updatedNote.title,
         category: updatedNote.category,
         tags: updatedNote.tags,
         noteType: updatedNote.noteType,
         videoUrl: updatedNote.videoUrl,
         webpageUrl: updatedNote.webpageUrl,
         webpageScreenshotUrl: updatedNote.webpageScreenshotUrl,
         versions: updatedNote.versions
       });
    } else {
       // Create fresh node directly in Yjs memory workspace Map
       const newId = updatedNote.id || 'doc-' + Math.random().toString(36).substring(2, 11);
       if (updatedNote.isStack) {
         addFolder(newId, updatedNote.title, parentId, {
           category: '堆栈',
           tags: ['组'],
           date: updatedNote.date || new Date().toLocaleDateString('zh-CN'),
         });
       } else {
         addFile(newId, updatedNote.title, parentId, {
           category: updatedNote.category || '随笔',
           tags: updatedNote.tags || ['本地笔记'],
           date: updatedNote.date || new Date().toLocaleDateString('zh-CN'),
           noteType: updatedNote.noteType || 'normal',
           videoUrl: updatedNote.videoUrl,
           webpageUrl: updatedNote.webpageUrl,
           webpageScreenshotUrl: updatedNote.webpageScreenshotUrl,
           versions: updatedNote.versions || [],
         });
         
         // Initialize empty BlockSuite document layout immediately for direct editing
         const manager = YjsManager.getInstance();
         let page = manager.blocksuiteWorkspace.getPage(newId);
         if (!page) {
           page = manager.blocksuiteWorkspace.createPage({ id: newId });
           page.load(() => {
             const pageBlockId = page.addBlock('affine:page', { title: new page.Text('') });
             page.addBlock('affine:surface', {}, pageBlockId);
             const noteId = page.addBlock('affine:note', {}, pageBlockId);
             page.addBlock('affine:paragraph', { text: new page.Text(updatedNote.content || '') }, noteId);
             page.resetHistory();
           });
         }
       }
    }
  };

  const handleRenameGroup = (id: string, newTitle: string) => {
    const node = nodes[id];
    if (node) {
      updateNode(id, { name: newTitle });
    }
  };

  const handleDeleteGroupFully = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes[id];
    const name = node ? node.name : '此堆栈组';
    const nestedChildren = Object.values(nodes).filter(n => n.parentId === id);
    const count = nestedChildren.length;
    const isConfirm = window.confirm(`警告：您确认要彻底删除堆栈组 "${name}" 极其内部包含的 ${count} 张卡片吗？\n\n此操作将会永久抹除这些纪录！`);
    if (isConfirm) {
      nestedChildren.forEach(child => {
        deleteNode(child.id);
      });
      deleteNode(id);
    }
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes[id];
    const name = node ? node.name : '此卡片';
    const isConfirm = window.confirm(`是否确定要删除卡片 "${name}"？此操作不可撤销。`);
    if (isConfirm) {
      deleteNode(id);
    }
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
    
    const newGroupId = 'doc-' + Math.random().toString(36).substring(2, 11);
    addFolder(newGroupId, '新建卡片组', currentStackId || 'root');
    
    // Reparent selected children in Yjs Map
    const manager = YjsManager.getInstance();
    selectedIds.forEach((childId) => {
      const node = nodes[childId];
      if (node) {
        manager.workspaceMap.set(childId, { ...node, parentId: newGroupId });
      }
    });
    
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 font-sans p-6 text-center">
        <div className="relative flex items-center justify-center mb-8">
          <div className="w-16 h-16 border-4 border-solid border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
          <Wifi className="w-6 h-6 text-blue-400 absolute animate-pulse" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Mindpiece01</h1>
        <p className="text-sm text-slate-400 font-mono max-w-md leading-relaxed">
          正在连接 Local-First 实时数据伴随服务，同步内存 Yjs CRDT 数据集...
        </p>
        <p className="text-xs text-slate-500 mt-6 font-mono border border-slate-800 rounded-full px-4 py-1 bg-slate-950/50">
          ws://127.0.0.1:3000/ws
        </p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen text-on-surface bg-transparent transition-colors duration-300`}>
      <Sidebar 
        onCreateClick={(type) => handleCardClick(null, type)} 
        onSettingsClick={() => setIsSettingsOpen(true)}
        pinnedNotes={notesList.filter(n => n.isPinned)}
        onNoteClick={(note) => { setSelectedNote(note); setIsPanelOpen(true); }}
      />
      
      <main className="flex-1 ml-[280px] relative">
        <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        
        <div className="pt-32 px-10 pb-24 max-w-7xl mx-auto">
          
          {/* Stack Breadcrumb Container (Absolute positioned to prevent layout shift) */}
          <div className="absolute top-24 left-10 mt-1 h-6">
            {stackPath.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant relative z-10 animate-in fade-in slide-in-from-left-2 duration-300">
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
          </div>

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
                        ? 'bg-primary text-white shadow-primary/20 animate-none' 
                        : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-900/90 text-on-surface-variant border border-white/50 dark:border-slate-800/50'
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
                      className="p-2 rounded-full bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-900/90 text-on-surface-variant border border-white/50 dark:border-slate-800/50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsSelectionMode(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-900/90 text-on-surface-variant border border-white/50 dark:border-slate-800/50 shadow-sm transition-all"
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
                    activeTag === null ? 'bg-primary/20 text-primary' : 'bg-white/40 dark:bg-slate-950/40 text-on-surface-variant hover:bg-white/60 dark:hover:bg-slate-950/60'
                  }`}
                >
                  全部
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      activeTag === tag ? 'bg-primary/20 text-primary' : 'bg-white/40 dark:bg-slate-950/40 text-on-surface-variant hover:bg-white/60 dark:hover:bg-slate-950/60'
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
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
              <SortableContext
                items={displayedNotes.map(n => n.id)}
                strategy={rectSortingStrategy}
              >
                {displayedNotes.map(note => (
                  <SortableItem key={note.id} id={note.id} disabled={isSelectionMode}>
                    <div className="relative h-full text-slate-800 dark:text-slate-200">
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
                          <CardStack 
                            note={note} 
                            onClick={() => isSelectionMode ? toggleSelection(note.id) : handleCardClick(note)} 
                            onDisband={handleDisbandGroup}
                            onTogglePin={handleTogglePin}
                            onRename={handleRenameGroup}
                            onDeleteGroupFully={handleDeleteGroupFully}
                          />
                        ) : (
                          <NoteCard 
                            note={note} 
                            onClick={() => isSelectionMode ? toggleSelection(note.id) : handleCardClick(note)} 
                            onDelete={(id, e) => handleDeleteNote(id, e)} 
                            onTogglePin={handleTogglePin}
                            onJoinGroup={handleJoinGroup}
                            onLeaveGroup={handleLeaveGroup}
                            allFolders={notesList.filter(n => n.isStack).map(f => ({ id: f.id, name: f.title }))}
                          />
                        )}
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>

              {!isSelectionMode && (
                <button 
                  onClick={() => handleCardClick(null)}
                  className="border-2 border-dashed border-outline-variant/40 rounded-3xl p-6 flex flex-col items-center justify-center h-[320px] hover:border-primary/50 hover:bg-primary/5 transition-all @theme group bg-white/20 dark:bg-slate-900/10"
                >
                  <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all mb-4 shadow-sm">
                    <Plus className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-bold text-on-surface-variant group-hover:text-primary">点击创建新卡片</p>
                  <p className="text-sm text-on-surface-variant/70 mt-2">记录此时此刻的想法</p>
                </button>
              )}
            </div>

            {/* Drag Overlay for authentic ghost-moving representation */}
            <DragOverlay>
              {activeId ? (
                <div className="opacity-95 scale-105 -rotate-1 shadow-2xl pointer-events-none transition-transform">
                  {(() => {
                    const activeNote = notesList.find(n => n.id === activeId);
                    if (!activeNote) return null;
                    return activeNote.isStack ? (
                      <CardStack note={activeNote} onClick={() => {}} />
                    ) : (
                      <NoteCard 
                        note={activeNote} 
                        onClick={() => {}} 
                        allFolders={[]}
                      />
                    );
                  })()}
                </div>
              ) : null}
            </DragOverlay>
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

        {/* Global Settings Dialog */}
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      </main>
    </div>
  );
}
