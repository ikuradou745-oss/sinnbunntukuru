import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');
const PROGRAMS_FILE = path.join(DATA_DIR, 'programs.json');

// Helper to read/write JSON files
const readJsonFile = <T>(filePath: string, fallback: T): T => {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
};

const writeJsonFile = <T>(filePath: string, data: T): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
};

// Initial Seeds if empty
const seedInitialDataIfEmpty = () => {
  if (!fs.existsSync(VIDEOS_FILE)) {
    // Generate sample video frames
    const canvas = {
      toDataUrl: () =>
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABAAQMAAAD/1p1wAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAABRJREFUOMtjGAWjYBSMglEwCkgEAAXwAAFx1/k+AAAAAElFTkSuQmCC',
    };
    const sampleVideo = {
      id: 'sample-video-online-1',
      type: 'video',
      title: '走る新聞くんアニメ',
      author: {
        name: 'ツクール公式',
        iconDataUrl: '',
      },
      createdAt: new Date().toISOString(),
      views: 128,
      width: 128,
      height: 64,
      totalFrames: 20,
      frameRate: 10,
      frames: Array.from({ length: 20 }, () => canvas.toDataUrl()),
    };
    writeJsonFile(VIDEOS_FILE, [sampleVideo]);
  }

  if (!fs.existsSync(PROGRAMS_FILE)) {
    const sampleProgram = {
      id: 'sample-prog-online-1',
      type: 'program',
      title: '新聞クエスト 〜冒険のはじまり〜',
      author: {
        name: 'ツクール公式',
        iconDataUrl: '',
      },
      createdAt: new Date().toISOString(),
      views: 245,
      width: 128,
      height: 128,
      backgroundDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACAAQMAAAD58POIAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAABtJREFUOMtjGAWjYBSMglEwCkbBKBgFo2AUDC4AAbwAAenp95cAAAAASUVORK5CYII=',
      sprites: [
        {
          id: 'sp-player',
          name: '主人公',
          dataUrl:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlMWhaAAAAA1BMVEUlY+s3N/6uAAAAAXRSTlMAQObYZgAAABBJREFUOMtjYCAMjBoxYNAAABrAAH0p8nZ+AAAAAElFTkSuQmCC',
          initialX: 32,
          initialY: 48,
        },
        {
          id: 'sp-chest',
          name: '宝箱',
          dataUrl:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlMWhaAAAAA1BMVEW0UwmqH3XnAAAAAXRSTlMAQObYZgAAABBJREFUOMtjYCAMjBoxYNAAABrAAH0p8nZ+AAAAAElFTkSuQmCC',
          initialX: 80,
          initialY: 48,
        },
      ],
      activeNumberKeys: [1, 2],
      variables: {
        'スコア1': 0,
        'スコア2': 0,
        'スコア3': 0,
        'スコア4': 0,
        'スコア5': 0,
        'スコア6': 0,
        'スコア7': 0,
        'スコア8': 0,
        'スコア9': 0,
        'スコア10': 0,
      },
      scripts: [
        {
          id: 'sc-start',
          eventBlock: { id: 'ev-start', category: 'event', eventType: 'start' },
          actionBlocks: [
            {
              id: 'act-start-msg',
              category: 'feature',
              featureAction: 'show_dialog',
              featureText: '冒険がはじまった！宝箱に触れてみよう',
            },
          ],
        },
        {
          id: 'sc-up',
          eventBlock: { id: 'ev-up', category: 'event', eventType: 'key_up' },
          actionBlocks: [
            {
              id: 'act-up',
              category: 'action',
              actionType: 'move_step',
              spriteId: 'sp-player',
              direction: 'up',
              steps: 8,
            },
            {
              id: 'act-check',
              category: 'check',
              checkSpriteA: 'sp-player',
              checkSpriteB: 'sp-chest',
              childBlocks: [
                {
                  id: 'check-msg',
                  category: 'feature',
                  featureAction: 'show_dialog',
                  featureText: '宝箱を発見！1キーで開けよう',
                },
              ],
            },
          ],
        },
        {
          id: 'sc-down',
          eventBlock: { id: 'ev-down', category: 'event', eventType: 'key_down' },
          actionBlocks: [
            {
              id: 'act-down',
              category: 'action',
              actionType: 'move_step',
              spriteId: 'sp-player',
              direction: 'down',
              steps: 8,
            },
            {
              id: 'act-check-d',
              category: 'check',
              checkSpriteA: 'sp-player',
              checkSpriteB: 'sp-chest',
              childBlocks: [
                {
                  id: 'check-msg-d',
                  category: 'feature',
                  featureAction: 'show_dialog',
                  featureText: '宝箱を発見！1キーで開けよう',
                },
              ],
            },
          ],
        },
        {
          id: 'sc-left',
          eventBlock: { id: 'ev-left', category: 'event', eventType: 'key_left' },
          actionBlocks: [
            {
              id: 'act-left',
              category: 'action',
              actionType: 'move_step',
              spriteId: 'sp-player',
              direction: 'left',
              steps: 8,
            },
            {
              id: 'act-check-l',
              category: 'check',
              checkSpriteA: 'sp-player',
              checkSpriteB: 'sp-chest',
              childBlocks: [
                {
                  id: 'check-msg-l',
                  category: 'feature',
                  featureAction: 'show_dialog',
                  featureText: '宝箱を発見！1キーで開けよう',
                },
              ],
            },
          ],
        },
        {
          id: 'sc-right',
          eventBlock: { id: 'ev-right', category: 'event', eventType: 'key_right' },
          actionBlocks: [
            {
              id: 'act-right',
              category: 'action',
              actionType: 'move_step',
              spriteId: 'sp-player',
              direction: 'right',
              steps: 8,
            },
            {
              id: 'act-check-r',
              category: 'check',
              checkSpriteA: 'sp-player',
              checkSpriteB: 'sp-chest',
              childBlocks: [
                {
                  id: 'check-msg-r',
                  category: 'feature',
                  featureAction: 'show_dialog',
                  featureText: '宝箱を発見！1キーで開けよう',
                },
              ],
            },
          ],
        },
        {
          id: 'sc-key1',
          eventBlock: { id: 'ev-k1', category: 'event', eventType: 'key_num', keyNum: 1 },
          actionBlocks: [
            {
              id: 'k1-check',
              category: 'check',
              checkSpriteA: 'sp-player',
              checkSpriteB: 'sp-chest',
              childBlocks: [
                {
                  id: 'act-add-score',
                  category: 'variable',
                  varName: 'スコア1',
                  varOp: 'add',
                  varValue: 10,
                },
                {
                  id: 'act-show-score',
                  category: 'feature',
                  featureAction: 'show_dialog',
                  featureText: '宝箱を開けた！スコア1: {スコア1}',
                },
              ],
            },
          ],
        },
      ],
    };
    writeJsonFile(PROGRAMS_FILE, [sampleProgram]);
  }
};

