interface AvatarProps {
  user: { name: string; avatarUrl?: string; isOnline?: boolean };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const dotSizeMap = {
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
  xl: 'w-3.5 h-3.5 border-2',
};

function initials(name: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function Avatar({ user, size = 'md', showOnline = false }: AvatarProps) {
  return (
    <div className="relative flex-shrink-0 select-none">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          loading="lazy"
          className={`${sizeMap[size]} rounded-full object-cover bg-blue-100 dark:bg-gray-700`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-semibold shadow-xs`}
        >
          {initials(user.name)}
        </div>
      )}
      {showOnline && user.isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizeMap[size]} rounded-full bg-emerald-500 border-white dark:border-gray-800`}
        />
      )}
    </div>
  );
}
