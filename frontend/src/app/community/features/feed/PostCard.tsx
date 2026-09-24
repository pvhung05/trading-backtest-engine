import { useState } from 'react';
import type { Post, ReactionType, User } from '../../types';
import Avatar from '../../components/Avatar';
import { DotsIcon, MessageIcon, ShareIcon, GlobeIcon, UsersIcon, LockIcon } from '../../components/Icons';
import ReactionPicker, { reactionConfig } from './ReactionPicker';
import CommentThread from './CommentThread';

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function PrivacyIcon({ privacy }: { privacy: string }) {
  if (privacy === 'friends') return <UsersIcon size={13} className="text-slate-400 dark:text-gray-500" />;
  if (privacy === 'private') return <LockIcon size={13} className="text-slate-400 dark:text-gray-500" />;
  return <GlobeIcon size={13} className="text-slate-400 dark:text-gray-500" />;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  currentUser?: User;
  onReact: (postId: string, type: ReactionType) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

function MediaGrid({ media }: { media: Post['media'] }) {
  if (media.length === 0) return null;
  if (media.length === 1) {
    return (
      <div className="rounded-[12px] overflow-hidden mt-3 bg-slate-100 dark:bg-gray-700">
        <img src={media[0].url} alt={media[0].alt ?? ''} loading="lazy" className="w-full object-cover max-h-96" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-1 mt-3 rounded-[12px] overflow-hidden">
      {media.slice(0, 4).map((m, i) => (
        <div key={m.id} className={`bg-slate-100 dark:bg-gray-700 ${media.length === 3 && i === 0 ? 'col-span-2' : ''}`}>
          <img src={m.url} alt={m.alt ?? ''} loading="lazy" className="w-full h-48 object-cover" />
        </div>
      ))}
    </div>
  );
}

function ReactionBar({ reactions }: { reactions: Post['reactions'] }) {
  const top = Object.entries(reactions.counts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  if (reactions.total === 0) return null;
  return (
    <div className="flex items-center gap-1 py-2 border-b border-slate-100 dark:border-gray-700/60">
      <div className="flex items-center">
        {top.map(([type]) => {
          const r = reactionConfig.find((rc) => rc.type === type);
          return r ? <span key={type} className="text-base -ml-0.5 first:ml-0">{r.emoji}</span> : null;
        })}
      </div>
      <span className="text-sm text-slate-500 dark:text-gray-400 ml-1">{reactions.total.toLocaleString('vi-VN')}</span>
    </div>
  );
}

export default function PostCard({ post, currentUserId = 'u0', currentUser, onReact, onComment, onShare }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localReaction, setLocalReaction] = useState<ReactionType | null>(post.reactions.myReaction);
  const [localTotal, setLocalTotal] = useState(post.reactions.total);

  const MAX_LEN = 280;
  const shouldTruncate = post.content.length > MAX_LEN && !expanded;
  const displayContent = shouldTruncate ? post.content.slice(0, MAX_LEN) : post.content;

  function handleReact(type: ReactionType) {
    const prev = localReaction;
    if (prev === type) {
      setLocalReaction(null);
      setLocalTotal((n) => Math.max(0, n - 1));
    } else {
      setLocalReaction(type);
      setLocalTotal((n) => n + (prev ? 0 : 1));
    }
    onReact(post.id, type);
  }

  return (
    <article className="bg-white dark:bg-gray-800 rounded-[16px] shadow-sm border border-slate-100 dark:border-gray-700/70 p-4 space-y-1">
      <div className="flex items-start gap-3">
        <Avatar user={post.author} size="md" showOnline />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-800 dark:text-gray-100 text-sm">{post.author.name}</span>
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500 mt-0.5">
            <span>{timeAgo(post.createdAt)}</span>
            <span>·</span>
            <PrivacyIcon privacy={post.privacy} />
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 p-1.5 rounded-[8px] hover:bg-slate-50 dark:hover:bg-gray-700/60 cursor-pointer" aria-label="Tùy chọn">
          <DotsIcon size={18} />
        </button>
      </div>

      <div className="text-slate-700 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line pt-1">
        {displayContent}
        {shouldTruncate && (
          <>{' '}<button onClick={() => setExpanded(true)} className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">Xem thêm</button></>
        )}
      </div>

      <MediaGrid media={post.media} />
      <ReactionBar reactions={{ ...post.reactions, myReaction: localReaction, total: localTotal }} />

      <div className="flex items-center gap-1 py-1">
        <ReactionPicker currentReaction={localReaction} onReact={handleReact} />

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-sm font-medium text-slate-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700/60 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
          aria-label="Bình luận"
        >
          <MessageIcon size={17} />
          <span>{post.commentCount > 0 ? post.commentCount : 'Bình luận'}</span>
        </button>

        <button
          onClick={() => onShare?.(post.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-sm font-medium text-slate-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700/60 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
          aria-label="Chia sẻ"
        >
          <ShareIcon size={17} />
          <span>{post.shareCount > 0 ? post.shareCount : 'Chia sẻ'}</span>
        </button>
      </div>

      {showComments && <CommentThread postId={post.id} commentCount={post.commentCount} currentUser={currentUser} />}
    </article>
  );
}
