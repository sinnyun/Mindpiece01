import React, { useEffect, useRef, useState } from 'react';
import { Schema, Workspace } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';
import { EditorContainer } from '@blocksuite/editor';
import '@blocksuite/editor/themes/affine.css';

interface BlockSuiteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

export function BlockSuiteEditor({ initialContent, onChange }: BlockSuiteEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let dispose: (() => void) | undefined;
    let editor: EditorContainer;

    try {
      const schema = new Schema().register(AffineSchemas);
      const workspace = new Workspace({ schema, id: 'test-workspace' });

      // create a page and setup blocks
      const page = workspace.createPage({ id: 'page-1' });
      page.load();

      const pageId = page.addBlock('affine:page', {
        title: new Workspace.Y.Text(''),
      }, page.root?.id);
      
      if (pageId) {
        page.addBlock('affine:surface', {}, pageId);
        const noteId = page.addBlock('affine:note', {}, pageId);
        page.addBlock('affine:paragraph', { text: new Workspace.Y.Text(initialContent || '') }, noteId);
      }

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
    <div className="blocksuite-container w-full h-full flex-1 overflow-auto rounded-xl">
      <div ref={containerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
}
