import React, { useState } from 'react';
import { useSettingsStore } from '../store';
import { X, Settings, Cpu, FileJson, Check, Laptop, Sparkles, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'basic' | 'ai' | 'editor';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const settings = useSettingsStore();

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: '基础设置', icon: Settings },
    { id: 'ai', label: 'AI 功能', icon: Cpu },
    { id: 'editor', label: '编辑器', icon: Sliders },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
        />

        {/* Content Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-2xl h-[520px] bg-white dark:bg-slate-900 rounded-3xl border border-black/5 dark:border-white/5 shadow-2xl flex flex-col overflow-hidden z-10 text-slate-800 dark:text-slate-100"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">软件系统设置</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">管理您的工作空间偏好与智能接口</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-48 bg-slate-50/30 dark:bg-slate-950/20 border-r border-black/5 dark:border-white/5 p-4 flex flex-col gap-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Panel Area */}
            <div className="flex-1 p-8 overflow-y-auto">
              {activeTab === 'basic' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">常规选项</h4>
                  
                  {/* Aspect: Theme */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">外观主题风格</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => settings.setTheme('light')}
                        className={`p-3 rounded-2xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                          settings.theme === 'light'
                            ? 'bg-primary/5 border-primary text-primary shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        亮色模式 (Light)
                        {settings.theme === 'light' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => settings.setTheme('dark')}
                        className={`p-3 rounded-2xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                          settings.theme === 'dark'
                            ? 'bg-primary/5 border-primary text-primary shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        暗色模式 (Dark)
                        {settings.theme === 'dark' && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">界面展现语言 (Language)</label>
                    <select
                      value={settings.language}
                      onChange={(e) => settings.setLanguage(e.target.value as 'zh' | 'en')}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="zh">简体中文 (Simplified Chinese)</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-4 text-xs font-bold text-amber-500 px-1">
                    <Sparkles className="w-4 h-4" />
                    <span>AI 赋能: 配合视频音频与网页内容提炼</span>
                  </div>

                  {/* API Key */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">Gemini API 密钥密钥</label>
                    <input
                      type="password"
                      placeholder="输入您的 Gemini API 密钥..."
                      value={settings.gemini_api_key}
                      onChange={(e) => settings.setApiKey(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">密钥保存在您的个人 Yjs 协作空间内，不会被公开泄露。</p>
                  </div>

                  {/* AI Model */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">底层微调模型</label>
                    <select
                      value={settings.aiModel}
                      onChange={(e) => settings.setAiModel(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-905 p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (推荐 - 高速度)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (推荐 - 高解析度)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (经典版)</option>
                    </select>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>生成创意力 (Temperature)</span>
                      <span className="text-primary text-xs font-mono">{settings.aiTemperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.aiTemperature}
                      onChange={(e) => settings.setAiTemperature(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'editor' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">BlockSuite 文档偏好</h4>

                  {/* Font Family */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">主要显示字体</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['sans', 'mono', 'serif'] as const).map((font) => (
                        <button
                          key={font}
                          onClick={() => settings.setEditorFontFamily(font)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all capitalize ${
                            settings.editorFontFamily === font
                              ? 'bg-primary/5 border-primary text-primary'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {font === 'sans' ? '无衬线' : font === 'mono' ? '等宽' : '衬线雅致'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>主文字字号</span>
                      <span className="text-primary text-xs font-mono">{settings.editorFontSize} px</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400">A-</span>
                      <input
                        type="range"
                        min="12"
                        max="22"
                        step="1"
                        value={settings.editorFontSize}
                        onChange={(e) => settings.setEditorFontSize(parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="text-sm text-slate-400">A+</span>
                    </div>
                  </div>

                  {/* Auto Save Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-sm font-semibold">后台静默自动保存</label>
                      <span className="text-xs text-slate-400">自动为您在每次输入后将文档内容存盘</span>
                    </div>
                    <button
                      onClick={() => settings.setEditorAutoSave(!settings.editorAutoSave)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                        settings.editorAutoSave ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform transform shadow-sm ${
                          settings.editorAutoSave ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
