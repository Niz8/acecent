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
const SUITS = {
  spades:   { name: 'Spades',   symbol: '♠', emoji: '🖤', theme: 'Thrust' },
  hearts:   { name: 'Hearts',   symbol: '♥', emoji: '❤️', theme: 'Life Support' },
  diamonds: { name: 'Diamonds', symbol: '♦', emoji: '💎', theme: 'Engineering' },
  clubs:    { name: 'Clubs',    symbol: '♣', emoji: '🍀', theme: 'Mission Control' },
};

const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

const BURN_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 15
};

// Diamonds burn for floor(face/2) — holding them is the play
const DIAMOND_BURN_VALUES = {
  '2': 1, '3': 1, '4': 2, '5': 2, '6': 3,
  '7': 3, '8': 4, '9': 4, '10': 5,
  'J': 5, 'Q': 6, 'K': 6, 'A': 7
};

const CARD_EFFECTS = {

  'A_spades': {
    emoji: '🚀',
    holdEffect: {
      desc: '✖️1.5x final altitude — only if you hold no pairs',
      emoji: '✖️',
      condition: (gs) => !gs.handHasPair,
      fn: (gs) => gs.handHasPair
        ? { message: '❌ Ace of Spades: pair detected, bonus lost' }
        : { altitudeMult: 1.5, message: '🚀 Ace of Spades: NO PAIRS — ✖️1.5x THRUST!' }
    }
  },

  'K_spades': {
    emoji: '👑',
    holdEffect: {
      desc: '✖️2x fuel from all burned ♠️',
      emoji: '✖️',
      fn: () => ({ fuelMult: 2, fuelMultSuit: 'spades', message: '👑 King of Spades: Spade fuel DOUBLED!' })
    }
  },

  'Q_spades': {
    emoji: '⚡',
    holdEffect: {
      desc: '✖️1.3x final altitude if you hold 3+ ♠️',
      emoji: '✖️',
      condition: (gs) => gs.heldSuitCount('spades') >= 3,
      fn: (gs) => gs.heldSuitCount('spades') >= 3
        ? { altitudeMult: 1.3, message: '⚡ Queen of Spades: Full Thrust Array! ✖️1.3x altitude' }
        : { message: '⚡ Queen of Spades: Need 3 spades — no bonus' }
    }
  },

  'J_spades': {
    emoji: '💥',
    holdEffect: {
      desc: '✖️1.15x final altitude',
      emoji: '✖️',
      fn: () => ({ altitudeMult: 1.15, message: '💥 Jack of Spades: Booster ignition! ✖️1.15x altitude' })
    }
  },

  '10_spades': {
    emoji: '🔥',
    holdEffect: {
      desc: '✖️1.5x fuel from all burned ♠️',
      emoji: '✖️',
      fn: () => ({ fuelMult: 1.5, fuelMultSuit: 'spades', message: '🔥 10 of Spades: Auxiliary thrusters! Spade fuel ✖️1.5x' })
    }
  },

  '7_spades': {
    emoji: '🛸',
    holdEffect: {
      desc: '🚀 +5,000 ft if you hold any other ♠️',
      emoji: '🚀',
      condition: (gs) => gs.heldSuitCount('spades') >= 2,
      fn: (gs) => gs.heldSuitCount('spades') >= 2
        ? { altitudeFlat: 5000, message: '🛸 7 of Spades: Spade formation! +5,000 ft' }
        : { message: '🛸 7 of Spades: No spade wingman — no bonus' }
    }
  },

  '2_spades': {
    burnValue: 8,
    emoji: '⛽',
    burnEffect: {
      desc: '🔥 Burns for 4x face value',
      emoji: '🔥',
      fn: () => ({ message: '⛽ 2 of Spades: High-octane fuel! Boosted burn' })
    }
  },

  // ============================================================
  // HEARTS — Life Support: penalty blocking, crew synergy
  // ============================================================

  'A_hearts': {
    emoji: '💗',
    holdEffect: {
      desc: '🛡️ Blocks one penalty + ✖️1.2x altitude',
      emoji: '🛡️',
      fn: () => ({ blockPenalty: true, altitudeMult: 1.2, message: '💗 Ace of Hearts: Crew protected! Penalty blocked + ✖️1.2x altitude' })
    }
  },

  'K_hearts': {
    emoji: '🫀',
    holdEffect: {
      desc: '🛡️ Blocks ALL suit conflict penalties',
      emoji: '🛡️',
      fn: () => ({ blockSuitPenalty: true, message: '🫀 King of Hearts: Systems stable. All conflicts shielded!' })
    }
  },

  'Q_hearts': {
    emoji: '🌹',
    holdEffect: {
      desc: '🛡️ Blocks one penalty',
      emoji: '🛡️',
      fn: () => ({ blockPenalty: true, message: '🌹 Queen of Hearts: One penalty neutralized!' })
    }
  },

  'J_hearts': {
    emoji: '🩺',
    holdEffect: {
      desc: '🛡️ Blocks one penalty + ✖️1.1x altitude',
      emoji: '🛡️',
      fn: () => ({ blockPenalty: true, altitudeMult: 1.1, message: '🩺 Jack of Hearts: Medic on deck! Penalty blocked + ✖️1.1x altitude' })
    }
  },

  '9_hearts': {
    emoji: '💞',
    holdEffect: {
      desc: '✖️1.1x altitude per ♥️ held (including this)',
      emoji: '✖️',
      fn: (gs) => {
        const count = gs.heldSuitCount('hearts');
        const mult = parseFloat((1 + count * 0.1).toFixed(2));
        return { altitudeMult: mult, message: `💞 9 of Hearts: Crew synergy! ✖️${mult}x altitude (${count} hearts)` };
      }
    }
  },

  '6_hearts': {
    emoji: '🛡️',
    holdEffect: {
      desc: '🛡️ Blocks one penalty',
      emoji: '🛡️',
      fn: () => ({ blockPenalty: true, message: '🛡️ 6 of Hearts: Emergency shielding! Penalty blocked' })
    }
  },

  '5_hearts': {
    emoji: '🛡️',
    holdEffect: {
      desc: '🛡️ Blocks one penalty',
      emoji: '🛡️',
      fn: () => ({ blockPenalty: true, message: '🛡️ 5 of Hearts: Backup shielding! Penalty blocked' })
    }
  },

  '4_hearts': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 4 of Hearts: Reserve systems! +1 Redraw' })
    }
  },

  '3_hearts': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 3 of Hearts: Backup O2 tank! +1 Redraw' })
    }
  },

  '2_hearts': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 2 of Hearts: Contingency fuel! +1 Redraw' })
    }
  },

  // ============================================================
  // DIAMONDS — Engineering: synergy and pairs, low burn value
  // All diamonds burn for floor(face/2)
  // ============================================================

  'A_diamonds': {
    emoji: '💠',
    holdEffect: {
      desc: '🚀 +30,000 ft if you hold 3 of a kind OR 4 of same suit',
      emoji: '🚀',
      condition: (gs) => {
        const rankCounts = {};
        const suitCounts = {};
        for (const c of gs.heldCards) {
          rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
          suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
        }
        return Object.values(rankCounts).some(v => v >= 3) || Object.values(suitCounts).some(v => v >= 4);
      },
      fn: (gs) => {
        const rankCounts = {};
        const suitCounts = {};
        for (const c of gs.heldCards) {
          rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
          suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
        }
        const hasThreeOfKind = Object.values(rankCounts).some(v => v >= 3);
        const hasFourSuit = Object.values(suitCounts).some(v => v >= 4);
        if (hasThreeOfKind || hasFourSuit) {
          const reason = hasThreeOfKind ? '3 of a kind' : '4 of same suit';
          return { altitudeFlat: 30000, message: `💠 Ace of Diamonds: Perfect configuration (${reason})! +30,000 ft` };
        }
        return { message: '💠 Ace of Diamonds: Need 3 of a kind or 4 of same suit — no bonus' };
      }
    }
  },

  'K_diamonds': {
    emoji: '🔬',
    holdEffect: {
      desc: '✖️1.4x altitude — only if you burned zero ♦️',
      emoji: '✖️',
      condition: (gs) => gs.burnedSuitCount('diamonds') === 0,
      fn: (gs) => gs.burnedSuitCount('diamonds') === 0
        ? { altitudeMult: 1.4, message: '🔬 King of Diamonds: Pure engineering! ✖️1.4x altitude' }
        : { message: '🔬 King of Diamonds: Burned diamonds detected — bonus lost' }
    }
  },

  'Q_diamonds': {
    emoji: '⚙️',
    holdEffect: {
      desc: '✖️1.2x altitude if you hold a pair',
      emoji: '✖️',
      condition: (gs) => gs.handHasPair,
      fn: (gs) => gs.handHasPair
        ? { altitudeMult: 1.2, message: '⚙️ Queen of Diamonds: Matched components! ✖️1.2x altitude' }
        : { message: '⚙️ Queen of Diamonds: No pair — no bonus' }
    }
  },

  'J_diamonds': {
    emoji: '🛠️',
    holdEffect: {
      desc: '✖️1.15x altitude if you hold no ♠️',
      emoji: '✖️',
      condition: (gs) => gs.heldSuitCount('spades') === 0,
      fn: (gs) => gs.heldSuitCount('spades') === 0
        ? { altitudeMult: 1.15, message: '🛠️ Jack of Diamonds: Clean integration! ✖️1.15x altitude' }
        : { message: '🛠️ Jack of Diamonds: Spade interference — no bonus' }
    }
  },

  '10_diamonds': {
    emoji: '📡',
    holdEffect: {
      desc: '✖️1.1x per unique suit in hand',
      emoji: '✖️',
      fn: (gs) => {
        const suits = new Set(gs.heldCards.map(c => c.suit));
        const mult = parseFloat((suits.size * 1.1).toFixed(2));
        return { altitudeMult: mult, message: `📡 10 of Diamonds: Multi-system sync! ✖️${mult}x altitude (${suits.size} suits)` };
      }
    }
  },

  '3_diamonds': {
    emoji: '💎',
    holdEffect: {
      desc: '🚀 +8,000 ft if you hold a pair',
      emoji: '🚀',
      condition: (gs) => gs.handHasPair,
      fn: (gs) => gs.handHasPair
        ? { altitudeFlat: 8000, message: '💎 3 of Diamonds: Redundant systems! +8,000 ft' }
        : { message: '💎 3 of Diamonds: No pair — no bonus' }
    }
  },

  '2_diamonds': {
    emoji: '💎',
    holdEffect: {
      desc: '🚀 +5,000 ft if you hold a pair',
      emoji: '🚀',
      condition: (gs) => gs.handHasPair,
      fn: (gs) => gs.handHasPair
        ? { altitudeFlat: 5000, message: '💎 2 of Diamonds: Dual calibration! +5,000 ft' }
        : { message: '💎 2 of Diamonds: No pair — no bonus' }
    }
  },

  // ============================================================
  // CLUBS — Mission Control: redraws, burn bonuses, peek
  // ============================================================

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
      desc: '✖️1.2x final altitude',
      emoji: '✖️',
      fn: () => ({ altitudeMult: 1.2, message: '📻 King of Clubs: Mission Control confirms! ✖️1.2x altitude' })
    }
  },

  'Q_clubs': {
    emoji: '🗺️',
    burnEffect: {
      desc: '🔭 Reveals one additional next card suit for rest of game',
      emoji: '🔭',
      fn: () => ({ extraPeek: 1, message: '🗺️ Queen of Clubs: Extended scan! +1 card peek for rest of game' })
    }
  },

  'J_clubs': {
    emoji: '🧭',
    holdEffect: {
      desc: '✖️1.25x final altitude',
      emoji: '✖️',
      fn: () => ({ altitudeMult: 1.25, message: '🧭 Jack of Clubs: Optimal trajectory locked! ✖️1.25x altitude' })
    }
  },

  '8_clubs': {
    emoji: '🌐',
    holdEffect: {
      desc: '✖️1.15x altitude per 2 ♣️ held',
      emoji: '✖️',
      fn: (gs) => {
        const clubCount = gs.heldSuitCount('clubs');
        const mult = parseFloat((1 + Math.floor(clubCount / 2) * 0.15).toFixed(2));
        return { altitudeMult: mult, message: `🌐 8 of Clubs: Network effect! ✖️${mult}x altitude` };
      }
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

  '4_clubs': {
    emoji: '🎁',
    burnEffect: {
      desc: '🔄 +1 redraw when burned',
      emoji: '🔄',
      fn: () => ({ redraws: 1, message: '🎁 4 of Clubs: Contingency protocol! +1 Redraw' })
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

  // ============================================================
  // JOKERS
  // ============================================================

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
};

function buildDeck() {
  const cards = [];

  for (const suit of Object.keys(SUITS)) {
    for (const rank of RANKS) {
      const id = `${rank}_${suit}`;
      const baseEffect = CARD_EFFECTS[id] || {};
      const burnValue = baseEffect.burnValue ||
        (suit === 'diamonds' ? DIAMOND_BURN_VALUES[rank] : BURN_VALUES[rank]);
      cards.push({
        id,
        rank,
        suit,
        suitSymbol: SUITS[suit].symbol,
        suitEmoji: SUITS[suit].emoji,
        burnValue,
        holdEffect: baseEffect.holdEffect || null,
        burnEffect: baseEffect.burnEffect || null,
        emoji: baseEffect.emoji || '🂠',
        isNegative: baseEffect.negative || false,
      });
    }
  }

  cards.push({
    id: 'JOKER_red', rank: 'JOKER', suit: 'joker',
    suitSymbol: '🃏', suitEmoji: '🔴', burnValue: 5,
    holdEffect: CARD_EFFECTS['JOKER_red'].holdEffect,
    burnEffect: null, emoji: '🃏', isNegative: false,
  });
  cards.push({
    id: 'JOKER_black', rank: 'JOKER', suit: 'joker',
    suitSymbol: '🃏', suitEmoji: '⚫', burnValue: 5,
    holdEffect: CARD_EFFECTS['JOKER_black'].holdEffect,
    burnEffect: null, emoji: '🃏', isNegative: false,
  });

  return cards;
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

export { getDailyDeck, getDailyDateString, SUITS, RANKS, CARD_EFFECTS, DIAMOND_BURN_VALUES };
