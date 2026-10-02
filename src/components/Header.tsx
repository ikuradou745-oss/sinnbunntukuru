import React from 'react';
import { Newspaper, Printer, Download, Sparkles, Flame, RefreshCw, Edit3, Eye } from 'lucide-react';
import { PaperTheme } from '../types';
import { PRESET_TEMPLATES } from '../presets';

interface HeaderProps {
  currentTheme: PaperTheme;
  onThemeChange: (theme: PaperTheme) => void;
  isGogai: boolean;
  onToggleGogai: () => void;
  onSelectPreset: (presetKey: string) => void;
  onPrint: () => void;
  onDownloadImage: () => void;
  isDownloading: boolean;
  isEditorOpen: boolean;
  onToggleEditor: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onThemeChange,
  isGogai,
  onToggleGogai,
  onSelectPreset,
  onPrint,
  onDownloadImage,
  isDownloading,
  isEditorOpen,
  onToggleEditor,
  onReset,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-neutral-900 text-neutral-100 shadow-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 text-white p-2 rounded-lg flex items-center justify-center shadow-inner">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-wider text-amber-50">新聞つくる</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono border border-neutral-700">
                sinnbunntukuru
              </span>
            </div>
            <p className="text-xs text-neutral-400">オリジナル新聞作成・印刷・画像保存ツール</p>
          </div>
        </div>

        {/* Preset & Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-800/90 rounded-lg px-2 py-1 border border-neutral-700 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400 hidden sm:inline">テンプレート:</span>
            <select
              aria-label="テンプレート選択"
              onChange={(e) => onSelectPreset(e.target.value)}
              className="bg-transparent text-amber-200 text-xs focus:outline-none cursor-pointer font-medium"
              defaultValue="standard"
            >
              <option value="standard" className="bg-neutral-800 text-neutral-100">日刊デイリー新聞 (標準)</option>
              <option value="gogai" className="bg-neutral-800 text-neutral-100">号外スクープ新聞 (超特報)</option>
              <option value="school" className="bg-neutral-800 text-neutral-100">たいよう組 学級新聞</option>
              <option value="family" className="bg-neutral-800 text-neutral-100">ねこねこ家庭日報 (ペット/家族)</option>
            </select>
          </div>

          {/* Gogai toggle button */}
          <button
            onClick={onToggleGogai}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isGogai
                ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
            }`}
            title="号外モードに切り替える"
          >
            <Flame className={`w-3.5 h-3.5 ${isGogai ? 'text-yellow-300' : 'text-red-400'}`} />
            <span>号外モード {isGogai ? 'ON' : 'OFF'}</span>
          </button>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1 border border-neutral-700 text-xs">
            <button
              onClick={() => onThemeChange('retro')}
              className={`px-2 py-1 rounded transition-colors ${
                currentTheme === 'retro' ? 'bg-amber-700/60 text-amber-100 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="昭和レトロな紙色"
            >
              レトロ
            </button>
            <button
              onClick={() => onThemeChange('modern')}
              className={`px-2 py-1 rounded transition-colors ${
                currentTheme === 'modern' ? 'bg-amber-700/60 text-amber-100 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="すっきりとした現代紙面"
            >
              現代
            </button>
            <button
              onClick={() => onThemeChange('craft')}
              className={`px-2 py-1 rounded transition-colors ${
                currentTheme === 'craft' ? 'bg-amber-700/60 text-amber-100 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="素朴なクラフト紙調"
            >
              クラフト
            </button>
          </div>
        </div>

        {/* Actions (Editor toggle, Print, Download) */}
        <div className="flex items-center gap-2">
          {/* Editor toggle */}
          <button
            onClick={onToggleEditor}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isEditorOpen
                ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700'
            }`}
          >
            {isEditorOpen ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditorOpen ? '紙面を広く見る' : '記事を編集する'}</span>
          </button>

          {/* Download Image */}
          <button
            onClick={onDownloadImage}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 shadow-sm"
            title="新聞を画像(PNG)として保存"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDownloading ? '保存中…' : '画像保存'}</span>
          </button>

          {/* Print */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-700 hover:bg-blue-600 text-white transition-colors shadow-sm"
            title="印刷またはPDFで保存"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">印刷 / PDF</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
            title="初期化"
            aria-label="初期化"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
