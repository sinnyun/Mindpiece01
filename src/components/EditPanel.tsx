import React, { useState, useEffect, useRef } from 'react';
import { Note, Category, NoteVersion, NoteType } from '../types';
import { X, Edit3, Plus, FileText, GitBranch, History, ChevronLeft, Check, Clock, Video, Globe, Zap, Image as ImageIcon } from 'lucide-react';
import { BlockSuiteEditor, BlockSuiteEditorRef } from './BlockSuiteEditor';

interface EditPanelProps {
  note: Note | null;
  isOpen: boolean;
  defaultNoteType?: NoteType;
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

export default function EditPanel({ note, isOpen, defaultNoteType = 'normal', onClose, onSave }: EditPanelProps) {
  const [editedNote, setEditedNote] = useState<Note>(emptyNote);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const editorRef = useRef<BlockSuiteEditorRef>(null);

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

      setEditedNote(note ? { ...note, versions: initialVersions } : { ...emptyNote, noteType: defaultNoteType, date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) });
      setNewTag('');
      setIsAddingTag(false);
      setShowVersionPanel(false);
      setIsGeneratingAI(false);
    }
  }, [note, isOpen, defaultNoteType]);

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

  const handleAIVideoSubtitleSummary = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const summaryText = "### AI 自动总结 (基于视频字幕/音频)\n这可能是一个关于前沿技术的分享。讲者提到了未来的产品方向，包括增强跨平台兼容性以及如何使用AI来提升工作效率。主要的三个核心点是：\n1. AI 基础设施的铺设\n2. 用户体验的极简化\n3. 快速迭代开发模型";
      editorRef.current?.appendContent(summaryText);
      setEditedNote(prev => ({
        ...prev,
        content: prev.content + "\n\n" + summaryText,
        videoMetadata: { title: "提取的视频标题: AI 赋能未来", duration: "12:34" }
      }));
      setIsGeneratingAI(false);
    }, 1500);
  };

  const handleVideoScreenshotNote = () => {
    const timestamp = "0" + Math.floor(Math.random() * 9) + ":" + Math.floor(Math.random() * 5) + Math.floor(Math.random() * 9);
    const screenshotText = `[视频截图 - ${timestamp}]\n笔记: 这里提到了一个关键的设计模式。`;
    editorRef.current?.appendContent(screenshotText);
    setEditedNote(prev => ({
      ...prev,
      content: prev.content + `\n\n![视频截图 - ${timestamp}](https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&q=80&w=600)\n**[${timestamp}] 笔记:** 这里提到了一个关键的设计模式。`
    }));
  };

  const handleAIWebStyleRecognition = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const styleText = "**💎 AI 网页风格识别:**\n当前网页采用了 **极简现代主义 (Minimal Modernist)** 风格。主色调偏冷（#1E293B），辅以高对比度的重点色。排版使用了无衬线字体（如 Inter），大量使用留白（Negative Space）来强调内容层次，整体观感十分清爽且专业。";
      editorRef.current?.appendContent(styleText);
      setEditedNote(prev => ({
        ...prev,
        content: prev.content + "\n\n" + styleText
      }));
      setIsGeneratingAI(false);
    }, 1500);
  };

  const handleAIWebSummary = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const text = "**📝 AI 网页内容总结:**\n这篇文章主要探讨了2026年Web全栈开发的新趋势。作者认为，随着AI辅助开发的普及，开发者应更多关注业务架构与用户体验，而不是重复造轮子。文章还列举了3个最佳实践：\n- 使用边缘计算加速渲染\n- 采用更智能的缓存策略\n- 组件驱动的微前端架构";
      editorRef.current?.appendContent(text);
      setEditedNote(prev => ({
        ...prev,
        content: prev.content + "\n\n" + text
      }));
      setIsGeneratingAI(false);
    }, 1500);
  };

  const versionsList = editedNote.versions || [];
  const currentType = editedNote.noteType || 'normal';

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
                {currentType === 'video' ? <Video className="w-5 h-5" /> : currentType === 'webpage' ? <Globe className="w-5 h-5" /> : isEditing ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">
                  {currentType === 'video' ? '视频笔记' : currentType === 'webpage' ? '网页收藏' : isEditing ? '编辑笔记' : '新建笔记'}
                </h2>
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
            
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-2">
                 <label className="block text-xs font-bold text-primary uppercase tracking-wider px-1">卡片标题</label>
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
            </div>

            {/* Video specifics */}
            {currentType === 'video' && (
              <div className="bg-surface-variant/20 p-4 rounded-2xl border border-outline-variant/30 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface opacity-60 uppercase tracking-wider mb-2">视频链接 (可自动提取信息)</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={editedNote.videoUrl || ''}
                    onChange={(e) => setEditedNote({...editedNote, videoUrl: e.target.value})}
                    onBlur={() => {
                      if (editedNote.videoUrl && !editedNote.title) {
                        setEditedNote(prev => ({...prev, title: '提取视频标题...'}));
                        setTimeout(() => setEditedNote(prev => ({...prev, title: 'AI 赋能未来'})), 800);
                      }
                    }}
                    className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                
                {editedNote.videoUrl && (
                  <div className="aspect-video bg-black/90 rounded-xl overflow-hidden relative flex items-center justify-center">
                    <span className="text-white/50 text-sm">视频预览区</span>
                    <button 
                      onClick={handleVideoScreenshotNote}
                      className="absolute bottom-4 right-4 bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-1"
                    >
                      <ImageIcon className="w-4 h-4" /> 网页截图打点笔记
                    </button>
                  </div>
                )}
                
                <div className="pt-2">
                  <button 
                    onClick={handleAIVideoSubtitleSummary}
                    disabled={isGeneratingAI}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/20 text-purple-700 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    {isGeneratingAI ? '提取及总结中...' : 'AI 一键生成字幕与智能总结'}
                  </button>
                </div>
              </div>
            )}

            {/* Webpage specifics */}
            {currentType === 'webpage' && (
              <div className="bg-surface-variant/20 p-4 rounded-2xl border border-outline-variant/30 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface opacity-60 uppercase tracking-wider mb-2">网页链接</label>
                  <input
                    type="url"
                    placeholder="https://news.ycombinator.com"
                    value={editedNote.webpageUrl || ''}
                    onChange={(e) => setEditedNote({...editedNote, webpageUrl: e.target.value})}
                    onBlur={() => {
                      if (editedNote.webpageUrl && !editedNote.title) {
                        setEditedNote(prev => ({...prev, title: '网页标题提取中...'}));
                        setTimeout(() => setEditedNote(prev => ({...prev, title: 'Hacker News', webpageScreenshotUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80'})), 800);
                      }
                    }}
                    className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                
                {editedNote.webpageScreenshotUrl ? (
                  <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-outline-variant/20 relative">
                    <img src={editedNote.webpageScreenshotUrl} alt="Webpage screenshot" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[21/9] w-full bg-white/50 border border-outline-variant/20 border-dashed rounded-xl flex items-center justify-center text-on-surface-variant/50 text-sm">
                    输入链接后自动生成网页截图
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleAIWebStyleRecognition}
                    disabled={isGeneratingAI}
                    className="flex-1 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-700 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    {isGeneratingAI ? '识别中...' : '识别设计风格'}
                  </button>
                  <button 
                    onClick={handleAIWebSummary}
                    disabled={isGeneratingAI}
                    className="flex-1 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-700 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    {isGeneratingAI ? '总结中...' : '一键总结内容'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col min-h-[350px]">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider px-1 mb-2">内容编辑器 (BlockSuite)</label>
              <div className="w-full flex-1 bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <BlockSuiteEditor 
                  ref={editorRef}
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
