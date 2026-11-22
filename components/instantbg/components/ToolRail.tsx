import React from 'react';
import {
  SplitSquareHorizontal,
  Eraser,
  Paintbrush,
  Wand2,
  Hand,
  Undo2,
  Redo2,
  Eye,
  Contrast,
} from 'lucide-react';
import { ToolMode } from '../types/studio';

interface ToolRailProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  invertMask: boolean;
  onToggleInvert: () => void;
  peekOriginal: boolean;
  onPeekStart: () => void;
  onPeekEnd: () => void;
}

const TOOLS: {
  id: ToolMode;
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'compare', label: 'Inspect & Split', shortcut: 'V', icon: SplitSquareHorizontal },
  { id: 'erase', label: 'Erase Brush', shortcut: 'E', icon: Eraser },
  { id: 'restore', label: 'Restore Brush', shortcut: 'R', icon: Paintbrush },
  { id: 'wand', label: 'Magic Wand', shortcut: 'W', icon: Wand2 },
  { id: 'pan', label: 'Pan Canvas', shortcut: 'H', icon: Hand },
];

export const ToolRail: React.FC<ToolRailProps> = ({
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  invertMask,
  onToggleInvert,
  peekOriginal,
  onPeekStart,
  onPeekEnd,
}) => {
  return (
    <aside
      aria-label="Retouch tools"
      className="w-14 shrink-0 border-r border-white/[0.08] bg-[#111318] flex flex-col items-center py-3 justify-between select-none"
    >
      <div className="flex flex-col items-center gap-1.5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const active = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              aria-label={`${tool.label} (${tool.shortcut})`}
              aria-pressed={active}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                active
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#9DA4B0] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
            </button>
          );
        })}

        <div className="w-6 h-px bg-white/[0.08] my-2" aria-hidden="true" />

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-[#9DA4B0] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Undo2 className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-[#9DA4B0] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Redo2 className="w-[18px] h-[18px]" />
        </button>

        <button
          type="button"
          onClick={onToggleInvert}
          title="Invert Cutout Mask (I)"
          aria-label="Invert Cutout Mask"
          aria-pressed={invertMask}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            invertMask
              ? 'bg-white/[0.14] text-white'
              : 'text-[#9DA4B0] hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Contrast className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Hold-to-peek original photo */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onPointerDown={onPeekStart}
          onPointerUp={onPeekEnd}
          onPointerLeave={onPeekEnd}
          onPointerCancel={onPeekEnd}
          title="Hold to Peek Original (Space)"
          aria-label="Hold to Peek Original"
          aria-pressed={peekOriginal}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            peekOriginal
              ? 'bg-white text-[#0C0D10]'
              : 'text-[#9DA4B0] hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Eye className="w-[18px] h-[18px]" />
        </button>
      </div>
    </aside>
  );
};
