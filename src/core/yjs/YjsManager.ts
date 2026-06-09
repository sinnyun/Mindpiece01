import * as Y from 'yjs';
import { Schema, Workspace } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';

// Helper for character-level diff and patch on a Y.Text object
export function diffAndPatchYText(yText: Y.Text | any, newText: string) {
  const currentText = yText.toString();
  if (currentText === newText) return;

  // Find common prefix
  let start = 0;
  while (start < currentText.length && start < newText.length && currentText[start] === newText[start]) {
    start++;
  }

  // Find common suffix
  let endCurrent = currentText.length;
  let endNew = newText.length;
  while (endCurrent > start && endNew > start && currentText[endCurrent - 1] === newText[endNew - 1]) {
    endCurrent--;
    endNew--;
  }

  // Delete diff portion from current
  const deleteCount = endCurrent - start;
  if (deleteCount > 0) {
    yText.delete(start, deleteCount);
  }

  // Insert diff portion from new
  const insertText = newText.slice(start, endNew);
  if (insertText.length > 0) {
    yText.insert(start, insertText);
  }
}

// Global class to coordinate state
export class YjsManager {
  private static instance: YjsManager | null = null;

  public settingsDoc: Y.Doc;
  public workspaceDoc: Y.Doc;
  public chatDoc: Y.Doc;
  public blocksuiteWorkspace: Workspace;

  public settingsMap: Y.Map<any>;
  public workspaceMap: Y.Map<any>;
  public chatArray: Y.Array<any>;

  public ws: WebSocket | null = null;
  private isLoadedState: boolean = false;
  private listeners: Set<(loaded: boolean) => void> = new Set();
  
  // To prevent self-updates from triggering save loops
  private incomingUpdateActive = false;

  public static getInstance(): YjsManager {
    if (!YjsManager.instance) {
      YjsManager.instance = new YjsManager();
    }
    return YjsManager.instance;
  }

  private constructor() {
    // 1. Initialize Docs
    this.settingsDoc = new Y.Doc();
    this.workspaceDoc = new Y.Doc();
    this.chatDoc = new Y.Doc();

    this.settingsMap = this.settingsDoc.getMap('settings');
    this.workspaceMap = this.workspaceDoc.getMap('index');
    this.chatArray = this.chatDoc.getArray('messages');

    // 2. Initialize BlockSuite Workspace
    const schema = new Schema().register(AffineSchemas);
    this.blocksuiteWorkspace = new Workspace({ schema, id: 'main-workspace' });

    // 3. Connect Socket and setup observers
    this.connectSocket();
    this.setupLocalObservers();
  }

  public get isLoaded(): boolean {
    return this.isLoadedState;
  }

  public subscribeLoaded(cb: (loaded: boolean) => void) {
    this.listeners.add(cb);
    cb(this.isLoadedState);
    return () => this.listeners.delete(cb);
  }

  private setLoaded(loaded: boolean) {
    this.isLoadedState = loaded;
    this.listeners.forEach(cb => cb(loaded));
  }