seedInitialDataIfEmpty();

// --- VIDEOS API ---
app.get('/api/videos', (req, res) => {
  const videos = readJsonFile<any[]>(VIDEOS_FILE, []);
  res.json(videos);
});

app.post('/api/videos', (req, res) => {
  const video = req.body;
  if (!video || !video.title || !video.author) {
    return res.status(400).json({ error: '不正な動画データです' });
  }

  const videos = readJsonFile<any[]>(VIDEOS_FILE, []);
  const userVideos = videos.filter((v) => v.author?.name === video.author?.name);
  if (userVideos.length >= 10 && !videos.some((v) => v.id === video.id)) {
    return res.status(400).json({ error: '1ユーザー最大10作品までです。' });
  }

  const existingIdx = videos.findIndex((v) => v.id === video.id);
  if (existingIdx >= 0) {
    videos[existingIdx] = video;
  } else {
    videos.unshift(video);
  }

  writeJsonFile(VIDEOS_FILE, videos);
  res.json({ success: true, video });
});

app.delete('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  const authorName = req.query.author as string;
  let videos = readJsonFile<any[]>(VIDEOS_FILE, []);
  const target = videos.find((v) => v.id === id);

  if (!target) {
    return res.status(404).json({ error: '動画が見つかりません' });
  }

  if (target.author?.name !== authorName && target.author?.name !== 'ツクール公式') {
    return res.status(403).json({ error: '削除権限がありません' });
  }

  videos = videos.filter((v) => v.id !== id);
  writeJsonFile(VIDEOS_FILE, videos);
  res.json({ success: true });
});

app.post('/api/videos/:id/view', (req, res) => {
  const { id } = req.params;
  const videos = readJsonFile<any[]>(VIDEOS_FILE, []);
  const target = videos.find((v) => v.id === id);
  if (target) {
    target.views = (target.views || 0) + 1;
    writeJsonFile(VIDEOS_FILE, videos);
  }
  res.json({ success: true });
});

// --- PROGRAMS API ---
app.get('/api/programs', (req, res) => {
  const programs = readJsonFile<any[]>(PROGRAMS_FILE, []);
  res.json(programs);
});

app.post('/api/programs', (req, res) => {
  const program = req.body;
  if (!program || !program.title || !program.author) {
    return res.status(400).json({ error: '不正なプログラムデータです' });
  }

  const programs = readJsonFile<any[]>(PROGRAMS_FILE, []);
  const userPrograms = programs.filter((p) => p.author?.name === program.author?.name);
  if (userPrograms.length >= 3 && !programs.some((p) => p.id === program.id)) {
    return res.status(400).json({ error: '1ユーザー最大3作品までです。' });
  }

  const existingIdx = programs.findIndex((p) => p.id === program.id);
  if (existingIdx >= 0) {
    programs[existingIdx] = program;
  } else {
    programs.unshift(program);
  }

  writeJsonFile(PROGRAMS_FILE, programs);
  res.json({ success: true, program });
});

app.delete('/api/programs/:id', (req, res) => {
  const { id } = req.params;
  const authorName = req.query.author as string;
  let programs = readJsonFile<any[]>(PROGRAMS_FILE, []);
  const target = programs.find((p) => p.id === id);

  if (!target) {
    return res.status(404).json({ error: 'プログラムが見つかりません' });
  }

  if (target.author?.name !== authorName && target.author?.name !== 'ツクール公式') {
    return res.status(403).json({ error: '削除権限がありません' });
  }

  programs = programs.filter((p) => p.id !== id);
  writeJsonFile(PROGRAMS_FILE, programs);
  res.json({ success: true });
});

app.post('/api/programs/:id/view', (req, res) => {
  const { id } = req.params;
  const programs = readJsonFile<any[]>(PROGRAMS_FILE, []);
  const target = programs.find((p) => p.id === id);
  if (target) {
    target.views = (target.views || 0) + 1;
    writeJsonFile(PROGRAMS_FILE, programs);
  }
  res.json({ success: true });
});

app.get(['/favicon.ico', '/apple-touch-icon.png', '/apple-touch-icon-precomposed.png', '/robots.txt', '/site.webmanifest'], (req, res) => {
  const filePath = path.join(__dirname, 'public', req.path.slice(1));
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(204).end();
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: HOST,
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA fallback: handle client-side routing and HTML requests in dev
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API routes so they 404 properly if non-existent
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[ティックエディション] Server running at http://${HOST}:${PORT}`);
  });
}

startServer();
