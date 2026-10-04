import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, ArrowLeft, RefreshCw, Trash2, Trophy } from 'lucide-react';
import api from '../../api';
import './QuizModal.css';

const QuizModal = ({ isOpen, onClose, padId }) => {
  const [view, setView] = useState('list'); // 'list', 'active', 'results'
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState(null);

  const [genCount, setGenCount] = useState(5);
  const [genDiff, setGenDiff] = useState('medium');

  useEffect(() => {
    if (isOpen && padId && view === 'list') {
      fetchQuizzes();
    }
  }, [isOpen, padId, view]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pads/${padId}/quizzes`);
      setQuizzes(res.data || []);
    } catch (err) {
      console.error('Error fetching quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/pads/${padId}/quiz/generate`, {
        count: genCount,
        difficulty: genDiff
      });
      const newQuiz = res.data;
      setQuizzes(prev => [newQuiz, ...prev]);
      startQuiz(newQuiz);
    } catch (err) {
      console.error('Error generating quiz', err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResults(null);
    setView('active');
  };

  const deleteQuiz = async (quizId) => {
    try {
      await api.delete(`/pads/${padId}/quizzes/${quizId}`);
      setQuizzes(prev => prev.filter(q => q._id !== quizId));
    } catch (err) {
      console.error('Error deleting quiz', err);
    }
  };

  const handleSelectOption = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      const answersArray = currentQuiz.questions.map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id] !== undefined ? answers[q._id] : -1
      }));
      
      const res = await api.post(`/pads/${padId}/quiz/${currentQuiz._id}/submit`, { answers: answersArray });
      setResults(res.data);
      setView('results');
    } catch (err) {
      console.error('Error submitting quiz', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQ = currentQuiz?.questions?.[currentQuestionIndex];
  const allAnswered = currentQuiz?.questions?.every(q => answers[q._id] !== undefined);

  if (!isOpen) return null;

  return (
    <div className="quiz-modal-overlay">
      <motion.div 
        className="quiz-modal"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <button className="quiz-close-btn" onClick={onClose}><X /></button>

        {view === 'list' && (
          <div className="quiz-view-list">
            <div className="quiz-header">
              <h2>Study Quizzes</h2>
            </div>
            
            <div className="quiz-generator-card">
              <h3>Generate New Quiz</h3>
              <div className="generator-controls">
                <div className="control-group">
                  <label>Questions</label>
                  <select value={genCount} onChange={e => setGenCount(Number(e.target.value))}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                  </select>
                </div>
                <div className="control-group">
                  <label>Difficulty</label>
                  <select value={genDiff} onChange={e => setGenDiff(e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <button 
                  className="generate-btn" 
                  onClick={generateQuiz} 
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="spin" size={18} /> : 'Generate'}
                </button>
              </div>
            </div>

            <div className="quiz-list">
              {loading && quizzes.length === 0 ? (
                <div className="loading-state">Loading quizzes...</div>
              ) : quizzes.length === 0 ? (
                <div className="empty-state">No quizzes generated yet.</div>
              ) : (
                quizzes.map((quiz, idx) => (
                  <div key={quiz._id || idx} className="quiz-list-item">
                    <div className="quiz-item-info">
                      <h4>{quiz.title || `Quiz ${quizzes.length - idx}`}</h4>
                      <p>{quiz.questions?.length || 0} Questions • Difficulty: {quiz.difficulty || 'Mixed'}</p>
                    </div>
                    <div className="quiz-item-actions">
                      {quiz.bestScore !== undefined && (
                        <div className="best-score">
                          <Trophy size={16} /> 
                          {quiz.bestScore}%
                        </div>
                      )}
                      <button className="start-btn" onClick={() => startQuiz(quiz)}>Start</button>
                      <button className="delete-btn" onClick={() => deleteQuiz(quiz._id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'active' && currentQ && (
          <div className="quiz-view-active">
            <div className="quiz-active-header">
              <div className="quiz-progress">
                Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
              </div>
              <div className="quiz-dots">
                {currentQuiz.questions.map((q, idx) => (
                  <div 
                    key={idx} 
                    className={`dot ${idx === currentQuestionIndex ? 'active' : ''} ${answers[q._id] !== undefined ? 'answered' : ''}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  />
                ))}
              </div>
            </div>

            <div className="question-container">
              <h3 className="question-text">{currentQ.text}</h3>
              <div className="options-list">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ._id] === idx;
                  const letters = ['A', 'B', 'C', 'D', 'E'];
                  return (
                    <button 
                      key={idx}
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(currentQ._id, idx)}
                    >
                      <span className="option-letter">{letters[idx]}</span>
                      <span className="option-text">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="quiz-navigation">
              <button 
                className="nav-btn" 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              >
                <ArrowLeft size={18} /> Previous
              </button>
              
              {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
                <button 
                  className="submit-quiz-btn" 
                  disabled={!allAnswered || loading}
                  onClick={submitQuiz}
                >
                  {loading ? <RefreshCw className="spin" size={18} /> : 'Submit Quiz'}
                </button>
              ) : (
                <button 
                  className="nav-btn primary" 
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                >
                  Next <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'results' && results && (
          <div className="quiz-view-results">
            <div className="results-header">
              <h2>Quiz Results</h2>
              <div className={`score-circle ${results.score >= 70 ? 'good' : results.score >= 50 ? 'okay' : 'bad'}`}>
                <span className="score-number">{results.score}</span>
                <span className="score-percent">%</span>
              </div>
              <p className="score-summary">
                You got {results.correctCount} out of {results.totalCount} correct!
              </p>
            </div>

            <div className="review-list">
              {results.review.map((item, idx) => (
                <div key={idx} className={`review-item ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="review-question-header">
                    <span className="q-num">Q{idx + 1}</span>
                    {item.isCorrect ? <Check className="icon-correct" /> : <X className="icon-incorrect" />}
                  </div>
                  <p className="r-question">{item.questionText}</p>
                  
                  <div className="r-answers">
                    <div className="r-answer user">
                      <span className="label">Your Answer:</span>
                      <span className={`text ${item.isCorrect ? 'text-correct' : 'text-incorrect'}`}>
                        {item.userAnswerText || 'Skipped'}
                      </span>
                    </div>
                    {!item.isCorrect && (
                      <div className="r-answer correct">
                        <span className="label">Correct Answer:</span>
                        <span className="text text-correct">{item.correctAnswerText}</span>
                      </div>
                    )}
                  </div>
                  
                  {item.explanation && (
                    <div className="r-explanation">
                      <strong>Explanation:</strong> {item.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="results-actions">
              <button className="secondary-btn" onClick={() => setView('list')}>Back to Quizzes</button>
              <button className="primary-btn" onClick={() => startQuiz(currentQuiz)}>Retake Quiz</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export { QuizModal };
export default QuizModal;
