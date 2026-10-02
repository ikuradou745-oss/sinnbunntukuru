import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, Paintbrush, RotateCcw, Trash2, PaintBucket } from 'lucide-react';

interface IconCanvasProps {
  initialImage?: string;
  onSave: (dataUrl: string) => void;
}

const PALETTE = [
  '#000000', '#4a4a4a', '#8a8a8a', '#ffffff',
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169',
  '#319795', '#3182ce', '#805ad5', '#d53f8c',
  '#fed7d7', '#feebc8', '#c6f6d5', '#bee3f8',
];

export const IconCanvas: React.FC<IconCanvasProps> = ({ initialImage, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'bucket'>('pen');
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [history, setHistory] = useState<ImageData[]>([]);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, 64, 64);
        ctx.drawImage(img, 0, 0, 64, 64);
        saveHistory();
        onSave(canvas.toDataURL('image/png'));
      };
      img.src = initialImage;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 64, 64);
      saveHistory();
      onSave(canvas.toDataURL('image/png'));
    }
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, 64, 64);
    setHistory((prev) => [...prev.slice(-15), imgData]);
  };

  const notifyChange = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

    const scaleX = 64 / rect.width;
    const scaleY = 64 / rect.height;

    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);

    return {
      x: Math.max(0, Math.min(63, x)),
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

  // Draw line between two points to prevent gaps when mouse moves fast
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

  // Flood fill bucket
  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, 64, 64);
    const data = imgData.data;

    // Convert hex color to rgb
    const hex = color.replace('#', '');
    const fillR = parseInt(hex.substring(0, 2), 16);
    const fillG = parseInt(hex.substring(2, 4), 16);
    const fillB = parseInt(hex.substring(4, 6), 16);

    const startIndex = (startY * 64 + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    // Already the same color
    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === 255) return;

    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(64 * 64);

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      const idx = (cy * 64 + cx) * 4;
      const vIdx = cy * 64 + cx;

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
        if (cx < 63) queue.push([cx + 1, cy]);
        if (cy > 0) queue.push([cx, cy - 1]);
        if (cy < 63) queue.push([cx, cy + 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveHistory();
    notifyChange();
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
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
    if (!isDrawing.current) return;
    const coords = getCanvasCoords(e);
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
      saveHistory();
      notifyChange();
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // remove current
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
    notifyChange();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);
    saveHistory();
    notifyChange();
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full select-none">
      {/* 64*64 Canvas area */}
      <div className="relative p-2 bg-neutral-100 rounded-xl border border-neutral-300 shadow-inner flex flex-col items-center">
        <div className="text-[11px] font-bold text-neutral-500 mb-1 flex items-center justify-between w-full px-1">
          <span>アイコン描画 (64×64 px)</span>
          <span className="font-mono text-neutral-400">実寸 64x64</span>
        </div>

        <canvas
          ref={canvasRef}
          width={64}
          height={64}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="border-2 border-neutral-400 rounded-lg cursor-crosshair touch-none bg-white shadow-sm"
          style={{
            width: '224px',
            height: '224px',
            imageRendering: 'pixelated',
          }}
        />

        {/* Live Preview badge */}
        <div className="mt-2 flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-neutral-200 text-xs text-neutral-600">
          <span>プレビュー:</span>
          <div className="w-8 h-8 rounded-full border border-neutral-300 overflow-hidden shadow-xs flex items-center justify-center bg-white">
            <canvas
              width={64}
              height={64}
              style={{ width: '32px', height: '32px' }}
              ref={(previewCanvas) => {
                if (previewCanvas && canvasRef.current) {
                  const pCtx = previewCanvas.getContext('2d');
                  pCtx?.drawImage(canvasRef.current, 0, 0);
                }
              }}
            />
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">64×64</span>
        </div>
      </div>

      {/* Tools Toolbar */}
      <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200 w-full justify-center">
        <button
          type="button"
          onClick={() => setTool('pen')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tool === 'pen'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-700 hover:bg-neutral-200'
          }`}
          title="ペン"
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>ペン</span>
        </button>

        <button
          type="button"
          onClick={() => setTool('eraser')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tool === 'eraser'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-700 hover:bg-neutral-200'
          }`}
          title="消しゴム"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>消しゴム</span>
        </button>

        <button
          type="button"
          onClick={() => setTool('bucket')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tool === 'bucket'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-700 hover:bg-neutral-200'
          }`}
          title="塗りつぶし"
        >
          <PaintBucket className="w-3.5 h-3.5" />
          <span>バケツ</span>
        </button>

        <div className="h-4 w-px bg-neutral-300 mx-0.5" />

        <button
          type="button"
          onClick={handleUndo}
          disabled={history.length <= 1}
          className="p-1.5 rounded-lg text-neutral-700 hover:bg-neutral-200 disabled:opacity-30"
          title="元に戻す"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
          title="全消去"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Brush Size (1px or 2px or 3px) */}
      <div className="flex items-center gap-2 text-xs text-neutral-600 w-full justify-between px-1">
        <span className="text-[11px] font-medium text-neutral-500">ペンの太さ:</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setBrushSize(size)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                brushSize === size
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      {/* Palette */}
      <div className="w-full">
        <div className="text-[11px] font-medium text-neutral-500 mb-1 px-1">カラーパレット:</div>
        <div className="grid grid-cols-8 gap-1.5 p-2 bg-neutral-100 rounded-xl border border-neutral-200">
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
        <div className="mt-1.5 flex items-center justify-between px-1 text-xs">
          <span className="text-neutral-500 text-[11px]">カスタム色:</span>
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
  );
};
