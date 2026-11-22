import React, { useState } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { PhotoItem } from '../types/studio';

interface FilmstripProps {
  photos: PhotoItem[];
  activePhotoId: string;
  onSelectPhoto: (id: string) => void;
  onRemovePhoto: (id: string) => void;
  onAddPhotoClick: () => void;
}

const FilmstripThumb: React.FC<{
  photo: PhotoItem;
  active: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}> = ({ photo, active, onSelect, onRemove }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative group shrink-0">
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-lg border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          active
            ? 'border-[#2563EB] bg-[#1B2030]'
            : 'border-white/[0.08] bg-[#151820] hover:border-white/[0.18] hover:bg-[#191D26]'
        }`}
      >
        <div className="w-11 h-8 rounded overflow-hidden bg-[#0E1015] shrink-0 flex items-center justify-center">
          {!imgError ? (
            <img
              src={photo.src}
              alt={photo.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-4 h-4 text-[#6B7280]" aria-hidden="true" />
          )}
        </div>
        <div className="text-left min-w-0 max-w-[104px]">
          <div className="text-[12px] font-medium text-[#EEF0F4] truncate leading-tight">
            {photo.name}
          </div>
          <div className="text-[11px] text-[#7E8696] truncate leading-tight mt-0.5">
            {photo.category}
          </div>
        </div>
      </button>

      {!photo.isSample && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${photo.name}`}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#242834] border border-white/[0.14] text-[#C8CDD6] hover:text-white hover:bg-[#DC2626] hover:border-[#DC2626] flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export const Filmstrip: React.FC<FilmstripProps> = ({
  photos,
  activePhotoId,
  onSelectPhoto,
  onRemovePhoto,
  onAddPhotoClick,
}) => {
  return (
    <div className="h-[68px] shrink-0 border-t border-white/[0.08] bg-[#111318] px-4 flex items-center gap-2.5 overflow-x-auto studio-scroll select-none">
      <button
        type="button"
        onClick={onAddPhotoClick}
        className="h-11 px-3.5 rounded-lg border border-dashed border-white/[0.18] hover:border-[#3B82F6] hover:bg-[#171C28] text-[12px] font-medium text-[#CBD2DE] hover:text-white inline-flex items-center gap-2 shrink-0 whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Add Photo</span>
      </button>

      <div className="w-px h-7 bg-white/[0.08] shrink-0 mx-0.5" aria-hidden="true" />

      <div className="flex items-center gap-2">
        {photos.map((photo) => (
          <FilmstripThumb
            key={photo.id}
            photo={photo}
            active={photo.id === activePhotoId}
            onSelect={() => onSelectPhoto(photo.id)}
            onRemove={() => onRemovePhoto(photo.id)}
          />
        ))}
      </div>
    </div>
  );
};
