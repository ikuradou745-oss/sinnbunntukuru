import { VideoToolItem, ProgramToolItem } from '../types/tools';

const LOCAL_VIDEO_KEY = 'shinbun_tsukuru_videos_local';
const LOCAL_PROGRAM_KEY = 'shinbun_tsukuru_programs_local';

// Fetch Videos from Online API (with local fallback)
export const fetchOnlineVideos = async (): Promise<VideoToolItem[]> => {
  try {
    const res = await fetch('/api/videos');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(LOCAL_VIDEO_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Online API unavailable, using local cache:', err);
  }
  const cached = localStorage.getItem(LOCAL_VIDEO_KEY);
  return cached ? JSON.parse(cached) : [];
};

// Post Video to Online API
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
      // update local
      const current = await fetchOnlineVideos();
      return { success: true };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, message: err.error || '保存に失敗しました。' };
  } catch (err) {
    console.warn('Failed to post online, saving locally', err);
    // Local fallback
    const list = getLocalVideos();
    list.unshift(video);
    localStorage.setItem(LOCAL_VIDEO_KEY, JSON.stringify(list));
    return { success: true };
  }
};

// Delete Video Online
export const deleteOnlineVideo = async (id: string, authorName: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/videos/${id}?author=${encodeURIComponent(authorName)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Failed to delete online', err);
  }
  // Local fallback
  const list = getLocalVideos().filter((v) => v.id !== id);
  localStorage.setItem(LOCAL_VIDEO_KEY, JSON.stringify(list));
  return true;
};

// Increment Video Views
export const incrementOnlineVideoViews = async (id: string): Promise<void> => {
  try {
    fetch(`/api/videos/${id}/view`, { method: 'POST' }).catch(() => {});
  } catch {}
};

// --- PROGRAMS ONLINE ---
export const fetchOnlinePrograms = async (): Promise<ProgramToolItem[]> => {
  try {
    const res = await fetch('/api/programs');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(LOCAL_PROGRAM_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Online API unavailable, using local cache:', err);
  }
  const cached = localStorage.getItem(LOCAL_PROGRAM_KEY);
  return cached ? JSON.parse(cached) : [];
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
    return { success: false, message: err.error || '保存に失敗しました。' };
  } catch (err) {
    console.warn('Failed to post program online, saving locally', err);
    const list = getLocalPrograms();
    list.unshift(program);
    localStorage.setItem(LOCAL_PROGRAM_KEY, JSON.stringify(list));
    return { success: true };
  }
};

export const deleteOnlineProgram = async (id: string, authorName: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/programs/${id}?author=${encodeURIComponent(authorName)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Failed to delete program online', err);
  }
  const list = getLocalPrograms().filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_PROGRAM_KEY, JSON.stringify(list));
  return true;
};

export const incrementOnlineProgramViews = async (id: string): Promise<void> => {
  try {
    fetch(`/api/programs/${id}/view`, { method: 'POST' }).catch(() => {});
  } catch {}
};

// Synchronous local helpers
function getLocalVideos(): VideoToolItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_VIDEO_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalPrograms(): ProgramToolItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRAM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
