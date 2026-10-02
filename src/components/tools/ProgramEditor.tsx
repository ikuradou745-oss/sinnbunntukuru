import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../types/user';
import { ProgramToolItem, SpriteItem, ProgramEventScript, ProgramBlock } from '../../types/tools';
import { saveProgram } from '../../services/toolStorage';
import { SpriteCanvas } from './SpriteCanvas';
import { GameRuntime } from './GameRuntime';
import {
  Code2,
  ArrowLeft,
  CheckCircle,
  Plus,
  Trash2,
  Play,
  Layers,
  Gamepad2,
  Blocks,
  Image as ImageIcon,
  User,
  PlusCircle,
  Paintbrush,
  Eraser,
  PaintBucket,
  AlertCircle,
} from 'lucide-react';

interface ProgramEditorProps {
  user: UserProfile;
  onBack: () => void;
  onPublished: () => void;
}

const BG_PALETTE = [
  '#f8fafc', '#e2e8f0', '#94a3b8', '#0f172a',
  '#fef2f2', '#fee2e2', '#fef3c7', '#dcfce7',
  '#e0f2fe', '#dbeafe', '#ede9fe', '#fce7f3',
  '#15803d', '#1e40af', '#b45309', '#7f1d1d',
];

export const ProgramEditor: React.FC<ProgramEditorProps> = ({
  user,
  onBack,
  onPublished,
}) => {
  const [activeTab, setActiveTab] = useState<'bg' | 'sprites' | 'buttons' | 'blocks' | 'test'>('bg');

  // Program State
  const [title, setTitle] = useState<string>('');
  const [backgroundDataUrl, setBackgroundDataUrl] = useState<string>('');
  const [sprites, setSprites] = useState<SpriteItem[]>([]);
  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
  const [activeNumberKeys, setActiveNumberKeys] = useState<number[]>([1, 2]);
  const [variables, setVariables] = useState<Record<string, number>>({ 'スコア': 0 });
  const [newVarName, setNewVarName] = useState<string>('');
  const [scripts, setScripts] = useState<ProgramEventScript[]>([]);

  // Modals & Notices
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [publishError, setPublishError] = useState<string>('');
  const [editingSprite, setEditingSprite] = useState<SpriteItem | null>(null);

  // Background drawing tools
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [bgTool, setBgTool] = useState<'pen' | 'eraser' | 'bucket'>('pen');
  const [bgColor, setBgColor] = useState<string>('#94a3b8');
  const isBgDrawing = useRef<boolean>(false);

  // Initialize Background & Starter Sprites
  useEffect(() => {
    // Default background: pale gray floor with borders
    const bgC = document.createElement('canvas');
    bgC.width = 128;
    bgC.height = 128;
    const ctx = bgC.getContext('2d')!;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 128, 128);

    // Subtle grid
    ctx.strokeStyle = '#e2e8f0';
    for (let i = 0; i < 128; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 128);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(128, i);
      ctx.stroke();
    }

    const bgUrl = bgC.toDataURL('image/png');
    setBackgroundDataUrl(bgUrl);
    loadBgToCanvas(bgUrl);

    // Initial Starter Sprite 1: 主人公 (Blue slime/character)
    const spC = document.createElement('canvas');
    spC.width = 16;
    spC.height = 16;
    const spCtx = spC.getContext('2d')!;
    spCtx.fillStyle = '#2563eb';
    spCtx.fillRect(2, 2, 12, 12);
    spCtx.fillStyle = '#ffffff';
    spCtx.fillRect(4, 5, 3, 3);
    spCtx.fillRect(9, 5, 3, 3);
    spCtx.fillStyle = '#1e3a8a';
    spCtx.fillRect(5, 6, 1, 1);
    spCtx.fillRect(10, 6, 1, 1);

    const initSprite: SpriteItem = {
      id: 'sp-1',
      name: '主人公',
      dataUrl: spC.toDataURL('image/png'),
      initialX: 32,
      initialY: 48,
    };
    setSprites([initSprite]);
    setSelectedSpriteId(initSprite.id);

    // Starter Scripts: Arrow keys move player
    const starterScripts: ProgramEventScript[] = [
      {
        id: 'sc-start',
        eventBlock: { id: 'b-start', category: 'event', eventType: 'start' },
        actionBlocks: [
          {
            id: 'b-start-msg',
            category: 'feature',
            featureAction: 'show_dialog',
            featureText: 'ゲームスタート！矢印キーで動かそう',
          },
        ],
      },
      {
        id: 'sc-up',
        eventBlock: { id: 'b-up', category: 'event', eventType: 'key_up' },
        actionBlocks: [
          {
            id: 'b-act-up',
            category: 'action',
            actionType: 'move_step',
            spriteId: 'sp-1',
            direction: 'up',
            steps: 8,
          },
        ],
      },
      {
        id: 'sc-down',
        eventBlock: { id: 'b-down', category: 'event', eventType: 'key_down' },
        actionBlocks: [
          {
            id: 'b-act-down',
            category: 'action',
            actionType: 'move_step',
            spriteId: 'sp-1',
            direction: 'down',
            steps: 8,
          },
        ],
      },
      {
        id: 'sc-left',
        eventBlock: { id: 'b-left', category: 'event', eventType: 'key_left' },
        actionBlocks: [
          {
            id: 'b-act-left',
            category: 'action',
            actionType: 'move_step',
            spriteId: 'sp-1',
            direction: 'left',
            steps: 8,
          },
        ],
      },
      {
        id: 'sc-right',
        eventBlock: { id: 'b-right', category: 'event', eventType: 'key_right' },
        actionBlocks: [
          {
            id: 'b-act-right',
            category: 'action',
            actionType: 'move_step',
            spriteId: 'sp-1',
            direction: 'right',
            steps: 8,
          },
        ],
      },
    ];
    setScripts(starterScripts);
  }, []);

  const loadBgToCanvas = (url: string) => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, 128, 128);
      ctx.drawImage(img, 0, 0, 128, 128);
    };
    img.src = url;
  };

  const saveBgCanvas = () => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    setBackgroundDataUrl(canvas.toDataURL('image/png'));
  };

  // Background pointer drawing
  const handleBgPointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 128);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * 128);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (bgTool === 'bucket') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 128, 128);
      saveBgCanvas();
      return;
    }

    isBgDrawing.current = true;
    ctx.fillStyle = bgTool === 'eraser' ? '#ffffff' : bgColor;
    ctx.fillRect(x - 2, y - 2, 5, 5);
  };

  const handleBgPointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isBgDrawing.current) return;
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 128);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * 128);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bgTool === 'eraser' ? '#ffffff' : bgColor;
    ctx.fillRect(x - 2, y - 2, 5, 5);
  };

  const handleBgPointerUp = () => {
    if (isBgDrawing.current) {
      isBgDrawing.current = false;
      saveBgCanvas();
    }
  };

  // Total blocks counter (Max 1000)
  const totalBlocks = scripts.reduce((acc, s) => acc + 1 + s.actionBlocks.length, 0);

  // Add new sprite (Max 7)
  const handleAddSprite = () => {
    if (sprites.length >= 7) return;
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(3, 3, 10, 10);

    const newSprite: SpriteItem = {
      id: 'sp-' + Date.now(),
      name: `キャラ${sprites.length + 1}`,
      dataUrl: c.toDataURL('image/png'),
      initialX: 64,
      initialY: 64,
    };
    setSprites([...sprites, newSprite]);
    setSelectedSpriteId(newSprite.id);
  };

  const handleDeleteSprite = (id: string) => {
    if (sprites.length <= 1) return;
    setSprites(sprites.filter((s) => s.id !== id));
    if (selectedSpriteId === id) {
      setSelectedSpriteId(sprites[0].id);
    }
  };

  // Toggle Number Keys 1..9
  const handleToggleNumberKey = (num: number) => {
    if (activeNumberKeys.includes(num)) {
      setActiveNumberKeys(activeNumberKeys.filter((n) => n !== num));
    } else {
      setActiveNumberKeys([...activeNumberKeys, num].sort());
    }
  };

  // Add Variable
  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    const vName = newVarName.trim();
    if (!vName || variables[vName] !== undefined) return;
    setVariables({ ...variables, [vName]: 0 });
    setNewVarName('');
  };

  // Add Action block to a script stack
  const handleAddActionBlock = (scriptId: string, category: 'action' | 'feature' | 'variable') => {
    if (totalBlocks >= 1000) return;

    let newBlock: ProgramBlock;
    if (category === 'action') {
      newBlock = {
        id: 'blk-' + Date.now(),
        category: 'action',
        actionType: 'move_step',
        spriteId: sprites[0]?.id || '',
        direction: 'up',
        steps: 8,
      };
    } else if (category === 'feature') {
      newBlock = {
        id: 'blk-' + Date.now(),
        category: 'feature',
        featureAction: 'show_dialog',
        featureText: 'こんにちは！',
      };
    } else {
      const firstVar = Object.keys(variables)[0] || 'スコア';
      newBlock = {
        id: 'blk-' + Date.now(),
        category: 'variable',
        varName: firstVar,
        varOp: 'add',
        varValue: 1,
      };
    }

    setScripts(
      scripts.map((s) => (s.id === scriptId ? { ...s, actionBlocks: [...s.actionBlocks, newBlock] } : s))
    );
  };

  // Add new Event Script Stack
  const handleAddEventScript = (eventType: ProgramBlock['eventType'], keyNum?: number) => {
    if (totalBlocks >= 1000) return;
    const newScript: ProgramEventScript = {
      id: 'sc-' + Date.now(),
      eventBlock: {
        id: 'ev-' + Date.now(),
        category: 'event',
        eventType,
        keyNum,
      },
      actionBlocks: [],
    };
    setScripts([...scripts, newScript]);
  };

  // Remove block from script
  const handleRemoveBlock = (scriptId: string, blockId: string) => {
    setScripts(
      scripts.map((s) =>
        s.id === scriptId
          ? { ...s, actionBlocks: s.actionBlocks.filter((b) => b.id !== blockId) }
          : s
      )
    );
  };

  // Remove entire script stack
  const handleRemoveScript = (scriptId: string) => {
    setScripts(scripts.filter((s) => s.id !== scriptId));
  };

  // Publish Program
  const handlePublish = () => {
    const trimmed = title.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setPublishError('タイトルは2〜20文字で入力してください。');
      return;
    }

    const programItem: ProgramToolItem = {
      id: 'prog-' + Date.now(),
      type: 'program',
      title: trimmed,
      author: {
        name: user.name,
        iconDataUrl: user.iconDataUrl,
      },
      createdAt: new Date().toISOString(),
      views: 0,
      width: 128,
      height: 128,
      backgroundDataUrl,
      sprites,
      activeNumberKeys,
      variables,
      scripts,
    };

    const res = saveProgram(programItem);
    if (!res.success) {
      setPublishError(res.message || '保存に失敗しました。');
      return;
    }

    setIsPublishModalOpen(false);
    onPublished();
  };

  const currentProgramForTesting: ProgramToolItem = {
    id: 'test-preview',
    type: 'program',
    title: title || 'テストプレイ',
    author: { name: user.name, iconDataUrl: user.iconDataUrl },
    createdAt: new Date().toISOString(),
    views: 0,
    width: 128,
    height: 128,
    backgroundDataUrl,
    sprites,
    activeNumberKeys,
    variables,
    scripts,
  };

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
          <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-neutral-900 leading-tight">プログラム・ゲームエディタ</h2>
              <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                ※ゲームなどを作れるよ
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              128×128 px | 背景・キャラ・ボタン・ブロックプログラミング
            </p>
          </div>
        </div>

        {/* Complete button */}
        <button
          type="button"
          onClick={() => setIsPublishModalOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>完成（投稿する）</span>
        </button>
      </div>

      {/* Editor Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 p-1.5 rounded-2xl">
        <div className="flex flex-wrap gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bg')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'bg'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>① 背景 (128×128)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sprites')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'sprites'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>② キャラクター (最大7個)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('buttons')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'buttons'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>③ ボタン (上下左右・1〜9)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blocks')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'blocks'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Blocks className="w-3.5 h-3.5" />
            <span>④ プログラム (ブロック)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'test'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>テストプレイ</span>
          </button>
        </div>

        {/* Total Blocks Counter */}
        <div className="px-3 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-mono">
          <span className="text-neutral-500">ブロック数: </span>
          <span className={`font-bold ${totalBlocks > 900 ? 'text-red-600' : 'text-neutral-900'}`}>
            {totalBlocks}
          </span>
          <span className="text-neutral-400"> / 1000</span>
        </div>
      </div>

      {/* TAB 1: BACKGROUND (128x128) */}
      {activeTab === 'bg' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-6 flex flex-col items-center gap-3 bg-neutral-50 p-6 rounded-3xl border border-neutral-200">
            <div className="text-xs font-bold text-neutral-600">背景キャンバス (128×128)</div>
            <div className="border-4 border-neutral-800 rounded-xl overflow-hidden bg-white shadow-md">
              <canvas
                ref={bgCanvasRef}
                width={128}
                height={128}
                onMouseDown={handleBgPointerDown}
                onMouseMove={handleBgPointerMove}
                onMouseUp={handleBgPointerUp}
                onMouseLeave={handleBgPointerUp}
                className="cursor-crosshair bg-white"
                style={{ width: '256px', height: '256px', imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          <div className="md:col-span-6 bg-white p-5 rounded-3xl border border-neutral-200 space-y-4">
            <h3 className="font-bold text-sm text-neutral-800">背景の色塗りツール</h3>
            <p className="text-xs text-neutral-500">
              ゲームのマップや背景を128×128ピクセルで自由にペイントできます。
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBgTool('pen')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  bgTool === 'pen' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>ブラシ</span>
              </button>
              <button
                type="button"
                onClick={() => setBgTool('bucket')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  bgTool === 'bucket' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                <PaintBucket className="w-3.5 h-3.5" />
                <span>全画面塗り</span>
              </button>
              <button
                type="button"
                onClick={() => setBgTool('eraser')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  bgTool === 'eraser' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>消しゴム</span>
              </button>
            </div>

            <div className="grid grid-cols-8 gap-1.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
              {BG_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setBgColor(c);
                    if (bgTool === 'eraser') setBgTool('pen');
                  }}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-lg border ${
                    bgColor === c && bgTool !== 'eraser' ? 'ring-2 ring-neutral-900 scale-105' : 'border-neutral-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPRITES (Up to 7, 16x16, Initial placement) */}
      {activeTab === 'sprites' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Sprite List & Placement map */}
          <div className="md:col-span-6 bg-white p-5 rounded-3xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-800">キャラクター一覧</h3>
                <span className="text-xs text-neutral-500">1作品あたり最大7個まで作成可能</span>
              </div>
              <button
                type="button"
                onClick={handleAddSprite}
                disabled={sprites.length >= 7}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>追加 ({sprites.length}/7)</span>
              </button>
            </div>

            <div className="space-y-2">
              {sprites.map((sp) => (
                <div
                  key={sp.id}
                  onClick={() => setSelectedSpriteId(sp.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedSpriteId === sp.id
                      ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-neutral-300 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-xs">
                      <img
                        src={sp.dataUrl}
                        alt={sp.name}
                        className="w-8 h-8 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={sp.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSprites(sprites.map((s) => (s.id === sp.id ? { ...s, name: val } : s)));
                        }}
                        className="font-bold text-xs text-neutral-900 bg-transparent border-b border-dashed border-neutral-400 focus:outline-none focus:border-neutral-900"
                      />
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        初期座標: X:{sp.initialX}, Y:{sp.initialY}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSprite(sp);
                      }}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-semibold text-neutral-700"
                    >
                      ドット絵を描く
                    </button>
                    {sprites.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSprite(sp.id);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Placement Editor (128x128 preview where you can drag or click to place) */}
          <div className="md:col-span-6 bg-neutral-50 p-5 rounded-3xl border border-neutral-200 flex flex-col items-center gap-3">
            <h3 className="font-bold text-xs text-neutral-700">初期配置マップ (クリックして配置)</h3>
            <p className="text-[11px] text-neutral-500">
              選択中のキャラクターの初期位置（X, Y）をクリックで指定できます。
            </p>

            <div
              onClick={(e) => {
                if (!selectedSpriteId) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = Math.floor(((e.clientX - rect.left) / rect.width) * 128);
                const clickY = Math.floor(((e.clientY - rect.top) / rect.height) * 128);
                const clampedX = Math.max(0, Math.min(112, clickX - 8));
                const clampedY = Math.max(0, Math.min(112, clickY - 8));

                setSprites(
                  sprites.map((s) =>
                    s.id === selectedSpriteId ? { ...s, initialX: clampedX, initialY: clampedY } : s
                  )
                );
              }}
              className="relative border-4 border-neutral-800 rounded-xl overflow-hidden bg-white shadow-md cursor-pointer select-none"
              style={{ width: '256px', height: '256px' }}
            >
              {backgroundDataUrl && (
                <img
                  src={backgroundDataUrl}
                  alt="背景"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
              {sprites.map((sp) => (
                <div
                  key={sp.id}
                  style={{
                    position: 'absolute',
                    left: `${(sp.initialX / 128) * 100}%`,
                    top: `${(sp.initialY / 128) * 100}%`,
                    width: `${(16 / 128) * 100}%`,
                    height: `${(16 / 128) * 100}%`,
                  }}
                  className={`pointer-events-none transition-all ${
                    selectedSpriteId === sp.id ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  <img
                    src={sp.dataUrl}
                    alt={sp.name}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUTTONS (上下左右キー + 123456789追加) */}
      {activeTab === 'buttons' && (
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">コントローラー・ボタン設定</h3>
            <p className="text-xs text-neutral-500">
              ゲーム画面の下に配置するボタンを設定します。上下左右キーは標準装備で、1〜9の数字ボタンを自由に追加できます。
            </p>
          </div>

          {/* D-Pad Notice */}
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div className="font-bold text-xs text-neutral-800 mb-1">上下左右キー (D-Pad)</div>
            <p className="text-xs text-neutral-600">
              ✓ 上・下・左・右の十字キーは常に有効です（PCの矢印キーでも操作可能）。
            </p>
          </div>

          {/* Number Keys Toggle */}
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div className="font-bold text-xs text-neutral-800 mb-1">
              追加数字ボタン (1〜9ボタン)
            </div>
            <p className="text-xs text-neutral-600 mb-3">
              アクション、決定、会話、道具使用などのトリガーとして使えます。クリックしてON/OFFを切り替えます。
            </p>

            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const isActive = activeNumberKeys.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleToggleNumberKey(num)}
                    className={`w-12 h-12 rounded-xl text-base font-bold transition-all shadow-xs ${
                      isActive
                        ? 'bg-amber-500 text-white ring-2 ring-amber-600 scale-105'
                        : 'bg-white text-neutral-400 border border-neutral-300 hover:border-neutral-500'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BLOCKS (実行・動作・機能・変数) */}
      {activeTab === 'blocks' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Variables Manager Sidebar */}
          <div className="md:col-span-4 bg-white p-5 rounded-3xl border border-neutral-200 space-y-4">
            <div className="border-b border-neutral-200 pb-3">
              <h3 className="font-bold text-sm text-neutral-800">変数マネージャー</h3>
              <p className="text-[11px] text-neutral-500">
                スコアやHPなど、変化する数を管理できます。
              </p>
            </div>

            <form onSubmit={handleAddVariable} className="flex gap-1.5">
              <input
                type="text"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                placeholder="新しい変数名 (例: HP)"
                className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold"
              >
                追加
              </button>
            </form>

            <div className="space-y-1.5">
              {Object.keys(variables).map((vName) => (
                <div
                  key={vName}
                  className="flex items-center justify-between p-2 bg-neutral-50 rounded-xl text-xs font-mono"
                >
                  <span className="font-bold text-neutral-800">{vName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500 text-[11px]">初期値:</span>
                    <input
                      type="number"
                      value={variables[vName]}
                      onChange={(e) =>
                        setVariables({ ...variables, [vName]: Number(e.target.value) })
                      }
                      className="w-14 px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-center text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = { ...variables };
                        delete copy[vName];
                        setVariables(copy);
                      }}
                      className="text-neutral-400 hover:text-red-600 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Event Stacks */}
            <div className="border-t border-neutral-200 pt-3">
              <h4 className="font-bold text-xs text-neutral-700 mb-2">新しい実行ブロックを追加</h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleAddEventScript('start')}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 text-left"
                >
                  ▶ ゲームスタート
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEventScript('key_up')}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200 text-left"
                >
                  ▲ 上キー押下
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEventScript('key_down')}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200 text-left"
                >
                  ▼ 下キー押下
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEventScript('key_left')}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200 text-left"
                >
                  ◀ 左キー押下
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEventScript('key_right')}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200 text-left"
                >
                  ▶ 右キー押下
                </button>
                {activeNumberKeys.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleAddEventScript('key_num', num)}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl border border-blue-200 text-left"
                  >
                    [{num}] キー押下
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scripts Block Stacks (実行 block on top, action blocks stacked underneath) */}
          <div className="md:col-span-8 space-y-4">
            {scripts.map((script) => (
              <div
                key={script.id}
                className="bg-white rounded-3xl border-2 border-neutral-300 shadow-xs overflow-hidden"
              >
                {/* 実行 (Event) Root Block */}
                <div className="bg-emerald-600 text-white p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <span className="px-2 py-0.5 bg-black/20 rounded-md font-mono">実行</span>
                    <span>
                      {script.eventBlock.eventType === 'start' && '【ゲームがスタートされた】'}
                      {script.eventBlock.eventType === 'key_up' && '【上キーが押された】'}
                      {script.eventBlock.eventType === 'key_down' && '【下キーが押された】'}
                      {script.eventBlock.eventType === 'key_left' && '【左キーが押された】'}
                      {script.eventBlock.eventType === 'key_right' && '【右キーが押された】'}
                      {script.eventBlock.eventType === 'key_num' &&
                        `【数字キー ${script.eventBlock.keyNum} が押された】`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveScript(script.id)}
                    className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10"
                    title="この処理スタックを削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stacked Blocks */}
                <div className="p-4 space-y-3 bg-neutral-50/60">
                  {script.actionBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="p-3 bg-white rounded-2xl border border-neutral-300 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      {/* ACTION BLOCK: 動作 */}
                      {block.category === 'action' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                            動作
                          </span>
                          <select
                            value={block.spriteId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScripts(
                                scripts.map((s) =>
                                  s.id === script.id
                                    ? {
                                        ...s,
                                        actionBlocks: s.actionBlocks.map((b) =>
                                          b.id === block.id ? { ...b, spriteId: val } : b
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold text-xs"
                          >
                            {sprites.map((sp) => (
                              <option key={sp.id} value={sp.id}>
                                {sp.name}
                              </option>
                            ))}
                          </select>

                          <span>を</span>

                          <input
                            type="number"
                            value={Number(block.steps ?? 8)}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setScripts(
                                scripts.map((s) =>
                                  s.id === script.id
                                    ? {
                                        ...s,
                                        actionBlocks: s.actionBlocks.map((b) =>
                                          b.id === block.id ? { ...b, steps: val } : b
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="w-14 bg-neutral-100 border border-neutral-300 rounded px-1.5 py-1 text-center font-bold"
                          />
                          <span>マス</span>

                          <select
                            value={block.direction}
                            onChange={(e) => {
                              const val = e.target.value as 'up' | 'down' | 'left' | 'right';
                              setScripts(
                                scripts.map((s) =>
                                  s.id === script.id
                                    ? {
                                        ...s,
                                        actionBlocks: s.actionBlocks.map((b) =>
                                          b.id === block.id ? { ...b, direction: val } : b
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold"
                          >
                            <option value="up">上</option>
                            <option value="down">下</option>
                            <option value="left">左</option>
                            <option value="right">右</option>
                          </select>
                          <span>に動かす</span>
                        </div>
                      )}

                      {/* FEATURE BLOCK: 機能 (テキストダイアログ) */}
                      {block.category === 'feature' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            機能
                          </span>
                          <select
                            value={block.featureAction}
                            onChange={(e) => {
                              const val = e.target.value as 'show_dialog' | 'hide_dialog';
                              setScripts(
                                scripts.map((s) =>
                                  s.id === script.id
                                    ? {
                                        ...s,
                                        actionBlocks: s.actionBlocks.map((b) =>
                                          b.id === block.id ? { ...b, featureAction: val } : b
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold"
                          >
                            <option value="show_dialog">テキストダイアログを表示</option>
                            <option value="hide_dialog">テキストダイアログを閉じる</option>
                          </select>

                          {block.featureAction === 'show_dialog' && (
                            <input
                              type="text"
                              maxLength={20}
                              value={block.featureText || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setScripts(
                                  scripts.map((s) =>
                                    s.id === script.id
                                      ? {
                                          ...s,
                                          actionBlocks: s.actionBlocks.map((b) =>
                                            b.id === block.id ? { ...b, featureText: val } : b
                                          ),
                                        }
                                      : s
                                  )
                                );
                              }}
                              placeholder="20文字まで (例: スコア: {スコア})"
                              className="w-48 bg-neutral-100 border border-neutral-300 rounded px-2 py-1 text-xs"
                            />
                          )}
                        </div>
                      )}

                      {/* VARIABLE BLOCK: 変数 */}
                      {block.category === 'variable' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                            変数
                          </span>
                          <span>変数</span>
                          <select
                            value={block.varName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScripts(
                                scripts.map((s) =>
                                  s.id === script.id
                                    ? {
                                        ...s,
                                        actionBlocks: s.actionBlocks.map((b) =>
                                          b.id === block.id ? { ...b, varName: val } : b
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold"
                          >
                            {Object.keys(variables).map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                          <span>の値を</span>
                          <input
                            type="number"
                            value={Number(block.varValue ?? 1)}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setScripts(
                                scripts.map((s) =>
                                  s.id === script.id
                                    ? {
                                        ...s,
                                        actionBlocks: s.actionBlocks.map((b) =>
                                          b.id === block.id ? { ...b, varValue: val } : b
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="w-16 bg-neutral-100 border border-neutral-300 rounded px-1.5 py-1 text-center font-bold"
                          />
                          <span>に</span>
                          <select
                            value={block.varOp}
                            onChange={(e) => {
                              const val = e.target.value as 'set' | 'add' | 'sub';
                              setScripts(
                                scripts.map((s) =>
                                  s.id === script.id
                                    ? {
                                        ...s,
                                        actionBlocks: s.actionBlocks.map((b) =>
                                          b.id === block.id ? { ...b, varOp: val } : b
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold"
                          >
                            <option value="add">足す (+)</option>
                            <option value="sub">減らす (-)</option>
                            <option value="set">する (=)</option>
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(script.id, block.id)}
                        className="text-neutral-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add action block dropdown */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200">
                    <span className="text-[11px] font-bold text-neutral-400">+ ブロックを追加:</span>
                    <button
                      type="button"
                      onClick={() => handleAddActionBlock(script.id, 'action')}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-200"
                    >
                      動作ブロック
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddActionBlock(script.id, 'feature')}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200"
                    >
                      機能ブロック (ダイアログ)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddActionBlock(script.id, 'variable')}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold border border-purple-200"
                    >
                      変数ブロック
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TEST PLAY */}
      {activeTab === 'test' && (
        <div className="flex flex-col items-center bg-white p-6 rounded-3xl border border-neutral-200 max-w-md mx-auto">
          <GameRuntime program={currentProgramForTesting} />
        </div>
      )}

      {/* SPRITE EDIT MODAL (16x16) */}
      {editingSprite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 text-neutral-900">
            <h3 className="font-bold text-sm text-neutral-900 mb-1">
              キャラクターのドット絵を描く (16×16)
            </h3>
            <p className="text-xs text-neutral-500 mb-4">{editingSprite.name} のグラフィック</p>

            <SpriteCanvas
              initialImage={editingSprite.dataUrl}
              onSave={(url) => {
                setSprites(
                  sprites.map((s) => (s.id === editingSprite.id ? { ...s, dataUrl: url } : s))
                );
              }}
            />

            <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setEditingSprite(null)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold"
              >
                決定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-neutral-200 text-neutral-900">
            <h3 className="text-xl font-black text-neutral-900 mb-1">プログラムを投稿</h3>
            <p className="text-xs text-neutral-500 mb-4">
              名前を決めて投稿しましょう（1ユーザー3作品まで）
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="prog-title" className="text-xs font-bold text-neutral-700">
                    プログラムの名前 (2〜20文字)
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
                  id="prog-title"
                  type="text"
                  autoFocus
                  maxLength={20}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (publishError) setPublishError('');
                  }}
                  placeholder="例：スライム大冒険"
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
                  <span>ブロック数:</span>
                  <span className="font-bold">{totalBlocks} 個</span>
                </div>
                <div className="flex justify-between">
                  <span>キャラクター数:</span>
                  <span className="font-bold">{sprites.length} 体</span>
                </div>
                <div className="flex justify-between">
                  <span>作者:</span>
                  <span className="font-bold">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>上限制限:</span>
                  <span className="text-neutral-500">1ユーザー最大3作品まで</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="w-1/3 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold"
                >
                  戻る
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
