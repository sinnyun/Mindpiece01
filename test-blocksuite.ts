import { Schema, Workspace } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';
const schema = new Schema().register(AffineSchemas);
const workspace = new Workspace({ schema, id: 'test-workspace' });
const page = workspace.createPage({ id: 'page-1' });
page.load();

const pageId = page.addBlock('affine:page', {
  title: new Workspace.Y.Text(''),
}, page.root?.id);

console.log("Page ID", pageId);

try {
  page.addBlock('affine:surface', {}, pageId);
  console.log("Added surface");
} catch(e: any) {
  console.error("Error adding surface", e.message);
}

try {
  page.addBlock('affine:note', {}, pageId);
  console.log("Added note");
} catch(e: any) {
  console.error("Error adding note", e.message);
}
