import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Schema, Workspace } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';
import { EditorContainer } from '@blocksuite/editor';
import '@blocksuite/editor/themes/affine.css';

interface BlockSuiteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

export interface BlockSuiteEditorRef {
  appendContent: (text: string) => void;
}

export const BlockSuiteEditor = forwardRef<BlockSuiteEditorRef, BlockSuiteEditorProps>(
  ({ initialContent, onChange }, ref) => {
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
      }
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      let dispose: (() => void) | undefined;
      let editor: EditorContainer;

      try {
        const schema = new Schema().register(AffineSchemas);
        const workspace = new Workspace({ schema, id: 'test-workspace' });

        // create a page and setup blocks
        const page = workspace.createPage({ id: 'page-1' });
        pageRef.current = page;
        
        page.load(() => {
          const pageBlockId = page.addBlock('affine:page', {
            title: new page.Text(''),
          });
          workspace.setPageMeta(page.id, { title: '' });
          page.addBlock('affine:surface', {}, pageBlockId);
          const noteId = page.addBlock('affine:note', {}, pageBlockId);
          noteIdRef.current = noteId;
          page.addBlock('affine:paragraph', { text: new page.Text(initialContent || '') }, noteId);
          page.resetHistory();
        });

        editor = new EditorContainer();
        editor.page = page;
        editor.autofocus = true;
        editor.mode = 'page';
        
        const el = containerRef.current;
        el.innerHTML = '';
        el.appendChild(editor);

        let timeout: any;
        dispose = page.slots.historyUpdated.on(() => {
          if (!onChange) return;
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            let content = '';
            const blocks = page.getBlockByFlavour('affine:paragraph');
            blocks.forEach((model: any) => {
               if (model.text) {
                 content += model.text.toString() + '\n';
               }
               // Try extracting image inside the page, but skipped for simplicity
            });
            onChange(content.trim());
          }, 300);
        }).dispose;

        return () => {
          if (dispose) dispose();
          clearTimeout(timeout);
          el.innerHTML = '';
          workspace.removePage(page.id);
        };
      } catch (e) {
        console.error(e);
      }
    }, []);

    return (
      <div className="blocksuite-container w-full h-full flex-1 overflow-auto rounded-xl bg-white">
        <div ref={containerRef} className="w-full h-full min-h-[300px]" />
      </div>
    );
  }
);

