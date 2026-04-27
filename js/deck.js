// deck.js — Project Acecent
// Seeded deck generation, card definitions, daily seed

// --- Seeded PRNG (sfc32) ---
function sfc32(a, b, c, d) {
  return function () {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}

function getDailySeed() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  // Hash the date string into 4 numbers for sfc32
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < dateStr.length; i++) {
    h1 = Math.imul(h1 ^ dateStr.charCodeAt(i), 0x9e3779b9);
    h2 = Math.imul(h2 ^ dateStr.charCodeAt(i), 0x5f4a0bc5);
  }
  return [h1 >>> 0, h2 >>> 0, (h1 ^ h2) >>> 0, (h1 + h2) >>> 0];
}

function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Card Definitions ---
// Each card: { id, rank, suit, suitSymbol, burnValue, holdEffect, burnEffect, emoji, negative }
// holdEffect: { desc, emoji, fn(gameState) -> modifier object }
// burnEffect: { desc, emoji, fn(gameState) -> modifier object } — triggered on discard

const SUITS = {
  spades:   { name: 'Spades',   symbol: '♠', emoji: '🖤', theme: 'Thrust' },
  hearts:   { name: 'Hearts',   symbol: '♥', emoji: '❤️', theme: 'Life Support' },
  diamonds: { name: 'Diamonds', symbol: '♦', emoji: '💎', theme: 'Engineering' },
  clubs:    { name: 'Clubs',    symbol: '♣', emoji: '🍀', theme: 'Mission Control' },
};

const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

// Burn values by rank
const BURN_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 15
};

// Special overrides and effects per card
// Effects use gameState to compute modifiers
// Modifier shape: { altitudeFlat?, altitudeMult?, fuelMult?, redraws?, blockPenalty?, message }

