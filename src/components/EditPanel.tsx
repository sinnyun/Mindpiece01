import React, { useState, useEffect, useRef } from 'react';
import { Note, Category, NoteVersion, NoteType } from '../types';
import { X, Edit3, Plus, FileText, GitBranch, History, ChevronLeft, Check, Clock, Video, Globe, Zap, Maximize2, Minimize2, Image as ImageIcon, Sparkles, ArrowUp, BookOpen, Languages, Link } from 'lucide-react';
import { BlockSuiteEditor, BlockSuiteEditorRef } from './BlockSuiteEditor';
import { useWorkspaceStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';

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
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<Array<{role: 'user' | 'assistant', text: string}>>([]);
  const [activeVersion, setActiveVersion] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  const editorRef = useRef<BlockSuiteEditorRef>(null);

  const currentType = editedNote.noteType || defaultNoteType;
  const hasLeftPanel = currentType === 'video' || currentType === 'webpage';

  const toggleVersionPanel = () => {
    setShowVersionPanel(prev => !prev);
    setShowAIPanel(false);
  };

  const toggleAIPanel = () => {
    setShowAIPanel(prev => !prev);
    setShowVersionPanel(false);
  };

  // Fetch available notes from workspace store for "related nodes"
  const allNodes = useWorkspaceStore(state => state.nodes);

  const [isEditingHeader, setIsEditingHeader] = useState(false);

  // Get all unique tags used across all nodes in the workspace store
  const availableTags = React.useMemo(() => {
    const list = new Set<string>();
    Object.values(allNodes).forEach(node => {
      if (node.tags && Array.isArray(node.tags)) {
        node.tags.forEach(t => {
          if (t && typeof t === 'string' && t.trim()) list.add(t.trim());
        });
      }
    });
    return Array.from(list);
  }, [allNodes]);

  // Parse GFM WikiLink brackets: [[Title]]
  const wikiLinkMatches = React.useMemo(() => {
    if (!editedNote.content) return [];
    const regex = /\[\[(.*?)\]\]/g;
    const matches: string[] = [];
    let match;
    const contentToScan = editedNote.content;
    while ((match = regex.exec(contentToScan)) !== null) {
      if (match[1]) {
        const parts = match[1].split('|');
        const targetTitle = parts[0].trim();
        if (targetTitle) matches.push(targetTitle.toLowerCase());
      }
    }
    return matches;
  }, [editedNote.content]);

  // Find related notes in the same flat tree with title matches
  const relatedFiles = React.useMemo(() => {
    if (wikiLinkMatches.length === 0) return [];
    return Object.values(allNodes)
      .filter(n => n.type === 'file' && n.id !== editedNote.id)
      .filter(n => wikiLinkMatches.includes(n.name.toLowerCase()))
      .slice(0, 5)
      .map(n => ({
        id: n.id,
        title: n.name,
        content: '',
        category: n.category || '灵感',
        date: n.date || '',
        tags: n.tags || [],
        noteType: n.noteType
      }));
  }, [allNodes, editedNote.id, wikiLinkMatches]);

  const handleInsertFeedbackToEditor = (text: string) => {
    const cleanLines = text
      .split('\n')
      .map(line => line.replace(/^[\s*#>:-]+/, '- '))
      .filter(line => line.trim() && line !== '- —' && line !== '---');
    
    const cleanText = cleanLines.join('\n');
    const insertText = `\n[Lumina AI 优化内容]\n${cleanText}\n`;
    editorRef.current?.appendContent(insertText);
    setEditedNote(prev => ({
      ...prev,
      content: prev.content + "\n\n" + insertText
    }));
  };

  const handleAIChatSubmit = (customPrompt?: string) => {
    const promptText = (customPrompt || aiPrompt).trim();
    if (!promptText) return;
    
    setAiChatHistory(prev => [...prev, { role: 'user', text: promptText }]);
    if (!customPrompt) setAiPrompt('');
    setIsGeneratingAI(true);

    setTimeout(() => {
      let responseText = '';
      const docTitle = editedNote.title || '无标题卡片';
      const docCategory = editedNote.category || '灵感';
      const docTags = editedNote.tags && editedNote.tags.length > 0 ? editedNote.tags.join(', ') : '无标签';

      if (promptText.includes('摘要') || promptText.includes('💡') || promptText.includes('Summary')) {
        responseText = `📝 **Lumina 内容主旨摘要汇报:**\n一句话概括：您当前编辑的是关于【${docTitle}】的模块化记录。该笔记属于 [#${docCategory}] 分类，具有高度集中的知识表达力。建议在使用此卡片时提炼两项关键行文逻辑，配合 WikiLinks 构建个人的第二大脑网络。`;
      } else if (promptText.includes('翻译') || promptText.includes('🇬🇧') || promptText.includes('对照') || promptText.includes('Translate')) {
        responseText = `🌐 **Lumina 精简英译对照:**\n"This card is titled [${docTitle}]. It focuses on the atomic storage of thoughts, minimizing screen noise, and establishing dynamic relational networks directly between active cards inside your workspace."`;
      } else if (promptText.includes('关系') || promptText.includes('🔍') || promptText.includes('全局') || promptText.includes('检索') || promptText.includes('Analysis')) {
        const activeSize = Object.keys(allNodes).length;
        responseText = `📊 **Lumina 存储库交叉关系分析 (全局):**\n- **库总容量**: 检测到双向知识库共有 **${activeSize}** 个节点。\n- **密度与状态**: 笔记聚类指向「${docCategory}」，健康关系链条发育完整，不存在严重信息孤岛。\n- **演进指导**: 合理利用 [[卡片标题]] 标签创建跨域链条。`;
      } else if (promptText.includes('润色') || promptText.includes('优化') || promptText.includes('✨') || promptText.includes('Polishing')) {
        responseText = `✨ **Lumina 推荐修饰表达案:**\n\n> "让思绪的火花原子化地沉淀在优雅的卡片中。剔除过载的信息与前言噪音，只在字里行间，为您保留灵感诞生的最原始温度。"\n\n如果您对本段表述满意，可以点击下方的【插入本答案】追加保存！`;
      } else {
        responseText = `🤖 **Lumina 答读者问:**\n关于提问 *"${promptText}"*，以下是结合了卡片《${docTitle}》的分析：\n\n1. **关联关系诊断**：此笔记使用了分类 \`[${docCategory}]\` 与标签 \`${docTags}\`。它的思维结构较为纯粹，适宜继续做卡片式多维衍生。\n2. **提议方向**：你可以右下角点击“✨ 润色文字”或输入任意追问指令。我将根据最新写好的正文提供全方位的解答！`;
      }

      setAiChatHistory(prev => [...prev, { role: 'assistant', text: responseText }]);
      setIsGeneratingAI(false);
    }, 1100);
  };

  const handleAISubmit = () => {
    if (!aiPrompt.trim()) return;
    handleAIChatSubmit(aiPrompt);
  };

  const handleAICardSummary = () => {
    handleAIChatSubmit('💡 提炼摘要');
  };

  const handleAITranslation = () => {
    handleAIChatSubmit('🇬🇧 快速翻译');
  };

  const handleGlobalAnalysis = () => {
    handleAIChatSubmit('🔍 关系检索');
  };

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

      const tempId = 'doc-' + Math.random().toString(36).substring(2, 11);
      setEditedNote(note ? { ...note, versions: initialVersions } : { ...emptyNote, id: tempId, noteType: defaultNoteType, date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) });
      setNewTag('');
      setIsAddingTag(false);
      setShowVersionPanel(false);
      setShowAIPanel(false);
      setAiChatHistory([
        {
          role: 'assistant',
          text: `您好！我是您的多维智能 AI 助手。我已完全加载了当前卡片【${note?.title || '新卡片'}】的上下文内容。您可以通过快捷操作直接分析、提炼、翻译，或者在对话框中向我下达复杂的指令协助润色！`
        }
      ]);
      setIsGeneratingAI(false);
      setIsEditingHeader(false);
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
    setActiveVersion(v.id);
    setEditedNote(prev => ({
      ...prev,
      title: v.title,
      content: v.content,
    }));
    if (v.content !== undefined) {
      editorRef.current?.setContent(v.content);
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

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-30 transition-opacity"
        onClick={onClose}
      />
      
      <div className={`fixed top-4 right-4 bottom-4 flex justify-end z-40 animate-in slide-in-from-right-8 pointer-events-none`}>
        
        {/* Left: Extra Panel (Versions / Media specifics) */}
        <div className={`pointer-events-auto shrink-0 transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
          hasLeftPanel ? 'w-[336px] opacity-100' : 'w-0 opacity-0'
        }`}>
          <div className="w-[320px] mr-4 shrink-0 h-full">
            <aside className="glass-panel rounded-3xl flex flex-col overflow-hidden bg-white/95 dark:bg-slate-900/95 h-full">
            {currentType === 'video' ? (
              // --- Video Panel ---
              <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-none">
                <div className="px-6 py-5 border-b border-black/5 bg-white/40">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-on-surface">视频信息</h3>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-on-surface opacity-60 uppercase tracking-wider mb-2">视频链接 (自动提取)</label>
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
                      className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
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
                      {isGeneratingAI ? '提取总结中...' : '生成字幕与总结'}
                    </button>
                  </div>
                </div>
              </div>
            ) : currentType === 'webpage' ? (
              // --- Webpage Panel ---
              <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-none">
                <div className="px-6 py-5 border-b border-black/5 bg-white/40">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-on-surface">网页收藏</h3>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
                      className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  
                  {editedNote.webpageScreenshotUrl ? (
                    <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-outline-variant/20 relative">
                      <img src={editedNote.webpageScreenshotUrl} alt="Webpage screenshot" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-[21/9] w-full bg-surface border border-outline-variant/20 border-dashed rounded-xl flex items-center justify-center text-on-surface-variant/50 text-sm">
                      链接生成截图
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleAIWebStyleRecognition}
                      disabled={isGeneratingAI}
                      className="flex-1 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-700 font-bold text-sm transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 px-1"
                    >
                      <Zap className="w-4 h-4 shrink-0" />
                      <span className="truncate">{isGeneratingAI ? '识别中...' : '识别设计风格'}</span>
                    </button>
                  </div>
                  <div>
                    <button 
                      onClick={handleAIWebSummary}
                      disabled={isGeneratingAI}
                      className="w-full py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-700 font-bold text-sm transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 px-1"
                    >
                      <Zap className="w-4 h-4 shrink-0" />
                      <span className="truncate">{isGeneratingAI ? '总结中...' : '一键总结内容'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
          </div>
        </div>

        {/* Right: Main Edit Panel */}
        <div className={`relative pointer-events-none shrink-0 transition-all duration-300 ease-in-out flex h-full ${
          isExpanded 
            ? hasLeftPanel
              ? 'w-[calc(100vw-32px)] md:w-[calc(100vw-300px-336px)]'
              : 'w-[calc(100vw-32px)] md:w-[calc(100vw-300px)]'
            : 'w-[600px] max-w-[calc(100vw-32px)]'
        }`}>
          {/* Absolutely Positioned Version Panel attached to left side of Main Editor */}
          <AnimatePresence>
            {showVersionPanel && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 bottom-0 pointer-events-auto z-50 shadow-2xl rounded-3xl"
                style={{ 
                  left: hasLeftPanel ? '-672px' : '-336px',
                  width: '320px'
                }}
              >
                <aside className="glass-panel flex flex-col overflow-hidden bg-white/95 dark:bg-slate-900/95 h-full w-full rounded-3xl border border-white/20 dark:border-white/5">
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
                          <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border-2 bg-white ${v.type === 'branch' ? 'border-primary w-3 h-3 -left-[7px]' : 'border-outline-variant'} ${activeVersion === v.id ? 'bg-primary border-primary -left-[5px] w-2.5 h-2.5' : ''}`}></div>
                          
                          <div 
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${v.id === activeVersion ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20' : v.type === 'branch' ? 'bg-primary/5 hover:bg-primary/10 border-primary/20' : 'bg-[#FAFBFD] hover:bg-black/5 dark:bg-[#121824] dark:hover:bg-white/5 border-transparent shadow-sm'}`}
                            onClick={() => handleLoadVersion(v)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                {v.type === 'branch' ? <GitBranch className="w-3.5 h-3.5 text-primary" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-105">{v.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">{v.timestamp}</span>
                            </div>
                            {v.type !== 'initial' && v.content && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">{v.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Absolutely Positioned AI Panel attached to left side of Main Editor */}
          <AnimatePresence>
            {showAIPanel && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 bottom-0 pointer-events-auto z-50 shadow-2xl rounded-3xl"
                style={{ 
                  left: hasLeftPanel ? '-672px' : '-336px',
                  width: '320px'
                }}
              >
                <aside className="glass-panel flex flex-col overflow-hidden bg-white/95 dark:bg-slate-900/95 h-full w-full rounded-3xl border border-white/20 dark:border-white/5 font-sans relative">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-black/5 bg-white/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Lumina AI 助手</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gemini 2.5 Core</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowAIPanel(false)}
                      className="p-1.5 rounded-full hover:bg-black/5 text-slate-500 hover:text-slate-700 transition"
                      title="关闭 AI 助手"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable Chat Area */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar bg-slate-50/40 dark:bg-slate-950/20">
                    {aiChatHistory.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col gap-1.5 max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div 
                          className={`px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-sm transition-all ${
                            msg.role === 'user' 
                              ? 'bg-blue-650 text-white rounded-tr-none font-bold' 
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/80 rounded-tl-none font-medium'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>

                        {msg.role === 'assistant' && idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleInsertFeedbackToEditor(msg.text)}
                            className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 hover:underline self-start px-1 py-0.5 rounded transition"
                          >
                            <Plus className="w-3 h-3" /> 插入此建议至正文
                          </button>
                        )}
                      </div>
                    ))}
                    {isGeneratingAI && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-450 dark:text-slate-400 font-bold mr-auto pl-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                        <span>Lumina 正在深度分析中...</span>
                      </div>
                    )}
                  </div>

                  {/* Preset Quick Actions */}
                  <div className="px-4 py-2 border-t border-black/5 flex flex-wrap gap-1.5 shrink-0 bg-slate-50/50 dark:bg-slate-950/30">
                    <button
                      type="button"
                      onClick={() => handleAIChatSubmit('💡 提炼摘要')}
                      disabled={isGeneratingAI}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-250 hover:text-slate-800 transition shadow-sm disabled:opacity-40"
                    >
                      💡 提炼摘要
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAIChatSubmit('🇬🇧 快速翻译')}
                      disabled={isGeneratingAI}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-250 hover:text-slate-800 transition shadow-sm disabled:opacity-40"
                    >
                      🇬🇧 快速翻译
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAIChatSubmit('🔍 关系检索')}
                      disabled={isGeneratingAI}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-250 hover:text-slate-800 transition shadow-sm disabled:opacity-40"
                    >
                      🔍 关系检索
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAIChatSubmit('✨ 润色及优化')}
                      disabled={isGeneratingAI}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-250 hover:text-slate-800 transition shadow-sm disabled:opacity-40"
                    >
                      ✨ 润色文字
                    </button>
                  </div>

                  {/* Input Chat Box */}
                  <div className="p-3 border-t border-black/5 bg-white dark:bg-[#0B0F19] flex gap-2 shrink-0">
                    <input 
                      type="text"
                      placeholder={isGeneratingAI ? '思考中...' : '向 AI 智能体发问...'}
                      value={aiPrompt}
                      disabled={isGeneratingAI}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAIChatSubmit();
                      }}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500/20 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-50 font-sans"
                    />
                    <button 
                      type="button"
                      onClick={() => handleAIChatSubmit()}
                      disabled={isGeneratingAI || !aiPrompt.trim()}
                      className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0 disabled:opacity-40"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </aside>
              </motion.div>
            )}
          </AnimatePresence>

          <aside className="pointer-events-auto glass-panel rounded-3xl flex flex-col overflow-hidden bg-[#F8F9FA] dark:bg-[#0B0F19] shadow-2xl border border-white/20 dark:border-white/5 h-full w-full font-sans">
            {/* Header: compact top bar - modified with Notion Title & Summary inline + Editing support */}
            <div className="px-8 py-4 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-[#0B0F19]/45 backdrop-blur-sm relative z-20 shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "收起面板" : "展开面板"}
                    className="p-1.5 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
                  >
                    {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 font-mono">v1.4.2</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleVersionPanel}
                    title="版本管理"
                    className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${showVersionPanel ? 'text-primary bg-primary/10' : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <GitBranch className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={toggleAIPanel}
                    title="Lumina AI 智能助手"
                    className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${showAIPanel ? 'text-blue-500 bg-blue-550/10 dark:bg-blue-550/20' : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={handleSaveWrapper}
                    className="bg-[#111111] dark:bg-white text-white dark:text-black font-semibold px-5 py-2 rounded-full text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  >
                    发布
                  </button>
                  
                  <button 
                    onClick={onClose}
                    className="p-1.5 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Title & Summary editing block */}
              <div className="flex items-center justify-between gap-3 bg-white/70 dark:bg-[#121824]/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm relative z-10">
                {isEditingHeader ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="修改您的笔记标题..."
                      value={editedNote.title}
                      onChange={(e) => setEditedNote({...editedNote, title: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-white"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="修改您的笔记概要描述..."
                      value={editedNote.summary || ''}
                      onChange={(e) => setEditedNote({...editedNote, summary: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {editedNote.title || '无标题笔记'}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">
                      {editedNote.summary || '暂无概要，记录此时此刻的想法'}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingHeader(!isEditingHeader)}
                  className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-205 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-all shadow-sm hover:scale-105 shrink-0"
                  title={isEditingHeader ? "保存修改" : "修改标题及概要"}
                >
                  {isEditingHeader ? <Check className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400 font-bold" /> : <Edit3 className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Scrollable Center: Card Workspace */}
            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 flex flex-col no-scrollbar">
              {/* Premium Category Icon Badge at top of properties */}
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center shadow-sm shrink-0 mb-1">
                {currentType === 'video' ? (
                  <Video className="w-8 h-8" />
                ) : currentType === 'webpage' ? (
                  <Globe className="w-8 h-8" />
                ) : (
                  <FileText className="w-8 h-8" />
                )}
              </div>

              {/* Notion-Style Properties List Under Category Badge */}
              <div className="grid grid-cols-[80px_1fr] items-baseline gap-y-4 py-4 px-1 border-b border-black/5 dark:border-white/5 text-sm font-sans shrink-0">
                
                {/* Category Property */}
                <div className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
                  分类
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['灵感', '待办', '随笔', '堆栈'] as Category[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditedNote({...editedNote, category: cat})}
                      className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all border ${
                        editedNote.category === cat 
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40 font-bold' 
                          : 'bg-slate-50 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 hover:dark:bg-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Tags Property */}
                <div className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 pt-1">
                  标签
                </div>
                <div className="flex flex-wrap items-center gap-1.5 relative">
                  {editedNote.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 group whitespace-nowrap border border-emerald-100 dark:border-emerald-900/40"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded p-0.5 text-emerald-500 dark:text-emerald-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Notion-Style Add Tag with dropdown select list */}
                  <div className="relative z-30">
                    {isAddingTag ? (
                      <div className="absolute left-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl shadow-xl p-2 w-48 text-xs flex flex-col gap-1.5 animate-in fade-in-50 duration-100">
                        <input 
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={handleAddTag}
                          placeholder="新标签加自选或敲回车..."
                          autoFocus
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500/20 outline-none"
                        />
                        
                        {/* Dropdown list of already used tags in the workspace */}
                        {availableTags.length > 0 && (
                          <div className="flex flex-col max-h-32 overflow-y-auto pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="text-[10px] text-slate-400 pb-1 px-1 font-medium">快捷选用已有标签:</div>
                            {availableTags.map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (!editedNote.tags.includes(tag)) {
                                    setEditedNote({ ...editedNote, tags: [...editedNote.tags, tag] });
                                  }
                                  setIsAddingTag(false);
                                  setNewTag('');
                                }}
                                className="text-left py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold truncate hover:text-blue-500"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <span>ESC 退出</span>
                          <button 
                            type="button" 
                            onClick={() => { setIsAddingTag(false); setNewTag(''); }}
                            className="hover:text-red-500 font-bold"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 font-semibold flex items-center gap-0.5 whitespace-nowrap bg-slate-50 dark:bg-slate-900/20 px-2.5 py-1 rounded-md border border-dashed border-slate-200 dark:border-slate-800/80"
                      >
                        <Plus className="w-3.5 h-3.5" /> 加分类标签
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Borderless BlockSuite Editor Workspace Frame Card inline with picture */}
              <div className="flex-1 flex flex-col min-h-[380px] mt-4 p-8 bg-white dark:bg-slate-900 border border-[#E5E9F0] dark:border-slate-850 rounded-[28px] shadow-[0_2px_12px_rgba(0,0,0,0.015)]">
                <div className="w-full flex-1 bg-transparent overflow-hidden flex flex-col">
                  {editedNote.id && (
                    <BlockSuiteEditor 
                      ref={editorRef}
                      docId={editedNote.id}
                      initialContent={editedNote.content} 
                      onChange={(val) => setEditedNote(prev => ({...prev, content: val}))} 
                    />
                  )}
                </div>
              </div>

              {/* Backlinks/Related Nodes container - matched if double brackets wikilink is present in content */}
              {relatedFiles.length > 0 && (
                <div className="border border-slate-150/80 dark:border-slate-850 bg-white/60 dark:bg-[#111622]/40 p-5 rounded-2xl space-y-3 mt-8">
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">双向链接关联节点 (WikiLinks)</div>
                  <div className="space-y-2">
                    {relatedFiles.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          setEditedNote(n as Note);
                        }}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:dark:text-blue-400 transition-colors cursor-pointer text-sm font-semibold group"
                      >
                        <Link className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span className="group-hover:underline">{n.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