  private connectSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use relative path '/ws' which Vite will proxy to the watch-server on 3001
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}/ws`;

    console.log(`[YjsManager] Connecting to WebSocket: ${socketUrl}`);
    const ws = new WebSocket(socketUrl);
    this.ws = ws;

    ws.onopen = () => {
      console.log('[YjsManager] WebSocket connected');
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'BOOTSTRAP') {
          console.log('[YjsManager] Bootstrap data received:', message.data);
          this.handleBootstrap(message.data);
        } else if (message.type === 'FILE_CHANGED') {
          console.log('[YjsManager] Hot-Reload External Modification:', message.path);
          await this.handleFileChanged(message.path, message.content);
        }
      } catch (e) {
        console.error('[YjsManager] Error handling socket message:', e);
      }
    };

    ws.onerror = (e) => {
      console.error('[YjsManager] WebSocket error:', e);
    };

    ws.onclose = () => {
      console.warn('[YjsManager] WebSocket closed. Retrying in 3s...');
      this.setLoaded(false);
      setTimeout(() => this.connectSocket(), 3000);
    };
  }

  private handleBootstrap(data: { config: any; workspace: any; chats: any[]; notes: Record<string, string> }) {
    this.incomingUpdateActive = true;

    try {
      // Synchronize Settings Map
      this.settingsDoc.transact(() => {
        this.settingsMap.clear();
        Object.entries(data.config || {}).forEach(([key, val]) => {
          this.settingsMap.set(key, val);
        });
      });

      // Synchronize Workspace Map
      this.workspaceDoc.transact(() => {
        this.workspaceMap.clear();
        Object.entries(data.workspace || {}).forEach(([key, val]) => {
          this.workspaceMap.set(key, val);
        });
      });

      // Synchronize Chats Array
      this.chatDoc.transact(() => {
        this.chatArray.delete(0, this.chatArray.length);
        if (Array.isArray(data.chats)) {
          this.chatArray.push(data.chats);
        }
      });

      // Synchronize Notes in BlockSuite collection
      Object.entries(data.notes || {}).forEach(([docId, content]) => {
        let page = this.blocksuiteWorkspace.getPage(docId);
        if (!page) {
          page = this.blocksuiteWorkspace.createPage({ id: docId });
        }
        
        // Populate page with structure and blocks
        page.load(() => {
          // If empty, define basic visual modules
          const noteBlocks = page.getBlockByFlavour('affine:note');
          if (noteBlocks.length === 0) {
            const pageBlockId = page.addBlock('affine:page', { title: new page.Text('') });
            this.blocksuiteWorkspace.setPageMeta(page.id, { title: '' });
            page.addBlock('affine:surface', {}, pageBlockId);
            const noteId = page.addBlock('affine:note', {}, pageBlockId);
            
            // Render markdown content to paragraphs
            const lines = content.split('\n');
            lines.forEach((line) => {
              if (line.trim() || line === '') {
                page.addBlock('affine:paragraph', { text: new page.Text(line) }, noteId);
              }
            });
          }
        });

        // Setup individual page auto-save observation of document slot edits
        this.setupPageObserver(page);
      });

      // Listen for newly added pages dynamically in future
      this.blocksuiteWorkspace.slots.pageAdded.on((pageId) => {
        const page = this.blocksuiteWorkspace.getPage(pageId);
        if (page) {
          this.setupPageObserver(page);
        }
      });

      this.setLoaded(true);
      console.log('[YjsManager] Bootstrap mapping completed successfully.');
    } catch (e) {
      console.error('[YjsManager] Error decoding BOOTSTRAP schema:', e);
    } finally {
      this.incomingUpdateActive = false;
    }
  }

  private async handleFileChanged(filePath: string, content: string) {
    this.incomingUpdateActive = true;
    try {
      const normalizedPath = filePath.replace(/\\/g, '/');

      if (normalizedPath === 'config.json') {
        const json = JSON.parse(content);
        this.settingsDoc.transact(() => {
          this.settingsMap.clear();
          Object.entries(json).forEach(([k, v]) => this.settingsMap.set(k, v));
        });
      } else if (normalizedPath === 'workspace.json') {
        const json = JSON.parse(content);
        this.workspaceDoc.transact(() => {
          this.workspaceMap.clear();
          Object.entries(json).forEach(([k, v]) => this.workspaceMap.set(k, v));
        });
      } else if (normalizedPath === 'chats.json') {
        const json = JSON.parse(content);
        this.chatDoc.transact(() => {
          this.chatArray.delete(0, this.chatArray.length);
          if (Array.isArray(json)) {
            this.chatArray.push(json);
          }
        });
      } else if (normalizedPath.startsWith('notes/') && normalizedPath.endsWith('.md')) {
        // Extract note document ID
        const docId = normalizedPath.substring(6, normalizedPath.length - 3);
        const page = this.blocksuiteWorkspace.getPage(docId);
        if (page) {
          await page.load();
          
          this.patchPageFromMarkdown(page, content);
        }
      }
    } catch (e) {
      console.error('[YjsManager] Error hot-merging external modification:', e);
    } finally {
      this.incomingUpdateActive = false;
    }
  }

  // Implementation of Cursor-Preserved differential patch algorithm!
  private patchPageFromMarkdown(page: any, newMarkdown: string) {
    const activeNotes = page.getBlockByFlavour('affine:note');
    if (activeNotes.length === 0) return;
    const activeNote = activeNotes[0];

    // Build lists of blocks from raw markdown line splits (simulating the ShadowDoc)
    const lines = newMarkdown.split('\n');
    const shadowBlockData: Array<{ flavour: string; textVal: string; type?: string; language?: string }> = [];
    
    let currentCodeLang = '';
    let isInsideCode = false;
    let codeBuffer: string[] = [];

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        if (isInsideCode) {
          // Close code block
          shadowBlockData.push({
            flavour: 'affine:code',
            textVal: codeBuffer.join('\n'),
            language: currentCodeLang || 'text'
          });
          isInsideCode = false;
          codeBuffer = [];
        } else {
          isInsideCode = true;
          currentCodeLang = line.replace('```', '').trim();
        }
        continue;
      }

      if (isInsideCode) {
        codeBuffer.push(line);
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed && line !== '') continue;

      if (trimmed.startsWith('#')) {
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          shadowBlockData.push({
            flavour: 'affine:paragraph',
            textVal: headingMatch[2],
            type: `h${level}`
          });
          continue;
        }
      }

      // Standard paragraph
      shadowBlockData.push({
        flavour: 'affine:paragraph',
        textVal: line
      });
    }

    // Now, perform differential comparison & incremental patch inside transaction
    const liveContentBlocks = [...activeNote.children];
    const maxLength = Math.max(liveContentBlocks.length, shadowBlockData.length);

    page.transact(() => {
      for (let i = 0; i < maxLength; i++) {
        const liveBlock = liveContentBlocks[i];
        const shadowBlock = shadowBlockData[i];

        if (liveBlock && shadowBlock) {
          const sameFlavour = liveBlock.flavour === shadowBlock.flavour;
          const liveTextObj = liveBlock.text || liveBlock.title;

          if (sameFlavour && liveTextObj) {
            // Incremental diff & patch to retain cursors and selections!
            diffAndPatchYText(liveTextObj, shadowBlock.textVal);
            
            // Check secondary properties
            if (liveBlock.flavour === 'affine:code' && liveBlock.language !== shadowBlock.language) {
              page.updateBlock(liveBlock, { language: shadowBlock.language });
            }
            if (liveBlock.flavour === 'affine:paragraph' && liveBlock.type !== shadowBlock.type) {
              page.updateBlock(liveBlock, { type: shadowBlock.type });
            }
          } else {
            // Type mismatch -> delete and recreate block at i
            page.deleteBlock(liveBlock);
            
            const props: any = {};
            if (shadowBlock.flavour === 'affine:code') {
              props.text = new page.Text(shadowBlock.textVal);
              props.language = shadowBlock.language || 'text';
            } else {
              props.text = new page.Text(shadowBlock.textVal);
              if (shadowBlock.type) props.type = shadowBlock.type;
            }
            
            page.addBlock(shadowBlock.flavour, props, activeNote, i);
          }
        } else if (shadowBlock) {
          // Shadow block is extra -> append to document end
          const props: any = {};
          if (shadowBlock.flavour === 'affine:code') {
            props.text = new page.Text(shadowBlock.textVal);
            props.language = shadowBlock.language || 'text';
          } else {
            props.text = new page.Text(shadowBlock.textVal);
            if (shadowBlock.type) props.type = shadowBlock.type;
          }
          
          page.addBlock(shadowBlock.flavour, props, activeNote);
        } else if (liveBlock) {
          // Live block is extra -> truncate / delete
          page.deleteBlock(liveBlock);
        }
      }
    });
  }

  private setupLocalObservers() {
    // 1. Settings Map Observer
    this.settingsMap.observe(() => {
      if (this.incomingUpdateActive) return;
      this.saveFileToDisk('config.json', JSON.stringify(this.settingsMap.toJSON(), null, 2));
    });

    // 2. Workspace Map Observer
    this.workspaceMap.observe(() => {
      if (this.incomingUpdateActive) return;
      this.saveFileToDisk('workspace.json', JSON.stringify(this.workspaceMap.toJSON(), null, 2));
    });

    // 3. Chat Array Observer
    this.chatArray.observe(() => {
      if (this.incomingUpdateActive) return;
      this.saveFileToDisk('chats.json', JSON.stringify(this.chatArray.toJSON(), null, 2));
    });
  }

  private pageSaveTimeouts = new Map<string, any>();

  private setupPageObserver(page: any) {
    // Listen to page changes (which is block tree modifications or text edits)
    page.slots.historyUpdated.on(() => {
      if (this.incomingUpdateActive) return;

      const docId = page.id;
      // 800ms Auto-Save Debounce
      if (this.pageSaveTimeouts.has(docId)) {
        clearTimeout(this.pageSaveTimeouts.get(docId));
      }

      const timeout = setTimeout(() => {
        this.pageSaveTimeouts.delete(docId);
        this.exportAndSaveMarkdown(page);
      }, 800);

      this.pageSaveTimeouts.set(docId, timeout);
    });
  }

  private exportAndSaveMarkdown(page: any) {
    try {
      // Simple and standard Markdown serializer from blocks
      let markdownStr = '';
      const activeNotes = page.getBlockByFlavour('affine:note');
      if (activeNotes.length > 0) {
        const noteBlock = activeNotes[0];
        noteBlock.children.forEach((model: any) => {
          const textVal = (model.text || model.title)?.toString() || '';
          if (model.flavour === 'affine:paragraph') {
            if (model.type && model.type.startsWith('h')) {
              const hLevel = parseInt(model.type.slice(1)) || 1;
              markdownStr += `${'#'.repeat(hLevel)} ${textVal}\n\n`;
            } else {
              markdownStr += `${textVal}\n\n`;
            }
          } else if (model.flavour === 'affine:code') {
            const lang = model.language || 'text';
            markdownStr += `\`\`\`${lang}\n${textVal}\n\`\`\`\n\n`;
          }
        });
      }

      const cleanMd = markdownStr.trim();
      const relativePath = `notes/${page.id}.md`;
      this.saveFileToDisk(relativePath, cleanMd);
    } catch (e) {
      console.error(`[YjsManager] Failed to export note ${page.id} to GFM Markdown:`, e);
    }
  }

  private saveFileToDisk(relativePath: string, content: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'WRITE_FILE',
        path: relativePath,
        content: content
      }));
    } else {
      console.warn(`[YjsManager] Server offline, unable to save ${relativePath} to disk immediately`);
    }
  }
}
