import { useState, useEffect } from 'react';
import type { Comment, User } from '../../types';
import { currentUser as defaultUser, mockComments } from '../../data/mock';
import Avatar from '../../components/Avatar';
import { SendIcon } from '../../components/Icons';
import { communityApi, type PostCommentResponse } from '../../../services';

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
  onReply?: (parentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
}

function CommentItem({ comment, depth = 0, currentUser = defaultUser, onReply, onLike }: CommentItemProps) {
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(false);
  const [likes, setLikes] = useState(comment.reactions.total);
  const [hasLiked, setHasLiked] = useState(false);

  function handleLikeClick() {
    setHasLiked(!hasLiked);
    setLikes((l) => (hasLiked ? Math.max(0, l - 1) : l + 1));
    onLike?.(comment.id);
  }

  function handleSendReply() {
    if (!replyText.trim()) return;
    onReply?.(comment.id, replyText.trim());
    setReplyText('');
    setReplyingTo(false);
  }

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-10' : ''}`}>
      <Avatar user={comment.author} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 dark:bg-gray-700/50 rounded-[12px] px-3 py-2.5">
          <span className="font-semibold text-sm text-slate-800 dark:text-gray-100">{comment.author.name}</span>
          <p className="text-sm text-slate-700 dark:text-gray-300 mt-0.5 leading-relaxed">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 px-1">
          <button
            onClick={handleLikeClick}
            className={`text-xs font-medium transition-colors cursor-pointer ${
              hasLiked ? 'text-blue-600 font-bold' : 'text-slate-500 dark:text-gray-400 hover:text-blue-600'
            }`}
          >
            👍 Thích {likes > 0 && <span className="text-slate-400">· {likes}</span>}
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
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                autoFocus
              />
              {replyText && (
                <button
                  onClick={handleSendReply}
                  className="text-blue-600 dark:text-blue-400 cursor-pointer"
                  aria-label="Gửi"
                >
                  <SendIcon size={15} />
                </button>
              )}
            </div>
          </div>
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    let mounted = true;
    const numId = Number(postId);
    if (!isNaN(numId)) {
      communityApi
        .getPostComments(numId)
        .then((res) => {
          if (mounted && res?.content && res.content.length > 0) {
            const mapped = res.content.map(mapBackendComment);
            setComments(mapped);
          } else if (mounted) {
            const local = mockComments.filter((c) => c.postId === postId);
            setComments(local);
          }
        })
        .catch(() => {
          if (mounted) {
            const local = mockComments.filter((c) => c.postId === postId);
            setComments(local);
          }
        });
    } else {
      const local = mockComments.filter((c) => c.postId === postId);
      setComments(local);
    }
    return () => {
      mounted = false;
    };
  }, [postId]);

  function mapBackendComment(c: PostCommentResponse): Comment {
    return {
      id: String(c.id),
      postId,
      author: {
        id: String(c.userId),
        name: c.userName || 'Trader',
        avatarUrl: c.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
      },
      content: c.content,
      reactions: {
        counts: { like: c.likesCount || 0 },
        myReaction: c.hasLiked ? 'like' : null,
        total: c.likesCount || 0,
      },
      replyCount: 0,
      createdAt: c.createdAt || new Date().toISOString(),
      parentId: c.parentId ? String(c.parentId) : undefined,
    };
  }

  async function submit() {
    if (!text.trim()) return;
    const content = text.trim();
    setText('');

    let newCommentId = `c-${Date.now()}`;
    const numId = Number(postId);
    if (!isNaN(numId)) {
      try {
        const res = await communityApi.addPostComment(numId, content);
        if (res?.id) newCommentId = String(res.id);
      } catch (err) {
        console.warn('Could not post comment to backend API:', err);
      }
    }

    const c: Comment = {
      id: newCommentId,
      postId,
      author: currentUser,
      content,
      reactions: { counts: { like: 0 }, myReaction: null, total: 0 },
      replyCount: 0,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [c, ...prev]);
  }

  async function handleReply(parentId: string, content: string) {
    let replyId = `c-${Date.now()}`;
    const numId = Number(postId);
    const parentNum = Number(parentId);
    if (!isNaN(numId)) {
      try {
        const res = await communityApi.addPostComment(numId, content, isNaN(parentNum) ? undefined : parentNum);
        if (res?.id) replyId = String(res.id);
      } catch (err) {
        console.warn('Could not reply to backend API:', err);
      }
    }
    const c: Comment = {
      id: replyId,
      postId,
      author: currentUser,
      content,
      reactions: { counts: { like: 0 }, myReaction: null, total: 0 },
      replyCount: 0,
      createdAt: new Date().toISOString(),
      parentId,
    };
    setComments((prev) => [...prev, c]);
  }

  function handleLike(commentId: string) {
    const num = Number(commentId);
    if (!isNaN(num)) {
      communityApi.togglePostCommentLike(num).catch((e) => console.warn('Comment like error', e));
    }
  }

  const visible = comments.slice(0, visibleCount);

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
        <CommentItem
          key={c.id}
          comment={c}
          depth={c.parentId ? 1 : 0}
          currentUser={currentUser}
          onReply={handleReply}
          onLike={handleLike}
        />
      ))}

      {comments.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((n) => n + 5)}
          className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline ml-12 cursor-pointer"
        >
          Xem thêm bình luận ({comments.length - visibleCount})
        </button>
      )}
    </div>
  );
}
