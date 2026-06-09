import { create } from 'zustand';
import { YjsManager } from '../core/yjs/YjsManager';
import { Category, NoteType, NoteVersion } from '../types';

export interface WorkspaceNode {
  id: string;
  type: 'folder' | 'file';
  name: string;
  parentId: string; // 'root' or another nodeId
  category?: Category;
  date?: string;
  tags?: string[];
  noteType?: NoteType;
  videoUrl?: string;
  webpageUrl?: string;
  webpageScreenshotUrl?: string;
  versions?: NoteVersion[];
  isPinned?: boolean;
}

interface SettingsState {
  theme: 'light' | 'dark';
  gemini_api_key: string;
  language: 'zh' | 'en';
  aiModel: string;
  aiTemperature: number;
  editorFontSize: number;
  editorFontFamily: 'sans' | 'mono' | 'serif';
  editorAutoSave: boolean;
  isLoaded: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setApiKey: (key: string) => void;
  setLanguage: (lang: 'zh' | 'en') => void;
  setAiModel: (model: string) => void;
  setAiTemperature: (temp: number) => void;
  setEditorFontSize: (size: number) => void;
  setEditorFontFamily: (font: 'sans' | 'mono' | 'serif') => void;
  setEditorAutoSave: (autoSave: boolean) => void;
  setLoaded: (loaded: boolean) => void;
  syncFromYjs: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  gemini_api_key: '',
  language: 'zh',
  aiModel: 'gemini-2.5-flash',
  aiTemperature: 0.7,
  editorFontSize: 15,
  editorFontFamily: 'sans',
  editorAutoSave: true,
  isLoaded: false,
  setTheme: (theme) => {
    const manager = YjsManager.getInstance();
    manager.settingsMap.set('theme', theme);
  },
  setApiKey: (key) => {
    const manager = YjsManager.getInstance();
    manager.settingsMap.set('gemini_api_key', key);
  },
  setLanguage: (lang) => {
    const manager = YjsManager.getInstance();
    manager.settingsMap.set('language', lang);
  },
  setAiModel: (model) => {
    const manager = YjsManager.getInstance();
    manager.settingsMap.set('aiModel', model);
  },
  setAiTemperature: (temp) => {
    const manager = YjsManager.getInstance();
    manager.settingsMap.set('aiTemperature', temp);
  },
  setEditorFontSize: (size) => {
    const manager = YjsManager.getInstance();
    manager.settingsMap.set('editorFontSize', size);
  },
  setEditorFontFamily: (font) => {
    const manager = YjsManager.getInstance();
    manager.settingsMap.set('editorFontFamily', font);
  },
  setEditorAutoSave: (autoSave) => {
    const manager = YjsManager.getInstance();
    manager.settingsMap.set('editorAutoSave', autoSave);
  },
  setLoaded: (loaded) => {
    set({ isLoaded: loaded });
  },
  syncFromYjs: () => {
    const manager = YjsManager.getInstance();
    const data = manager.settingsMap.toJSON();
    set({
      theme: data.theme === 'dark' ? 'dark' : 'light',
      gemini_api_key: data.gemini_api_key || '',
      language: data.language || 'zh',
      aiModel: data.aiModel || 'gemini-2.5-flash',
      aiTemperature: data.aiTemperature !== undefined ? data.aiTemperature : 0.7,
      editorFontSize: data.editorFontSize || 15,
      editorFontFamily: data.editorFontFamily || 'sans',
      editorAutoSave: data.editorAutoSave !== undefined ? data.editorAutoSave : true,
    });
  }
}));

interface WorkspaceState {
  nodes: Record<string, WorkspaceNode>;
  addFile: (id: string, name: string, parentId: string, extra?: Partial<WorkspaceNode>) => void;
  addFolder: (id: string, name: string, parentId: string, extra?: Partial<WorkspaceNode>) => void;
  deleteNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  updateNode: (id: string, data: Partial<WorkspaceNode>) => void;
  syncFromYjs: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  nodes: {},
  addFile: (id, name, parentId, extra = {}) => {
    const manager = YjsManager.getInstance();
    manager.workspaceMap.set(id, { id, type: 'file', name, parentId, ...extra });
  },
  addFolder: (id, name, parentId, extra = {}) => {
    const manager = YjsManager.getInstance();
    manager.workspaceMap.set(id, { id, type: 'folder', name, parentId, ...extra });
  },
  deleteNode: (id) => {
    const manager = YjsManager.getInstance();
    const allNodes = manager.workspaceMap.toJSON() as Record<string, WorkspaceNode>;
    const toDelete = [id];

    // Recursively collect all child nodes
    let search = true;
    while (search) {
      let added = false;
      Object.values(allNodes).forEach((n) => {
        if (n && toDelete.includes(n.parentId) && !toDelete.includes(n.id)) {
          toDelete.push(n.id);
          added = true;
        }
      });
      if (!added) search = false;
    }

    manager.workspaceDoc.transact(() => {
      toDelete.forEach((nodeId) => {
        manager.workspaceMap.delete(nodeId);
        
        // Also remove Corresponding blocksuite notes if any (to keep workspace tidy)
        const page = manager.blocksuiteWorkspace.getPage(nodeId);
        if (page) {
          manager.blocksuiteWorkspace.removePage(nodeId);
        }
      });
    });
  },
  renameNode: (id, name) => {
    const manager = YjsManager.getInstance();
    const existing = manager.workspaceMap.get(id);
    if (existing) {
      manager.workspaceMap.set(id, { ...existing, name });
    }
  },
  updateNode: (id, data) => {
    const manager = YjsManager.getInstance();
    const existing = manager.workspaceMap.get(id);
    if (existing) {
      manager.workspaceMap.set(id, { ...existing, ...data });
    }
  },
  syncFromYjs: () => {
    const manager = YjsManager.getInstance();
    set({ nodes: (manager.workspaceMap.toJSON() as Record<string, WorkspaceNode>) || {} });
  }
}));

// Initialize listeners inside singleton
const manager = YjsManager.getInstance();

// Subscribe to loading status
manager.subscribeLoaded((loaded) => {
  useSettingsStore.getState().setLoaded(loaded);
  if (loaded) {
    useSettingsStore.getState().syncFromYjs();
    useWorkspaceStore.getState().syncFromYjs();
  }
});

// React to hot data updates
manager.settingsMap.observe(() => {
  useSettingsStore.getState().syncFromYjs();
});

manager.workspaceMap.observe(() => {
  useWorkspaceStore.getState().syncFromYjs();
});
