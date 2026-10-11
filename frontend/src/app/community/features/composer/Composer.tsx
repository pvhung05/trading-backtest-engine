import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import {
  Image as ImageIcon,
  Globe,
  Users,
  Lock,
  ChevronDown,
  X,
  Send,
  TrendingUp,
  TrendingDown,
  Smile,
  Hash,
  Loader2,
  Check,
} from 'lucide-react';
import { currentUser as defaultUser } from '../../data/mock';
import type { User } from '../../types';

export type Privacy = 'public' | 'friends' | 'private';
export type Sentiment = 'bullish' | 'bearish' | 'neutral' | null;

const privacyOptions: {
  value: Privacy;
  label: string;
  description: string;
  Icon: typeof Globe;
}[] = [
  { value: 'public', label: 'Công khai', description: 'Bất kỳ ai trên nền tảng', Icon: Globe },
  { value: 'friends', label: 'Bạn bè', description: 'Chỉ những người bạn kết nối', Icon: Users },
  { value: 'private', label: 'Chỉ mình tôi', description: 'Chỉ hiển thị với bạn', Icon: Lock },
];

const quickTickers = ['$BTC', '$ETH', '$SOL', '$BNB', '$GOLD', '$VNINDEX'];
const quickEmojis = ['🚀', '📈', '📉', '💎', '🐂', '🐻', '🔥', '💰', '🎯', '⚡'];

interface ComposerProps {
  onPost?: (content: string, privacy: Privacy, mediaUrls?: string[], sentiment?: Sentiment) => void;
  currentUser?: User;
  placeholder?: string;
  className?: string;
}

