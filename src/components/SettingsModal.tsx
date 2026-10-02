import React, { useState } from 'react';
import { UserProfile, saveUserProfile } from '../types/user';
import { IconCanvas } from './IconCanvas';
import { X, Check, Settings, AlertCircle, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onResetAccount: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  isOpen,
  onClose,
  onUpdateProfile,
  onResetAccount,
}) => {
  const [name, setName] = useState<string>(profile.name);
  const [iconDataUrl, setIconDataUrl] = useState<string>(profile.iconDataUrl);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profile' | 'icon'>('profile');

  if (!isOpen) return null;

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 2 && trimmedName.length <= 12;

  const handleSave = () => {
    if (!isNameValid) {
      setError('名前は2文字以上12文字以内で入力してください。');
      setActiveTab('profile');
      return;
    }

    const updated: UserProfile = {
      name: trimmedName,
      iconDataUrl: iconDataUrl || profile.iconDataUrl,
      updatedAt: new Date().toISOString(),
    };

    saveUserProfile(updated);
    onUpdateProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 text-neutral-900 relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">プロフィール設定</h2>
              <p className="text-xs text-neutral-500">名前やアイコン（64×64）を変更できます</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 mt-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            名前の変更
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('icon')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              activeTab === 'icon'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            アイコンの再描画 (64×64)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="settings-name" className="text-xs font-bold text-neutral-700">
                    名前（ニックネーム）
                  </label>
                  <span
                    className={`text-[11px] font-mono font-semibold ${
                      trimmedName.length > 12 || (trimmedName.length > 0 && trimmedName.length < 2)
                        ? 'text-red-600'
                        : 'text-neutral-400'
                    }`}
                  >
                    {trimmedName.length} / 12 文字
                  </span>
                </div>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  maxLength={12}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all shadow-inner"
                  placeholder="2〜12文字で入力"
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current Preview */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-neutral-300 overflow-hidden bg-white shadow-xs shrink-0 flex items-center justify-center">
                  {iconDataUrl ? (
                    <img
                      src={iconDataUrl}
                      alt="ユーザーアイコン"
                      className="w-full h-full object-cover"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <span className="text-xs text-neutral-400">なし</span>
                  )}
                </div>
                <div>
                  <div className="text-xs text-neutral-500 font-medium">ヘッダー表示プレビュー</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {trimmedName || '（未入力）'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'icon' && (
            <div className="space-y-3">
              <IconCanvas
                initialImage={iconDataUrl}
                onSave={(url) => setIconDataUrl(url)}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('登録データをリセットして初期登録画面に戻りますか？')) {
                onResetAccount();
              }
            }}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-600 py-1 px-2 rounded transition-colors"
            title="データを初期化"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>最初から登録し直す</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isNameValid}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>変更を保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
