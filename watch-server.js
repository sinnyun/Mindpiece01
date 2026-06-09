import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const NOTES_DIR = path.resolve(DATA_DIR, 'notes');

// Auto-initialize directories
if (!fs.existsSync(NOTES_DIR)) {
  fs.mkdirSync(NOTES_DIR, { recursive: true });
}

const DEFAULT_FILES = {
  'config.json': JSON.stringify({ theme: 'light', gemini_api_key: '' }, null, 2),
  'workspace.json': JSON.stringify({}, null, 2),
  'chats.json': JSON.stringify([], null, 2)
};

Object.entries(DEFAULT_FILES).forEach(([filename, defaultContent]) => {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent, 'utf8');
  }
});

// Write locks set (relative file paths like 'config.json', 'notes/doc-1.md')
const writeLocks = new Set();
const lastWriteContents = new Map(); // relativePath -> string content to avoid redundant hot reload broadcast loops

// WebSocket server
const wss = new WebSocketServer({ port: 3001 });
console.log('[Watch Server] Running internally on port 3001...');

function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}

// Watch data directory
const watcher = chokidar.watch(DATA_DIR, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
});

watcher.on('all', (event, filePath) => {
  if (event !== 'add' && event !== 'change') return;
  
  const relativePath = path.relative(DATA_DIR, filePath).replace(/\\/g, '/');
  
  // Ignore system/lock files or temporary creations
  if (relativePath.startsWith('.aistudio') || relativePath.includes('.git') || relativePath.includes('node_modules')) return;
  if (!relativePath.endsWith('.json') && !relativePath.endsWith('.md')) return;

  if (writeLocks.has(relativePath)) {
    // Lock hit, release and ignore
    writeLocks.delete(relativePath);
    console.log(`[Watch Server] Change ignored (Write-Locked-Release): ${relativePath}`);
    return;
  }

  console.log(`[Watch Server] External change detected: ${relativePath}`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the content is exactly the same as our own last written data
    const lastContent = lastWriteContents.get(relativePath);
    if (lastContent === content) {
      console.log(`[Watch Server] Change ignored (Content Identical to last write): ${relativePath}`);
      return;
    }
    
    broadcast({
      type: 'FILE_CHANGED',
      path: relativePath,
      content: content
    });
  } catch (error) {
    console.error(`[Watch Server] Error reading changed file ${relativePath}:`, error);
  }
});

wss.on('connection', (ws) => {
  console.log('[Watch Server] Client connected');

  // Trigger Bootstrap Sync
  try {
    const config = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'config.json'), 'utf8'));
    const workspace = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'workspace.json'), 'utf8'));
    const chats = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'chats.json'), 'utf8'));
    
    const notes = {};
    if (fs.existsSync(NOTES_DIR)) {
      const files = fs.readdirSync(NOTES_DIR);
      files.forEach(file => {
        if (file.endsWith('.md')) {
          const docId = path.basename(file, '.md');
          const content = fs.readFileSync(path.join(NOTES_DIR, file), 'utf8');
          notes[docId] = content;
        }
      });
    }

    ws.send(JSON.stringify({
      type: 'BOOTSTRAP',
      data: { config, workspace, chats, notes }
    }));
    console.log('[Watch Server] Sent BOOTSTRAP data to connected client');
  } catch (error) {
    console.error('[Watch Server] Error reading files during bootstrap:', error);
  }

  ws.on('message', (messageStr) => {
    try {
      const message = JSON.parse(messageStr);
      if (message.type === 'WRITE_FILE') {
        const { path: relPath, content } = message;
        // Basic path sanitization
        if (relPath.includes('..') || path.isAbsolute(relPath)) {
          console.warn('[Watch Server] Saved process blocked: rejected unsafe path:', relPath);
          return;
        }

        const absolutePath = path.resolve(DATA_DIR, relPath);
        // Ensure within DATA_DIR
        if (!absolutePath.startsWith(DATA_DIR)) {
          console.warn('[Watch Server] Saved process blocked: rejected unsafe path boundary transition:', relPath);
          return;
        }

        const normalizedPath = relPath.replace(/\\/g, '/');
        // Add to write locks before syncing to disk
        writeLocks.add(normalizedPath);
        console.log(`[Watch Server] Writing file under lock: ${normalizedPath}`);

        // Ensure parent directory exists
        const parentDir = path.dirname(absolutePath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.writeFileSync(absolutePath, content, 'utf8');
        lastWriteContents.set(normalizedPath, content);
        console.log(`[Watch Server] Successfully wrote to disk: ${normalizedPath}`);
      }
    } catch (e) {
      console.error('[Watch Server] Error handling incoming client WRITE_FILE:', e);
    }
  });

  ws.on('close', () => {
    console.log('[Watch Server] Client disconnected');
  });
});