const CARD_EFFECTS = {
  // --- SPADES: Thrust ---
  'A_spades': {
    emoji: '🚀',
    holdEffect: {
      desc: '✖️1.5x final altitude — only if you hold no pairs',
      emoji: '✖️',
      condition: (gs) => !gs.handHasPair,
      fn: (gs) => gs.handHasPair ? { message: '❌ Ace of Spades: pair detected, bonus lost' } : { altitudeMult: 1.5, message: '🚀 Ace of Spades: NO PAIRS — 1.5x THRUST!' }
    }
  },
  'K_spades': {
    emoji: '👑',
    holdEffect: {
      desc: '✖️2x fuel from all burned ♠',
      emoji: '✖️',
      fn: (gs) => ({ fuelMult: 2, fuelMultSuit: 'spades', message: '👑 King of Spades: Spade fuel DOUBLED!' })
    }
  },
  'Q_spades': {
    emoji: '⚡',
    holdEffect: {
      desc: '🚀 +15,000 ft if you hold 3+ ♠',
      emoji: '🚀',
      condition: (gs) => gs.heldSuitCount('spades') >= 3,
      fn: (gs) => gs.heldSuitCount('spades') >= 3
        ? { altitudeFlat: 15000, message: '⚡ Queen of Spades: Full Thrust Array! +15,000 ft' }
        : { message: '⚡ Queen of Spades: Need 3 spades — no bonus' }
    }
  },
  'J_spades': {
    emoji: '💥',
    holdEffect: {
      desc: '🚀 +8,000 ft flat',
      emoji: '🚀',
      fn: () => ({ altitudeFlat: 8000, message: '💥 Jack of Spades: Booster ignition! +8,000 ft' })
    }
  },
  '2_spades': {
    burnValue: 6,
    emoji: '⛽',
    burnEffect: {
      desc: '🔥 Burns for 3x face value',
      emoji: '🔥',
      fn: () => ({ fuelBonus: 6, message: '⛽ 2 of Spades: High-octane fuel! Extra burn' })
    }
  },
  '7_spades': {
    emoji: '🛸',
    holdEffect: {
      desc: '🚀 +5,000 ft if you hold any ♦',
      emoji: '🔗',
      condition: (gs) => gs.heldSuitCount('diamonds') >= 1,
      fn: (gs) => gs.heldSuitCount('diamonds') >= 1
        ? { altitudeFlat: 5000, message: '🛸 7 of Spades: Engineering sync! +5,000 ft' }
        : { message: '🛸 7 of Spades: No diamonds — sync failed' }
    }
  },

  // --- HEARTS: Life Support ---
  'A_hearts': {
    emoji: '💗',
    holdEffect: {
      desc: '🛡️ Blocks one penalty + 🚀 +10,000 ft',
      emoji: '🛡️',
      fn: () => ({ blockPenalty: true, altitudeFlat: 10000, message: '💗 Ace of Hearts: Crew protected! Penalty blocked + 10,000 ft' })
    }
  },
  'K_hearts': {
    emoji: '🫀',
    holdEffect: {
      desc: '🛡️ Blocks all suit conflict penalties',
      emoji: '🛡️',
      fn: () => ({ blockSuitPenalty: true, message: '🫀 King of Hearts: Systems stable. Conflict shielded!' })
    }
  },
  'Q_hearts': {
    emoji: '🌹',
    holdEffect: {
      desc: '🛡️ Negates one penalty card in hand',
      emoji: '🛡️',
      fn: () => ({ blockPenalty: true, message: '🌹 Queen of Hearts: One penalty neutralized!' })
    }
  },
  'J_hearts': {
    emoji: '🩺',
    holdEffect: {
      desc: '🚀 +6,000 ft if no ♠ in hand',
      emoji: '🚀',
      condition: (gs) => gs.heldSuitCount('spades') === 0,
      fn: (gs) => gs.heldSuitCount('spades') === 0
        ? { altitudeFlat: 6000, message: '🩺 Jack of Hearts: Clean systems! +6,000 ft' }
        : { message: '🩺 Jack of Hearts: Spade interference — no bonus' }
    }
  },
  '3_hearts': {
    emoji: '🎁',
    burnEffect: {
      desc: '🎲 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 3 of Hearts: Backup O2 tank! +1 Redraw' })
    }
  },
  '4_hearts': {
    emoji: '🎁',
    burnEffect: {
      desc: '🎲 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 4 of Hearts: Reserve systems! +1 Redraw' })
    }
  },
  '2_hearts': {
    emoji: '🎁',
    burnEffect: {
      desc: '🎲 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 2 of Hearts: Contingency fuel! +1 Redraw' })
    }
  },
  '9_hearts': {
    emoji: '💞',
    holdEffect: {
      desc: '🚀 +3,000 ft per ♥ held (including this)',
      emoji: '🚀',
      fn: (gs) => {
        const count = gs.heldSuitCount('hearts');
        return { altitudeFlat: count * 3000, message: `💞 9 of Hearts: Crew synergy! +${count * 3000} ft` };
      }
    }
  },

  // --- DIAMONDS: Engineering ---
  'A_diamonds': {
    emoji: '💠',
    holdEffect: {
      desc: '✖️1.5x final altitude — only if you hold no pairs',
      emoji: '✖️',
      condition: (gs) => !gs.handHasPair,
      fn: (gs) => gs.handHasPair
        ? { message: '❌ Ace of Diamonds: pair detected, multiplier lost' }
        : { altitudeMult: 1.5, message: '💠 Ace of Diamonds: Optimal configuration! 1.5x altitude' }
    }
  },
  'K_diamonds': {
    emoji: '🔬',
    holdEffect: {
      desc: '✖️1.3x final altitude',
      emoji: '✖️',
      fn: () => ({ altitudeMult: 1.3, message: '🔬 King of Diamonds: Engineering excellence! 1.3x altitude' })
    }
  },
  'Q_diamonds': {
    emoji: '⚙️',
    holdEffect: {
      desc: '✖️1.2x fuel efficiency (all fuel)',
      emoji: '✖️',
      fn: () => ({ fuelMult: 1.2, fuelMultSuit: 'all', message: '⚙️ Queen of Diamonds: Fuel efficiency optimized! 1.2x all fuel' })
    }
  },
  'J_diamonds': {
    emoji: '🛠️',
    holdEffect: {
      desc: '🚀 +5,000 ft if you hold 2+ ♦',
      emoji: '🚀',
      condition: (gs) => gs.heldSuitCount('diamonds') >= 2,
      fn: (gs) => gs.heldSuitCount('diamonds') >= 2
        ? { altitudeFlat: 5000, message: '🛠️ Jack of Diamonds: Systems integrated! +5,000 ft' }
        : { message: '🛠️ Jack of Diamonds: Need 2 diamonds — no bonus' }
    }
  },
  '3_diamonds': {
    emoji: '🎁',
    burnEffect: {
      desc: '🎲 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 3 of Diamonds: Recalibration! +1 Redraw' })
    }
  },
  '2_diamonds': {
    emoji: '🎁',
    burnEffect: {
      desc: '🎲 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 2 of Diamonds: Blueprint revision! +1 Redraw' })
    }
  },
  '10_diamonds': {
    emoji: '📡',
    holdEffect: {
      desc: '🚀 +4,000 ft per unique suit in hand',
      emoji: '🚀',
      fn: (gs) => {
        const suits = new Set(gs.heldCards.map(c => c.suit));
        return { altitudeFlat: suits.size * 4000, message: `📡 10 of Diamonds: Multi-system sync! +${suits.size * 4000} ft` };
      }
    }
  },

  // --- CLUBS: Mission Control ---
  'A_clubs': {
    emoji: '🎲',
    burnEffect: {
      desc: '🔄 +2 redraws when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 2, message: '🎲 Ace of Clubs: Mission reset! +2 Redraws' })
    }
  },
  'K_clubs': {
    emoji: '📻',
    holdEffect: {
      desc: '🚀 +10,000 ft flat',
      emoji: '🚀',
      fn: () => ({ altitudeFlat: 10000, message: '📻 King of Clubs: Mission Control confirms! +10,000 ft' })
    }
  },
  'Q_clubs': {
    emoji: '🗺️',
    holdEffect: {
      desc: '🚀 +5,000 ft + blocks one ⚠️ penalty',
      emoji: '🛡️',
      fn: () => ({ altitudeFlat: 5000, blockPenalty: true, message: '🗺️ Queen of Clubs: Flight plan secured! +5,000 ft + penalty blocked' })
    }
  },
  'J_clubs': {
    emoji: '🧭',
    holdEffect: {
      desc: '🎲 Wildcard: +8,000 ft OR ✖️1.2x (whichever is higher)',
      emoji: '🎲',
      fn: (gs) => {
        // Calculated at launch time
        return { wildcard: true, message: '🧭 Jack of Clubs: Navigation computed! Best path taken' };
      }
    }
  },
  '3_clubs': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 3 of Clubs: Ground control assist! +1 Redraw' })
    }
  },
  '2_clubs': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 2 of Clubs: Comm check! +1 Redraw' })
    }
  },
  '5_clubs': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 5 of Clubs: Systems redundancy! +1 Redraw' })
    }
  },
  '8_clubs': {
    emoji: '🌐',
    holdEffect: {
      desc: '✖️1.1x altitude per 2 clubs held',
      emoji: '✖️',
      fn: (gs) => {
        const clubCount = gs.heldSuitCount('clubs');
        const mult = 1 + (Math.floor(clubCount / 2) * 0.1);
        return { altitudeMult: mult, message: `🌐 8 of Clubs: Network effect! ✖️${mult.toFixed(1)}x altitude` };
      }
    }
  },

  // --- JOKERS ---
  'JOKER_red': {
    emoji: '🃏',
    suit: 'joker',
    holdEffect: {
      desc: '🚀 +50,000 ft — ALL SYSTEMS GO',
      emoji: '🚀',
      fn: () => ({ altitudeFlat: 50000, message: '🃏 RED JOKER: ALL SYSTEMS GO! +50,000 ft' })
    }
  },
  'JOKER_black': {
    emoji: '🃏',
    suit: 'joker',
    holdEffect: {
      desc: '🎲 Random event — could be great or catastrophic',
      emoji: '🎲',
      fn: (gs) => {
        const roll = gs.rng();
        if (roll < 0.2) return { altitudeMult: 2.0, message: '🃏 BLACK JOKER: ANOMALY — DOUBLE THRUST! ✖️2x' };
        if (roll < 0.5) return { altitudeFlat: 25000, message: '🃏 BLACK JOKER: Anomaly contained! +25,000 ft' };
        if (roll < 0.75) return { altitudeFlat: -15000, message: '🃏 BLACK JOKER: ⚠️ SYSTEM FAILURE! -15,000 ft' };
        return { altitudeMult: 0.5, message: '🃏 BLACK JOKER: ⚠️ CATASTROPHIC ANOMALY! ✖️0.5x altitude' };
      }
    }
  },

  // --- NEGATIVE INTERACTIONS (applied at launch if conditions met) ---
  // Stored separately, checked globally at launch
};

