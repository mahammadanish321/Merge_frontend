import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RefreshCw } from 'lucide-react';
import api from '../../api';
import './FlashcardDrawer.css';

const FlashcardDrawer = ({ isOpen, onClose, padId }) => {
  const [view, setView] = useState('review'); // 'generate' or 'review'
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genSource, setGenSource] = useState('From Notes');
  const [genCount, setGenCount] = useState(10);

  useEffect(() => {
    if (isOpen && padId) {
      fetchCards();
    }
  }, [isOpen, padId]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pads/${padId}/flashcards`);
      setCards(res.data || []);
      setCurrentIndex(0);
      setIsFlipped(false);
      setView(res.data && res.data.length > 0 ? 'review' : 'generate');
    } catch (err) {
      console.error('Error fetching flashcards', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCards = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/pads/${padId}/flashcards/generate`, {
        source: genSource,
        count: genCount
      });
      setCards(prev => [...prev, ...(res.data || [])]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setView('review');
    } catch (err) {
      console.error('Error generating flashcards', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating) => {
    const currentCard = cards[currentIndex];
    if (currentCard && currentCard._id) {
      try {
        await api.put(`/pads/${padId}/flashcards/${currentCard._id}`, { confidence: rating });
      } catch (err) {
        console.error('Error rating card', err);
      }
    }
    nextCard();
  };

  const deleteCard = async () => {
    const currentCard = cards[currentIndex];
    if (!currentCard || !currentCard._id) return;
    try {
      await api.delete(`/pads/${padId}/flashcards/${currentCard._id}`);
      const newCards = [...cards];
      newCards.splice(currentIndex, 1);
      setCards(newCards);
      setIsFlipped(false);
      if (currentIndex >= newCards.length) {
        setCurrentIndex(Math.max(0, newCards.length - 1));
      }
      if (newCards.length === 0) setView('generate');
    } catch (err) {
      console.error('Error deleting card', err);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // reached end
        setCurrentIndex(0);
      }
    }, 150);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="flashcard-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="flashcard-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="drawer-header">
              <h2>Flashcards</h2>
              <div className="drawer-actions">
                <button 
                  className="switch-view-btn"
                  onClick={() => {
                    setView(view === 'generate' ? 'review' : 'generate');
                    setIsFlipped(false);
                  }}
                >
                  {view === 'generate' ? 'Back to Review' : 'Generate More'}
                </button>
                <button className="icon-btn" onClick={onClose}><X size={20} /></button>
              </div>
            </div>

            <div className="drawer-content">
              {view === 'generate' ? (
                <div className="generate-view">
                  <h3>Create New Flashcards</h3>
                  <div className="form-group">
                    <label>Source Material</label>
                    <select value={genSource} onChange={(e) => setGenSource(e.target.value)}>
                      <option value="From Notes">From Notes</option>
                      <option value="From Documents">From Documents</option>
                      <option value="From Canvas">From Canvas</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Number of Cards</label>
                    <div className="count-selector">
                      {[5, 10, 15, 20].map(num => (
                        <button 
                          key={num}
                          className={`count-btn ${genCount === num ? 'active' : ''}`}
                          onClick={() => setGenCount(num)}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    className="primary-btn generate-btn" 
                    onClick={generateCards}
                    disabled={loading}
                  >
                    {loading ? <RefreshCw className="spin" size={18} /> : 'Generate Flashcards'}
                  </button>
                </div>
              ) : (
                <div className="review-view">
                  {cards.length === 0 ? (
                    <div className="empty-state">
                      <p>No flashcards found.</p>
                      <button className="secondary-btn" onClick={() => setView('generate')}>
                        Generate some now
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="review-header">
                        <span className="progress-text">Card {currentIndex + 1} of {cards.length}</span>
                        <button className="icon-btn danger" onClick={deleteCard} title="Delete Card">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flashcard-container" onClick={() => setIsFlipped(!isFlipped)}>
                        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                          <div className="flashcard-front">
                            <div className="card-content">
                              <span className="card-label">Q</span>
                              <p>{cards[currentIndex]?.question}</p>
                            </div>
                            <p className="flip-hint">Click to reveal answer</p>
                          </div>
                          <div className="flashcard-back">
                            <div className="card-content">
                              <span className="card-label">A</span>
                              <p>{cards[currentIndex]?.answer}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isFlipped && (
                        <div className="rating-container">
                          <p>How well did you know this?</p>
                          <div className="rating-buttons">
                            <button className="rating-btn again" onClick={() => handleRate(1)}>
                              <span className="emoji">😟</span>
                              <span className="label">Again (1)</span>
                            </button>
                            <button className="rating-btn hard" onClick={() => handleRate(2)}>
                              <span className="emoji">🤔</span>
                              <span className="label">Hard (2)</span>
                            </button>
                            <button className="rating-btn good" onClick={() => handleRate(3)}>
                              <span className="emoji">😊</span>
                              <span className="label">Good (3)</span>
                            </button>
                            <button className="rating-btn easy" onClick={() => handleRate(4)}>
                              <span className="emoji">🤩</span>
                              <span className="label">Easy (4)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export { FlashcardDrawer };
export default FlashcardDrawer;
