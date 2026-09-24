import type { User, Post, Comment, Group, Notification, FriendRequest } from '../types';

export const currentUser: User = {
  id: 'u0',
  name: 'Nguyễn Minh Tuấn',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
  email: 'tuan.nguyen@dev.vn',
  isOnline: true,
};

export const users: User[] = [
  {
    id: 'u1',
    name: 'Lê Thu Hương',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&auto=format',
    email: 'huong.le@company.vn',
    isOnline: true,
  },
  {
    id: 'u2',
    name: 'Trần Đức Anh',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format',
    email: 'anh.tran@startup.io',
    isOnline: false,
  },
  {
    id: 'u3',
    name: 'Phạm Thị Lan',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format',
    email: 'lan.pham@tech.vn',
    isOnline: true,
  },
  {
    id: 'u4',
    name: 'Vũ Hoàng Nam',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format',
    email: 'nam.vu@design.vn',
    isOnline: false,
  },
];

export const mockPosts: Post[] = [
  {
    id: 'p1',
    author: users[0],
    content:
      'Vừa hoàn thành sprint review cho dự án mạng xã hội & giao dịch thuật toán. Team làm việc rất hiệu quả tuần này 🚀 Chúng ta đã ship được infinite scroll, reaction system và real-time notifications. Cảm ơn tất cả mọi người!\n\nMột số kỹ thuật hay mình học được:\n• TanStack Query với optimistic updates\n• WebSocket / STOMP cho real-time features\n• React.memo + useMemo để tối ưu render đồ thị nến',
    media: [
      {
        id: 'm1',
        url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=700&h=400&fit=crop&auto=format',
        type: 'image',
        alt: 'Team meeting at tech startup',
      },
    ],
    privacy: 'public',
    reactions: {
      counts: { like: 47, love: 23, haha: 3, wow: 8, sad: 0, angry: 0 },
      myReaction: 'love',
      total: 81,
    },
    commentCount: 14,
    shareCount: 6,
    createdAt: '2026-09-23T08:30:00Z',
  },
  {
    id: 'p2',
    author: users[1],
    content:
      'Hỏi ngu: mọi người đang dùng state management gì cho project React trading lớn? Mình đang phân vân giữa Zustand và Context API + Redux Toolkit. Zustand nhẹ hơn nhiều nhưng Redux có DevTools xịn hơn. Trade-off nào phù hợp với team ~15 người?',
    media: [],
    privacy: 'public',
    reactions: {
      counts: { like: 32, love: 5, haha: 2, wow: 1, sad: 0, angry: 0 },
      myReaction: null,
      total: 40,
    },
    commentCount: 28,
    shareCount: 3,
    createdAt: '2026-09-22T21:15:00Z',
  },
  {
    id: 'p3',
    author: users[2],
    content:
      'Chia sẻ bộ sưu tập UI components & Chiến lược Backtest EMA Cross mình build cho dự án vừa rồi. Tất cả đều accessible, có TypeScript types đầy đủ và có docs rõ ràng. Mọi người có thể fork về trải nghiệm nhé!',
    media: [
      {
        id: 'm2',
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=700&h=350&fit=crop&auto=format',
        type: 'image',
        alt: 'Code on screen',
      },
      {
        id: 'm3',
        url: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=700&h=350&fit=crop&auto=format',
        type: 'image',
        alt: 'UI design components',
      },
    ],
    privacy: 'public',
    reactions: {
      counts: { like: 119, love: 67, haha: 0, wow: 24, sad: 0, angry: 0 },
      myReaction: 'like',
      total: 210,
    },
    commentCount: 41,
    shareCount: 35,
    createdAt: '2026-09-22T14:00:00Z',
  },
  {
    id: 'p4',
    author: users[3],
    content:
      'Cuối tuần này mình tổ chức buổi sharing nhỏ về Quantitative Trading & Backtest Engine. Ai ở HN muốn tham gia ping mình nhé. Chỗ giới hạn 20 người.',
    media: [],
    privacy: 'friends',
    reactions: {
      counts: { like: 28, love: 12, haha: 0, wow: 5, sad: 0, angry: 0 },
      myReaction: null,
      total: 45,
    },
    commentCount: 19,
    shareCount: 8,
    createdAt: '2026-09-22T09:45:00Z',
  },
];

export const mockComments: Comment[] = [
  {
    id: 'c1',
    postId: 'p2',
    author: currentUser,
    content: 'Mình đang dùng Zustand cho 2 project lớn, rất ổn! Kết hợp với Immer thì viết reducer cũng dễ như Redux.',
    reactions: { counts: { like: 8, love: 2, haha: 0, wow: 0, sad: 0, angry: 0 }, myReaction: null, total: 10 },
    replyCount: 3,
    createdAt: '2026-09-22T21:30:00Z',
  },
  {
    id: 'c2',
    postId: 'p2',
    author: users[2],
    content: 'Redux Toolkit đã simplify rất nhiều so với Redux thuần. DevTools cực xịn, time-travel debugging rất tiện khi debug.',
    reactions: { counts: { like: 12, love: 1, haha: 0, wow: 0, sad: 0, angry: 0 }, myReaction: null, total: 13 },
    replyCount: 1,
    createdAt: '2026-09-22T21:45:00Z',
  },
  {
    id: 'c3',
    postId: 'p2',
    author: users[0],
    content: 'Team 15 người mà không có convention chặt thì Zustand dễ bị loạn lắm. RTK Query + Redux Toolkit là combo mình recommend cho team lớn.',
    reactions: { counts: { like: 15, love: 3, haha: 0, wow: 2, sad: 0, angry: 0 }, myReaction: 'like', total: 20 },
    replyCount: 5,
    createdAt: '2026-09-22T22:00:00Z',
  },
];

export const mockGroups: Group[] = [
  {
    id: 'g1',
    name: 'Cộng Đồng Trader & Quant VN',
    coverUrl: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=200&fit=crop&auto=format',
    privacy: 'public',
    memberCount: 12847,
    isMember: true,
    isPendingApproval: false,
    description: 'Cộng đồng lập trình viên & nhà giao dịch thuật toán Việt Nam',
  },
  {
    id: 'g2',
    name: 'React & Trading Engine VN',
    coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop&auto=format',
    privacy: 'public',
    memberCount: 5632,
    isMember: true,
    isPendingApproval: false,
  },
  {
    id: 'g3',
    name: 'Chiến Lược Backtest Nâng Cao',
    coverUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=400&h=200&fit=crop&auto=format',
    privacy: 'private',
    memberCount: 847,
    isMember: false,
    isPendingApproval: false,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'reaction',
    actor: users[0],
    message: 'đã thả tim bài viết của bạn',
    createdAt: '2026-09-23T08:45:00Z',
    isRead: false,
  },
  {
    id: 'n2',
    type: 'comment',
    actor: users[1],
    message: 'đã bình luận về bài viết của bạn',
    createdAt: '2026-09-23T07:30:00Z',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'friend_request',
    actor: users[3],
    message: 'đã gửi lời mời kết bạn',
    createdAt: '2026-09-22T20:00:00Z',
    isRead: true,
  },
  {
    id: 'n4',
    type: 'mention',
    actor: users[2],
    message: 'đã nhắc đến bạn trong một bình luận',
    createdAt: '2026-09-22T14:15:00Z',
    isRead: true,
  },
];

export const mockFriendRequests: FriendRequest[] = [
  {
    id: 'fr1',
    from: users[3],
    to: currentUser,
    status: 'pending',
    createdAt: '2026-09-22T20:00:00Z',
  },
];

export const suggestedFriends = users.slice(1, 4);
