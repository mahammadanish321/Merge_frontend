import React from 'react';
import { Pencil, Columns, FileText } from 'lucide-react';

const PadModeToggle = ({ mode, onChange }) => {
  return (
    <div className="pad-mode-segmented-control" role="tablist" aria-label="Pad View Mode">
      <button 
        className={`mode-segment-btn ${mode === 'canvas' ? 'active' : ''}`}
        onClick={() => onChange('canvas')}
        title="Canvas Mode (Drawing & Mindmapping)"
        type="button"
        role="tab"
        aria-selected={mode === 'canvas'}
      >
        <Pencil size={14} />
        <span>Canvas</span>
      </button>
      <button 
        className={`mode-segment-btn ${mode === 'split' ? 'active' : ''}`}
        onClick={() => onChange('split')}
        title="Split View (Notes + Canvas side-by-side)"
        type="button"
        role="tab"
        aria-selected={mode === 'split'}
      >
        <Columns size={14} />
        <span>Split</span>
      </button>
      <button 
        className={`mode-segment-btn ${mode === 'notes' ? 'active' : ''}`}
        onClick={() => onChange('notes')}
        title="Notes Mode (Rich-Text Document)"
        type="button"
        role="tab"
        aria-selected={mode === 'notes'}
      >
        <FileText size={14} />
        <span>Notes</span>
      </button>
    </div>
  );
};

export { PadModeToggle };
export default PadModeToggle;
