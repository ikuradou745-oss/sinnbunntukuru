import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../types/user';
import { ProgramToolItem, SpriteItem, ProgramEventScript, ProgramBlock } from '../../types/tools';
import { saveOnlineProgram } from '../../services/toolStorage';
import { SpriteCanvas } from './SpriteCanvas';
import { GameRuntime } from './GameRuntime';
import { ValueInput } from './ValueInput';
import {
  Code2,
  ArrowLeft,
  CheckCircle,
  Plus,
  Trash2,
  Play,
  Gamepad2,
  Blocks,
  Image as ImageIcon,
  User,
  Paintbrush,
  Eraser,
  PaintBucket,
  Search,
  Repeat,
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

// Generate default variables: スコアのみ (変数は15個まで追加可能)
const createDefaultVariables = (): Record<string, number> => {
  return { 'スコア': 0 };
};

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
  
  // Variables (初期は「スコア」のみ、最大15個まで追加可能)
  const [variables, setVariables] = useState<Record<string, number>>(createDefaultVariables());
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
    // Default background
    const bgC = document.createElement('canvas');
    bgC.width = 128;
    bgC.height = 128;
    const ctx = bgC.getContext('2d')!;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 128, 128);

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

    // Initial Starter Sprite 1: 主人公
    const spC = document.createElement('canvas');
    spC.width = 16;
    spC.height = 16;
    const spCtx = spC.getContext('2d')!;
    spCtx.fillStyle = '#2563eb';
    spCtx.fillRect(2, 2, 12, 12);
    spCtx.fillStyle = '#ffffff';
    spCtx.fillRect(4, 5, 3, 3);
    spCtx.fillRect(9, 5, 3, 3);

    // Initial Starter Sprite 2: 宝箱 (Chest)
    const spC2 = document.createElement('canvas');
    spC2.width = 16;
    spC2.height = 16;
    const spCtx2 = spC2.getContext('2d')!;
    spCtx2.fillStyle = '#b45309';
    spCtx2.fillRect(2, 4, 12, 9);
    spCtx2.fillStyle = '#f59e0b';
    spCtx2.fillRect(7, 7, 2, 3);

    const initSprite1: SpriteItem = {
      id: 'sp-player',
      name: '主人公',
      dataUrl: spC.toDataURL('image/png'),
      initialX: 32,
      initialY: 48,
    };

    const initSprite2: SpriteItem = {
      id: 'sp-chest',
      name: '宝箱',
      dataUrl: spC2.toDataURL('image/png'),
      initialX: 80,
      initialY: 48,
    };

    setSprites([initSprite1, initSprite2]);
    setSelectedSpriteId(initSprite1.id);

    // Starter Scripts with 検査 (Collision check)
    const starterScripts: ProgramEventScript[] = [
      {
        id: 'sc-start',
        eventBlock: { id: 'b-start', category: 'event', eventType: 'start' },
        actionBlocks: [
          {
            id: 'b-start-msg',
            category: 'feature',
            featureAction: 'show_dialog',
            featureText: 'ゲームスタート！宝箱に触れてみよう',
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
            spriteId: 'sp-player',
            direction: 'up',
            steps: 8,
          },
          {
            id: 'b-check-touch',
            category: 'check',
            checkSpriteA: 'sp-player',
            checkSpriteB: 'sp-chest',
            childBlocks: [
              {
                id: 'b-touch-msg',
                category: 'feature',
                featureAction: 'show_dialog',
                featureText: '宝箱に触れた！1キーで開けよう',
              },
            ],
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
            spriteId: 'sp-player',
            direction: 'down',
            steps: 8,
          },
          {
            id: 'b-check-touch-d',
            category: 'check',
            checkSpriteA: 'sp-player',
            checkSpriteB: 'sp-chest',
            childBlocks: [
              {
                id: 'b-touch-msg-d',
                category: 'feature',
                featureAction: 'show_dialog',
                featureText: '宝箱に触れた！1キーで開けよう',
              },
            ],
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
            spriteId: 'sp-player',
            direction: 'left',
            steps: 8,
          },
          {
            id: 'b-check-touch-l',
            category: 'check',
            checkSpriteA: 'sp-player',
            checkSpriteB: 'sp-chest',
            childBlocks: [
              {
                id: 'b-touch-msg-l',
                category: 'feature',
                featureAction: 'show_dialog',
                featureText: '宝箱に触れた！1キーで開けよう',
              },
            ],
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
            spriteId: 'sp-player',
            direction: 'right',
            steps: 8,
          },
          {
            id: 'b-check-touch-r',
            category: 'check',
            checkSpriteA: 'sp-player',
            checkSpriteB: 'sp-chest',
            childBlocks: [
              {
                id: 'b-touch-msg-r',
                category: 'feature',
                featureAction: 'show_dialog',
                featureText: '宝箱に触れた！1キーで開けよう',
              },
            ],
          },
        ],
      },
      {
        id: 'sc-key1',
        eventBlock: { id: 'b-k1', category: 'event', eventType: 'key_num', keyNum: 1 },
        actionBlocks: [
          {
            id: 'b-check-k1',
            category: 'check',
            checkSpriteA: 'sp-player',
            checkSpriteB: 'sp-chest',
            childBlocks: [
              {
                id: 'b-add-score',
                category: 'variable',
                varName: 'スコア',
                varOp: 'add',
                varValue: 10,
              },
              {
                id: 'b-show-score',
                category: 'feature',
                featureAction: 'show_dialog',
                featureText: '宝箱を開けた！スコア: {スコア}',
              },
            ],
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
  const countBlocks = (blocks: ProgramBlock[]): number => {
    return blocks.reduce((acc, b) => {
      let count = 1;
      if (b.childBlocks && b.childBlocks.length > 0) {
        count += countBlocks(b.childBlocks);
      }
      return acc + count;
    }, 0);
  };

  const totalBlocks = scripts.reduce((acc, s) => acc + 1 + countBlocks(s.actionBlocks), 0);

  // Variable list
  const varNames = Object.keys(variables);

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

  // Add Custom Variable (Max 15)
  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    const vName = newVarName.trim();
    if (!vName || variables[vName] !== undefined) return;
    if (Object.keys(variables).length >= 15) return;
    setVariables({ ...variables, [vName]: 0 });
    setNewVarName('');
  };

  // Create a block instance
  const createNewBlock = (category: ProgramBlock['category']): ProgramBlock => {
    const defaultSprite = sprites[0]?.id || '';
    const secondSprite = sprites[1]?.id || sprites[0]?.id || '';
    const defaultVar = varNames[0] || 'スコア';

    if (category === 'action') {
      return {
        id: 'blk-' + Date.now() + '-' + Math.random(),
        category: 'action',
        actionType: 'move_step',
        spriteId: defaultSprite,
        direction: 'up',
        steps: 8,
        waitSeconds: 1,
      };
    } else if (category === 'feature') {
      return {
        id: 'blk-' + Date.now() + '-' + Math.random(),
        category: 'feature',
        featureAction: 'show_dialog',
        featureText: 'こんにちは！',
      };
    } else if (category === 'variable') {
      return {
        id: 'blk-' + Date.now() + '-' + Math.random(),
        category: 'variable',
        varName: defaultVar,
        varOp: 'add',
        varValue: 1,
      };
    } else if (category === 'check') {
      return {
        id: 'blk-' + Date.now() + '-' + Math.random(),
        category: 'check',
        checkSpriteA: defaultSprite,
        checkSpriteB: secondSprite,
        childBlocks: [],
      };
    } else {
      // Loop
      return {
        id: 'blk-' + Date.now() + '-' + Math.random(),
        category: 'loop',
        repeatType: 'count',
        repeatCount: 5,
        childBlocks: [],
      };
    }
  };

  // Add Action block to top-level script stack
  const handleAddActionBlock = (scriptId: string, category: ProgramBlock['category']) => {
    if (totalBlocks >= 1000) return;
    const newBlock = createNewBlock(category);
    setScripts(
      scripts.map((s) => (s.id === scriptId ? { ...s, actionBlocks: [...s.actionBlocks, newBlock] } : s))
    );
  };

  // Add nested block inside Check or Loop block
  const handleAddChildBlock = (parentBlock: ProgramBlock, category: ProgramBlock['category']) => {
    if (totalBlocks >= 1000) return;
    const child = createNewBlock(category);

    const updateBlockTree = (blocks: ProgramBlock[]): ProgramBlock[] => {
      return blocks.map((b) => {
        if (b.id === parentBlock.id) {
          return { ...b, childBlocks: [...(b.childBlocks || []), child] };
        }
        if (b.childBlocks && b.childBlocks.length > 0) {
          return { ...b, childBlocks: updateBlockTree(b.childBlocks) };
        }
        return b;
      });
    };

    setScripts(
      scripts.map((s) => ({
        ...s,
        actionBlocks: updateBlockTree(s.actionBlocks),
      }))
    );
  };

  // Remove block anywhere in tree
  const handleRemoveBlockFromTree = (blockId: string) => {
    const removeRecursive = (blocks: ProgramBlock[]): ProgramBlock[] => {
      return blocks
        .filter((b) => b.id !== blockId)
        .map((b) => ({
          ...b,
          childBlocks: b.childBlocks ? removeRecursive(b.childBlocks) : [],
        }));
    };

    setScripts(
      scripts.map((s) => ({
        ...s,
        actionBlocks: removeRecursive(s.actionBlocks),
      }))
    );
  };

  // Update a single block's field in tree
  const handleUpdateBlockInTree = (blockId: string, updater: (b: ProgramBlock) => ProgramBlock) => {
    const updateRecursive = (blocks: ProgramBlock[]): ProgramBlock[] => {
      return blocks.map((b) => {
        if (b.id === blockId) {
          return updater(b);
        }
        if (b.childBlocks && b.childBlocks.length > 0) {
          return { ...b, childBlocks: updateRecursive(b.childBlocks) };
        }
        return b;
      });
    };

    setScripts(
      scripts.map((s) => ({
        ...s,
        actionBlocks: updateRecursive(s.actionBlocks),
      }))
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

  // Remove entire script stack
  const handleRemoveScript = (scriptId: string) => {
    setScripts(scripts.filter((s) => s.id !== scriptId));
  };

  // Publish Program Online
  const handlePublish = async () => {
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

    const res = await saveOnlineProgram(programItem);
    if (!res.success) {
      setPublishError(res.message || '保存に失敗しました。');
      return;
    }

    setIsPublishModalOpen(false);
    onPublished();
  };

  // Render individual block (with nested blocks support for 検査 and 繰り返し)
  const renderBlockItem = (block: ProgramBlock, depth = 0) => {
    return (
      <div
        key={block.id}
        className={`rounded-2xl border shadow-2xs transition-all ${
          block.category === 'check'
            ? 'bg-purple-50/70 border-purple-300'
            : block.category === 'loop'
            ? 'bg-amber-50/70 border-amber-300'
            : 'bg-white border-neutral-300'
        } p-3 text-xs`}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* 1. ACTION (動作: 動かす / 座標指定 / 〇秒待つ) */}
          {block.category === 'action' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                動作
              </span>
              <select
                value={block.actionType || 'move_step'}
                onChange={(e) => {
                  const val = e.target.value as 'move_step' | 'set_pos' | 'wait_seconds';
                  handleUpdateBlockInTree(block.id, (b) => ({ ...b, actionType: val }));
                }}
                className="bg-neutral-100 border border-neutral-300 rounded px-1.5 py-1 font-bold text-xs"
              >
                <option value="move_step">動かす</option>
                <option value="set_pos">座標指定</option>
                <option value="wait_seconds">〇秒待つ ⏱️</option>
              </select>

              {block.actionType === 'wait_seconds' ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <ValueInput
                    value={block.waitSeconds}
                    onChange={(val) => handleUpdateBlockInTree(block.id, (b) => ({ ...b, waitSeconds: val }))}
                    availableVariables={varNames}
                    defaultValue={1}
                  />
                  <span>秒待つ</span>
                </div>
              ) : (
                <>
                  <select
                    value={block.spriteId}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateBlockInTree(block.id, (b) => ({ ...b, spriteId: val }));
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

                  {block.actionType === 'move_step' ? (
                    <>
                      <ValueInput
                        value={block.steps}
                        onChange={(val) => handleUpdateBlockInTree(block.id, (b) => ({ ...b, steps: val }))}
                        availableVariables={varNames}
                        defaultValue={8}
                      />
                      <span>マス</span>
                      <select
                        value={block.direction}
                        onChange={(e) => {
                          const val = e.target.value as 'up' | 'down' | 'left' | 'right';
                          handleUpdateBlockInTree(block.id, (b) => ({ ...b, direction: val }));
                        }}
                        className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold"
                      >
                        <option value="up">上</option>
                        <option value="down">下</option>
                        <option value="left">左</option>
                        <option value="right">右</option>
                      </select>
                      <span>に動かす</span>
                    </>
                  ) : (
                    <>
                      <span>左から</span>
                      <ValueInput
                        value={block.posX}
                        onChange={(val) => handleUpdateBlockInTree(block.id, (b) => ({ ...b, posX: val }))}
                        availableVariables={varNames}
                        defaultValue={32}
                      />
                      <span>マス、上から</span>
                      <ValueInput
                        value={block.posY}
                        onChange={(val) => handleUpdateBlockInTree(block.id, (b) => ({ ...b, posY: val }))}
                        availableVariables={varNames}
                        defaultValue={48}
                      />
                      <span>マスにする</span>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* 2. FEATURE (機能: ダイアログ / ゲームクリア / ゲームオーバー) */}
          {block.category === 'feature' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                機能
              </span>
              <select
                value={block.featureAction || 'show_dialog'}
                onChange={(e) => {
                  const val = e.target.value as 'show_dialog' | 'hide_dialog' | 'game_clear' | 'game_over';
                  handleUpdateBlockInTree(block.id, (b) => ({ ...b, featureAction: val }));
                }}
                className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold text-xs"
              >
                <option value="show_dialog">テキストダイアログを表示</option>
                <option value="hide_dialog">テキストダイアログを閉じる</option>
                <option value="game_clear">🎉 ゲームクリアにする</option>
                <option value="game_over">💀 ゲームオーバーにする</option>
              </select>

              {(block.featureAction === 'show_dialog' ||
                block.featureAction === 'game_clear' ||
                block.featureAction === 'game_over') && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={20}
                    value={block.featureText || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateBlockInTree(block.id, (b) => ({ ...b, featureText: val }));
                    }}
                    placeholder={
                      block.featureAction === 'game_clear'
                        ? 'クリアメッセージ (例: 制覇！)'
                        : block.featureAction === 'game_over'
                        ? 'オーバー時メッセージ (例: やられた…)'
                        : 'ダイアログ (例: スコア: {スコア})'
                    }
                    className="w-52 bg-neutral-100 border border-neutral-300 rounded px-2 py-1 text-xs"
                  />
                  <select
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const text = (block.featureText || '') + `{${e.target.value}}`;
                      handleUpdateBlockInTree(block.id, (b) => ({ ...b, featureText: text }));
                    }}
                    value=""
                    className="bg-neutral-100 border border-neutral-300 rounded px-1.5 py-1 text-[11px] text-neutral-600"
                  >
                    <option value="">+ 変数を挿入</option>
                    {varNames.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 3. VARIABLE (変数) */}
          {block.category === 'variable' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded font-bold text-[10px]">
                変数
              </span>
              <span>変数</span>
              <select
                value={block.varName}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateBlockInTree(block.id, (b) => ({ ...b, varName: val }));
                }}
                className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold"
              >
                {varNames.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <span>の値を</span>
              <ValueInput
                value={block.varValue}
                onChange={(val) => handleUpdateBlockInTree(block.id, (b) => ({ ...b, varValue: val }))}
                availableVariables={varNames}
                defaultValue={1}
              />
              <span>に</span>
              <select
                value={block.varOp}
                onChange={(e) => {
                  const val = e.target.value as 'set' | 'add' | 'sub';
                  handleUpdateBlockInTree(block.id, (b) => ({ ...b, varOp: val }));
                }}
                className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1 font-bold"
              >
                <option value="add">足す (+)</option>
                <option value="sub">減らす (-)</option>
                <option value="set">する (=)</option>
              </select>
            </div>
          )}

          {/* 4. CHECK (検査: 〇〇が〇〇に触れていたら) */}
          {block.category === 'check' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-600 text-white rounded font-bold text-[10px]">
                検査 (条件)
              </span>
              <span className="font-bold text-purple-900">もし</span>
              <select
                value={block.checkSpriteA}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateBlockInTree(block.id, (b) => ({ ...b, checkSpriteA: val }));
                }}
                className="bg-white border border-purple-300 rounded px-2 py-1 font-bold text-xs"
              >
                {sprites.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
              <span className="font-bold text-purple-900">が</span>
              <select
                value={block.checkSpriteB}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateBlockInTree(block.id, (b) => ({ ...b, checkSpriteB: val }));
                }}
                className="bg-white border border-purple-300 rounded px-2 py-1 font-bold text-xs"
              >
                {sprites.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
              <span className="font-bold text-purple-900">に触れていたら：</span>
            </div>
          )}

          {/* 5. LOOP (繰り返し: 〇〇回またはずっと) */}
          {block.category === 'loop' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-600 text-white rounded font-bold text-[10px]">
                繰り返し
              </span>
              <select
                value={block.repeatType}
                onChange={(e) => {
                  const val = e.target.value as 'count' | 'forever';
                  handleUpdateBlockInTree(block.id, (b) => ({ ...b, repeatType: val }));
                }}
                className="bg-white border border-amber-300 rounded px-2 py-1 font-bold text-xs"
              >
                <option value="count">回数指定</option>
                <option value="forever">ずっと</option>
              </select>

              {block.repeatType === 'count' ? (
                <>
                  <ValueInput
                    value={block.repeatCount}
                    onChange={(val) => handleUpdateBlockInTree(block.id, (b) => ({ ...b, repeatCount: val }))}
                    availableVariables={varNames}
                    defaultValue={5}
                  />
                  <span className="font-bold text-amber-900">回繰り返し：</span>
                </>
              ) : (
                <span className="font-bold text-amber-900">ずっと繰り返し：</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleRemoveBlockFromTree(block.id)}
            className="text-neutral-400 hover:text-red-600 p-1"
            title="削除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* NESTED CHILD BLOCKS (for 検査 & 繰り返し) */}
        {(block.category === 'check' || block.category === 'loop') && (
          <div className="mt-2.5 pt-2.5 border-t border-purple-200/60 pl-3 border-l-2 border-l-purple-400 space-y-2">
            {block.childBlocks && block.childBlocks.length > 0 ? (
              block.childBlocks.map((child) => renderBlockItem(child, depth + 1))
            ) : (
              <div className="text-[11px] text-neutral-400 italic">
                （この中に実行するブロックを入れてください）
              </div>
            )}

            {/* Add inside child block buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-neutral-500">+ 中にブロックを追加:</span>
              <button
                type="button"
                onClick={() => handleAddChildBlock(block, 'action')}
                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded text-[11px] font-bold border border-blue-200"
              >
                動作
              </button>
              <button
                type="button"
                onClick={() => handleAddChildBlock(block, 'feature')}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-bold border border-amber-200"
              >
                機能
              </button>
              <button
                type="button"
                onClick={() => handleAddChildBlock(block, 'variable')}
                className="px-2 py-0.5 bg-pink-50 hover:bg-pink-100 text-pink-800 rounded text-[11px] font-bold border border-pink-200"
              >
                変数
              </button>
              <button
                type="button"
                onClick={() => handleAddChildBlock(block, 'check')}
                className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded text-[11px] font-bold border border-purple-200"
              >
                検査
              </button>
              <button
                type="button"
                onClick={() => handleAddChildBlock(block, 'loop')}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-bold border border-amber-200"
              >
                繰り返し
              </button>
            </div>
          </div>
        )}
      </div>
    );
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
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                ● リアルタイムオンライン
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              128×128 px | ゲームクリア/ゲームオーバー、衝突判定、繰り返しブロック対応
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
          <span>完成（オンライン投稿）</span>
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

          {/* Map Placement Editor */}
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

      {/* TAB 3: BUTTONS */}
      {activeTab === 'buttons' && (
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">コントローラー・ボタン設定</h3>
            <p className="text-xs text-neutral-500">
              ゲーム画面の下に配置するボタンを設定します。上下左右キーは標準装備で、1〜9の数字ボタンを自由に追加できます。
            </p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div className="font-bold text-xs text-neutral-800 mb-1">上下左右キー (D-Pad)</div>
            <p className="text-xs text-neutral-600">
              ✓ 上・下・左・右の十字キーは常に有効です（PCの矢印キーでも操作可能）。
            </p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div className="font-bold text-xs text-neutral-800 mb-1">
              追加数字ボタン (1〜9ボタン)
            </div>
            <p className="text-xs text-neutral-600 mb-3">
              クリックしてON/OFFを切り替えます。
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

      {/* TAB 4: BLOCKS (実行・動作・機能・変数・検査・繰り返し) */}
      {activeTab === 'blocks' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Variables Manager Sidebar (初期はスコアのみ、最大15個まで) */}
          <div className="md:col-span-4 bg-white p-5 rounded-3xl border border-neutral-200 space-y-4">
            <div className="border-b border-neutral-200 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-neutral-800">変数マネージャー</h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  {varNames.length} / 15 個
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                初期は「スコア」のみで、最大15個まで自由に変数を追加できます。
              </p>
            </div>

            <form onSubmit={handleAddVariable} className="flex gap-1.5">
              <input
                type="text"
                value={newVarName}
                disabled={varNames.length >= 15}
                onChange={(e) => setNewVarName(e.target.value)}
                placeholder={varNames.length >= 15 ? '最大15個に達しました' : 'カスタム変数追加 (例: コイン)'}
                className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={varNames.length >= 15 || !newVarName.trim()}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
              >
                追加
              </button>
            </form>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {varNames.map((vName) => (
                <div
                  key={vName}
                  className="flex items-center justify-between p-1.5 bg-neutral-50 rounded-lg text-xs font-mono"
                >
                  <span className="font-bold text-neutral-800">{vName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500 text-[10px]">初期:</span>
                    <input
                      type="number"
                      value={variables[vName]}
                      onChange={(e) =>
                        setVariables({ ...variables, [vName]: Number(e.target.value) })
                      }
                      className="w-12 px-1 py-0.5 bg-white border border-neutral-300 rounded text-center text-xs"
                    />
                    {varNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const copy = { ...variables };
                          delete copy[vName];
                          setVariables(copy);
                        }}
                        className="text-neutral-400 hover:text-red-600 p-0.5"
                        title="変数を削除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
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
                  onClick={() => handleAddEventScript('forever')}
                  className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl border border-teal-200 text-left"
                >
                  🔄 ずっと実行する
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
                      {script.eventBlock.eventType === 'forever' && '【ずっと実行する (常時ループ)】'}
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
                  {script.actionBlocks.map((block) => renderBlockItem(block, 0))}

                  {/* Add action block buttons */}
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
                      機能ブロック
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddActionBlock(script.id, 'variable')}
                      className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-800 rounded-lg text-xs font-bold border border-pink-200"
                    >
                      変数ブロック
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddActionBlock(script.id, 'check')}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold border border-purple-200 flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      <span>検査ブロック</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddActionBlock(script.id, 'loop')}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 flex items-center gap-1"
                    >
                      <Repeat className="w-3 h-3" />
                      <span>繰り返しブロック</span>
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
            <h3 className="text-xl font-black text-neutral-900 mb-1">プログラムをオンライン投稿</h3>
            <p className="text-xs text-neutral-500 mb-4">
              名前を決めて投稿しましょう（リアルタイムで全ユーザーの「ツールを見る」に掲載されます）
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
                  オンライン投稿する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
