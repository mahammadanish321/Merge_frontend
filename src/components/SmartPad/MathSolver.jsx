import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Send, CornerDownLeft, GripHorizontal } from 'lucide-react';
import './MathSolver.css';

const MathSolver = ({ isOpen, onClose, padId }) => {
  const [problem, setProblem] = useState('');
  const [history, setHistory] = useState([]);
  const [isSolving, setIsSolving] = useState(false);
  const [currentSolution, setCurrentSolution] = useState('');
  const [position, setPosition] = useState({ x: window.innerWidth - 450, y: 100 });
  const dragRef = useRef(null);

  // Simple LaTeX renderer (converts $$ blocks to styled divs and $ inline to styled spans)
  const renderMath = (text) => {
    if (!text) return null;
    
    // Split by block math $$...$$
    const blocks = text.split(/(\$\$[\s\S]*?\$\$)/g);
    
    return blocks.map((block, idx) => {
      if (block.startsWith('$$') && block.endsWith('$$')) {
        const mathContent = block.slice(2, -2);
        return (
          <div key={idx} className="math-block">
            {mathContent}
          </div>
        );
      }
      
      // Split by inline math $...$
      const inlines = block.split(/(\$[^$]+\$)/g);
      return inlines.map((inline, iIdx) => {
        if (inline.startsWith('$') && inline.endsWith('$')) {
          const inlineContent = inline.slice(1, -1);
          return (
            <span key={`${idx}-${iIdx}`} className="math-inline">
              {inlineContent}
            </span>
          );
        }
        return <span key={`${idx}-${iIdx}`}>{inline}</span>;
      });
    });
  };

  const solveProblem = async () => {
    if (!problem.trim()) return;
    
    setIsSolving(true);
    setCurrentSolution('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pads/${padId}/math-solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ problem })
      });

      if (!response.body) throw new Error("No readable stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullSolution = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') break;
              try {
                const data = JSON.parse(dataStr);
                if (data.chunk) {
                  fullSolution += data.chunk;
                  setCurrentSolution(fullSolution);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }
      
      setHistory(prev => [{ problem, solution: fullSolution }, ...prev]);
      setProblem('');
      
    } catch (err) {
      console.error('Error solving math problem:', err);
      setCurrentSolution('Sorry, an error occurred while solving the problem.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      solveProblem();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="math-solver-panel"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      drag
      dragHandle=".math-solver-header"
      dragMomentum={false}
      style={{ x: position.x, y: position.y }}
      onDragEnd={(e, info) => {
        setPosition({ 
          x: position.x + info.offset.x, 
          y: position.y + info.offset.y 
        });
      }}
    >
      <div className="math-solver-header">
        <div className="drag-handle"><GripHorizontal size={18} /></div>
        <h3>Math Solver</h3>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="math-solver-content">
        <div className="math-history">
          {history.length === 0 && !currentSolution && !isSolving && (
            <div className="math-empty">
              <p>Type a math problem below to get a step-by-step solution.</p>
              <p className="math-hint">Supports LaTeX syntax like $x^2 + y^2 = r^2$</p>
            </div>
          )}

          {history.map((item, idx) => (
            <div key={idx} className="math-history-item">
              <div className="math-problem-bubble">
                {renderMath(item.problem)}
              </div>
              <div className="math-solution-bubble">
                {renderMath(item.solution)}
              </div>
            </div>
          ))}

          {(isSolving || currentSolution) && (
            <div className="math-history-item active">
              <div className="math-problem-bubble">
                {renderMath(problem)}
              </div>
              <div className="math-solution-bubble">
                {renderMath(currentSolution)}
                {isSolving && <span className="blinking-cursor">|</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="math-solver-input">
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a math expression or word problem..."
          rows={3}
          disabled={isSolving}
        />
        <button 
          className="solve-btn"
          onClick={solveProblem}
          disabled={!problem.trim() || isSolving}
        >
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export { MathSolver };
export default MathSolver;
