import { ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="w-full h-full min-h-[180px] bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center p-6 text-center text-neutral-500">
        <ImageOff className="w-5 h-5 mb-2 text-neutral-400" strokeWidth={1.5} />
        <p className="text-xs font-medium text-neutral-600">
          {fallbackTitle || alt || 'Image unavailable'}
        </p>
        <p className="text-[11px] text-neutral-400 mt-0.5">
          Choose a studio photograph or paste a direct image URL
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Newsletter visual'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
