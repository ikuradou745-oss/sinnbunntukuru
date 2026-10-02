import { VideoToolItem, ProgramToolItem } from '../types/tools';

const VIDEO_STORAGE_KEY = 'shinbun_tsukuru_videos_v1';
const PROGRAM_STORAGE_KEY = 'shinbun_tsukuru_programs_v1';

// Seed sample video (A cute 128x64 walking / bouncing dot animation)
const createSampleVideo = (): VideoToolItem => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const frames: string[] = [];
  const totalFrames = 20;

  for (let i = 0; i < totalFrames; i++) {
    // Clear background
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, 128, 64);

    // Ground
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 48, 128, 16);

    // Bouncing Newspaper Character
    const x = 16 + i * 4.8;
    const bounce = Math.abs(Math.sin((i / totalFrames) * Math.PI * 4)) * 14;
    const y = 32 - bounce;

    // Body (Newspaper folded paper)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(x - 8, y - 10, 16, 16);
    ctx.strokeRect(x - 8, y - 10, 16, 16);

    // Headline marks
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 5, y - 6, 10, 2);
    ctx.fillRect(x - 5, y - 2, 8, 2);

    // Face / Eyes
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x - 4, y + 1, 2, 2);
    ctx.fillRect(x + 2, y + 1, 2, 2);

    // Legs
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 6);
    ctx.lineTo(x - 4, y + 10);
    ctx.moveTo(x + 4, y + 6);
    ctx.lineTo(x + 4, y + 10);
    ctx.stroke();

    frames.push(canvas.toDataURL('image/png'));
  }

  return {
    id: 'sample-video-1',
    type: 'video',
    title: '走る新聞くんアニメ',
    author: {
      name: 'ツクール公式',
      iconDataUrl: '',
    },
    createdAt: new Date().toISOString(),
    views: 42,
    width: 128,
    height: 64,
    totalFrames: 20,
    frameRate: 10,
    frames,
  };
};

// Seed sample program (128x128 Adventure game with player, chest, keys and variables)
const createSampleProgram = (): ProgramToolItem => {
  // 128x128 background
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = 128;
  bgCanvas.height = 128;
  const bgCtx = bgCanvas.getContext('2d')!;
  bgCtx.fillStyle = '#f8fafc';
  bgCtx.fillRect(0, 0, 128, 128);

  // Floor grid
  bgCtx.strokeStyle = '#e2e8f0';
  bgCtx.lineWidth = 1;
  for (let x = 0; x < 128; x += 16) {
    bgCtx.beginPath();
    bgCtx.moveTo(x, 0);
    bgCtx.lineTo(x, 128);
    bgCtx.stroke();
  }
  for (let y = 0; y < 128; y += 16) {
    bgCtx.beginPath();
    bgCtx.moveTo(0, y);
    bgCtx.lineTo(128, y);
    bgCtx.stroke();
  }

  // Border wall
  bgCtx.fillStyle = '#94a3b8';
  bgCtx.fillRect(0, 0, 128, 8);
  bgCtx.fillRect(0, 120, 128, 8);
  bgCtx.fillRect(0, 0, 8, 128);
  bgCtx.fillRect(120, 0, 8, 128);

  // Player sprite (16x16)
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 16;
  pCanvas.height = 16;
  const pCtx = pCanvas.getContext('2d')!;
  pCtx.fillStyle = '#2563eb';
  pCtx.fillRect(2, 2, 12, 12);
  pCtx.fillStyle = '#ffffff';
  pCtx.fillRect(4, 5, 3, 3);
  pCtx.fillRect(9, 5, 3, 3);
  pCtx.fillStyle = '#1e3a8a';
  pCtx.fillRect(5, 6, 1, 1);
  pCtx.fillRect(10, 6, 1, 1);

  // Item Chest sprite (16x16)
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 16;
  cCanvas.height = 16;
  const cCtx = cCanvas.getContext('2d')!;
  cCtx.fillStyle = '#b45309';
  cCtx.fillRect(2, 4, 12, 9);
  cCtx.fillStyle = '#f59e0b';
  cCtx.fillRect(7, 7, 2, 3);

  return {
    id: 'sample-prog-1',
    type: 'program',
    title: '新聞クエスト 〜冒険のはじまり〜',
    author: {
      name: 'ツクール公式',
      iconDataUrl: '',
    },
    createdAt: new Date().toISOString(),
    views: 89,
    width: 128,
    height: 128,
    backgroundDataUrl: bgCanvas.toDataURL('image/png'),
    sprites: [
      {
        id: 'sprite-player',
        name: '主人公',
        dataUrl: pCanvas.toDataURL('image/png'),
        initialX: 32,
        initialY: 48,
      },
      {
        id: 'sprite-chest',
        name: '宝箱',
        dataUrl: cCanvas.toDataURL('image/png'),
        initialX: 80,
        initialY: 48,
      },
    ],
    activeNumberKeys: [1, 2],
    variables: {
      'スコア': 0,
      'コイン': 10,
    },
    scripts: [
      {
        id: 'script-start',
        eventBlock: {
          id: 'ev-start',
          category: 'event',
          eventType: 'start',
        },
        actionBlocks: [
          {
            id: 'act-start-msg',
            category: 'feature',
            featureAction: 'show_dialog',
            featureText: '冒険がはじまった！矢印キーで移動しよう',
          },
        ],
      },
      {
        id: 'script-up',
        eventBlock: {
          id: 'ev-up',
          category: 'event',
          eventType: 'key_up',
        },
        actionBlocks: [
          {
            id: 'act-up-move',
            category: 'action',
            actionType: 'move_step',
            spriteId: 'sprite-player',
            direction: 'up',
            steps: 8,
          },
        ],
      },
      {
        id: 'script-down',
        eventBlock: {
          id: 'ev-down',
          category: 'event',
          eventType: 'key_down',
        },
        actionBlocks: [
          {
            id: 'act-down-move',
            category: 'action',
            actionType: 'move_step',
            spriteId: 'sprite-player',
            direction: 'down',
            steps: 8,
          },
        ],
      },
      {
        id: 'script-left',
        eventBlock: {
          id: 'ev-left',
          category: 'event',
          eventType: 'key_left',
        },
        actionBlocks: [
          {
            id: 'act-left-move',
            category: 'action',
            actionType: 'move_step',
            spriteId: 'sprite-player',
            direction: 'left',
            steps: 8,
          },
        ],
      },
      {
        id: 'script-right',
        eventBlock: {
          id: 'ev-right',
          category: 'event',
          eventType: 'key_right',
        },
        actionBlocks: [
          {
            id: 'act-right-move',
            category: 'action',
            actionType: 'move_step',
            spriteId: 'sprite-player',
            direction: 'right',
            steps: 8,
          },
        ],
      },
      {
        id: 'script-key1',
        eventBlock: {
          id: 'ev-key1',
          category: 'event',
          eventType: 'key_num',
          keyNum: 1,
        },
        actionBlocks: [
          {
            id: 'act-key1-var',
            category: 'variable',
            varName: 'スコア',
            varOp: 'add',
            varValue: 10,
          },
          {
            id: 'act-key1-dlg',
            category: 'feature',
            featureAction: 'show_dialog',
            featureText: '宝箱を開けた！スコアが+10された！',
          },
        ],
      },
      {
        id: 'script-key2',
        eventBlock: {
          id: 'ev-key2',
          category: 'event',
          eventType: 'key_num',
          keyNum: 2,
        },
        actionBlocks: [
          {
            id: 'act-key2-dlg',
            category: 'feature',
            featureAction: 'hide_dialog',
          },
        ],
      },
    ],
  };
};

