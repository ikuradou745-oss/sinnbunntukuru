import React, { useState, useEffect, useRef } from 'react';
import { ProgramToolItem, ProgramBlock } from '../../types/tools';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  X,
  Trophy,
  Skull,
  Award,
} from 'lucide-react';

interface GameRuntimeProps {
  program: ProgramToolItem;
  onClose?: () => void;
  isStandaloneModal?: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  // Game End State: playing / clear / gameover
  const [gameState, setGameState] = useState<'playing' | 'clear' | 'gameover'>('playing');
  const [endMessage, setEndMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const spriteImagesRef = useRef<Record<string, HTMLImageElement>>({});

  // Refs for async execution safety & fresh values
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const variablesRef = useRef<Record<string, number>>({});
  const gameStateRef = useRef<'playing' | 'clear' | 'gameover'>('playing');
  const gameSessionIdRef = useRef<number>(0);

  // Helper to resolve a value (literal number or variable name)
  const resolveValue = (
    val: number | string | undefined,
    currentVars: Record<string, number>,
    fallback = 0
  ): number => {
    if (val === undefined || val === null || val === '') return fallback;
    if (typeof val === 'number') return val;
    if (currentVars[val] !== undefined) return currentVars[val];
    const parsed = Number(val);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Interpolate variable values in text, e.g. "スコア: {スコア}"
  const interpolateText = (text: string, currentVars: Record<string, number>) => {
    let result = text;
    Object.keys(currentVars).forEach((vKey) => {
      result = result.replace(new RegExp(`{${vKey}}`, 'g'), String(currentVars[vKey]));
    });
    return result;
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

  // Execute a list of blocks asynchronously
  const executeBlockList = async (
    blockList: ProgramBlock[],
    sessionId: number
  ): Promise<void> => {
    for (const block of blockList) {
      if (sessionId !== gameSessionIdRef.current || gameStateRef.current !== 'playing') {
        return;
      }

      // 1. ACTION: Move step (動かす)
      if (block.category === 'action' && block.actionType === 'move_step' && block.spriteId) {
        const current = positionsRef.current[block.spriteId] || { x: 0, y: 0 };
        const stepVal = resolveValue(block.steps, variablesRef.current, 8);
        let dx = 0;
        let dy = 0;
        if (block.direction === 'up') dy = -stepVal;
        if (block.direction === 'down') dy = stepVal;
        if (block.direction === 'left') dx = -stepVal;
        if (block.direction === 'right') dx = stepVal;

        const nextPos = {
          x: Math.max(0, Math.min(112, current.x + dx)),
          y: Math.max(0, Math.min(112, current.y + dy)),
        };

        positionsRef.current = {
          ...positionsRef.current,
          [block.spriteId]: nextPos,
        };
        setSpritePositions({ ...positionsRef.current });
        drawGame(positionsRef.current);
      }

      // 2. ACTION: Set Pos (座標指定)
      if (block.category === 'action' && block.actionType === 'set_pos' && block.spriteId) {
        const posX = resolveValue(block.posX, variablesRef.current, 0);
        const posY = resolveValue(block.posY, variablesRef.current, 0);
        const nextPos = {
          x: Math.max(0, Math.min(112, posX)),
          y: Math.max(0, Math.min(112, posY)),
        };

        positionsRef.current = {
          ...positionsRef.current,
          [block.spriteId]: nextPos,
        };
        setSpritePositions({ ...positionsRef.current });
        drawGame(positionsRef.current);
      }

      // 3. ACTION: 〇秒待つ (Wait X seconds)
      if (block.category === 'action' && block.actionType === 'wait_seconds') {
        const sec = Math.max(0.01, resolveValue(block.waitSeconds, variablesRef.current, 1));
        await sleep(sec * 1000);
        if (sessionId !== gameSessionIdRef.current || gameStateRef.current !== 'playing') {
          return;
        }
      }

      // 4. FEATURE: Dialog / Game Clear / Game Over
      if (block.category === 'feature') {
        if (block.featureAction === 'show_dialog' && block.featureText) {
          const text = interpolateText(block.featureText, variablesRef.current);
          setDialogText(text);
        } else if (block.featureAction === 'hide_dialog') {
          setDialogText(null);
        } else if (block.featureAction === 'game_clear') {
          gameStateRef.current = 'clear';
          setGameState('clear');
          const msg = block.featureText
            ? interpolateText(block.featureText, variablesRef.current)
            : 'おめでとう！ゲームクリア！';
          setEndMessage(msg);
          return;
        } else if (block.featureAction === 'game_over') {
          gameStateRef.current = 'gameover';
          setGameState('gameover');
          const msg = block.featureText
            ? interpolateText(block.featureText, variablesRef.current)
            : 'ゲームオーバー…！もう一度挑戦しよう';
          setEndMessage(msg);
          return;
        }
      }

      // 5. VARIABLE: set, add, sub
      if (block.category === 'variable' && block.varName) {
        const currentVal = variablesRef.current[block.varName] ?? 0;
        const opVal = resolveValue(block.varValue, variablesRef.current, 1);
        let nextVal = currentVal;
        if (block.varOp === 'set') {
          nextVal = opVal;
        } else if (block.varOp === 'add') {
          nextVal = currentVal + opVal;
        } else if (block.varOp === 'sub') {
          nextVal = currentVal - opVal;
        }
        variablesRef.current = { ...variablesRef.current, [block.varName]: nextVal };
        setVariables({ ...variablesRef.current });
      }

      // 6. CHECK / 検査: 〇〇が〇〇に触れていたら
      if (block.category === 'check' && block.checkSpriteA && block.checkSpriteB) {
        const posA = positionsRef.current[block.checkSpriteA];
        const posB = positionsRef.current[block.checkSpriteB];
        if (posA && posB) {
          const isTouching = Math.abs(posA.x - posB.x) < 16 && Math.abs(posA.y - posB.y) < 16;
          if (isTouching && block.childBlocks && block.childBlocks.length > 0) {
            await executeBlockList(block.childBlocks, sessionId);
          }
        }
      }

      // 7. LOOP / 繰り返し: 〇〇回またはずっと
      if (block.category === 'loop' && block.childBlocks && block.childBlocks.length > 0) {
        if (block.repeatType === 'count') {
          const count = Math.max(1, Math.min(1000, resolveValue(block.repeatCount, variablesRef.current, 1)));
          for (let i = 0; i < count; i++) {
            if (sessionId !== gameSessionIdRef.current || gameStateRef.current !== 'playing') return;
            await executeBlockList(block.childBlocks, sessionId);
          }
        } else if (block.repeatType === 'forever') {
          while (sessionId === gameSessionIdRef.current && gameStateRef.current === 'playing') {
            await executeBlockList(block.childBlocks, sessionId);
            await sleep(50);
          }
        }
      }
    }
  };

  // Run 'forever' (ずっと実行する) Event scripts loop
  const startForeverScriptsLoop = async (sessionId: number) => {
    const foreverScripts = program.scripts.filter((s) => s.eventBlock.eventType === 'forever');
    if (foreverScripts.length === 0) return;

    while (sessionId === gameSessionIdRef.current && gameStateRef.current === 'playing') {
      for (const script of foreverScripts) {
        if (sessionId !== gameSessionIdRef.current || gameStateRef.current !== 'playing') return;
        await executeBlockList(script.actionBlocks, sessionId);
      }
      await sleep(100);
    }
  };

  // Execute a block stack triggered by an event
  const executeEvent = async (
    eventType: 'start' | 'key_up' | 'key_down' | 'key_left' | 'key_right' | 'key_num',
    keyNum?: number
  ) => {
    if (gameStateRef.current !== 'playing' && eventType !== 'start') return;

    const matchingScripts = program.scripts.filter((s) => {
      if (s.eventBlock.eventType !== eventType) return false;
      if (eventType === 'key_num' && s.eventBlock.keyNum !== keyNum) return false;
      return true;
    });

    if (matchingScripts.length === 0) return;

    const currentSession = gameSessionIdRef.current;
    for (const script of matchingScripts) {
      if (currentSession !== gameSessionIdRef.current) break;
      await executeBlockList(script.actionBlocks, currentSession);
    }
  };

  // Reset / Initialize game
  const resetGame = () => {
    gameSessionIdRef.current += 1;
    const thisSession = gameSessionIdRef.current;

    gameStateRef.current = 'playing';
    setGameState('playing');
    setEndMessage(null);
    setDialogText(null);

    const initPos: Record<string, { x: number; y: number }> = {};
    program.sprites.forEach((sp) => {
      initPos[sp.id] = { x: sp.initialX, y: sp.initialY };
    });
    positionsRef.current = initPos;
    setSpritePositions(initPos);

    // Initial variables: default to { 'スコア': 0 } if not defined
    const defaultVars: Record<string, number> = { 'スコア': 0 };
    const mergedVars = { ...defaultVars, ...(program.variables || {}) };
    variablesRef.current = mergedVars;
    setVariables(mergedVars);

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

    // Execute 'start' event blocks and start 'forever' event loops
    setTimeout(() => {
      if (thisSession === gameSessionIdRef.current) {
        executeEvent('start');
        startForeverScriptsLoop(thisSession);
      }
    }, 60);
  };

  useEffect(() => {
    resetGame();
    return () => {
      gameSessionIdRef.current += 1;
    };
  }, [program]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing') return;

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

  const activeVars = Object.entries(variables);

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

      {/* Variables Display bar (スコア・コイン・HPなど) */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-[288px] px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-mono">
        <div className="flex flex-wrap gap-2">
          {activeVars.length > 0 ? (
            activeVars.slice(0, 4).map(([k, v]) => (
              <span key={k} className="text-amber-300 font-bold">
                {k}: <span className="text-white">{v}</span>
              </span>
            ))
          ) : (
            <span className="text-neutral-400 text-[11px]">スコア: 0</span>
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
        {dialogText && gameState === 'playing' && (
          <div className="absolute bottom-2 inset-x-2 bg-neutral-950/95 text-white p-2.5 rounded-xl border border-neutral-700 shadow-lg animate-fade-in text-xs leading-snug font-sans">
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

        {/* GAME CLEAR / GAME OVER OVERLAY */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-between p-4 text-white animate-fade-in text-center z-20">
            {/* Title Badge */}
            <div className="mt-2">
              {gameState === 'clear' ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg animate-bounce">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-amber-300 tracking-tight mt-1">
                    ゲームクリア！
                  </h3>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shadow-lg">
                    <Skull className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-red-400 tracking-tight mt-1">
                    ゲームオーバー
                  </h3>
                </div>
              )}

              {/* Text Message */}
              {endMessage && (
                <p className="text-xs text-neutral-200 mt-1.5 leading-snug max-w-[240px]">
                  {endMessage}
                </p>
              )}
            </div>

            {/* Scorecard Display (スコアの表示) */}
            <div className="w-full bg-white/10 rounded-xl p-2.5 border border-white/15 my-2">
              <div className="text-[10px] text-neutral-400 font-bold mb-1 flex items-center justify-center gap-1">
                <Award className="w-3 h-3" />
                <span>リザルトスコア</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {activeVars.map(([k, v]) => (
                  <div
                    key={k}
                    className="px-2.5 py-1 bg-black/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border border-white/10"
                  >
                    <span className="text-neutral-300">{k}:</span>
                    <span className="text-amber-300 text-sm">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions: もう一度やるかやらないかを決めれる */}
            <div className="w-full flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={resetGame}
                className="flex-1 py-2 px-3 bg-white text-neutral-900 hover:bg-neutral-100 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>もう一度遊ぶ</span>
              </button>

              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 active:scale-95 transition-all"
                >
                  終了する
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    gameStateRef.current = 'playing';
                    setGameState('playing');
                  }}
                  className="py-2 px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 active:scale-95 transition-all"
                >
                  閉じる
                </button>
              )}
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
            disabled={gameState !== 'playing'}
            onClick={() => executeEvent('key_up')}
            className="w-11 h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 disabled:opacity-40 text-white rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-90"
            aria-label="上"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />

          <button
            type="button"
            disabled={gameState !== 'playing'}
            onClick={() => executeEvent('key_left')}
            className="w-11 h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 disabled:opacity-40 text-white rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-90"
            aria-label="左"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 flex items-center justify-center text-[10px] text-neutral-400 font-bold">
            十字
          </div>
          <button
            type="button"
            disabled={gameState !== 'playing'}
            onClick={() => executeEvent('key_right')}
            className="w-11 h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 disabled:opacity-40 text-white rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-90"
            aria-label="右"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div />
          <button
            type="button"
            disabled={gameState !== 'playing'}
            onClick={() => executeEvent('key_down')}
            className="w-11 h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 disabled:opacity-40 text-white rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-90"
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
                  disabled={gameState !== 'playing'}
                  onClick={() => executeEvent('key_num', num)}
                  className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-40 text-white font-bold text-sm shadow-md flex items-center justify-center transition-transform active:scale-90"
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
