import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PenTool, BookOpen, FlaskConical, GraduationCap, GitBranch, ArrowRight, Sparkles } from 'lucide-react';
import './AcademicTemplates.css';

const TEMPLATES = [
  {
    id: 'blank',
    Icon: PenTool,
    title: 'Blank Canvas',
    badge: 'Canvas Mode',
    description: 'Start fresh with an infinite sketch canvas, drawing tools, and mindmaps.',
    data: { pad_mode: 'canvas', content_json: null, notes_content: null, title: 'Untitled Pad' }
  },
  {
    id: 'cornell',
    Icon: BookOpen,
    title: 'Cornell Notes',
    badge: 'Split Mode',
    description: 'Dual-pane layout with notes on the left and canvas diagramming on the right.',
    data: { 
      pad_mode: 'split', 
      content_json: null, 
      notes_content: { 
        type: 'doc', 
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Cornell Notes' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Questions & Cues' }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Main question or concept 1...' }] }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Detailed Notes' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Start recording detailed lecture or study notes here...' }] },
          { type: 'horizontalRule' },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Summary' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Briefly summarize the core takeaways in 2-3 sentences...' }] }
        ] 
      }, 
      title: 'Cornell Notes' 
    }
  },
  {
    id: 'lecture',
    Icon: GraduationCap,
    title: 'Lecture Notes',
    badge: 'Split Mode',
    description: 'Capture live classroom notes while illustrating diagrams on the canvas simultaneously.',
    data: { 
      pad_mode: 'split', 
      content_json: null, 
      notes_content: { 
        type: 'doc', 
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Lecture Notes' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Topic & Overview' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Enter topic, course name, and date...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Discussion Points' }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Key point 1...' }] }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Questions to Follow Up' }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item to clarify...' }] }] }] }
        ] 
      }, 
      title: 'Lecture Notes' 
    }
  },
  {
    id: 'lab',
    Icon: FlaskConical,
    title: 'Lab Experiment',
    badge: 'Notes Mode',
    description: 'Structured scientific report with objectives, procedure, observations, and conclusions.',
    data: { 
      pad_mode: 'notes', 
      content_json: null, 
      notes_content: { 
        type: 'doc', 
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Lab Experiment Report' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Objective' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'State the hypothesis and purpose of the experiment...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Materials Required' }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Apparatus or reagent 1' }] }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Procedure' }] },
          { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 1...' }] }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Observations & Data' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Record quantitative readings or qualitative observations...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Conclusion' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Summarize your findings and error analysis...' }] }
        ] 
      }, 
      title: 'Lab Report' 
    }
  },
  {
    id: 'mindmap',
    Icon: GitBranch,
    title: 'Mindmap Canvas',
    badge: 'Canvas Mode',
    description: 'A spacious visual thinking space for concept linking, brainstorming, and revision.',
    data: { pad_mode: 'canvas', content_json: null, notes_content: null, title: 'Mindmap' }
  }
];

const AcademicTemplates = ({ isOpen, onClose, onSelectTemplate }) => {
  if (!isOpen) return null;

  const handleSelect = (template) => {
    onSelectTemplate(template.data);
  };

  const handleClose = () => {
    // Default to blank canvas on explicit close
    onSelectTemplate(TEMPLATES[0].data);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="template-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div 
          className="template-modal"
          initial={{ y: 20, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="template-modal-header">
            <div>
              <div className="template-header-title-row">
                <span className="template-header-badge">
                  <Sparkles size={13} />
                  <span>Templates</span>
                </span>
              </div>
              <h2>Create a New Pad</h2>
              <p>Start with a blank canvas or pick a structured study template</p>
            </div>
            <button className="template-close-btn" onClick={handleClose} title="Close" type="button">
              <X size={18} />
            </button>
          </div>
          
          <div className="template-grid">
            {TEMPLATES.map((template) => {
              const IconComponent = template.Icon;
              return (
                <div 
                  key={template.id} 
                  className="template-card"
                  onClick={() => handleSelect(template)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="template-card-icon-box">
                    <IconComponent size={22} />
                  </div>
                  <div className="template-card-body">
                    <div className="template-card-title-row">
                      <h3>{template.title}</h3>
                      <span className="template-mode-tag">{template.badge}</span>
                    </div>
                    <p>{template.description}</p>
                  </div>
                  <div className="template-card-arrow">
                    <ArrowRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export { AcademicTemplates };
export default AcademicTemplates;