export default function Composer({
  onPost,
  currentUser = defaultUser,
  placeholder = 'Chia sẻ phân tích thị trường, nhận định coin/cổ phiếu, hoặc ý tưởng của bạn...',
  className = '',
}: ComposerProps) {
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [sentiment, setSentiment] = useState<Sentiment>(null);
  const [showTickers, setShowTickers] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const privacyDropdownRef = useRef<HTMLDivElement>(null);

  // Close privacy dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        privacyDropdownRef.current &&
        !privacyDropdownRef.current.contains(event.target as Node)
      ) {
        setPrivacyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(f);
          })
      )
    ).then((urls) => {
      setPreviews((prev) => [...prev, ...urls].slice(0, 4));
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    });
  }

  function insertText(text: string) {
    setContent((prev) => {
      const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
      return `${prev}${space}${text} `;
    });
    textareaRef.current?.focus();
  }

  async function handlePost() {
    if (!content.trim() && previews.length === 0) return;
    setPosting(true);

    let finalContent = content.trim();
    if (sentiment === 'bullish' && !finalContent.includes('[BULLISH 🚀]')) {
      finalContent = `[BULLISH 🚀] ${finalContent}`;
    } else if (sentiment === 'bearish' && !finalContent.includes('[BEARISH 🔻]')) {
      finalContent = `[BEARISH 🔻] ${finalContent}`;
    }

    try {
      await onPost?.(finalContent, privacy, previews, sentiment);
      setContent('');
      setPreviews([]);
      setSentiment(null);
      setShowTickers(false);
      setShowEmojis(false);
    } finally {
      setPosting(false);
    }
  }

  const canPost = (content.trim().length > 0 || previews.length > 0) && !uploading && !posting;
  const currentPrivacy = privacyOptions.find((p) => p.value === privacy) || privacyOptions[0];
  const PrivacyIcon = currentPrivacy.Icon;

  return (
    <div
      className={`bg-white dark:bg-[#161b26] rounded-2xl border border-slate-200/90 dark:border-[#262c3a] shadow-xs hover:shadow-sm transition-all duration-200 overflow-visible p-4 sm:p-5 ${className}`}
    >
      {/* Top Header: Author Info + Privacy Pill */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="size-11 rounded-full object-cover ring-2 ring-blue-500/20 bg-slate-100 dark:bg-gray-800"
              />
            ) : (
              <div className="size-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-blue-500/20">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#161b26]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                PRO TRADER
              </span>
            </div>

            {/* Privacy Selector Trigger */}
            <div className="relative mt-1" ref={privacyDropdownRef}>
              <button
                type="button"
                onClick={() => setPrivacyOpen(!privacyOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
              >
                <PrivacyIcon className="size-3 text-slate-500 dark:text-slate-400" />
                <span>{currentPrivacy.label}</span>
                <ChevronDown className="size-3 opacity-60" />
              </button>

              {/* Privacy Dropdown Popover */}
              {privacyOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-[#1a2130] rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
                    Đối tượng xem bài viết
                  </div>
                  {privacyOptions.map(({ value, label, description, Icon }) => {
                    const isSelected = privacy === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setPrivacy(value);
                          setPrivacyOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg mt-0.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold ${
                              isSelected
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {label}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                            {description}
                          </p>
                        </div>
                        {isSelected && <Check className="size-4 text-blue-600 dark:text-blue-400 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Market Bias / Sentiment Selector Pills */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => setSentiment(sentiment === 'bullish' ? null : 'bullish')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sentiment === 'bullish'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            title="Đánh dấu tâm lý Tăng giá"
          >
            <TrendingUp className="size-3.5" />
            <span>Tăng (Long)</span>
          </button>

          <button
            type="button"
            onClick={() => setSentiment(sentiment === 'bearish' ? null : 'bearish')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sentiment === 'bearish'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
            title="Đánh dấu tâm lý Giảm giá"
          >
            <TrendingDown className="size-3.5" />
            <span>Giảm (Short)</span>
          </button>
        </div>
      </div>

      {/* Main Textarea Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none bg-slate-50/80 dark:bg-slate-800/40 focus:bg-white dark:focus:bg-[#1a2130] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none border border-slate-200/70 dark:border-slate-700/60 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150 leading-relaxed"
        />

        {/* Selected Sentiment Banner (Mobile or visual feedback) */}
        {sentiment && (
          <div className="sm:hidden flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800">
            <span>Tâm lý:</span>
            {sentiment === 'bullish' && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="size-3.5" /> Tăng giá (Long)
              </span>
            )}
            {sentiment === 'bearish' && (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <TrendingDown className="size-3.5" /> Giảm giá (Short)
              </span>
            )}
            <button
              onClick={() => setSentiment(null)}
              className="ml-auto text-slate-400 hover:text-slate-600"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Tickers Chips Bar */}
      {showTickers && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5 p-2 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs">
          <span className="text-blue-700 dark:text-blue-300 font-semibold text-[11px] flex items-center gap-1 mr-1">
            <Hash className="size-3" /> Mã phổ biến:
          </span>
          {quickTickers.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => insertText(t)}
              className="px-2 py-1 rounded-md font-semibold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white shadow-xs border border-blue-200/60 dark:border-blue-800/40 transition-colors cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Quick Emojis Bar */}
      {showEmojis && (
        <div className="flex items-center gap-1 flex-wrap mt-2.5 p-2 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 text-sm">
          <span className="text-amber-700 dark:text-amber-300 font-semibold text-[11px] flex items-center gap-1 mr-1">
            <Smile className="size-3" /> Biểu cảm:
          </span>
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertText(emoji)}
              className="size-7 rounded-lg hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Image Preview Grid */}
      {previews.length > 0 && (
        <div
          className={`grid gap-2 mt-3 rounded-xl overflow-hidden ${
            previews.length === 1 ? 'grid-cols-1' : previews.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {previews.map((src, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video sm:aspect-auto sm:h-36">
              <img src={src} alt="Uploaded preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPreviews((p) => p.filter((_, j) => j !== i))}
                className="absolute top-2 right-2 size-7 rounded-full bg-slate-900/75 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md backdrop-blur-xs"
                title="Xóa ảnh"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Bottom Action Toolbar */}
      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {/* Add Image Button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={previews.length >= 4}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              previews.length > 0
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Thêm ảnh chụp màn hình hoặc biểu đồ"
          >
            <ImageIcon className="size-4 text-blue-500" />
            <span className="hidden sm:inline">Ảnh / Biểu đồ</span>
            {previews.length > 0 && (
              <span className="size-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {previews.length}
              </span>
            )}
          </button>

          {/* Quick Tickers Toggle */}
          <button
            type="button"
            onClick={() => setShowTickers(!showTickers)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              showTickers
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Gắn mã coin / chứng khoán"
          >
            <Hash className="size-4 text-indigo-500" />
            <span className="hidden sm:inline">Mã ($)</span>
          </button>

          {/* Emojis Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              showEmojis
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Chèn biểu cảm giao dịch"
          >
            <Smile className="size-4 text-amber-500" />
            <span className="hidden sm:inline">Biểu cảm</span>
          </button>
        </div>

        {/* Submit Post Button */}
        <div className="flex items-center gap-3 ml-auto">
          {content.length > 0 && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
              {content.length} ký tự
            </span>
          )}

          <button
            type="button"
            onClick={handlePost}
            disabled={!canPost}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
              canPost
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 active:scale-[0.98]'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-none cursor-not-allowed opacity-60'
            }`}
          >
            {posting || uploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Đăng bài</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
