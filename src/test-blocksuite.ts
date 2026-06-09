import { Schema, Workspace } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';
import * as Y from 'yjs';

const schema = new Schema().register(AffineSchemas);
const workspace = new Workspace({ schema, id: 'test' });
const page = workspace.createPage({ id: 'test-page' });
page.load();
const pageBlockId = page.addBlock('affine:page', { title: new page.Text('') });
page.addBlock('affine:surface', {}, pageBlockId);
const noteId = page.addBlock('affine:note', {}, pageBlockId);

const paragraphId = page.addBlock('affine:paragraph', {}, noteId);
const paragraphBlock = page.getBlockById(paragraphId);
console.log('Paragraph block:', paragraphBlock);
if (paragraphBlock && paragraphBlock.text) {
  (paragraphBlock.text as any).insert('hello world', 0);
  console.log('Paragraph text:', paragraphBlock.text.toString());
}