export const getStoredVideos = (): VideoToolItem[] => {
  try {
    const raw = localStorage.getItem(VIDEO_STORAGE_KEY);
    if (!raw) {
      const initial = [createSampleVideo()];
      localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [createSampleVideo()];
  }
};

export const saveVideo = (video: VideoToolItem): { success: boolean; message?: string } => {
  try {
    const videos = getStoredVideos();
    const userVideos = videos.filter((v) => v.author.name === video.author.name);
    // Check max 10 videos per user
    if (userVideos.length >= 10 && !videos.some((v) => v.id === video.id)) {
      return {
        success: false,
        message: '1ユーザーで作成できる動画は最大10個までです。古い動画を削除してから投稿してください。',
      };
    }

    const existingIndex = videos.findIndex((v) => v.id === video.id);
    if (existingIndex >= 0) {
      videos[existingIndex] = video;
    } else {
      videos.unshift(video);
    }
    localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(videos));
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: '動画の保存に失敗しました。' };
  }
};

export const deleteVideo = (id: string, authorName: string): boolean => {
  try {
    const videos = getStoredVideos();
    const target = videos.find((v) => v.id === id);
    if (!target) return false;
    // Allow deletion if matching author or sample
    if (target.author.name !== authorName && target.author.name !== 'ツクール公式') {
      return false;
    }
    const filtered = videos.filter((v) => v.id !== id);
    localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
};

export const incrementVideoViews = (id: string): void => {
  try {
    const videos = getStoredVideos();
    const target = videos.find((v) => v.id === id);
    if (target) {
      target.views += 1;
      localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(videos));
    }
  } catch {}
};

// PROGRAMS
export const getStoredPrograms = (): ProgramToolItem[] => {
  try {
    const raw = localStorage.getItem(PROGRAM_STORAGE_KEY);
    if (!raw) {
      const initial = [createSampleProgram()];
      localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [createSampleProgram()];
  }
};

export const saveProgram = (program: ProgramToolItem): { success: boolean; message?: string } => {
  try {
    const programs = getStoredPrograms();
    const userPrograms = programs.filter((p) => p.author.name === program.author.name);
    // Check max 3 programs per user
    if (userPrograms.length >= 3 && !programs.some((p) => p.id === program.id)) {
      return {
        success: false,
        message: '1ユーザーで投稿できるプログラムは最大3つまでです。不要なプログラムを削除してから投稿してください。',
      };
    }

    const existingIndex = programs.findIndex((p) => p.id === program.id);
    if (existingIndex >= 0) {
      programs[existingIndex] = program;
    } else {
      programs.unshift(program);
    }
    localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(programs));
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'プログラムの保存に失敗しました。' };
  }
};

export const deleteProgram = (id: string, authorName: string): boolean => {
  try {
    const programs = getStoredPrograms();
    const target = programs.find((p) => p.id === id);
    if (!target) return false;
    if (target.author.name !== authorName && target.author.name !== 'ツクール公式') {
      return false;
    }
    const filtered = programs.filter((p) => p.id !== id);
    localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
};

export const incrementProgramViews = (id: string): void => {
  try {
    const programs = getStoredPrograms();
    const target = programs.find((p) => p.id === id);
    if (target) {
      target.views += 1;
      localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(programs));
    }
  } catch {}
};
