export type PaperTheme = 'modern' | 'retro' | 'gogai' | 'craft';

export type WritingDirection = 'vertical' | 'horizontal';

export interface WeatherInfo {
  weather: 'sunny' | 'cloudy' | 'rain' | 'snow';
  maxTemp: number;
  minTemp: number;
  phrase: string;
}

export interface NewspaperArticle {
  id: string;
  category: string; // e.g. 「社会」「一面」「カルチャー」「スクープ」
  headline: string; // 主見出し
  subHeadline?: string; // 袖見出し・サブ
  author?: string; // 記者名
  content: string; // 本文
  imageUrl?: string;
  imageCaption?: string;
  direction?: WritingDirection;
  columns?: number;
}

export interface ColumnCorner {
  title: string; // e.g. 「編集余白」「街角だより」「天声人語風」
  content: string;
  author: string;
}

export interface FourKomaFrame {
  caption: string;
  text: string;
}

export interface NewspaperData {
  paperTitle: string; // 題字 (例:「日刊しんぶん」「学級新聞」)
  issueNumber: string; // 第〇号
  edition: string; // 朝刊 / 夕刊 / 号外 / 特別版
  publishDate: string; // 2026年10月2日（金）
  price: string; // 1部 150円 (税込)
  publisher: string; // 〇〇新聞社
  slogan: string; // 題字横スローガン (例:「真実を伝え、明日を創る」)
  weather: WeatherInfo;
  
  // Articles
  leadArticle: NewspaperArticle;
  subArticle1: NewspaperArticle;
  subArticle2: NewspaperArticle;
  
  // Columns & Fun corners
  columnCorner: ColumnCorner;
  fourKomaTitle: string;
  fourKomaFrames: FourKomaFrame[];
  horoscope: {
    sign: string;
    luck: string;
    advice: string;
  }[];
  
  // Advertisement banner
  adText: {
    sponsor: string;
    catchphrase: string;
    subtext: string;
  };
  
  theme: PaperTheme;
  isGogai: boolean; // 号外モード
  fontStyle: 'mincho' | 'gothic';
}
