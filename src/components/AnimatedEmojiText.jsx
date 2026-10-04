// src/components/AnimatedEmojiText.jsx
import React from 'react';
import { ANIMATED_EMOJI_MAP } from '../config/animatedEmojis';

/**
 * Modern Unicode emoji sequence regex including variation selectors, skin tones & ZWJ.
 * Also matches :shortcode: format.
 */
export const FULL_EMOJI_REGEX = /(:\w+:|(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:[\uFE00-\uFE0F]|\u200D|[\u{1F3FB}-\u{1F3FF}]|(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}))*)/gu;

/**
 * Analyzes whether text is comprised ONLY of emojis.
 * Returns: { isOnly: boolean, count: number, sizeMode: 'jumbo' | 'large' | 'medium' | 'inline' }
 */
export const getEmojiMeta = (text) => {
  if (!text || typeof text !== 'string') {
    return { isOnly: false, count: 0, sizeMode: 'inline' };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { isOnly: false, count: 0, sizeMode: 'inline' };
  }

  // Remove all emojis and whitespace
  const withoutEmojis = trimmed.replace(FULL_EMOJI_REGEX, '').replace(/\s+/g, '');
  const matches = trimmed.match(FULL_EMOJI_REGEX) || [];
  const isOnly = withoutEmojis.length === 0 && matches.length > 0;
  const count = matches.length;

  // Sizing rules:
  // 1 emoji = jumbo (58px)
  // 2-3 emojis = large (42px)
  // 4-6 emojis = medium (32px)
  // mixed with text = inline (1.45em)
  const sizeMode = isOnly
    ? (count === 1 ? 'jumbo' : count <= 3 ? 'large' : 'medium')
    : 'inline';

  return { isOnly, count, sizeMode };
};

/**
 * Finds matching animated emoji object from key (checking raw, clean, or variation selector)
 */
export const findAnimatedEmoji = (key) => {
  if (!key) return null;
  if (ANIMATED_EMOJI_MAP[key]) return ANIMATED_EMOJI_MAP[key];
  const clean = key.replace(/\uFE0F/g, '');
  if (ANIMATED_EMOJI_MAP[clean]) return ANIMATED_EMOJI_MAP[clean];
  const withVar = clean + '\uFE0F';
  if (ANIMATED_EMOJI_MAP[withVar]) return ANIMATED_EMOJI_MAP[withVar];
  return null;
};

/**
 * Parses text and renders 3D animated emojis (or native emojis)
 * with responsive jumbo sizing when only emojis are present.
 */
export const AnimatedEmojiText = ({ text, sizeMode: explicitSizeMode, className = '' }) => {
  if (!text) return null;

  const meta = getEmojiMeta(text);
  const sizeMode = explicitSizeMode || meta.sizeMode;

  // Split text by emoji patterns
  const parts = text.split(FULL_EMOJI_REGEX).filter(Boolean);

  return (
    <span className={`animated-text-container size-${sizeMode} ${meta.isOnly ? 'is-emoji-only-text' : ''} ${className}`}>
      {parts.map((part, index) => {
        const animatedEmoji = findAnimatedEmoji(part);

        if (animatedEmoji) {
          return (
            <img
              key={index}
              src={animatedEmoji.url}
              alt={animatedEmoji.shortcode || animatedEmoji.char}
              title={animatedEmoji.name}
              className={`inline-animated-emoji ${sizeMode}`}
              loading="lazy"
              draggable={false}
            />
          );
        }

        // Check if it's a native Unicode emoji not in our animated map
        const isNativeEmoji = part.match(FULL_EMOJI_REGEX);
        if (isNativeEmoji) {
          return (
            <span key={index} className={`native-emoji ${sizeMode}`}>
              {part}
            </span>
          );
        }

        // Normal text / spacing
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default AnimatedEmojiText;
