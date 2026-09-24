export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-full ${className}`} />;
}

export function SkeletonRect({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-[12px] ${className}`} />;
}

export function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-[16px] p-4 shadow-sm border border-slate-100 dark:border-gray-700/60 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-3 w-20" />
        </div>
      </div>
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-5/6" />
      <SkeletonLine className="h-4 w-4/6" />
      <SkeletonRect className="h-48 w-full" />
      <div className="flex gap-4 pt-1">
        <SkeletonLine className="h-8 w-20" />
        <SkeletonLine className="h-8 w-20" />
        <SkeletonLine className="h-8 w-20" />
      </div>
    </div>
  );
}
