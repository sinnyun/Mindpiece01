import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorContainer } from '@blocksuite/editor';
import { YjsManager } from '../core/yjs/YjsManager';
import '@blocksuite/editor/themes/affine.css';

interface BlockSuiteEditorProps {
  docId: string; // Ensure we load the exact Local-First page matching our list card docId!
  initialContent?: string;
  onChange?: (content: string) => void;
}

export interface BlockSuiteEditorRef {
  appendContent: (text: string) => void;
  setContent: (text: string) => void;
}

export const BlockSuiteEditor = forwardRef<BlockSuiteEditorRef, BlockSuiteEditorProps>(
  ({ docId, initialContent, onChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<any>(null);
    const noteIdRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      appendContent: (text: string) => {
        const page = pageRef.current;
        const noteId = noteIdRef.current;
        if (page && noteId) {
          page.addBlock('affine:paragraph', { text: new page.Text(text) }, noteId);
        }
      },
      setContent: (text: string) => {
        const page = pageRef.current;
        const noteId = noteIdRef.current;
        if (page && noteId) {
          const blocks = page.getBlockByFlavour('affine:paragraph');
          blocks.forEach((b: any) => {
            try {
              page.deleteBlock(b.id || b);
            } catch(e) {}
          });
          const lines = text.split('\n');
          if (lines.length > 0) {
            lines.forEach((line: string) => {
              if (line.trim()) {
                page.addBlock('affine:paragraph', { text: new page.Text(line) }, noteId);
              }
            });
          } else {
             page.addBlock('affine:paragraph', { text: new page.Text('') }, noteId);
          }
        }
      }
    }));

    const onChangeRef = useRef(onChange);
    const initialContentRef = useRef(initialContent);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      initialContentRef.current = initialContent;
    }, [initialContent]);

    useEffect(() => {
      if (!containerRef.current || !docId) return;

      const manager = YjsManager.getInstance();
      const workspace = manager.blocksuiteWorkspace;
      let page = workspace.getPage(docId);

      if (!page) {
        page = workspace.createPage({ id: docId });
      }

      let dispose: (() => void) | undefined;
      let editor: EditorContainer;

      pageRef.current = page;

      const initEditor = async () => {
        await page.load();
        
        let noteId = '';
        const noteBlocks = page.getBlockByFlavour('affine:note');
        if (noteBlocks.length > 0) {
          noteId = noteBlocks[0].id;
        } else {
          // Auto initialize default visual components if blank
          const pageBlockId = page.addBlock('affine:page', {
            title: new page.Text(''),
          });
          workspace.setPageMeta(page.id, { title: '' });
          page.addBlock('affine:surface', {}, pageBlockId);
          noteId = page.addBlock('affine:note', {}, pageBlockId);
          page.addBlock('affine:paragraph', { text: new page.Text(initialContentRef.current || '') }, noteId);
          page.resetHistory();
        }
        noteIdRef.current = noteId;

        editor = new EditorContainer();
        editor.page = page;
        editor.autofocus = true;
        editor.mode = 'page';

        const el = containerRef.current;
        if (el) {
          el.innerHTML = '';
          el.appendChild(editor);
        }

        // Sync local React container state with other processes
        dispose = page.slots.historyUpdated.on(() => {
          if (!onChangeRef.current) return;
          let content = '';
          const blocks = page.getBlockByFlavour('affine:paragraph');
          blocks.forEach((model: any) => {
             if (model.text) {
               content += model.text.toString() + '\n';
             }
          });
          onChangeRef.current(content.trim());
        }).dispose;
      };

      initEditor();

      return () => {
        if (dispose) dispose();
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    }, [docId]);

    return (
      <div className="blocksuite-container w-full h-full flex-1 overflow-auto rounded-xl bg-white dark:bg-slate-900">
        <div ref={containerRef} className="w-full h-full min-h-[300px]" />
      </div>
    );
  }
);
