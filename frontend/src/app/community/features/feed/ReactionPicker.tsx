import { useState, useRef, useEffect } from 'react';
import type { ReactionType } from '../../types';
import { ThumbsUpIcon } from '../../components/Icons';

const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: 'like', emoji: '👍', label: 'Thích', color: 'text-blue-600 dark:text-blue-400' },
  { type: 'love', emoji: '❤️', label: 'Yêu thích', color: 'text-red-500 dark:text-red-400' },
  { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-500 dark:text-yellow-400' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-yellow-500 dark:text-yellow-400' },
  { type: 'sad', emoji: '😢', label: 'Buồn', color: 'text-yellow-500 dark:text-yellow-400' },
  { type: 'angry', emoji: '😡', label: 'Phẫn nộ', color: 'text-orange-500 dark:text-orange-400' },
];

export const reactionConfig = REACTIONS;

interface ReactionPickerProps {
  currentReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
}

export default function ReactionPicker({ currentReaction, onReact }: ReactionPickerProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showPicker() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), 250);
  }

  function hidePicker() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 200);
  }

  function handleClick() {
    onReact(currentReaction ?? 'like');
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const active = REACTIONS.find((r) => r.type === currentReaction);

  return (
    <div className="relative" onMouseEnter={showPicker} onMouseLeave={hidePicker}>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-sm font-medium transition-colors duration-150 hover:bg-blue-50 dark:hover:bg-gray-700/60 cursor-pointer ${
          currentReaction ? active?.color ?? 'text-blue-600' : 'text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
        aria-label={currentReaction ? `Bỏ ${active?.label}` : 'Thích'}
      >
        {currentReaction ? (
          <span className="text-base leading-none">{active?.emoji}</span>
        ) : (
          <ThumbsUpIcon size={17} />
        )}
        <span>{active?.label ?? 'Thích'}</span>
      </button>

      {visible && (
        <div
          className="absolute bottom-full left-0 mb-2 pop-in z-20"
          onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current); }}
          onMouseLeave={hidePicker}
        >
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-slate-100 dark:border-gray-700 px-3 py-2">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={() => { onReact(r.type); setVisible(false); }}
                className="reaction-btn text-2xl p-1 rounded-full hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer transition-transform"
                title={r.label}
                aria-label={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
