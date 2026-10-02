import React from 'react';
import { Film, Code2, X } from 'lucide-react';

interface ToolSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (toolType: 'video' | 'program') => void;
}

export const ToolSelectModal: React.FC<ToolSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-neutral-200 relative text-neutral-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold mb-2">
            クリエイターメニュー
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            どちらのツールを作りますか？
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            パラパラ動画や、自分だけの簡易ゲーム・プログラムを作成できます
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option 1: 動画 */}
          <button
            type="button"
            onClick={() => onSelect('video')}
            className="group flex flex-col items-center justify-between p-6 bg-neutral-50 hover:bg-white rounded-2xl border-2 border-neutral-200 hover:border-neutral-900 shadow-2xs hover:shadow-xl transition-all duration-200 text-center cursor-pointer active:scale-98"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 group-hover:bg-neutral-900 group-hover:text-white flex items-center justify-center mb-3 transition-colors shadow-xs">
              <Film className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">動画</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                128×64の横長画面で、0.1秒ごとのコマ撮りアニメーション（最大150コマ）を作成
              </p>
            </div>
            <div className="mt-4 px-3 py-1 bg-white border border-neutral-300 rounded-full text-[11px] font-bold text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900 transition-colors">
              動画を作成する →
            </div>
          </button>

          {/* Option 2: プログラム */}
          <button
            type="button"
            onClick={() => onSelect('program')}
            className="group flex flex-col items-center justify-between p-6 bg-neutral-50 hover:bg-white rounded-2xl border-2 border-neutral-200 hover:border-neutral-900 shadow-2xs hover:shadow-xl transition-all duration-200 text-center cursor-pointer active:scale-98"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 group-hover:bg-neutral-900 group-hover:text-white flex items-center justify-center mb-3 transition-colors shadow-xs">
              <Code2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">プログラム</h3>
              <p className="text-xs text-blue-600 font-bold mb-1">
                ※ゲームなどを作れるよ
              </p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                128×128の画面、背景・キャラ・ボタンとブロックプログラミングで自由に作成
              </p>
            </div>
            <div className="mt-4 px-3 py-1 bg-white border border-neutral-300 rounded-full text-[11px] font-bold text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900 transition-colors">
              プログラムを作成する →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
