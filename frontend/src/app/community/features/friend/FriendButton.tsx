import { useState } from 'react';
import type { FriendStatus } from '../../types';
import Button from '../../components/Button';
import { PlusIcon, ClockIcon, CheckIcon, UsersIcon } from '../../components/Icons';

interface FriendButtonProps {
  initialStatus: FriendStatus;
  userName: string;
}

const config: Record<FriendStatus, { label: string; Icon: typeof PlusIcon; variant: 'primary' | 'secondary' }> = {
  not_friend:       { label: 'Kết bạn',         Icon: PlusIcon,    variant: 'primary' },
  pending_sent:     { label: 'Đã gửi lời mời',  Icon: ClockIcon,   variant: 'secondary' },
  pending_received: { label: 'Chấp nhận',        Icon: CheckIcon,   variant: 'primary' },
  friends:          { label: 'Bạn bè',           Icon: UsersIcon,   variant: 'secondary' },
};

export default function FriendButton({ initialStatus, userName }: FriendButtonProps) {
  const [status, setStatus] = useState<FriendStatus>(initialStatus);

  function handleClick() {
    switch (status) {
      case 'not_friend':       setStatus('pending_sent'); break;
      case 'pending_sent':     setStatus('not_friend'); break;
      case 'pending_received': setStatus('friends'); break;
      case 'friends':          setStatus('not_friend'); break;
    }
  }

  const { label, Icon, variant } = config[status];

  return (
    <Button variant={variant} size="sm" onClick={handleClick} aria-label={`${label} ${userName}`} icon={<Icon size={14} />}>
      {label}
    </Button>
  );
}
