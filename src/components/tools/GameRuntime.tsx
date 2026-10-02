import React, { useState, useEffect, useRef } from 'react';
import { ProgramToolItem } from '../../types/tools';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, X } from 'lucide-react';

interface GameRuntimeProps {
  program: ProgramToolItem;
  onClose?: () => void;
  isStandaloneModal?: boolean;
}

export const GameRuntime: React.FC<GameRuntimeProps> = ({
  program,
  onClose,
  isStandaloneModal = false,
}) => {
  // Sprite positions state: spriteId -> { x, y }
  const [spritePositions, setSpritePositions] = useState<Record<string, { x: number; y: number }>>({});
  // Variables state: varName -> number
  const [variables, setVariables] = useState<Record<string, number>>({});
  // Dialog state
  const [dialogText, setDialogText] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const spriteImagesRef = useRef<Record<string, HTMLImageElement>>({});

  // Reset / Initialize game
  const resetGame = () => {
    const initPos: Record<string, { x: number; y: number }> = {};
    program.sprites.forEach((sp) => {
      initPos[sp.id] = { x: sp.initialX, y: sp.initialY };
    });
    setSpritePositions(initPos);
    setVariables({ ...(program.variables || {}) });
    setDialogText(null);

    // Preload background
    const bgImg = new Image();
    bgImg.onload = () => {
      bgImageRef.current = bgImg;
      drawGame(initPos);
    };
    bgImg.src = program.backgroundDataUrl;

    // Preload sprites
    program.sprites.forEach((sp) => {
      const spImg = new Image();
      spImg.onload = () => {
        spriteImagesRef.current[sp.id] = spImg;
        drawGame(initPos);
      };
      spImg.src = sp.dataUrl;
    });

    // Execute 'start' event blocks
    setTimeout(() => {
      executeEvent('start');
    }, 50);
  };

  useEffect(() => {
    resetGame();
  }, [program]);

  // Interpolate variable values in text, e.g. "スコア: {スコア}"
  const interpolateText = (text: string, currentVars: Record<string, number>) => {
    let result = text;
    Object.keys(currentVars).forEach((vKey) => {
      result = result.replace(new RegExp(`{${vKey}}`, 'g'), String(currentVars[vKey]));
    });
    return result;
  };

  // Execute a block stack
  const executeEvent = (
    eventType: 'start' | 'key_up' | 'key_down' | 'key_left' | 'key_right' | 'key_num',
    keyNum?: number
  ) => {
    const matchingScripts = program.scripts.filter((s) => {
      if (s.eventBlock.eventType !== eventType) return false;
      if (eventType === 'key_num' && s.eventBlock.keyNum !== keyNum) return false;
      return true;
    });

    if (matchingScripts.length === 0) return;

    setSpritePositions((prevPos) => {
      const nextPos = { ...prevPos };

      setVariables((prevVars) => {
        const nextVars = { ...prevVars };

        matchingScripts.forEach((script) => {
          script.actionBlocks.forEach((block) => {
            // Action 1: Move step
            if (block.category === 'action' && block.actionType === 'move_step' && block.spriteId) {
              const current = nextPos[block.spriteId] || { x: 0, y: 0 };
              let stepVal = typeof block.steps === 'number' ? block.steps : nextVars[String(block.steps)] || 8;
              let dx = 0;
              let dy = 0;
              if (block.direction === 'up') dy = -stepVal;
              if (block.direction === 'down') dy = stepVal;
              if (block.direction === 'left') dx = -stepVal;
              if (block.direction === 'right') dx = stepVal;

              nextPos[block.spriteId] = {
                x: Math.max(0, Math.min(112, current.x + dx)),
                y: Math.max(0, Math.min(112, current.y + dy)),
              };
            }

            // Action 2: Set pos
            if (block.category === 'action' && block.actionType === 'set_pos' && block.spriteId) {
              const posX = typeof block.posX === 'number' ? block.posX : nextVars[String(block.posX)] || 0;
              const posY = typeof block.posY === 'number' ? block.posY : nextVars[String(block.posY)] || 0;
              nextPos[block.spriteId] = {
                x: Math.max(0, Math.min(112, posX)),
                y: Math.max(0, Math.min(112, posY)),
              };
            }

            // Feature: Show / Hide Dialog
            if (block.category === 'feature') {
              if (block.featureAction === 'show_dialog' && block.featureText) {
                const text = interpolateText(block.featureText, nextVars);
                setDialogText(text);
              } else if (block.featureAction === 'hide_dialog') {
                setDialogText(null);
              }
            }

            // Variable Op
            if (block.category === 'variable' && block.varName) {
              const currentVal = nextVars[block.varName] ?? 0;
              const opVal = typeof block.varValue === 'number' ? block.varValue : nextVars[String(block.varValue)] || 0;
              if (block.varOp === 'set') {
                nextVars[block.varName] = opVal;
              } else if (block.varOp === 'add') {
                nextVars[block.varName] = currentVal + opVal;
              } else if (block.varOp === 'sub') {
                nextVars[block.varName] = currentVal - opVal;
              }
            }
          });
        });

        return nextVars;
      });

      drawGame(nextPos);
      return nextPos;
    });
  };

  // Draw 128x128 canvas
  const drawGame = (currentPositions: Record<string, { x: number; y: number }>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 128, 128);

    // Draw background
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, 128, 128);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 128, 128);
    }

    // Draw sprites
    program.sprites.forEach((sp) => {
      const pos = currentPositions[sp.id] || { x: sp.initialX, y: sp.initialY };
      const img = spriteImagesRef.current[sp.id];
      if (img) {
        ctx.drawImage(img, pos.x, pos.y, 16, 16);
      }
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        executeEvent('key_up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        executeEvent('key_down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        executeEvent('key_left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        executeEvent('key_right');
      } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        const num = Number(e.key);
        if (program.activeNumberKeys.includes(num)) {
          executeEvent('key_num', num);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [program]);

  // Re-draw when positions change
  useEffect(() => {
    drawGame(spritePositions);
  }, [spritePositions]);

  return (
    <div className="flex flex-col items-center gap-4 w-full select-none">
      {/* Title & Close (if modal) */}
      {isStandaloneModal && (
        <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-200">
          <div>
            <h3 className="font-bold text-base text-neutral-900">{program.title}</h3>
            <span className="text-[11px] text-neutral-500">作者: {program.author.name}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Variables Display bar */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-[288px] px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-mono">
        <div className="flex flex-wrap gap-2.5">
          {Object.keys(variables).length > 0 ? (
            Object.entries(variables).map(([k, v]) => (
              <span key={k} className="text-amber-300 font-bold">
                {k}: <span className="text-white">{v}</span>
              </span>
            ))
          ) : (
            <span className="text-neutral-400 text-[11px]">変数なし</span>
          )}
        </div>
        <button
          type="button"
          onClick={resetGame}
          className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white ml-auto"
          title="リスタート"
        >
          <RotateCcw className="w-3 h-3" />
          <span>リセット</span>
        </button>
      </div>

      {/* Game Screen (128x128 pixels, rendered in 288x288 display) */}
      <div className="relative border-4 border-neutral-900 rounded-2xl bg-white shadow-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={128}
          height={128}
          className="bg-white"
          style={{
            width: '288px',
            height: '288px',
            imageRendering: 'pixelated',
          }}
        />

        {/* Text Dialog Overlay (機能: テキストダイアログを表示) */}
        {dialogText && (
          <div className="absolute bottom-2 inset-x-2 bg-neutral-950/90 text-white p-2.5 rounded-xl border border-neutral-700 shadow-lg animate-fade-in text-xs leading-snug font-sans">
            <div className="flex items-start justify-between gap-1">
              <span className="font-medium">{dialogText}</span>
              <button
                type="button"
                onClick={() => setDialogText(null)}
                className="text-neutral-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controller Pad Section (ゲーム画面の下) */}
      <div className="w-full max-w-[320px] bg-neutral-100 p-4 rounded-3xl border border-neutral-300 shadow-sm flex flex-col items-center gap-3">
        {/* Directional D-Pad (上下左右キー) */}
        <div className="grid grid-cols-3 gap-1.5 w-36">
          <div />
          <button
            type="button"
            onClick={() => executeEvent('key_up')}
            className="w-11 h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 text-white rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-90"
            aria-label="上"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />

          <button
            type="button"
            onClick={() => executeEvent('key_left')}
            className="w-11 h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 text-white rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-90"
            aria-label="左"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 flex items-center justify-center text-[10px] text-neutral-400 font-bold">
            十字
          </div>
          <button
            type="button"
            onClick={() => executeEvent('key_right')}
            className="w-11 h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 text-white rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-90"
            aria-label="右"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div />
          <button
            type="button"
            onClick={() => executeEvent('key_down')}
            className="w-11 h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 text-white rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-90"
            aria-label="下"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <div />
        </div>

        {/* Number Buttons: 123456789 (ユーザーが追加したボタン) */}
        {program.activeNumberKeys && program.activeNumberKeys.length > 0 && (
          <div className="w-full pt-2 border-t border-neutral-300">
            <div className="text-[10px] text-neutral-500 font-bold mb-1.5 text-center">
              アクションボタン (数字キー)
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {program.activeNumberKeys.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => executeEvent('key_num', num)}
                  className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm shadow-md flex items-center justify-center transition-transform active:scale-90"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
