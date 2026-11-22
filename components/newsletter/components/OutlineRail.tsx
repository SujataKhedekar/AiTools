import {
  AlignLeft,
  BarChart3,
  Heading2,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Minus,
  MousePointerClick,
  Quote,
} from 'lucide-react';
import React from 'react';
import { BlockType, NewsletterBlock } from '../types/newsletter';

interface OutlineRailProps {
  blocks: NewsletterBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onInsertBlock: (type: BlockType) => void;
}

const BLOCK_CATALOG: {
  type: BlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
  { type: 'heading', label: 'Section Heading', icon: Heading2 },
  { type: 'image', label: 'Photograph', icon: ImageIcon },
  { type: 'quote', label: 'Pull Quote', icon: Quote },
  { type: 'links', label: 'Curated Links', icon: Link2 },
  { type: 'callout', label: 'Editor’s Note', icon: MessageSquare },
  { type: 'button', label: 'CTA Button', icon: MousePointerClick },
  { type: 'metrics', label: 'Key Figures', icon: BarChart3 },
  { type: 'divider', label: 'Divider', icon: Minus },
];

function summarizeBlock(block: NewsletterBlock): string {
  switch (block.type) {
    case 'heading':
      return block.text.trim() || 'Untitled heading';
    case 'paragraph':
      return block.text.replace(/\*\*|\*/g, '').trim().slice(0, 38) || 'Empty paragraph';
    case 'image':
      return block.caption.trim().slice(0, 36) || block.alt.trim().slice(0, 36) || 'Image block';
    case 'quote':
      return block.text.trim().slice(0, 36) || 'Pull quote';
    case 'links':
      return block.heading.trim() || `Curated links (${block.items.length})`;
    case 'callout':
      return block.title.trim() || 'Editor’s note';
    case 'button':
      return block.label.trim() || 'Button';
    case 'metrics':
      return block.heading.trim() || 'Key figures';
    case 'divider':
      return block.style === 'dinkus' ? 'Section break (* * *)' : 'Divider';
  }
}

export function OutlineRail({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onInsertBlock,
}: OutlineRailProps) {
  return (
    <aside
      aria-label="Insert blocks and document outline"
      className="w-full lg:w-[236px] xl:w-[252px] shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-white flex flex-col"
    >
      {/* Insert Blocks */}
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-xs font-semibold text-neutral-900 mb-3">Add Block</h2>
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-1">
          {BLOCK_CATALOG.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => onInsertBlock(item.type)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors text-left cursor-pointer whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Outline */}
      <div className="p-4 flex-1 overflow-y-auto hidden lg:block">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold text-neutral-900">Outline</h2>
          <span className="text-[11px] font-mono tabular-nums text-neutral-400">
            {blocks.length}
          </span>
        </div>

        {blocks.length === 0 ? (
          <p className="text-xs text-neutral-400 leading-relaxed">
            No blocks yet. Pick a block above to start writing your issue.
          </p>
        ) : (
          <ol className="space-y-0.5">
            {blocks.map((block, idx) => {
              const active = block.id === selectedBlockId;
              return (
                <li key={block.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBlock(block.id);
                      const el = document.getElementById(`editor-block-${block.id}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-baseline gap-2 cursor-pointer ${
                      active
                        ? 'bg-[#EFF6FF] text-[#1D4ED8] font-medium'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <span className="font-mono tabular-nums text-[10px] text-neutral-400 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate">{summarizeBlock(block)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}
