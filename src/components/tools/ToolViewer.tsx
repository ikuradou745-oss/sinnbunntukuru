import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/user';
import { VideoToolItem, ProgramToolItem } from '../../types/tools';
import {
  fetchOnlineVideos,
  fetchOnlinePrograms,
  deleteOnlineVideo,
  deleteOnlineProgram,
  incrementOnlineVideoViews,
  incrementOnlineProgramViews,
} from '../../services/toolStorage';
import { VideoPlayerModal } from './VideoPlayerModal';
import { GameRuntime } from './GameRuntime';
import {
  Film,
  Code2,
  Search,
  ArrowUpDown,
  Play,
  Eye,
  Trash2,
  ArrowLeft,
  Sparkles,
  Gamepad2,
  User,
  RefreshCw,
} from 'lucide-react';

interface ToolViewerProps {
  user: UserProfile;
  initialCategory?: 'video' | 'program';
  onBack: () => void;
  onOpenCreateModal: () => void;
}

export const ToolViewer: React.FC<ToolViewerProps> = ({
  user,
  initialCategory = 'video',
  onBack,
  onOpenCreateModal,
}) => {
  const [category, setCategory] = useState<'video' | 'program'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<'title' | 'author'>('title');
  const [sortBy, setSortBy] = useState<'popular' | 'latest'>('popular');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [videos, setVideos] = useState<VideoToolItem[]>([]);
  const [programs, setPrograms] = useState<ProgramToolItem[]>([]);

  // Selected item to view/play
  const [selectedVideo, setSelectedVideo] = useState<VideoToolItem | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramToolItem | null>(null);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [vList, pList] = await Promise.all([
        fetchOnlineVideos(),
        fetchOnlinePrograms(),
      ]);
      setVideos(vList);
      setPrograms(pList);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Real-time polling every 4 seconds to sync online submissions
    const interval = setInterval(() => {
      fetchOnlineVideos().then(setVideos).catch(() => {});
      fetchOnlinePrograms().then(setPrograms).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenVideo = (video: VideoToolItem) => {
    incrementOnlineVideoViews(video.id);
    setSelectedVideo({ ...video, views: video.views + 1 });
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, views: v.views + 1 } : v))
    );
  };

  const handleOpenProgram = (program: ProgramToolItem) => {
    incrementOnlineProgramViews(program.id);
    setSelectedProgram({ ...program, views: program.views + 1 });
    setPrograms((prev) =>
      prev.map((p) => (p.id === program.id ? { ...p, views: p.views + 1 } : p))
    );
  };

  const handleDeleteVideo = async (id: string) => {
    const success = await deleteOnlineVideo(id, user.name);
    if (success) {
      if (selectedVideo?.id === id) setSelectedVideo(null);
      loadData();
    }
  };

  const handleDeleteProgram = async (id: string) => {
    const success = await deleteOnlineProgram(id, user.name);
    if (success) {
      if (selectedProgram?.id === id) setSelectedProgram(null);
      loadData();
    }
  };

  // Filter & Sort Videos
  const filteredVideos = videos
    .filter((v) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      if (searchType === 'title') {
        return v.title.toLowerCase().includes(q);
      } else {
        return v.author.name.toLowerCase().includes(q);
      }
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Filter & Sort Programs
  const filteredPrograms = programs
    .filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      if (searchType === 'title') {
        return p.title.toLowerCase().includes(q);
      } else {
        return p.author.name.toLowerCase().includes(q);
      }
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ホームへ戻る</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-neutral-900 text-white rounded-lg">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-neutral-900 leading-tight">ツールを見る</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                ● リアルタイムオンライン
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              みんなが投稿した動画・プログラムをリアルタイムで閲覧＆プレイできます
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs transition-colors"
            title="最新データに更新"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <span>作品をつくる</span>
          </button>
        </div>
      </div>

      {/* Category Tabs: 動画 vs プログラム */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setCategory('video')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-2xs ${
            category === 'video'
              ? 'bg-neutral-900 text-white shadow-md'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>動画 ({videos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('program')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-2xs ${
            category === 'program'
              ? 'bg-neutral-900 text-white shadow-md'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>プログラム・ゲーム ({programs.length})</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-neutral-50 p-4 rounded-3xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3">
        {/* Search input + search type */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchType === 'title' ? '作品名で検索…' : 'ユーザー名で検索…'}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div className="flex items-center bg-white border border-neutral-300 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSearchType('title')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                searchType === 'title' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
              }`}
            >
              作品名
            </button>
            <button
              type="button"
              onClick={() => setSearchType('author')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                searchType === 'author' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
              }`}
            >
              ユーザー名
            </button>
          </div>
        </div>

        {/* Sort: 人気順 vs 最新順 */}
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-neutral-500 font-medium">並び替え:</span>
          <div className="flex items-center bg-white border border-neutral-300 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                sortBy === 'popular' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
              }`}
            >
              人気順 (再生数)
            </button>
            <button
              type="button"
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                sortBy === 'latest' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
              }`}
            >
              最新順
            </button>
          </div>
        </div>
      </div>

      {/* VIDEO LIST */}
      {category === 'video' && (
        <div>
          {filteredVideos.length === 0 ? (
            <div className="p-12 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-300">
              <Film className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-600">該当する動画が見つかりませんでした</p>
              <p className="text-xs text-neutral-400 mt-1">検索条件を変更するか、新しい動画を作成してみましょう</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredVideos.map((vid) => {
                const isAuthor = vid.author.name === user.name || vid.author.name === 'ツクール公式';
                return (
                  <div
                    key={vid.id}
                    onClick={() => handleOpenVideo(vid)}
                    className="group bg-white rounded-3xl border border-neutral-200 hover:border-neutral-900 shadow-2xs hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Video Thumbnail (128x64 display) */}
                      <div className="relative w-full bg-neutral-900 aspect-[128/64] flex items-center justify-center overflow-hidden">
                        <img
                          src={vid.frames[0]}
                          alt={vid.title}
                          className="w-full h-full object-contain filter contrast-105 group-hover:scale-105 transition-transform"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/90 group-hover:bg-white text-neutral-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-mono">
                          {vid.totalFrames}コマ ({(vid.totalFrames * 0.1).toFixed(1)}s)
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-4">
                        <h3 className="font-black text-sm text-neutral-900 group-hover:text-amber-600 transition-colors line-clamp-1 mb-2">
                          {vid.title}
                        </h3>

                        {/* Author info with 64x64 icon */}
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full border border-neutral-300 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                            {vid.author.iconDataUrl ? (
                              <img
                                src={vid.author.iconDataUrl}
                                alt={vid.author.name}
                                className="w-full h-full object-cover"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            ) : (
                              <User className="w-3.5 h-3.5 text-neutral-400" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-neutral-700 truncate">
                            {vid.author.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-4 py-3 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                      <div className="flex items-center gap-1 font-mono">
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{vid.views} 回</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span>{new Date(vid.createdAt).toLocaleDateString('ja-JP')}</span>
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVideo(vid.id);
                            }}
                            className="text-neutral-400 hover:text-red-600 p-1"
                            title="動画を削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROGRAM LIST */}
      {category === 'program' && (
        <div>
          {filteredPrograms.length === 0 ? (
            <div className="p-12 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-300">
              <Code2 className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-600">該当するプログラムが見つかりませんでした</p>
              <p className="text-xs text-neutral-400 mt-1">検索条件を変更するか、新しいプログラムを作ってみましょう</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredPrograms.map((prog) => {
                const isAuthor = prog.author.name === user.name || prog.author.name === 'ツクール公式';
                return (
                  <div
                    key={prog.id}
                    onClick={() => handleOpenProgram(prog)}
                    className="group bg-white rounded-3xl border border-neutral-200 hover:border-neutral-900 shadow-2xs hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* 128x128 Preview Thumbnail */}
                      <div className="relative w-full bg-neutral-900 aspect-square flex items-center justify-center overflow-hidden">
                        <img
                          src={prog.backgroundDataUrl}
                          alt="背景"
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        {/* Display sprites on preview */}
                        {prog.sprites.map((sp) => (
                          <div
                            key={sp.id}
                            style={{
                              position: 'absolute',
                              left: `${(sp.initialX / 128) * 100}%`,
                              top: `${(sp.initialY / 128) * 100}%`,
                              width: `${(16 / 128) * 100}%`,
                              height: `${(16 / 128) * 100}%`,
                            }}
                          >
                            <img
                              src={sp.dataUrl}
                              alt={sp.name}
                              className="w-full h-full object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>
                        ))}
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-transparent transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/95 group-hover:bg-white text-neutral-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Gamepad2 className="w-6 h-6" />
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-neutral-900/80 text-white rounded text-[10px] font-bold">
                          {prog.sprites.length} 体のキャラ
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-4">
                        <h3 className="font-black text-sm text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                          {prog.title}
                        </h3>

                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full border border-neutral-300 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                            {prog.author.iconDataUrl ? (
                              <img
                                src={prog.author.iconDataUrl}
                                alt={prog.author.name}
                                className="w-full h-full object-cover"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            ) : (
                              <User className="w-3.5 h-3.5 text-neutral-400" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-neutral-700 truncate">
                            {prog.author.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-4 py-3 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                      <div className="flex items-center gap-1 font-mono">
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{prog.views} 回プレイ</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span>{new Date(prog.createdAt).toLocaleDateString('ja-JP')}</span>
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProgram(prog.id);
                            }}
                            className="text-neutral-400 hover:text-red-600 p-1"
                            title="プログラムを削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          currentUser={user}
          onClose={() => setSelectedVideo(null)}
          onDelete={handleDeleteVideo}
        />
      )}

      {/* PROGRAM GAME PLAYER MODAL */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 text-neutral-900 relative">
            <GameRuntime
              program={selectedProgram}
              isStandaloneModal={true}
              onClose={() => setSelectedProgram(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
