export interface UserProfile {
  name: string; // 2 ~ 12 characters
  iconDataUrl: string; // 64x64 PNG data URL
  updatedAt: string;
}

const STORAGE_KEY = 'shinbun_tsukuru_user_profile';

export const loadUserProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data.name === 'string' && typeof data.iconDataUrl === 'string') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

export const saveUserProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile to localStorage', err);
  }
};

export const clearUserProfile = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear profile', err);
  }
};
