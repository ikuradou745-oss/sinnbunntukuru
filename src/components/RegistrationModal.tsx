import React, { useState } from 'react';
import { UserProfile, saveUserProfile } from '../types/user';
import { IconCanvas } from './IconCanvas';
import { Newspaper, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

interface RegistrationModalProps {
  onComplete: (profile: UserProfile) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState<string>('');
  const [iconDataUrl, setIconDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 2 && trimmedName.length <= 12;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmedName.length < 2) {
      setError('名前は2文字以上で入力してください。');
      return;
    }
    if (trimmedName.length > 12) {
      setError('名前は12文字以内で入力してください。');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinish = () => {
    if (!isNameValid) {
      setError('名前は2文字以上12文字以内で入力してください。');
      setStep(1);
      return;
    }

    const profile: UserProfile = {
      name: trimmedName,
      iconDataUrl: iconDataUrl || '',
      updatedAt: new Date().toISOString(),
    };

    saveUserProfile(profile);
    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-neutral-200 text-neutral-900 relative">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-3 shadow-md">
            <Newspaper className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-neutral-900">
            新聞ツクールへようこそ
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            はじめる前に、あなたのプロフィールを設定しましょう
          </p>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 1 ? 'bg-neutral-900 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              1
            </div>
            <div className={`h-0.5 w-10 transition-all ${step === 2 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400 border border-neutral-300'
              }`}
            >
              2
            </div>
          </div>
          <div className="text-[11px] font-medium text-neutral-500 mt-1">
            {step === 1 ? 'ステップ 1: ニックネームの決定' : 'ステップ 2: アイコンを描く (64×64)'}
          </div>
        </div>

        {/* STEP 1: NICKNAME INPUT */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="nickname" className="text-xs font-bold text-neutral-700">
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
                id="nickname"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="例：たろう、ニュース記者"
                maxLength={12}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all shadow-inner"
              />
              <p className="text-[11px] text-neutral-400 mt-1.5">
                ※ 2〜12文字以内で設定してください（後から設定で変更可能）
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!isNameValid}
              className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98"
            >
              <span>次へ進む (アイコンを描く)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: DRAW 64*64 ICON */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center text-xs text-neutral-600">
              <span className="font-bold text-neutral-900">{trimmedName}</span> さんのアイコンを描きましょう！
            </div>

            <IconCanvas
              initialImage={iconDataUrl}
              onSave={(url) => setIconDataUrl(url)}
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium text-xs transition-colors"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="w-2/3 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-98"
              >
                <UserCheck className="w-4 h-4" />
                <span>登録を完了してホームへ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
