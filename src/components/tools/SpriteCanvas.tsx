import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Paintbrush, PaintBucket, RotateCcw, Trash2 } from 'lucide-react';

interface SpriteCanvasProps {
  initialImage?: string;
  onSave: (dataUrl: string) => void;
}

const PALETTE = [
  '#000000', '#4a4a4a', '#9ca3af', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#78350f', '#fde68a', '#bbf7d0', '#bfdbfe',
];

export const SpriteCanvas: React.FC<SpriteCanvasProps> = ({ initialImage, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'bucket'>('pen');
  const [color, setColor] = useState<string>('#3b82f6');
  const [history, setHistory] = useState<ImageData[]>([]);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, 16, 16);
        ctx.drawImage(img, 0, 0, 16, 16);
        saveHistory();
        onSave(canvas.toDataURL('image/png'));
      };
      img.src = initialImage;
    } else {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(2, 2, 12, 12);
      saveHistory();
      onSave(canvas.toDataURL('image/png'));
    }
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, 16, 16)]);
  };

  const notifyChange = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

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
    const scaleX = 16 / rect.width;
    const scaleY = 16 / rect.height;
    return {
      x: Math.max(0, Math.min(15, Math.floor((clientX - rect.left) * scaleX))),
      y: Math.max(0, Math.min(15, Math.floor((clientY - rect.top) * scaleY))),
    };
  };

  const setPixel = (x: number, y: number, isEraser = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isEraser) {
      ctx.clearRect(x, y, 1, 1);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCoords(e);
    if (!coords) return;
    isDrawing.current = true;
    setPixel(coords.x, coords.y, tool === 'eraser');
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const coords = getCoords(e);
    if (!coords) return;
    setPixel(coords.x, coords.y, tool === 'eraser');
  };

  const handlePointerUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      saveHistory();
      notifyChange();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 16, 16);
    saveHistory();
    notifyChange();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 16x16 Canvas */}
      <div className="relative p-2 bg-neutral-100 rounded-xl border border-neutral-300 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={16}
          height={16}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="cursor-crosshair touch-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:8px_8px] bg-white border-2 border-neutral-400 rounded-lg shadow-sm"
          style={{
            width: '160px',
            height: '160px',
            imageRendering: 'pixelated',
          }}
        />
        <span className="text-[10px] text-neutral-400 font-mono mt-1">16×16 ピクセル</span>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
        <button
          type="button"
          onClick={() => setTool('pen')}
          className={`p-1.5 rounded-lg text-xs font-semibold ${
            tool === 'pen' ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-200'
          }`}
          title="ペン"
        >
          <Paintbrush className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setTool('eraser')}
          className={`p-1.5 rounded-lg text-xs font-semibold ${
            tool === 'eraser' ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-200'
          }`}
          title="消しゴム"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs"
          title="クリア"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Palette */}
      <div className="grid grid-cols-8 gap-1 p-1.5 bg-neutral-100 rounded-xl border border-neutral-200">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setColor(c);
              if (tool === 'eraser') setTool('pen');
            }}
            style={{ backgroundColor: c }}
            className={`w-5 h-5 rounded border ${
              color === c && tool !== 'eraser' ? 'ring-2 ring-neutral-900 scale-110' : 'border-neutral-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
