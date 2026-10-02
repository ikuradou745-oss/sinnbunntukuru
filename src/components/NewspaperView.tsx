import React from 'react';
import { NewspaperData } from '../types';
import { Sun, Cloud, CloudRain, Snowflake, Camera, Sparkles } from 'lucide-react';

interface NewspaperViewProps {
  data: NewspaperData;
  onUpdate: (updater: (prev: NewspaperData) => NewspaperData) => void;
  innerRef: React.RefObject<HTMLDivElement | null>;
}

export const NewspaperView: React.FC<NewspaperViewProps> = ({
  data,
  onUpdate,
  innerRef,
}) => {
  // Theme classes
  const themeClasses = {
    modern: 'bg-[#faf9f6] text-neutral-900 border-neutral-900',
    retro: 'newspaper-texture text-[#1f1d1a] border-[#2b2723]',
    craft: 'bg-[#ece3d1] text-[#2c2621] border-[#383129]',
    gogai: 'bg-[#fffdfa] text-neutral-950 border-red-700',
  }[data.theme] || 'bg-[#faf9f6] text-neutral-900 border-neutral-900';

  const inkColor = data.theme === 'gogai' ? 'text-red-700' : 'text-neutral-900';

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny':
        return <Sun className="w-5 h-5 text-amber-600 inline-block mr-1" />;
      case 'cloudy':
        return <Cloud className="w-5 h-5 text-slate-500 inline-block mr-1" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-blue-500 inline-block mr-1" />;
      case 'snow':
        return <Snowflake className="w-5 h-5 text-cyan-500 inline-block mr-1" />;
      default:
        return <Sun className="w-5 h-5 text-amber-600 inline-block mr-1" />;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, articleKey: 'lead' | 'sub1') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (articleKey === 'lead') {
          onUpdate((prev) => ({
            ...prev,
            leadArticle: { ...prev.leadArticle, imageUrl: result },
          }));
        } else {
          onUpdate((prev) => ({
            ...prev,
            subArticle1: { ...prev.subArticle1, imageUrl: result },
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full flex justify-center py-4 sm:py-8 px-2 sm:px-4">
      {/* Newspaper Sheet Container */}
      <div
        ref={innerRef}
        className={`print-page w-full max-w-[960px] shadow-2xl transition-all duration-300 ${themeClasses} p-4 sm:p-7 border-4 border-double font-serif relative overflow-hidden`}
        style={{ minHeight: '1350px' }}
      >
        {/* Gogai Header Ribbon (if active) */}
        {data.isGogai && (
          <div className="mb-4 bg-red-700 text-white text-center py-2 px-4 shadow-md border-y-2 border-red-900 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black tracking-widest">★ 号外 ★ GOGAI SPECIAL ★</span>
            <span className="text-xs sm:text-sm font-bold bg-white text-red-700 px-2 py-0.5 rounded">
              速報特報版
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-widest hidden sm:inline">★ 号外 ★</span>
          </div>
        )}

        {/* Newspaper Top Header / Masthead Section */}
        <div className="border-b-4 border-double border-neutral-800 pb-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
            {/* Top Left: Slogan, Edition info, Barcode */}
            <div className="md:col-span-3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-400/80 pr-3 pb-2 md:pb-0 text-xs">
              <div className="border-b border-dotted border-neutral-400 pb-1 mb-1">
                <span className="inline-block bg-neutral-800 text-neutral-100 px-1.5 py-0.5 text-[11px] font-bold rounded-xs mr-1">
                  {data.edition}
                </span>
                <span className="font-bold">{data.issueNumber}</span>
              </div>

              <p className="text-[11px] text-neutral-600 leading-snug py-1">
                {data.slogan}
              </p>

              <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-300">
                <p>{data.publisher}</p>
                <p>{data.price}</p>
              </div>
            </div>

            {/* Top Center: Main Newspaper Masthead (題字) */}
            <div className="md:col-span-6 flex flex-col items-center justify-center text-center py-2 px-2 border-b md:border-b-0 md:border-r border-neutral-400/80">
              <div className="relative inline-block w-full">
                {/* Decorative border box around masthead */}
                <div className="border-2 border-neutral-800 p-2 sm:p-3 relative bg-neutral-50/20">
                  <h1 className={`text-3xl sm:text-5xl font-black tracking-widest ${data.isGogai ? 'text-red-700' : 'text-neutral-950'}`}>
                    {data.paperTitle}
                  </h1>
                  {/* Red Square Seal / 印鑑 */}
                  <div className="absolute right-2 top-2 w-8 h-8 border border-red-600 text-red-600 rounded-xs flex items-center justify-center text-[10px] font-black rotate-3 select-none pointer-events-none opacity-80">
                    新聞<br />之印
                  </div>
                </div>
              </div>
              <div className="w-full flex items-center justify-between text-[11px] font-semibold mt-1.5 px-1 border-t border-neutral-700/60 pt-1 text-neutral-700">
                <span>第 {data.issueNumber}</span>
                <span>{data.publishDate}</span>
                <span>日本国内版</span>
              </div>
            </div>

            {/* Top Right: Weather Box & Quick Notice */}
            <div className="md:col-span-3 flex flex-col justify-between pl-1 text-xs">
              <div className="border border-neutral-700 p-2 bg-neutral-200/40 rounded-xs">
                <div className="text-[11px] font-bold border-b border-neutral-400 pb-0.5 flex items-center justify-between">
                  <span>きょうの天気</span>
                  <span className="text-[10px] text-neutral-600">東京地方</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center">
                    {getWeatherIcon(data.weather.weather)}
                    <span className="font-bold text-sm">
                      {data.weather.weather === 'sunny' && '晴れ'}
                      {data.weather.weather === 'cloudy' && 'くもり'}
                      {data.weather.weather === 'rain' && '雨'}
                      {data.weather.weather === 'snow' && '雪'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono font-bold">
                    <span className="text-red-600">{data.weather.maxTemp}℃</span>
                    <span className="text-neutral-400 mx-1">/</span>
                    <span className="text-blue-600">{data.weather.minTemp}℃</span>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-600 border-t border-neutral-300 pt-1">
                  {data.weather.phrase}
                </p>
              </div>

              <div className="text-[10px] text-right text-neutral-500 mt-1">
                ※無断転載・複製を歓迎します
              </div>
            </div>
          </div>
        </div>

        {/* Newspaper Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 items-start">
          
          {/* Main Area (8 columns on desktop): Lead Story + Secondary Story */}
          <div className="lg:col-span-8 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-neutral-400/80 pr-0 lg:pr-5">
            
            {/* Top Lead Story Section */}
            <article className="border-b-2 border-neutral-700/80 pb-5">
              {/* Category Tag */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 text-white ${data.isGogai ? 'bg-red-700' : 'bg-neutral-800'}`}>
                  {data.leadArticle.category}
                </span>
                {data.leadArticle.author && (
                  <span className="text-xs text-neutral-600">【{data.leadArticle.author}】</span>
                )}
              </div>

              {/* Main Headline */}
              <h2 className={`text-2xl sm:text-4xl font-black leading-tight sm:leading-snug tracking-tight mb-2 ${inkColor}`}>
                {data.leadArticle.headline}
              </h2>

              {/* Subheadline / 袖見出し */}
              {data.leadArticle.subHeadline && (
                <div className="border-l-4 border-amber-700 pl-2.5 py-0.5 mb-3 text-sm sm:text-base font-bold text-neutral-800">
                  {data.leadArticle.subHeadline}
                </div>
              )}

              {/* Lead Story Content: Image & Text columns */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-3">
                {/* Photo (if provided) */}
                {data.leadArticle.imageUrl ? (
                  <div className="sm:col-span-5 flex flex-col">
                    <div className="border border-neutral-700 p-1 bg-white shadow-xs">
                      <img
                        src={data.leadArticle.imageUrl}
                        alt="報道写真"
                        className="w-full h-48 sm:h-52 object-cover filter contrast-105"
                      />
                    </div>
                    {data.leadArticle.imageCaption && (
                      <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                        {data.leadArticle.imageCaption}
                      </p>
                    )}
                    {/* Change photo button in UI */}
                    <label className="no-print mt-1 inline-flex items-center justify-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 cursor-pointer border border-dashed border-neutral-400 p-1 rounded hover:bg-neutral-100">
                      <Camera className="w-3 h-3" />
                      <span>写真を変更する</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'lead')}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="no-print sm:col-span-5 border-2 border-dashed border-neutral-300 p-4 text-center rounded flex flex-col items-center justify-center text-neutral-500">
                    <Camera className="w-8 h-8 mb-1 text-neutral-400" />
                    <span className="text-xs font-medium">写真を追加できます</span>
                    <label className="mt-2 text-xs bg-neutral-800 text-white px-2 py-1 rounded cursor-pointer hover:bg-neutral-700">
                      写真を選択
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'lead')}
                      />
                    </label>
                  </div>
                )}

                {/* Article Body Text */}
                <div className={`${data.leadArticle.imageUrl ? 'sm:col-span-7' : 'sm:col-span-12'}`}>
                  <div className="text-xs sm:text-[13px] leading-relaxed text-justify whitespace-pre-line tracking-wide font-serif text-neutral-900 columns-1 sm:columns-2 gap-4">
                    {data.leadArticle.content}
                  </div>
                </div>
              </div>
            </article>

            {/* Secondary Article 1 & 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Secondary Article 1 */}
              <article className="border-b sm:border-b-0 sm:border-r border-neutral-400/80 pr-0 sm:pr-4 pb-4 sm:pb-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-neutral-700 text-white">
                    {data.subArticle1.category}
                  </span>
                  {data.subArticle1.author && (
                    <span className="text-[11px] text-neutral-500">【{data.subArticle1.author}】</span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black leading-snug tracking-tight mb-1">
                  {data.subArticle1.headline}
                </h3>
                {data.subArticle1.subHeadline && (
                  <p className="text-xs font-bold text-neutral-700 mb-2 border-l-2 border-neutral-600 pl-1.5">
                    {data.subArticle1.subHeadline}
                  </p>
                )}
                {data.subArticle1.imageUrl && (
                  <div className="mb-2 border border-neutral-600 p-0.5 bg-white">
                    <img
                      src={data.subArticle1.imageUrl}
                      alt="写真"
                      className="w-full h-32 object-cover"
                    />
                    {data.subArticle1.imageCaption && (
                      <p className="text-[10px] text-neutral-600 mt-0.5 px-1">{data.subArticle1.imageCaption}</p>
                    )}
                  </div>
                )}
                <div className="text-xs leading-relaxed text-justify whitespace-pre-line text-neutral-800">
                  {data.subArticle1.content}
                </div>
              </article>

              {/* Secondary Article 2 */}
              <article>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-neutral-700 text-white">
                    {data.subArticle2.category}
                  </span>
                  {data.subArticle2.author && (
                    <span className="text-[11px] text-neutral-500">【{data.subArticle2.author}】</span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black leading-snug tracking-tight mb-1">
                  {data.subArticle2.headline}
                </h3>
                {data.subArticle2.subHeadline && (
                  <p className="text-xs font-bold text-neutral-700 mb-2 border-l-2 border-neutral-600 pl-1.5">
                    {data.subArticle2.subHeadline}
                  </p>
                )}
                <div className="text-xs leading-relaxed text-justify whitespace-pre-line text-neutral-800">
                  {data.subArticle2.content}
                </div>
              </article>
            </div>

          </div>

          {/* Right Sidebar Area (4 columns on desktop): Editorial Column & 4-Koma & Horoscope */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Editorial Column (天声人語風 コラム) */}
            <div className="border-2 border-neutral-800 p-3 bg-neutral-100/40 relative">
              <div className="flex items-center justify-between border-b-2 border-neutral-800 pb-1 mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-amber-800 text-sm">❖</span>
                  <h4 className="font-black text-base tracking-widest">{data.columnCorner.title}</h4>
                </div>
                <span className="text-[11px] text-neutral-600">筆：{data.columnCorner.author}</span>
              </div>
              <div className="text-xs leading-relaxed text-justify whitespace-pre-line text-neutral-900 font-serif">
                {data.columnCorner.content}
              </div>
            </div>

            {/* 4-Koma Manga or Single Frame (ひとコマ・4コマ劇場) */}
            <div className="border border-neutral-800 p-2.5 bg-white/70">
              <div className="flex items-center justify-between border-b border-neutral-700 pb-1 mb-2">
                <h4 className="font-bold text-xs tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  {data.fourKomaTitle}
                </h4>
                <span className="text-[10px] text-neutral-500">四コマ連載</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {data.fourKomaFrames.map((frame, idx) => (
                  <div key={idx} className="border border-neutral-400 p-1.5 bg-neutral-50 text-[11px] flex flex-col justify-between min-h-[70px]">
                    <div className="font-bold text-neutral-700 text-[10px] border-b border-neutral-300 pb-0.5">
                      {frame.caption}
                    </div>
                    <div className="text-[10px] text-neutral-800 leading-tight mt-1">
                      {frame.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Luck / Horoscope (星占い・運勢) */}
            <div className="border border-neutral-600 p-2.5 bg-neutral-100/30 text-xs">
              <div className="font-bold text-xs border-b border-neutral-400 pb-1 mb-1.5 flex items-center justify-between">
                <span>きょうの運勢ランキング</span>
                <span className="text-[10px] text-neutral-500">占い部</span>
              </div>
              <div className="space-y-1.5">
                {data.horoscope.map((h, i) => (
                  <div key={i} className="text-[11px] leading-snug border-b border-dotted border-neutral-300 pb-1">
                    <span className="font-bold text-neutral-900 mr-1.5">[{h.sign}]</span>
                    <span className="text-amber-700 font-mono mr-1.5">{h.luck}</span>
                    <span className="text-neutral-700">{h.advice}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Strip: Traditional Japanese Newspaper Advertisement (三段広告風) */}
        <div className="border-t-4 border-double border-neutral-800 pt-2 mt-4">
          <div className="border-2 border-neutral-700 p-3 bg-neutral-200/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex-1">
              <div className="text-[10px] font-bold tracking-widest text-neutral-500 mb-0.5">【広告】</div>
              <div className="text-sm sm:text-base font-black tracking-wide text-neutral-900">
                {data.adText.catchphrase}
              </div>
              <div className="text-xs text-neutral-700 mt-0.5">
                {data.adText.subtext}
              </div>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-neutral-400/80 pt-2 sm:pt-0 sm:pl-4 text-xs font-bold text-neutral-800 whitespace-nowrap">
              <span className="inline-block bg-neutral-800 text-white px-2 py-0.5 text-[11px] rounded-xs mb-1">
                広告主
              </span>
              <div>{data.adText.sponsor}</div>
            </div>
          </div>
          <div className="text-center text-[10px] text-neutral-400 mt-2 font-mono">
            - 新聞つくる (sinnbunntukuru) | {data.publishDate} 発行 -
          </div>
        </div>

      </div>
    </div>
  );
};
