import React, { useState, useEffect, useRef } from 'react';
import { VideoToolItem } from '../../types/tools';
import { UserProfile } from '../../types/user';
import { Play, Pause, RotateCcw, X, Trash2, Eye, User } from 'lucide-react';

interface VideoPlayerModalProps {
  video: VideoToolItem;
  currentUser: UserProfile;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  currentUser,
  onClose,
  onDelete,
}) => {
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const playIntervalRef = useRef<number | null>(null);

  const isAuthor = video.author.name === currentUser.name || video.author.name === 'ツクール公式';

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % video.totalFrames);
      }, 100); // 0.1s per frame
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, video.totalFrames]);

  const handleDelete = () => {
    if (confirm(`動画「${video.title}」を削除してもよろしいですか？`)) {
      onDelete(video.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 text-neutral-900 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-neutral-300 overflow-hidden bg-white shrink-0 flex items-center justify-center">
              {video.author.iconDataUrl ? (
                <img
                  src={video.author.iconDataUrl}
                  alt={video.author.name}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <User className="w-5 h-5 text-neutral-400" />
              )}
            </div>
            <div>
              <h3 className="font-black text-base text-neutral-900 leading-tight">{video.title}</h3>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                <span>作者: {video.author.name}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  {video.views} 回再生
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isAuthor && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50"
                title="動画を削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas Display (128x64 rendered in high contrast) */}
        <div className="my-5 flex flex-col items-center">
          <div className="relative border-4 border-neutral-900 rounded-2xl bg-white shadow-xl overflow-hidden w-full max-w-[440px]">
            <img
              src={video.frames[currentFrame] || video.frames[0]}
              alt={video.title}
              className="w-full object-contain"
              style={{
                aspectRatio: '128 / 64',
                imageRendering: 'pixelated',
              }}
            />
          </div>

          {/* Time & Frame status */}
          <div className="w-full max-w-[440px] flex items-center justify-between mt-2 text-xs font-mono text-neutral-500 px-1">
            <span>
              コマ: {currentFrame + 1} / {video.totalFrames}
            </span>
            <span>
              {((currentFrame + 1) * 0.1).toFixed(1)}s / {(video.totalFrames * 0.1).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min={0}
            max={video.totalFrames - 1}
            value={currentFrame}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentFrame(Number(e.target.value));
            }}
            className="w-full accent-neutral-900 cursor-pointer"
          />

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentFrame(0)}
              className="p-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700"
              title="最初に戻る"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? '一時停止' : '再生する'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
