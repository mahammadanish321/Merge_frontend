// src/config/animatedEmojis.js
// Open Source 60fps 3D Animated Emojis (Google Noto Animated / Telegram Style)

export const EMOJI_CATEGORIES = ['All', 'Faces', 'Gestures', 'Reactions & Objects'];

export const ANIMATED_EMOJIS = [
  // Faces
  { id: 'party', name: 'Party', char: '🥳', shortcode: ':party:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.webp' },
  { id: 'laugh', name: 'Joy Laugh', char: '😂', shortcode: ':laugh:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp' },
  { id: 'rofl', name: 'Rolling Laugh', char: '🤣', shortcode: ':rofl:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f923/512.webp' },
  { id: 'smile', name: 'Grin', char: '😀', shortcode: ':smile:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp' },
  { id: 'heart_eyes', name: 'Heart Eyes', char: '😍', shortcode: ':heart_eyes:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp' },
  { id: 'hearts', name: 'In Love', char: '🥰', shortcode: ':hearts:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.webp' },
  { id: 'cool', name: 'Sunglasses Cool', char: '😎', shortcode: ':cool:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp' },
  { id: 'wink', name: 'Wink', char: '😉', shortcode: ':wink:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f609/512.webp' },
  { id: 'star_struck', name: 'Star Struck', char: '🤩', shortcode: ':star_struck:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.webp' },
  { id: 'thinking', name: 'Thinking', char: '🤔', shortcode: ':thinking:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.webp' },
  { id: 'mind_blown', name: 'Mind Blown', char: '🤯', shortcode: ':mind_blown:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp' },
  { id: 'salute', name: 'Salute', char: '🫡', shortcode: ':salute:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fae1/512.webp' },
  { id: 'hug', name: 'Hug', char: '🤗', shortcode: ':hug:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.webp' },
  { id: 'pleading', name: 'Pleading Eyes', char: '🥺', shortcode: ':pleading:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f97a/512.webp' },
  { id: 'cry', name: 'Crying', char: '😭', shortcode: ':cry:', category: 'Faces', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.webp' },

  // Gestures
  { id: 'thumbsup', name: 'Thumbs Up', char: '👍', shortcode: ':thumbsup:', category: 'Gestures', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp' },
  { id: 'thumbsdown', name: 'Thumbs Down', char: '👎', shortcode: ':thumbsdown:', category: 'Gestures', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e/512.webp' },
  { id: 'clap', name: 'Clap', char: '👏', shortcode: ':clap:', category: 'Gestures', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp' },
  { id: 'wave', name: 'Wave', char: '👋', shortcode: ':wave:', category: 'Gestures', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp' },
  { id: 'peace', name: 'Peace', char: '✌️', shortcode: ':peace:', category: 'Gestures', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/270c_fe0f/512.webp' },
  { id: 'strong', name: 'Flex Muscle', char: '💪', shortcode: ':strong:', category: 'Gestures', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.webp' },
  { id: 'raised_hands', name: 'Celebrate', char: '🙌', shortcode: ':raised_hands:', category: 'Gestures', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64c/512.webp' },
  { id: 'pray', name: 'Pray / Thanks', char: '🙏', shortcode: ':pray:', category: 'Gestures', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.webp' },
  { id: 'handshake', name: 'Handshake', char: '🤝', shortcode: ':handshake:', category: 'Gestures', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f91d/512.webp' },

  // Reactions & Objects
  { id: 'fire', name: 'Fire', char: '🔥', shortcode: ':fire:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp' },
  { id: 'heart', name: 'Red Heart', char: '❤️', shortcode: ':heart:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp' },
  { id: 'sparkles', name: 'Sparkles', char: '✨', shortcode: ':sparkles:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp' },
  { id: 'tada', name: 'Party Popper', char: '🎉', shortcode: ':tada:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp' },
  { id: 'hundred', name: '100 Score', char: '💯', shortcode: ':100:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp' },
  { id: 'star', name: 'Star', char: '⭐', shortcode: ':star:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2b50/512.webp' },
  { id: 'zap', name: 'Lightning', char: '⚡', shortcode: ':zap:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/512.webp' },
  { id: 'target', name: 'Target', char: '🎯', shortcode: ':target:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/512.webp' },
  { id: 'trophy', name: 'Trophy', char: '🏆', shortcode: ':trophy:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.webp' },
  { id: 'bulb', name: 'Idea Bulb', char: '💡', shortcode: ':bulb:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a1/512.webp' },
  { id: 'rocket', name: 'Rocket', char: '🚀', shortcode: ':rocket:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp' },
  { id: 'brain', name: 'Brain', char: '🧠', shortcode: ':brain:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9e0/512.webp' },
  { id: 'books', name: 'Books', char: '📚', shortcode: ':books:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4da/512.webp' },
  { id: 'coffee', name: 'Coffee', char: '☕', shortcode: ':coffee:', category: 'Reactions & Objects', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2615/512.webp' },
];

export const ANIMATED_EMOJI_MAP = {};
ANIMATED_EMOJIS.forEach(e => {
  ANIMATED_EMOJI_MAP[e.shortcode] = e;
  if (e.char) {
    ANIMATED_EMOJI_MAP[e.char] = e;
    ANIMATED_EMOJI_MAP[e.char.replace(/\uFE0F/g, '')] = e;
    ANIMATED_EMOJI_MAP[e.char + '\uFE0F'] = e;
  }
});

export const QUICK_REACT_EMOJIS = [
  ANIMATED_EMOJI_MAP[':fire:'],
  ANIMATED_EMOJI_MAP[':heart:'],
  ANIMATED_EMOJI_MAP[':party:'],
  ANIMATED_EMOJI_MAP[':bulb:'],
  ANIMATED_EMOJI_MAP[':thumbsup:'],
  ANIMATED_EMOJI_MAP[':clap:'],
  ANIMATED_EMOJI_MAP[':100:'],
  ANIMATED_EMOJI_MAP[':rocket:'],
];
