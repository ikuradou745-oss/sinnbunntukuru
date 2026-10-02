import { VideoToolItem, ProgramToolItem } from '../types/tools';

const LOCAL_VIDEO_KEY = 'shinbun_tsukuru_videos_local_v2';
const LOCAL_PROGRAM_KEY = 'shinbun_tsukuru_programs_local_v2';

// Helper to safely write to localStorage without throwing QuotaExceededError
const safeSetLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`localStorage quota exceeded for ${key}, skipping local storage cache.`);
    // If quota exceeded, attempt to prune old cache if needed
    try {
      localStorage.removeItem(key);
    } catch {}
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
      const data: VideoToolItem[] = await res.json();
      safeSetLocal(LOCAL_VIDEO_KEY, data);
      return data;
    }
  } catch (err) {
    console.warn('Online API unavailable for videos, using local cache:', err);
  }
  return safeGetLocal<VideoToolItem[]>(LOCAL_VIDEO_KEY, []);
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
      // Re-fetch online list immediately
      const updated = await fetchOnlineVideos();
      return { success: true };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, message: err.error || '動画の保存に失敗しました。' };
  } catch (err) {
    console.warn('Failed to post video online, saving locally', err);
    const list = safeGetLocal<VideoToolItem[]>(LOCAL_VIDEO_KEY, []);
    const existingIdx = list.findIndex((v) => v.id === video.id);
    if (existingIdx >= 0) {
      list[existingIdx] = video;
    } else {
      list.unshift(video);
    }
    safeSetLocal(LOCAL_VIDEO_KEY, list);
    return { success: true };
  }
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
    console.warn('Failed to delete video online', err);
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
      const data: ProgramToolItem[] = await res.json();
      safeSetLocal(LOCAL_PROGRAM_KEY, data);
      return data;
    }
  } catch (err) {
    console.warn('Online API unavailable for programs, using local cache:', err);
  }
  return safeGetLocal<ProgramToolItem[]>(LOCAL_PROGRAM_KEY, []);
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
    const err = await res.json().catch(() => ({}));
    return { success: false, message: err.error || 'プログラムの保存に失敗しました。' };
  } catch (err) {
    console.warn('Failed to post program online, saving locally', err);
    const list = safeGetLocal<ProgramToolItem[]>(LOCAL_PROGRAM_KEY, []);
    const existingIdx = list.findIndex((p) => p.id === program.id);
    if (existingIdx >= 0) {
      list[existingIdx] = program;
    } else {
      list.unshift(program);
    }
    safeSetLocal(LOCAL_PROGRAM_KEY, list);
    return { success: true };
  }
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
    console.warn('Failed to delete program online', err);
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
