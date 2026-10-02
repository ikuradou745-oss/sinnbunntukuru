import { useState, useEffect } from 'react';
import { UserProfile, loadUserProfile, clearUserProfile } from './types/user';
import { RegistrationModal } from './components/RegistrationModal';
import { SettingsModal } from './components/SettingsModal';
import { ToolSelectModal } from './components/tools/ToolSelectModal';
import { VideoEditor } from './components/tools/VideoEditor';
import { ProgramEditor } from './components/tools/ProgramEditor';
import { ToolViewer } from './components/tools/ToolViewer';
import {
  Newspaper,
  Settings as SettingsIcon,
  BookOpen,
  FilePlus2,
  Wrench,
  Boxes,
  Info,
  X,
} from 'lucide-react';

type CurrentView = 'home' | 'video-editor' | 'program-editor' | 'tools-viewer';

export function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<CurrentView>('home');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isToolSelectOpen, setIsToolSelectOpen] = useState<boolean>(false);
  const [activeNoticeMessage, setActiveNoticeMessage] = useState<string | null>(null);

  // Load saved profile on initial render
  useEffect(() => {
    const saved = loadUserProfile();
    if (saved) {
      setProfile(saved);
    }
    setIsLoading(false);
  }, []);

  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  const handleResetAccount = () => {
    clearUserProfile();
    setProfile(null);
    setIsSettingsOpen(false);
    setCurrentView('home');
  };

  const handleToolSelect = (toolType: 'video' | 'program') => {
    setIsToolSelectOpen(false);
    if (toolType === 'video') {
      setCurrentView('video-editor');
    } else {
      setCurrentView('program-editor');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-neutral-200">
      {/* INITIAL REGISTRATION MODAL (Opens if user profile does not exist) */}
      {!profile && (
        <RegistrationModal onComplete={handleProfileComplete} />
      )}

      {/* HEADER: White, Simple, Right corner has (Icon : Name) and Settings */}
      <header className="w-full bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Top Left: Logo & Site Name */}
          <button
            type="button"
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl tracking-tight text-neutral-900 leading-none">
                ティックエディション
              </h1>
              <span className="text-[10px] text-neutral-400 font-bold tracking-wider">
                プログラム教材 / TICK EDITION
              </span>
            </div>
          </button>

          {/* Top Right: (Icon : Name) & Settings button */}
          {profile && (
            <div className="flex items-center gap-3">
              {/* User Badge: (アイコン : 名前) */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-200 shadow-2xs">
                {/* 64*64 drawn icon */}
                <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-300 bg-white flex items-center justify-center shrink-0 shadow-xs">
                  {profile.iconDataUrl ? (
                    <img
                      src={profile.iconDataUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <span className="text-xs font-bold text-neutral-400">
                      {profile.name.charAt(0)}
                    </span>
                  )}
                </div>
                {/* Nickname (2~12 chars) */}
                <span className="text-xs sm:text-sm font-bold text-neutral-800 max-w-[130px] truncate">
                  {profile.name}
                </span>
              </div>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 rounded-full border border-neutral-300 shadow-2xs transition-colors"
                title="プロフィール・アイコン設定"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-neutral-600" />
                <span className="hidden sm:inline">設定</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* VIEW SWITCHER */}
      <div className="flex-1 flex flex-col">
        {/* VIEW 1: HOME SCREEN */}
        {currentView === 'home' && (
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto w-full">
            
            {/* Welcome Headline */}
            <div className="text-center mb-10">
              <div className="inline-block px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold mb-3">
                プログラム教材
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
                ティックエディション
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                新聞の閲覧・作成や、ドット絵アニメーション動画・ゲームプログラミング教材を体験できます
              </p>
            </div>

            {/* CENTER SECTION: Large Buttons (「新聞を見る」「新聞を作る」) */}
            <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
              
              {/* 新聞を見る Button (Large) */}
              <button
                type="button"
                onClick={() =>
                  setActiveNoticeMessage('「新聞を見る」は現在準備中です（仮配置）。')
                }
                className="group relative flex flex-col items-center justify-center p-8 sm:p-10 bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-neutral-900 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 active:scale-98 text-center cursor-pointer"
              >
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 group-hover:bg-neutral-900 text-neutral-800 group-hover:text-white flex items-center justify-center mb-4 transition-colors shadow-xs">
                  <BookOpen className="w-8 h-8" />
                </div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 mb-1">
                  新聞を見る
                </span>
                <span className="text-xs text-neutral-500 group-hover:text-neutral-700">
                  作成した新聞の閲覧・記事一覧
                </span>
                <div className="mt-3 text-[11px] font-medium text-neutral-400 border border-neutral-200 rounded-full px-2.5 py-0.5">
                  仮ボタン
                </div>
              </button>

              {/* 新聞を作る Button (Large) */}
              <button
                type="button"
                onClick={() =>
                  setActiveNoticeMessage('「新聞を作る」は現在準備中です（仮配置）。')
                }
                className="group relative flex flex-col items-center justify-center p-8 sm:p-10 bg-neutral-900 hover:bg-neutral-800 text-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-200 active:scale-98 text-center cursor-pointer border-2 border-neutral-900"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/10 group-hover:bg-white text-white group-hover:text-neutral-900 flex items-center justify-center mb-4 transition-colors shadow-xs">
                  <FilePlus2 className="w-8 h-8" />
                </div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
                  新聞を作る
                </span>
                <span className="text-xs text-neutral-300">
                  新しい新聞記事の作成・レイアウト
                </span>
                <div className="mt-3 text-[11px] font-medium text-neutral-300/80 border border-white/20 rounded-full px-2.5 py-0.5">
                  仮ボタン
                </div>
              </button>

            </div>

            {/* BOTTOM SECTION: Smaller Buttons (「ツールを作る」「ツールを見る」) */}
            <div className="w-full max-w-md pt-6 border-t border-neutral-200 flex flex-col items-center">
              <div className="text-xs font-semibold text-neutral-400 mb-3 tracking-wider">
                ツールメニュー
              </div>
              
              <div className="w-full grid grid-cols-2 gap-3 sm:gap-4">
                {/* ツールを作る Button (Smaller) */}
                <button
                  type="button"
                  onClick={() => setIsToolSelectOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 hover:border-neutral-900 rounded-xl text-neutral-900 font-bold text-xs sm:text-sm transition-all shadow-2xs hover:shadow-sm active:scale-98 cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-neutral-700" />
                  <span>ツールを作る</span>
                </button>

                {/* ツールを見る Button (Smaller) */}
                <button
                  type="button"
                  onClick={() => setCurrentView('tools-viewer')}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 hover:border-neutral-900 rounded-xl text-neutral-900 font-bold text-xs sm:text-sm transition-all shadow-2xs hover:shadow-sm active:scale-98 cursor-pointer"
                >
                  <Boxes className="w-4 h-4 text-neutral-700" />
                  <span>ツールを見る</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 mt-2">
                動画（128×64）やプログラム（128×128）の作成・プレイが楽しめます
              </p>
            </div>

          </main>
        )}

        {/* VIEW 2: VIDEO EDITOR */}
        {currentView === 'video-editor' && profile && (
          <VideoEditor
            user={profile}
            onBack={() => setCurrentView('home')}
            onPublished={() => setCurrentView('tools-viewer')}
          />
        )}

        {/* VIEW 3: PROGRAM EDITOR */}
        {currentView === 'program-editor' && profile && (
          <ProgramEditor
            user={profile}
            onBack={() => setCurrentView('home')}
            onPublished={() => setCurrentView('tools-viewer')}
          />
        )}

        {/* VIEW 4: TOOLS VIEWER */}
        {currentView === 'tools-viewer' && profile && (
          <ToolViewer
            user={profile}
            onBack={() => setCurrentView('home')}
            onOpenCreateModal={() => setIsToolSelectOpen(true)}
          />
        )}
      </div>

      {/* FOOTER */}
      <footer className="w-full border-t border-neutral-200 py-6 text-center text-xs text-neutral-400 bg-white">
        <p>© ティックエディション (プログラム教材)</p>
      </footer>

      {/* SETTINGS MODAL */}
      {profile && (
        <SettingsModal
          profile={profile}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateProfile={(updated) => setProfile(updated)}
          onResetAccount={handleResetAccount}
        />
      )}

      {/* TOOL SELECT MODAL ("ツールを作る" clicked) */}
      <ToolSelectModal
        isOpen={isToolSelectOpen}
        onClose={() => setIsToolSelectOpen(false)}
        onSelect={handleToolSelect}
      />

      {/* PROVISIONAL NOTICE MODAL */}
      {activeNoticeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 border border-neutral-200 text-center relative">
            <button
              onClick={() => setActiveNoticeMessage(null)}
              className="absolute top-3 right-3 p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              aria-label="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center mx-auto mb-3">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 mb-1">機能のご案内</h3>
            <p className="text-xs text-neutral-600 leading-relaxed mb-5">
              {activeNoticeMessage}
            </p>
            <button
              type="button"
              onClick={() => setActiveNoticeMessage(null)}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-xs transition-colors"
            >
              了解しました
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
