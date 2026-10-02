import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../types/user';
import { VideoToolItem } from '../../types/tools';
import { saveVideo } from '../../services/toolStorage';
import {
  Film,
  Play,
  Pause,
  Copy,
  ClipboardPaste,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trash2,
  CheckCircle,
  Eye,
  Eraser,
  Paintbrush,
  PaintBucket,
  ArrowLeft,
  Layers,
} from 'lucide-react';

interface VideoEditorProps {
  user: UserProfile;
  onBack: () => void;
  onPublished: () => void;
}

const PALETTE = [
  '#000000', '#374151', '#9ca3af', '#ffffff',
  '#dc2626', '#ea580c', '#f59e0b', '#16a34a',
  '#0d9488', '#2563eb', '#7c3aed', '#db2777',
  '#fee2e2', '#fef3c7', '#dcfce7', '#dbeafe',
];

export const VideoEditor: React.FC<VideoEditorProps> = ({
  user,
  onBack,
  onPublished,
}) => {
  const [totalFrames, setTotalFrames] = useState<number>(20); // 10 to 150
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [clipboardFrame, setClipboardFrame] = useState<string | null>(null);

  // Drawing state
  const [tool, setTool] = useState<'pen' | 'eraser' | 'bucket'>('pen');
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [showOnionSkin, setShowOnionSkin] = useState<boolean>(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playIntervalRef = useRef<number | null>(null);

  // Completion modal state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [publishError, setPublishError] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef<boolean>(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize frames array with blank white 128x64 images
  useEffect(() => {
    const blank = createBlankFrameDataUrl();
    const initial: string[] = Array.from({ length: 20 }, () => blank);
    setFrames(initial);
    loadFrameToCanvas(blank);
  }, []);

  const createBlankFrameDataUrl = () => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 64);
    return c.toDataURL('image/png');
  };

  // Sync canvas when frame index changes
  useEffect(() => {
    if (frames[currentFrameIndex]) {
      loadFrameToCanvas(frames[currentFrameIndex]);
    }
  }, [currentFrameIndex]);

  const loadFrameToCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, 128, 64);
      ctx.drawImage(img, 0, 0, 128, 64);
    };
    img.src = dataUrl;
  };

  const saveCurrentCanvasToFrames = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    setFrames((prev) => {
      const copy = [...prev];
      copy[currentFrameIndex] = url;
      return copy;
    });
  };

  // Frame count adjustment (10 ~ 150)
  const handleTotalFramesChange = (newCount: number) => {
    const count = Math.max(10, Math.min(150, newCount));
    setTotalFrames(count);
    setFrames((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const blank = createBlankFrameDataUrl();
        const diff = count - prev.length;
        const addition = Array.from({ length: diff }, () => blank);
        return [...prev, ...addition];
      } else {
        return prev.slice(0, count);
      }
    });
    if (currentFrameIndex >= count) {
      setCurrentFrameIndex(count - 1);
    }
  };

  // Coords on 128x64 canvas
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = 128 / rect.width;
    const scaleY = 64 / rect.height;

    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);

    return {
      x: Math.max(0, Math.min(127, x)),
      y: Math.max(0, Math.min(63, y)),
    };
  };

  const drawPixelOrBrush = (x: number, y: number, isEraser = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = isEraser ? '#ffffff' : color;
    if (brushSize === 1) {
      ctx.fillRect(x, y, 1, 1);
    } else {
      const radius = brushSize - 1;
      ctx.beginPath();
      ctx.arc(x + 0.5, y + 0.5, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawLine = (x0: number, y0: number, x1: number, y1: number, isEraser: boolean) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let curX = x0;
    let curY = y0;

    while (true) {
      drawPixelOrBrush(curX, curY, isEraser);
      if (curX === x1 && curY === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        curX += sx;
      }
      if (e2 < dx) {
        err += dx;
        curY += sy;
      }
    }
  };

  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, 128, 64);
    const data = imgData.data;

    const hex = color.replace('#', '');
    const fillR = parseInt(hex.substring(0, 2), 16);
    const fillG = parseInt(hex.substring(2, 4), 16);
    const fillB = parseInt(hex.substring(4, 6), 16);

    const startIndex = (startY * 128 + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === 255) return;

    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(128 * 64);

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      const idx = (cy * 128 + cx) * 4;
      const vIdx = cy * 128 + cx;

      if (visited[vIdx]) continue;
      visited[vIdx] = 1;

      if (
        data[idx] === targetR &&
        data[idx + 1] === targetG &&
        data[idx + 2] === targetB &&
        data[idx + 3] === targetA
      ) {
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = 255;

        if (cx > 0) queue.push([cx - 1, cy]);
        if (cx < 127) queue.push([cx + 1, cy]);
        if (cy > 0) queue.push([cx, cy - 1]);
        if (cy < 63) queue.push([cx, cy + 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveCurrentCanvasToFrames();
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    const coords = getCoords(e);
    if (!coords) return;

    if (tool === 'bucket') {
      floodFill(coords.x, coords.y);
      return;
    }

    isDrawing.current = true;
    lastPos.current = coords;
    drawPixelOrBrush(coords.x, coords.y, tool === 'eraser');
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || isPlaying) return;
    const coords = getCoords(e);
    if (!coords) return;

    if (lastPos.current) {
      drawLine(lastPos.current.x, lastPos.current.y, coords.x, coords.y, tool === 'eraser');
    }
    lastPos.current = coords;
  };

  const handlePointerUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      lastPos.current = null;
      saveCurrentCanvasToFrames();
    }
  };

  // Copy previous frame into current frame
  const handleCopyPrevious = () => {
    if (currentFrameIndex === 0) return;
    const prevFrameUrl = frames[currentFrameIndex - 1];
    if (prevFrameUrl) {
      loadFrameToCanvas(prevFrameUrl);
      setFrames((prev) => {
        const copy = [...prev];
        copy[currentFrameIndex] = prevFrameUrl;
        return copy;
      });
    }
  };

  // Copy current frame to clipboard
  const handleCopyCurrent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    setClipboardFrame(url);
  };

  // Paste clipboard into current frame
  const handlePaste = () => {
    if (!clipboardFrame) return;
    loadFrameToCanvas(clipboardFrame);
    setFrames((prev) => {
      const copy = [...prev];
      copy[currentFrameIndex] = clipboardFrame;
      return copy;
    });
  };

  // Clear current frame
  const handleClearFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 64);
    saveCurrentCanvasToFrames();
  };

  // Playback Preview (0.1s = 100ms per frame)
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % totalFrames);
      }, 100);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, totalFrames]);

  const togglePlay = () => {
    if (!isPlaying) {
      saveCurrentCanvasToFrames();
    }
    setIsPlaying(!isPlaying);
  };

  // Complete / Publish
  const handlePublish = () => {
    const trimmed = title.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setPublishError('名前は2〜20文字で入力してください。');
      return;
    }

    saveCurrentCanvasToFrames();

    const videoItem: VideoToolItem = {
      id: 'vid-' + Date.now(),
      type: 'video',
      title: trimmed,
      author: {
        name: user.name,
        iconDataUrl: user.iconDataUrl,
      },
      createdAt: new Date().toISOString(),
      views: 0,
      width: 128,
      height: 64,
      totalFrames,
      frameRate: 10,
      frames: frames.slice(0, totalFrames),
    };

    const res = saveVideo(videoItem);
    if (!res.success) {
      setPublishError(res.message || '保存に失敗しました。');
      return;
    }

    setIsPublishModalOpen(false);
    onPublished();
  };

  // Get previous frame for onion skin
  const prevFrameUrl = currentFrameIndex > 0 ? frames[currentFrameIndex - 1] : null;

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 flex flex-col gap-5">
      {/* Top Bar */}
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
          <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-900 leading-tight">動画クリエイター</h2>
            <p className="text-[11px] text-neutral-500">128×64 px | 0.1秒コマ送り (10 FPS)</p>
          </div>
        </div>

        {/* Complete button */}
        <button
          type="button"
          onClick={() => {
            saveCurrentCanvasToFrames();
            setIsPublishModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>完成（投稿する）</span>
        </button>
      </div>

      {/* Main Workspace (Half-screen / Centered 128x64 display) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Canvas + Playback */}
        <div className="lg:col-span-8 flex flex-col items-center gap-4 bg-neutral-50 p-4 sm:p-6 rounded-3xl border border-neutral-200 shadow-xs">
          
          {/* Header over canvas */}
          <div className="w-full flex items-center justify-between text-xs text-neutral-600 px-1">
            <div className="font-bold flex items-center gap-2">
              <span className="bg-neutral-900 text-white px-2 py-0.5 rounded text-[11px] font-mono">
                コマ {currentFrameIndex + 1} / {totalFrames}
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {((currentFrameIndex + 1) * 0.1).toFixed(1)}s / {(totalFrames * 0.1).toFixed(1)}s
              </span>
            </div>

            {/* Onion skin toggle */}
            <button
              type="button"
              onClick={() => setShowOnionSkin(!showOnionSkin)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                showOnionSkin
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  : 'bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-100'
              }`}
              title="前のコマを薄く表示する（作画補助）"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>オニオンスキン {showOnionSkin ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* 128x64 Canvas Container (Relative with Onion skin underneath) */}
          <div className="relative border-4 border-neutral-800 rounded-xl bg-white shadow-md overflow-hidden select-none">
            {/* Onion skin background image */}
            {showOnionSkin && prevFrameUrl && !isPlaying && (
              <img
                src={prevFrameUrl}
                alt="前コマ下絵"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-25 filter contrast-125"
                style={{ imageRendering: 'pixelated' }}
              />
            )}

            {/* Drawing Canvas */}
            <canvas
              ref={canvasRef}
              width={128}
              height={64}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className={`touch-none relative z-10 ${isPlaying ? 'cursor-default' : 'cursor-crosshair'}`}
              style={{
                width: '100%',
                maxWidth: '512px',
                aspectRatio: '128 / 64',
                imageRendering: 'pixelated',
              }}
            />
          </div>

          {/* Canvas Bottom Action Controls */}
          <div className="w-full max-w-[512px] flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold shadow-xs transition-all ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? '停止' : '再生確認 (0.1秒)'}</span>
            </button>

            {/* Step navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentFrameIndex === 0 || isPlaying}
                onClick={() => {
                  saveCurrentCanvasToFrames();
                  setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
                }}
                className="p-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40"
                title="前のコマへ"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-700" />
              </button>

              <span className="text-xs font-mono font-bold px-2 text-neutral-700">
                {currentFrameIndex + 1} / {totalFrames}
              </span>

              <button
                type="button"
                disabled={currentFrameIndex === totalFrames - 1 || isPlaying}
                onClick={() => {
                  saveCurrentCanvasToFrames();
                  setCurrentFrameIndex((prev) => Math.min(totalFrames - 1, prev + 1));
                }}
                className="p-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40"
                title="次のコマへ"
              >
                <ChevronRight className="w-4 h-4 text-neutral-700" />
              </button>
            </div>

            {/* Frame Copy Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentFrameIndex === 0 || isPlaying}
                onClick={handleCopyPrevious}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 text-[11px] font-semibold text-neutral-700"
                title="直前のコマを現在のコマにコピーする"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">前画面コピー</span>
              </button>

              <button
                type="button"
                disabled={isPlaying}
                onClick={handleCopyCurrent}
                className="p-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-[11px] text-neutral-700"
                title="現在の画面をクリップボードにコピー"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={!clipboardFrame || isPlaying}
                onClick={handlePaste}
                className="p-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-[11px] text-neutral-700 disabled:opacity-30"
                title="コピーした画面を貼り付け"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={isPlaying}
                onClick={handleClearFrame}
                className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-[11px] text-red-600"
                title="このコマを全消去"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="w-full max-w-[512px] bg-white p-3 rounded-2xl border border-neutral-200">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
              <span className="font-semibold text-neutral-700">タイムライン (コマ選択)</span>
              <span className="font-mono text-[11px]">
                全コマ時間: {(totalFrames * 0.1).toFixed(1)} 秒
              </span>
            </div>
            
            <input
              type="range"
              min={0}
              max={totalFrames - 1}
              value={currentFrameIndex}
              disabled={isPlaying}
              onChange={(e) => {
                saveCurrentCanvasToFrames();
                setCurrentFrameIndex(Number(e.target.value));
              }}
              className="w-full accent-neutral-900 cursor-pointer"
            />

            {/* Thumbnail mini strip */}
            <div className="flex gap-1 overflow-x-auto py-1 mt-1 scrollbar-none">
              {frames.slice(0, totalFrames).map((fUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!isPlaying) {
                      saveCurrentCanvasToFrames();
                      setCurrentFrameIndex(idx);
                    }
                  }}
                  className={`w-9 h-5 rounded shrink-0 border overflow-hidden transition-all ${
                    idx === currentFrameIndex
                      ? 'border-neutral-900 ring-2 ring-neutral-900 scale-105'
                      : 'border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={fUrl}
                    alt={`コマ ${idx + 1}`}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Tools & Settings */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Frame count settings (10 to 150) */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
            <h3 className="font-bold text-xs text-neutral-800 mb-1 flex items-center justify-between">
              <span>コマ数設定 (10 〜 150 コマ)</span>
              <span className="text-amber-700 font-mono font-bold text-sm">
                {totalFrames} コマ ({(totalFrames * 0.1).toFixed(1)}秒)
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400 mb-3">
              1コマ0.1秒。最大150コマ（15.0秒）まで作成可能です。
            </p>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={totalFrames}
                onChange={(e) => handleTotalFramesChange(Number(e.target.value))}
                className="flex-1 accent-neutral-900 cursor-pointer"
              />
              <input
                type="number"
                min={10}
                max={150}
                value={totalFrames}
                onChange={(e) => handleTotalFramesChange(Number(e.target.value))}
                className="w-16 px-2 py-1 bg-neutral-50 border border-neutral-300 rounded text-center text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Drawing Tools */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <div className="text-xs font-bold text-neutral-700">描画ツール</div>

            {/* Tool Selection */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  tool === 'pen'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>ペン</span>
              </button>

              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  tool === 'eraser'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>消しゴム</span>
              </button>

              <button
                type="button"
                onClick={() => setTool('bucket')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  tool === 'bucket'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <PaintBucket className="w-3.5 h-3.5" />
                <span>塗りつぶし</span>
              </button>
            </div>

            {/* Brush sizes */}
            <div className="flex items-center justify-between text-xs text-neutral-600 pt-1">
              <span className="text-[11px] font-medium text-neutral-500">太さ:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setBrushSize(sz)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                      brushSize === sz
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* Palette */}
            <div>
              <div className="text-[11px] font-medium text-neutral-500 mb-1.5">カラーパレット:</div>
              <div className="grid grid-cols-8 gap-1.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      if (tool === 'eraser') setTool('pen');
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-md border transition-all ${
                      color === c && tool !== 'eraser'
                        ? 'ring-2 ring-neutral-900 scale-110 shadow-sm border-neutral-900'
                        : 'border-neutral-300 hover:scale-105'
                    }`}
                    title={c}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-neutral-500 text-[11px]">自由選択:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      setColor(e.target.value);
                      if (tool === 'eraser') setTool('pen');
                    }}
                    className="w-7 h-7 rounded border border-neutral-300 cursor-pointer p-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-neutral-600">{color}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PUBLISH / COMPLETION MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-neutral-200 text-neutral-900">
            <h3 className="text-xl font-black text-neutral-900 mb-1">動画を完成・投稿</h3>
            <p className="text-xs text-neutral-500 mb-4">
              動画の名前を決めて投稿しましょう（ツールを見るで他の人も閲覧できます）
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="video-title" className="text-xs font-bold text-neutral-700">
                    動画の名前 (2〜20文字)
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      title.trim().length < 2 || title.trim().length > 20
                        ? 'text-red-500 font-bold'
                        : 'text-neutral-400'
                    }`}
                  >
                    {title.trim().length} / 20 文字
                  </span>
                </div>
                <input
                  id="video-title"
                  type="text"
                  autoFocus
                  maxLength={20}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (publishError) setPublishError('');
                  }}
                  placeholder="例：パラパラ猫のジャンプ"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {publishError && (
                <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  {publishError}
                </div>
              )}

              <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-600 space-y-1">
                <div className="flex justify-between">
                  <span>コマ数:</span>
                  <span className="font-bold">{totalFrames} コマ ({(totalFrames * 0.1).toFixed(1)}秒)</span>
                </div>
                <div className="flex justify-between">
                  <span>作者:</span>
                  <span className="font-bold">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>上限制限:</span>
                  <span className="text-neutral-500">1ユーザー最大10作品まで</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="w-1/3 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  編集に戻る
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={title.trim().length < 2 || title.trim().length > 20}
                  className="w-2/3 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
                >
                  投稿する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
