export interface AuthorInfo {
  name: string;
  iconDataUrl: string;
}

// ------------------- VIDEO (動画) -------------------
export interface VideoToolItem {
  id: string;
  type: 'video';
  title: string; // 2 ~ 20 characters
  author: AuthorInfo;
  createdAt: string;
  views: number;
  width: 128;
  height: 64;
  totalFrames: number; // 10 ~ 150 frames (0.1s each = 1.0s ~ 15.0s)
  frameRate: 10; // 0.1s per frame
  frames: string[]; // array of base64 PNGs or pixel data strings
}

// ------------------- PROGRAM (プログラム) -------------------
export interface SpriteItem {
  id: string;
  name: string;
  dataUrl: string; // 16x16 PNG data url
  initialX: number; // 0 ~ 112
  initialY: number; // 0 ~ 112
}

export type BlockCategory = 'event' | 'action' | 'feature' | 'variable' | 'check' | 'loop';

export type EventType =
  | 'start' // ゲームがスタートされた
  | 'key_up' // 上キーが押された
  | 'key_down' // 下キーが押された
  | 'key_left' // 左キーが押された
  | 'key_right' // 右キーが押された
  | 'key_num'; // 数字キー(1~9)が押された

export interface ProgramBlock {
  id: string;
  category: BlockCategory;

  // Event (実行)
  eventType?: EventType;
  keyNum?: number; // 1 ~ 9
  
  // Action (動作: 動かす / 座標設定)
  actionType?: 'move_step' | 'set_pos';
  spriteId?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  steps?: number | string; // literal number OR variable name (e.g. "スコア1")
  posX?: number | string;  // literal number OR variable name
  posY?: number | string;  // literal number OR variable name

  // Feature (機能: ダイアログ表示 / 閉じる / ゲームクリア / ゲームオーバー)
  featureText?: string; // 20文字まで (ダイアログまたはクリア/ゲームオーバー時メッセージ)
  featureAction?: 'show_dialog' | 'hide_dialog' | 'game_clear' | 'game_over';

  // Variable (変数操作)
  varName?: string;
  varOp?: 'set' | 'add' | 'sub';
  varValue?: number | string; // literal number OR variable name

  // Check / Condition (検査: 〇〇が〇〇に触れていたら)
  checkSpriteA?: string;
  checkSpriteB?: string;

  // Loop (繰り返し: 〇〇回またはずっと)
  repeatType?: 'count' | 'forever';
  repeatCount?: number | string; // literal number OR variable name

  // Nested blocks inside Check or Loop
  childBlocks?: ProgramBlock[];
}

export interface ProgramEventScript {
  id: string;
  eventBlock: ProgramBlock;
  actionBlocks: ProgramBlock[];
}

export interface ProgramToolItem {
  id: string;
  type: 'program';
  title: string; // 2 ~ 20 characters
  author: AuthorInfo;
  createdAt: string;
  views: number;
  width: 128;
  height: 128;
  backgroundDataUrl: string; // 128x128
  sprites: SpriteItem[]; // Max 7
  activeNumberKeys: number[]; // e.g. [1, 2, 3] from 1..9
  variables: Record<string, number>; // initial variables (including スコア1〜10)
  scripts: ProgramEventScript[]; // Event + Stacked blocks (max 1000 blocks)
}
