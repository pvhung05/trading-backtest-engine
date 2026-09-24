import { useState, useRef, type ChangeEvent } from 'react';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { ImageIcon, ChevronDownIcon, GlobeIcon, UsersIcon, LockIcon, XIcon } from '../../components/Icons';
import { currentUser as defaultUser } from '../../data/mock';
import type { User } from '../../types';

type Privacy = 'public' | 'friends' | 'private';

const privacyOptions: { value: Privacy; label: string; Icon: typeof GlobeIcon }[] = [
  { value: 'public', label: 'Công khai', Icon: GlobeIcon },
  { value: 'friends', label: 'Bạn bè', Icon: UsersIcon },
  { value: 'private', label: 'Chỉ mình tôi', Icon: LockIcon },
];

interface ComposerProps {
  onPost?: (content: string, privacy: Privacy) => void;
  currentUser?: User;
}

export default function Composer({ onPost, currentUser = defaultUser }: ComposerProps) {
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    });
  }

  async function handlePost() {
    if (!content.trim() && previews.length === 0) return;
    setPosting(true);
    await new Promise((r) => setTimeout(r, 400));
    onPost?.(content.trim(), privacy);
    setContent('');
    setPreviews([]);
    setPosting(false);
  }

  const canPost = (content.trim().length > 0 || previews.length > 0) && !uploading;
  const currentPrivacy = privacyOptions.find((p) => p.value === privacy)!;
  const PrivacyIcon = currentPrivacy.Icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[16px] shadow-sm border border-slate-100 dark:border-gray-700/70 p-4">
      <div className="flex gap-3">
        <Avatar user={currentUser} size="md" />
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ phân tích thị trường hoặc suy nghĩ của bạn..."
            rows={3}
            className="w-full resize-none bg-slate-50 dark:bg-gray-700/50 rounded-[12px] px-4 py-3 text-sm text-slate-800 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 border border-slate-200/40 dark:border-gray-600 transition-all"
          />

          {previews.length > 0 && (
            <div className={`grid gap-1 mt-2 rounded-[12px] overflow-hidden ${previews.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {previews.map((src, i) => (
                <div key={i} className="relative group bg-slate-100 dark:bg-gray-700">
                  <img src={src} alt="" className="w-full h-32 object-cover" />
                  <button
                    onClick={() => setPreviews((p) => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Xóa ảnh"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-gray-700/60">
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={previews.length >= 4}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-sm text-slate-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700/60 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Thêm ảnh"
          >
            <ImageIcon size={16} />
            <span>Ảnh/Biểu đồ</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />

          <div className="relative">
            <button
              onClick={() => setPrivacyOpen(!privacyOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-sm text-slate-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <PrivacyIcon size={15} />
              <span>{currentPrivacy.label}</span>
              <ChevronDownIcon size={13} />
            </button>
            {privacyOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-[12px] shadow-xl border border-slate-100 dark:border-gray-700 py-1 z-10 min-w-44 pop-in">
                {privacyOptions.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setPrivacy(value); setPrivacyOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${privacy === value ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-gray-200'}`}
                  >
                    <Icon size={15} className={privacy === value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-gray-400'} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button onClick={handlePost} disabled={!canPost} loading={posting} size="sm">
          Đăng bài
        </Button>
      </div>
    </div>
  );
}
