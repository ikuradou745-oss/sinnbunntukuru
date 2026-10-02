import { VideoToolItem, ProgramToolItem } from '../types/tools';

const LOCAL_VIDEO_KEY = 'shinbun_tsukuru_videos_local_v3';
const LOCAL_PROGRAM_KEY = 'shinbun_tsukuru_programs_local_v3';

// Built-in starter seed items (for static GitHub Pages hosting & offline fallback)
const DEFAULT_SAMPLE_VIDEO: VideoToolItem = {
  id: 'sample-video-default-1',
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
  frames: Array.from(
    { length: 20 },
    () =>
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABAAQMAAAD/1p1wAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAABRJREFUOMtjGAWjYBSMglEwCkgEAAXwAAFx1/k+AAAAAElFTkSuQmCC'
  ),
};

const DEFAULT_SAMPLE_PROGRAM: ProgramToolItem = {
  id: 'sample-prog-default-1',
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
  variables: { 'スコア': 0 },
  scripts: [
    {
      id: 'sc-start',
      eventBlock: { id: 'b-start', category: 'event', eventType: 'start' },
      actionBlocks: [
        {
          id: 'b-start-msg',
          category: 'feature',
          featureAction: 'show_dialog',
          featureText: 'ゲームスタート！宝箱に触れてみよう',
        },
      ],
    },
    {
      id: 'sc-up',
      eventBlock: { id: 'b-up', category: 'event', eventType: 'key_up' },
      actionBlocks: [
        {
          id: 'b-act-up',
          category: 'action',
          actionType: 'move_step',
          spriteId: 'sp-player',
          direction: 'up',
          steps: 8,
        },
        {
          id: 'b-check-touch-u',
          category: 'check',
          checkSpriteA: 'sp-player',
          checkSpriteB: 'sp-chest',
          childBlocks: [
            {
              id: 'b-touch-msg-u',
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
      eventBlock: { id: 'b-down', category: 'event', eventType: 'key_down' },
      actionBlocks: [
        {
          id: 'b-act-down',
          category: 'action',
          actionType: 'move_step',
          spriteId: 'sp-player',
          direction: 'down',
          steps: 8,
        },
        {
          id: 'b-check-touch-d',
          category: 'check',
          checkSpriteA: 'sp-player',
          checkSpriteB: 'sp-chest',
          childBlocks: [
            {
              id: 'b-touch-msg-d',
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
      eventBlock: { id: 'b-left', category: 'event', eventType: 'key_left' },
      actionBlocks: [
        {
          id: 'b-act-left',
          category: 'action',
          actionType: 'move_step',
          spriteId: 'sp-player',
          direction: 'left',
          steps: 8,
        },
        {
          id: 'b-check-touch-l',
          category: 'check',
          checkSpriteA: 'sp-player',
          checkSpriteB: 'sp-chest',
          childBlocks: [
            {
              id: 'b-touch-msg-l',
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
      eventBlock: { id: 'b-right', category: 'event', eventType: 'key_right' },
      actionBlocks: [
        {
          id: 'b-act-right',
          category: 'action',
          actionType: 'move_step',
          spriteId: 'sp-player',
          direction: 'right',
          steps: 8,
        },
        {
          id: 'b-check-touch-r',
          category: 'check',
          checkSpriteA: 'sp-player',
          checkSpriteB: 'sp-chest',
          childBlocks: [
            {
              id: 'b-touch-msg-r',
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
      eventBlock: { id: 'b-k1', category: 'event', eventType: 'key_num', keyNum: 1 },
      actionBlocks: [
        {
          id: 'b-check-k1',
          category: 'check',
          checkSpriteA: 'sp-player',
          checkSpriteB: 'sp-chest',
          childBlocks: [
            {
              id: 'b-add-score',
              category: 'variable',
              varName: 'スコア',
              varOp: 'add',
              varValue: 10,
            },
            {
              id: 'b-game-clear',
              category: 'feature',
              featureAction: 'game_clear',
              featureText: '宝箱を開けてステージクリア！',
            },
          ],
        },
      ],
    },
  ],
};

// Safe LocalStorage helpers
const safeSetLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`localStorage quota exceeded for ${key}, skipping local storage cache.`);
  }
};

const safeGetLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// --- VIDEOS ONLINE ---
export const fetchOnlineVideos = async (): Promise<VideoToolItem[]> => {
  try {
    const res = await fetch(`/api/videos?t=${Date.now()}`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data: VideoToolItem[] = await res.json();
        safeSetLocal(LOCAL_VIDEO_KEY, data);
        return data;
      }
    }
  } catch (err) {
    // Expected on static GitHub Pages hosting
  }
  const cached = safeGetLocal<VideoToolItem[]>(LOCAL_VIDEO_KEY, []);
  if (cached.length === 0) {
    safeSetLocal(LOCAL_VIDEO_KEY, [DEFAULT_SAMPLE_VIDEO]);
    return [DEFAULT_SAMPLE_VIDEO];
  }
  return cached;
};

export const saveOnlineVideo = async (
  video: VideoToolItem
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video),
    });
    if (res.ok) {
      await fetchOnlineVideos();
      return { success: true };
    }
  } catch (err) {
    // Static fallback
  }

  // Fallback for static GitHub Pages hosting
  const list = safeGetLocal<VideoToolItem[]>(LOCAL_VIDEO_KEY, [DEFAULT_SAMPLE_VIDEO]);
  const existingIdx = list.findIndex((v) => v.id === video.id);
  if (existingIdx >= 0) {
    list[existingIdx] = video;
  } else {
    list.unshift(video);
  }
  safeSetLocal(LOCAL_VIDEO_KEY, list);
  return { success: true };
};

export const deleteOnlineVideo = async (id: string, authorName: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/videos/${id}?author=${encodeURIComponent(authorName)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await fetchOnlineVideos();
      return true;
    }
  } catch (err) {
    // Static fallback
  }
  const list = safeGetLocal<VideoToolItem[]>(LOCAL_VIDEO_KEY, []).filter((v) => v.id !== id);
  safeSetLocal(LOCAL_VIDEO_KEY, list);
  return true;
};

export const incrementOnlineVideoViews = async (id: string): Promise<void> => {
  try {
    fetch(`/api/videos/${id}/view`, { method: 'POST' }).catch(() => {});
  } catch {}
};

// --- PROGRAMS ONLINE ---
export const fetchOnlinePrograms = async (): Promise<ProgramToolItem[]> => {
  try {
    const res = await fetch(`/api/programs?t=${Date.now()}`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data: ProgramToolItem[] = await res.json();
        safeSetLocal(LOCAL_PROGRAM_KEY, data);
        return data;
      }
    }
  } catch (err) {
    // Expected on static GitHub Pages hosting
  }
  const cached = safeGetLocal<ProgramToolItem[]>(LOCAL_PROGRAM_KEY, []);
  if (cached.length === 0) {
    safeSetLocal(LOCAL_PROGRAM_KEY, [DEFAULT_SAMPLE_PROGRAM]);
    return [DEFAULT_SAMPLE_PROGRAM];
  }
  return cached;
};

export const saveOnlineProgram = async (
  program: ProgramToolItem
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(program),
    });
    if (res.ok) {
      await fetchOnlinePrograms();
      return { success: true };
    }
  } catch (err) {
    // Static fallback
  }

  // Fallback for static GitHub Pages hosting
  const list = safeGetLocal<ProgramToolItem[]>(LOCAL_PROGRAM_KEY, [DEFAULT_SAMPLE_PROGRAM]);
  const existingIdx = list.findIndex((p) => p.id === program.id);
  if (existingIdx >= 0) {
    list[existingIdx] = program;
  } else {
    list.unshift(program);
  }
  safeSetLocal(LOCAL_PROGRAM_KEY, list);
  return { success: true };
};

export const deleteOnlineProgram = async (id: string, authorName: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/programs/${id}?author=${encodeURIComponent(authorName)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await fetchOnlinePrograms();
      return true;
    }
  } catch (err) {
    // Static fallback
  }
  const list = safeGetLocal<ProgramToolItem[]>(LOCAL_PROGRAM_KEY, []).filter((p) => p.id !== id);
  safeSetLocal(LOCAL_PROGRAM_KEY, list);
  return true;
};

export const incrementOnlineProgramViews = async (id: string): Promise<void> => {
  try {
    fetch(`/api/programs/${id}/view`, { method: 'POST' }).catch(() => {});
  } catch {}
};
