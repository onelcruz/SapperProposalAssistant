type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-xl bg-slate-800/70 ${className}`} />;
}

type SkeletonListProps = {
  rows?: number;
  rowClassName?: string;
};

export function SkeletonList({ rows = 3, rowClassName = "h-12 w-full" }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={rowClassName} />
      ))}
    </div>
  );
}