// Suit conflict: 3+ mixed red/black reduces multipliers
// Engine stress: burning 4+ cards without a Hearts stabilizer caps ceiling
// These are checked in game.js at launch time

function buildDeck() {
  const cards = [];

  for (const suit of Object.keys(SUITS)) {
    for (const rank of RANKS) {
      const id = `${rank}_${suit}`;
      const baseEffect = CARD_EFFECTS[id] || {};
      cards.push({
        id,
        rank,
        suit,
        suitSymbol: SUITS[suit].symbol,
        suitEmoji: SUITS[suit].emoji,
        burnValue: baseEffect.burnValue || BURN_VALUES[rank],
        holdEffect: baseEffect.holdEffect || null,
        burnEffect: baseEffect.burnEffect || null,
        emoji: baseEffect.emoji || '🂠',
        isNegative: baseEffect.negative || false,
      });
    }
  }

  // Add jokers
  cards.push({
    id: 'JOKER_red',
    rank: 'JOKER',
    suit: 'joker',
    suitSymbol: '🃏',
    suitEmoji: '🔴',
    burnValue: 5,
    holdEffect: CARD_EFFECTS['JOKER_red'].holdEffect,
    burnEffect: null,
    emoji: '🃏',
    isNegative: false,
  });
  cards.push({
    id: 'JOKER_black',
    rank: 'JOKER',
    suit: 'joker',
    suitSymbol: '🃏',
    suitEmoji: '⚫',
    burnValue: 5,
    holdEffect: CARD_EFFECTS['JOKER_black'].holdEffect,
    burnEffect: null,
    emoji: '🃏',
    isNegative: false,
  });

  return cards; // 54 cards
}

function getDailyDeck() {
  const [a, b, c, d] = getDailySeed();
  const rng = sfc32(a, b, c, d);
  const deck = buildDeck();
  return { deck: seededShuffle(deck, rng), rng };
}

function getDailyDateString() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

export { getDailyDeck, getDailyDateString, SUITS, RANKS, CARD_EFFECTS };
