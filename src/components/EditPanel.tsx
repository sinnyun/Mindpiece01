import React, { useState, useEffect } from 'react';
import { Note, Category, NoteVersion } from '../types';
import { X, Edit3, Plus, FileText, GitBranch, History, ChevronLeft, Check, Clock } from 'lucide-react';
import { BlockSuiteEditor } from './BlockSuiteEditor';

interface EditPanelProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
}

const emptyNote: Note = {
  id: '',
  title: '',
  content: '',
  category: '灵感',
  date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
  tags: []
};

export default function EditPanel({ note, isOpen, onClose, onSave }: EditPanelProps) {
  const [editedNote, setEditedNote] = useState<Note>(emptyNote);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showVersionPanel, setShowVersionPanel] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialVersions: NoteVersion[] = note?.versions || (note ? [{
        id: 'initial',
        name: '初始创建',
        timestamp: note.date,
        type: 'initial',
        title: note.title,
        content: note.content
      }] : []);

      setEditedNote(note ? { ...note, versions: initialVersions } : { ...emptyNote, date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) });
      setNewTag('');
      setIsAddingTag(false);
      setShowVersionPanel(false);
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      if (!editedNote.tags.includes(newTag.trim())) {
        setEditedNote({ ...editedNote, tags: [...editedNote.tags, newTag.trim()] });
      }
      setNewTag('');
      setIsAddingTag(false);
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedNote({
      ...editedNote,
      tags: editedNote.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const isEditing = !!note;

  const handleCreateBranch = () => {
    const branchName = prompt('请输入分支名称', '新建分支');
    if (!branchName) return;

    const newVersion: NoteVersion = {
      id: Date.now().toString(),
      name: branchName,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      type: 'branch',
      title: editedNote.title,
      content: editedNote.content,
    };
    
    setEditedNote(prev => ({
      ...prev,
      versions: [newVersion, ...(prev.versions || [])]
    }));
  };

  const handleLoadVersion = (v: NoteVersion) => {
    if (confirm(`确定要切换到版本 "${v.name || '历史记录'}" 吗？未保存的更改将会丢失。`)) {
      setEditedNote(prev => ({
        ...prev,
        title: v.title,
        content: v.content,
      }));
    }
  };

  const handleSaveWrapper = () => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const autoSave: NoteVersion = {
      id: Date.now().toString(),
      name: '自动保存',
      timestamp,
      type: 'auto-save',
      title: editedNote.title,
      content: editedNote.content,
    };
    
    const finalNote = {
      ...editedNote,
      versions: [autoSave, ...(editedNote.versions || [])]
    };
    onSave(finalNote);
    onClose();
  };

  const versionsList = editedNote.versions || [];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-30 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-4 right-4 bottom-4 flex gap-4 z-40 animate-in slide-in-from-right-8 duration-300">
        
        {/* Left: Version Management Panel */}
        {showVersionPanel && (
          <aside className="w-[320px] glass-panel rounded-3xl flex flex-col overflow-hidden bg-white/95">
            <div className="px-6 py-5 border-b border-black/5 bg-white/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-on-surface">版本管理</h3>
                </div>
                <button 
                  onClick={() => setShowVersionPanel(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 text-on-surface-variant transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="relative border-l-2 border-outline-variant/30 ml-3 space-y-6 pb-4 pt-2">
                {versionsList.map((v, idx) => (
                  <div key={v.id} className="relative pl-6 group">
                    {/* Node Dot */}
                    <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border-2 bg-white ${v.type === 'branch' ? 'border-primary w-3 h-3 -left-[7px]' : 'border-outline-variant'}`}></div>
                    
                    <div 
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${v.type === 'branch' ? 'bg-primary/5 hover:bg-primary/10 border-primary/20' : 'bg-white hover:bg-surface-variant/50 border-transparent hover:border-outline-variant/20 shadow-sm'}`}
                      onClick={() => handleLoadVersion(v)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {v.type === 'branch' ? <GitBranch className="w-3.5 h-3.5 text-primary" /> : <Clock className="w-3.5 h-3.5 text-on-surface-variant/60" />}
                          <span className={`text-sm font-bold ${v.type === 'branch' ? 'text-primary' : 'text-on-surface'}`}>{v.name}</span>
                        </div>
                        <span className="text-xs text-on-surface-variant/70 font-medium">{v.timestamp}</span>
                      </div>
                      {v.type !== 'initial' && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-1.5">{v.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Right: Main Edit Panel */}
        <aside className="w-[600px] glass-panel rounded-3xl flex flex-col overflow-hidden bg-white/95">
          <div className="px-8 py-6 flex items-center justify-between border-b border-black/5 bg-white/40 shadow-sm relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {isEditing ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">{isEditing ? '编辑笔记' : '新建笔记'}</h2>
                <p className="text-xs text-on-surface-variant">{isEditing ? '正在修改选中的内容' : '记录此时此刻的想法'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowVersionPanel(!showVersionPanel)}
                title="版本管理"
                className={`p-2 rounded-full transition-colors flex items-center gap-1.5 px-3 border shadow-sm ${showVersionPanel ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-outline-variant/40 hover:bg-black/5'}`}
              >
                <GitBranch className="w-4 h-4" />
                <span className="text-xs font-bold">版本</span>
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 ml-2 flex items-center justify-center rounded-full hover:bg-error/10 hover:text-error transition-colors text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 flex flex-col">
            <div className="flex items-center justify-between">
               <label className="block text-xs font-bold text-primary uppercase tracking-wider px-1">笔记标题</label>
               {showVersionPanel && (
                 <button onClick={handleCreateBranch} className="text-xs font-bold text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-full transition-colors">
                   <Plus className="w-3.5 h-3.5" /> 添加分支
                 </button>
               )}
            </div>
            
            <input 
              type="text" 
              placeholder="输入标题..."
              value={editedNote.title}
              onChange={(e) => setEditedNote({...editedNote, title: e.target.value})}
              className="w-full bg-white/50 border-none rounded-2xl px-6 py-4 text-xl font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-white/80 transition-all outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]"
            />

            <div className="flex-1 flex flex-col min-h-[350px]">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider px-1 mb-2">内容编辑器 (BlockSuite)</label>
              <div className="w-full flex-1 bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <BlockSuiteEditor 
                  initialContent={editedNote.content} 
                  onChange={(val) => setEditedNote(prev => ({...prev, content: val}))} 
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider px-1">调整标签</label>
              <div className="flex flex-wrap gap-2 items-center">
                {editedNote.tags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => handleRemoveTag(tag)}
                    className="px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium flex items-center gap-1 group shadow-sm"
                  >
                    <span>#{tag}</span>
                    <X className="w-3.5 h-3.5 ml-1 opacity-50 group-hover:opacity-100" />
                  </button>
                ))}
                
                {isAddingTag ? (
                  <input 
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    onBlur={() => { setIsAddingTag(false); setNewTag(''); }}
                    placeholder="按回车添加..."
                    autoFocus
                    className="w-32 bg-white/50 border-none rounded-full px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                  />
                ) : (
                  <button 
                    onClick={() => setIsAddingTag(true)}
                    className="px-4 py-2 rounded-full border border-dashed border-outline-variant text-outline hover:bg-black/5 transition-colors text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> 添加标签
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-3 pt-2 pb-4">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider px-1">分类</label>
              <div className="flex gap-2">
                {(['灵感', '待办', '随笔', '堆栈'] as Category[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setEditedNote({...editedNote, category: cat})}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
                      editedNote.category === cat 
                        ? 'bg-primary text-white shadow-primary/30' 
                        : 'bg-white/50 text-on-surface-variant hover:bg-white/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="px-8 py-6 border-t border-black/5 flex gap-4 bg-white/40">
            <button 
              onClick={onClose}
              className="flex-1 py-4 rounded-xl font-bold text-on-surface-variant bg-white/60 hover:bg-white/90 transition-colors border border-outline-variant/30"
            >
              取消
            </button>
            <button 
              onClick={handleSaveWrapper}
              className="flex-1 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {isEditing ? '保存修改' : '创建笔记'}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
