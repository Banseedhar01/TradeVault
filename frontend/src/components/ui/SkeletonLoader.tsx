interface SkeletonLoaderProps {
  className?: string;
}

export const SkeletonLoader = ({ className = '' }: SkeletonLoaderProps) => {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
};

export const CardSkeleton = () => (
  <div className="card bg-gray-900 p-5 animate-pulse">
    <div className="space-y-4">
      <div className="h-4 bg-gray-800 rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-800 rounded w-full"></div>
        <div className="h-3 bg-gray-800 rounded w-3/4"></div>
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="h-4 bg-gray-800 rounded w-1/4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/4"></div>
      </div>
    ))}
  </div>
);