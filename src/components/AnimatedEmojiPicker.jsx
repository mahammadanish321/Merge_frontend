// src/components/AnimatedEmojiPicker.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Smile, Search, X } from 'lucide-react';
import { ANIMATED_EMOJIS, EMOJI_CATEGORIES } from '../config/animatedEmojis';
import './AnimatedEmojiPicker.css';

export const AnimatedEmojiPicker = ({ onSelectEmoji, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const pickerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on click outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSelectedCategory('All');
    }
  }, [isOpen]);

  // Filter emojis
  const filteredEmojis = useMemo(() => {
    return ANIMATED_EMOJIS.filter(emoji => {
      const matchesCategory = selectedCategory === 'All' || emoji.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || emoji.name.toLowerCase().includes(q) || emoji.shortcode.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="animated-emoji-picker-wrap" ref={pickerRef}>
      <button
        type="button"
        className={`animated-emoji-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        disabled={disabled}
        title="Choose animated emoji"
      >
        <Smile size={18} />
      </button>

      {isOpen && (
        <div className="animated-emoji-popover animate-fade-in">
          {/* Header & Search */}
          <div className="animated-emoji-popover-header">
            <div className="animated-emoji-search-box">
              <Search size={14} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="animated-emoji-search-input"
                placeholder="Search animated emojis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="animated-emoji-category-tabs">
            {EMOJI_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className={`animated-emoji-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="animated-emoji-grid">
            {filteredEmojis.length === 0 ? (
              <div className="animated-emoji-no-results">
                No animated emojis found
              </div>
            ) : (
              filteredEmojis.map(emoji => (
                <button
                  key={emoji.id}
                  type="button"
                  className="animated-emoji-cell"
                  onClick={() => {
                    onSelectEmoji(emoji.char || emoji.shortcode);
                    setIsOpen(false);
                  }}
                  title={`${emoji.char ? emoji.char + ' ' : ''}${emoji.name} (${emoji.shortcode})`}
                >
                  <img
                    src={emoji.url}
                    alt={emoji.name}
                    className="animated-emoji-thumb"
                    loading="lazy"
                  />
                </button>
              ))
            )}
          </div>

          {/* Footer tip */}
          <div className="animated-emoji-footer">
            <span>60fps 3D Animated Emojis</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedEmojiPicker;
