import React, { useState } from 'react';
import { Layers, ClipboardCheck, GitBranch, Calculator, Sparkles, ChevronDown } from 'lucide-react';
import './StudyToolbar.css';

const StudyToolbar = ({ onFlashcards, onQuiz, onMindmap, onMathSolver }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="study-toolbar-wrapper collapsed">
        <button 
          className="study-toolbar-collapsed-btn" 
          onClick={() => setIsCollapsed(false)}
          title="Open Study Tools (Flashcards, Quiz, Mindmap, Math)"
          type="button"
        >
          <Sparkles size={14} />
          <span>Study Suite</span>
        </button>
      </div>
    );
  }

  return (
    <div className="study-toolbar-wrapper">
      <div className="study-toolbar">
        <button 
          className="study-toolbar-item" 
          onClick={onFlashcards} 
          aria-label="Flashcards"
          title="Generate Flashcards from Notes & Canvas"
          type="button"
        >
          <Layers className="study-icon" />
          <span className="study-tooltip">Flashcards</span>
        </button>

        <button 
          className="study-toolbar-item" 
          onClick={onQuiz} 
          aria-label="Quiz Me"
          title="Quiz Me on this Pad"
          type="button"
        >
          <ClipboardCheck className="study-icon" />
          <span className="study-tooltip">Quiz Me</span>
        </button>

        <button 
          className="study-toolbar-item" 
          onClick={onMindmap} 
          aria-label="Mindmap"
          title="Generate AI Mindmap"
          type="button"
        >
          <GitBranch className="study-icon" />
          <span className="study-tooltip">Mindmap</span>
        </button>

        <button 
          className="study-toolbar-item" 
          onClick={onMathSolver} 
          aria-label="Math Solver"
          title="Solve Handwritten or Typed Math"
          type="button"
        >
          <Calculator className="study-icon" />
          <span className="study-tooltip">Math Solver</span>
        </button>

        <div className="study-toolbar-separator" />

        <button 
          className="study-toolbar-collapse-btn" 
          onClick={() => setIsCollapsed(true)}
          title="Minimize Study Suite"
          type="button"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
};

export { StudyToolbar };
export default StudyToolbar;
