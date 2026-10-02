import React, { useState } from 'react';
import { NewspaperData, WeatherInfo } from '../types';
import { X, Type, FileText, Image as ImageIcon, MessageSquare, Megaphone, CloudSun } from 'lucide-react';

interface EditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: NewspaperData;
  onUpdate: (updater: (prev: NewspaperData) => NewspaperData) => void;
}

export const EditorDrawer: React.FC<EditorDrawerProps> = ({
  isOpen,
  onClose,
  data,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'meta' | 'lead' | 'subs' | 'column' | 'ad'>('lead');

  if (!isOpen) return null;

  return (
    <aside className="no-print fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-neutral-900/95 backdrop-blur-md text-neutral-100 shadow-2xl border-l border-neutral-700 flex flex-col">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-base text-neutral-100">記事・紙面編集パネル</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-neutral-800 bg-neutral-900 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('lead')}
          className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'lead'
              ? 'border-amber-500 text-amber-400 bg-neutral-800/50'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>トップ記事</span>
        </button>
        <button
          onClick={() => setActiveTab('subs')}
          className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'subs'
              ? 'border-amber-500 text-amber-400 bg-neutral-800/50'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>サブ記事</span>
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'meta'
              ? 'border-amber-500 text-amber-400 bg-neutral-800/50'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5" />
          <span>題字・日付・天気</span>
        </button>
        <button
          onClick={() => setActiveTab('column')}
          className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'column'
              ? 'border-amber-500 text-amber-400 bg-neutral-800/50'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>コラム・4コマ</span>
        </button>
        <button
          onClick={() => setActiveTab('ad')}
          className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ad'
              ? 'border-amber-500 text-amber-400 bg-neutral-800/50'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>広告欄</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        
        {/* LEAD ARTICLE TAB */}
        {activeTab === 'lead' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-neutral-300 font-bold mb-1">主見出し (大見出し)</label>
              <textarea
                value={data.leadArticle.headline}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    leadArticle: { ...prev.leadArticle, headline: e.target.value },
                  }))
                }
                rows={2}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 text-sm font-bold focus:outline-none focus:border-amber-500"
                placeholder="トップ記事の主見出しを入力"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-bold mb-1">袖見出し / サブ見出し</label>
              <input
                type="text"
                value={data.leadArticle.subHeadline || ''}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    leadArticle: { ...prev.leadArticle, subHeadline: e.target.value },
                  }))
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                placeholder="袖見出し（例：地元の秋刀魚や新米を求め大盛況）"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">カテゴリー</label>
                <input
                  type="text"
                  value={data.leadArticle.category}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      leadArticle: { ...prev.leadArticle, category: e.target.value },
                    }))
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-bold mb-1">記者名</label>
                <input
                  type="text"
                  value={data.leadArticle.author || ''}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      leadArticle: { ...prev.leadArticle, author: e.target.value },
                    }))
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  placeholder="例：特派員 櫻井"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-bold mb-1">記事本文</label>
              <textarea
                value={data.leadArticle.content}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    leadArticle: { ...prev.leadArticle, content: e.target.value },
                  }))
                }
                rows={7}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-serif leading-relaxed focus:outline-none focus:border-amber-500"
                placeholder="記事の本文を入力してください"
              />
            </div>

            <div className="border-t border-neutral-800 pt-3">
              <label className="block text-neutral-300 font-bold mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>写真画像URL または 写真削除</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={data.leadArticle.imageUrl || ''}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      leadArticle: { ...prev.leadArticle, imageUrl: e.target.value },
                    }))
                  }
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  placeholder="https://... または紙面のボタンからファイル選択"
                />
                {data.leadArticle.imageUrl && (
                  <button
                    onClick={() =>
                      onUpdate((prev) => ({
                        ...prev,
                        leadArticle: { ...prev.leadArticle, imageUrl: undefined },
                      }))
                    }
                    className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-200"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-bold mb-1">写真キャプション</label>
              <input
                type="text"
                value={data.leadArticle.imageCaption || ''}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    leadArticle: { ...prev.leadArticle, imageCaption: e.target.value },
                  }))
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                placeholder="▲ 〇〇の様子"
              />
            </div>
          </div>
        )}

        {/* SUB ARTICLES TAB */}
        {activeTab === 'subs' && (
          <div className="space-y-6">
            {/* Sub Article 1 */}
            <div className="border border-neutral-800 p-3 rounded-lg bg-neutral-950/40 space-y-2.5">
              <h3 className="font-bold text-amber-400 text-sm border-b border-neutral-800 pb-1">
                準トップ記事 ① (左下)
              </h3>
              <div>
                <label className="block text-neutral-400 mb-0.5">見出し</label>
                <input
                  type="text"
                  value={data.subArticle1.headline}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      subArticle1: { ...prev.subArticle1, headline: e.target.value },
                    }))
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-0.5">サブ見出し</label>
                <input
                  type="text"
                  value={data.subArticle1.subHeadline || ''}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      subArticle1: { ...prev.subArticle1, subHeadline: e.target.value },
                    }))
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-0.5">本文</label>
                <textarea
                  value={data.subArticle1.content}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      subArticle1: { ...prev.subArticle1, content: e.target.value },
                    }))
                  }
                  rows={4}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-serif focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Sub Article 2 */}
            <div className="border border-neutral-800 p-3 rounded-lg bg-neutral-950/40 space-y-2.5">
              <h3 className="font-bold text-amber-400 text-sm border-b border-neutral-800 pb-1">
                準トップ記事 ② (中央下)
              </h3>
              <div>
                <label className="block text-neutral-400 mb-0.5">見出し</label>
                <input
                  type="text"
                  value={data.subArticle2.headline}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      subArticle2: { ...prev.subArticle2, headline: e.target.value },
                    }))
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-0.5">サブ見出し</label>
                <input
                  type="text"
                  value={data.subArticle2.subHeadline || ''}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      subArticle2: { ...prev.subArticle2, subHeadline: e.target.value },
                    }))
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-0.5">本文</label>
                <textarea
                  value={data.subArticle2.content}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      subArticle2: { ...prev.subArticle2, content: e.target.value },
                    }))
                  }
                  rows={4}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-serif focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* METADATA & WEATHER TAB */}
        {activeTab === 'meta' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-neutral-300 font-bold mb-1">新聞名 (題字)</label>
              <input
                type="text"
                value={data.paperTitle}
                onChange={(e) => onUpdate((prev) => ({ ...prev, paperTitle: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-bold text-base focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">発行号数</label>
                <input
                  type="text"
                  value={data.issueNumber}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, issueNumber: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-bold mb-1">版区分 (朝刊/夕刊/号外)</label>
                <input
                  type="text"
                  value={data.edition}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, edition: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-bold mb-1">発行年月日・曜日</label>
              <input
                type="text"
                value={data.publishDate}
                onChange={(e) => onUpdate((prev) => ({ ...prev, publishDate: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-bold mb-1">題字横スローガン</label>
              <input
                type="text"
                value={data.slogan}
                onChange={(e) => onUpdate((prev) => ({ ...prev, slogan: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">発行所</label>
                <input
                  type="text"
                  value={data.publisher}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, publisher: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-bold mb-1">定価表記</label>
                <input
                  type="text"
                  value={data.price}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Weather section */}
            <div className="border-t border-neutral-800 pt-3">
              <h3 className="font-bold text-neutral-200 mb-2">きょうの天気</h3>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <label className="block text-neutral-400 mb-0.5">天気アイコン</label>
                  <select
                    value={data.weather.weather}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        weather: { ...prev.weather, weather: e.target.value as WeatherInfo['weather'] },
                      }))
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none"
                  >
                    <option value="sunny">晴れ ☀️</option>
                    <option value="cloudy">くもり ☁️</option>
                    <option value="rain">雨 🌧️</option>
                    <option value="snow">雪 ❄️</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-0.5">最高気温</label>
                  <input
                    type="number"
                    value={data.weather.maxTemp}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        weather: { ...prev.weather, maxTemp: Number(e.target.value) },
                      }))
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-0.5">最低気温</label>
                  <input
                    type="number"
                    value={data.weather.minTemp}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        weather: { ...prev.weather, minTemp: Number(e.target.value) },
                      }))
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-neutral-400 mb-0.5">ひとこと概況</label>
                <input
                  type="text"
                  value={data.weather.phrase}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      weather: { ...prev.weather, phrase: e.target.value },
                    }))
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* COLUMN & 4-KOMA TAB */}
        {activeTab === 'column' && (
          <div className="space-y-4">
            {/* Column Corner */}
            <div className="border border-neutral-800 p-3 rounded-lg bg-neutral-950/40 space-y-2.5">
              <h3 className="font-bold text-amber-400 text-sm border-b border-neutral-800 pb-1">
                天声人語風 コラムコーナー
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-0.5">コーナー名</label>
                  <input
                    type="text"
                    value={data.columnCorner.title}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        columnCorner: { ...prev.columnCorner, title: e.target.value },
                      }))
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-0.5">筆者名</label>
                  <input
                    type="text"
                    value={data.columnCorner.author}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        columnCorner: { ...prev.columnCorner, author: e.target.value },
                      }))
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-neutral-400 mb-0.5">コラム本文</label>
                <textarea
                  value={data.columnCorner.content}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      columnCorner: { ...prev.columnCorner, content: e.target.value },
                    }))
                  }
                  rows={4}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-serif focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* 4-Koma Manga */}
            <div className="border border-neutral-800 p-3 rounded-lg bg-neutral-950/40 space-y-2.5">
              <h3 className="font-bold text-amber-400 text-sm border-b border-neutral-800 pb-1">
                4コマ・ひとコマ連載
              </h3>
              <div>
                <label className="block text-neutral-400 mb-0.5">連載タイトル</label>
                <input
                  type="text"
                  value={data.fourKomaTitle}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, fourKomaTitle: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              {data.fourKomaFrames.map((frame, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 border-t border-neutral-800 pt-2">
                  <div>
                    <label className="block text-neutral-400 text-[10px]">コマ {index + 1} 見出し</label>
                    <input
                      type="text"
                      value={frame.caption}
                      onChange={(e) => {
                        const newFrames = [...data.fourKomaFrames];
                        newFrames[index] = { ...newFrames[index], caption: e.target.value };
                        onUpdate((prev) => ({ ...prev, fourKomaFrames: newFrames }));
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-1.5 text-neutral-100 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-neutral-400 text-[10px]">セリフ・内容</label>
                    <input
                      type="text"
                      value={frame.text}
                      onChange={(e) => {
                        const newFrames = [...data.fourKomaFrames];
                        newFrames[index] = { ...newFrames[index], text: e.target.value };
                        onUpdate((prev) => ({ ...prev, fourKomaFrames: newFrames }));
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-1.5 text-neutral-100 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AD TAB */}
        {activeTab === 'ad' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-neutral-300 font-bold mb-1">キャッチコピー (大文字)</label>
              <input
                type="text"
                value={data.adText.catchphrase}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    adText: { ...prev.adText, catchphrase: e.target.value },
                  }))
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-bold mb-1">広告補足テキスト</label>
              <textarea
                value={data.adText.subtext}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    adText: { ...prev.adText, subtext: e.target.value },
                  }))
                }
                rows={2}
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-bold mb-1">広告主 / スポンサー名</label>
              <input
                type="text"
                value={data.adText.sponsor}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    adText: { ...prev.adText, sponsor: e.target.value },
                  }))
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

      </div>

      {/* Drawer Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-xs transition-colors"
        >
          編集完了 (紙面を確認)
        </button>
      </div>
    </aside>
  );
};
