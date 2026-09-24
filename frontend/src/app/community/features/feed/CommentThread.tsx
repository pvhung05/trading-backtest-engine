import { useState } from 'react';
import type { Comment, User } from '../../types';
import { currentUser as defaultUser, mockComments } from '../../data/mock';
import Avatar from '../../components/Avatar';
import { SendIcon } from '../../components/Icons';

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return `${Math.floor(diff / 86400)} ngày`;
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  currentUser?: User;
}

function CommentItem({ comment, depth = 0, currentUser = defaultUser }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(false);

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-10' : ''}`}>
      <Avatar user={comment.author} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 dark:bg-gray-700/50 rounded-[12px] px-3 py-2.5">
          <span className="font-semibold text-sm text-slate-800 dark:text-gray-100">{comment.author.name}</span>
          <p className="text-sm text-slate-700 dark:text-gray-300 mt-0.5 leading-relaxed">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 px-1">
          <button className="text-xs text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer">
            👍 Thích {comment.reactions.total > 0 && <span className="text-slate-400">· {comment.reactions.total}</span>}
          </button>
          <button
            onClick={() => setReplyingTo(!replyingTo)}
            className="text-xs text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
          >
            Phản hồi
          </button>
          <span className="text-xs text-slate-400 dark:text-gray-500">{timeAgo(comment.createdAt)}</span>
        </div>

        {replyingTo && (
          <div className="flex gap-2 mt-2">
            <Avatar user={currentUser} size="sm" />
            <div className="flex-1 flex items-center bg-slate-50 dark:bg-gray-700/50 rounded-full px-3 py-1.5 gap-2 border border-slate-200/50 dark:border-gray-600">
              <input
                className="flex-1 bg-transparent text-sm text-slate-800 dark:text-gray-100 outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500"
                placeholder={`Phản hồi ${comment.author.name}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              {replyText && (
                <button
                  onClick={() => { setReplyText(''); setReplyingTo(false); }}
                  className="text-blue-600 dark:text-blue-400 cursor-pointer"
                  aria-label="Gửi"
                >
                  <SendIcon size={15} />
                </button>
              )}
            </div>
          </div>
        )}

        {comment.replyCount > 0 && depth === 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
          >
            {showReplies ? 'Ẩn phản hồi' : `Xem ${comment.replyCount} phản hồi`}
          </button>
        )}
      </div>
    </div>
  );
}

interface CommentThreadProps {
  postId: string;
  commentCount: number;
  currentUser?: User;
}

export default function CommentThread({ postId, commentCount, currentUser = defaultUser }: CommentThreadProps) {
  const [text, setText] = useState('');
  const [optimistic, setOptimistic] = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);

  const allComments = [...mockComments.filter((c) => c.postId === postId), ...optimistic];
  const visible = allComments.slice(0, visibleCount);

  function submit() {
    if (!text.trim()) return;
    const c: Comment = {
      id: `opt-${Date.now()}`,
      postId,
      author: currentUser,
      content: text.trim(),
      reactions: { counts: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 }, myReaction: null, total: 0 },
      replyCount: 0,
      createdAt: new Date().toISOString(),
    };
    setOptimistic((prev) => [c, ...prev]);
    setText('');
  }

  return (
    <div className="border-t border-slate-100 dark:border-gray-700/60 pt-3 space-y-3">
      <div className="flex gap-3">
        <Avatar user={currentUser} size="sm" />
        <div className="flex-1 flex items-center bg-slate-50 dark:bg-gray-700/50 rounded-full px-4 py-2 gap-2 border border-slate-200/50 dark:border-gray-600">
          <input
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-gray-100 outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500"
            placeholder="Viết bình luận..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submit())}
          />
          {text && (
            <button onClick={submit} className="text-blue-600 dark:text-blue-400 cursor-pointer" aria-label="Gửi">
              <SendIcon size={15} />
            </button>
          )}
        </div>
      </div>

      {visible.map((c) => (
        <CommentItem key={c.id} comment={c} currentUser={currentUser} />
      ))}

      {allComments.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((n) => n + 5)}
          className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline ml-12 cursor-pointer"
        >
          Xem thêm bình luận ({allComments.length - visibleCount})
        </button>
      )}
    </div>
  );
}
