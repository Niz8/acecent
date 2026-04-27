// effects.js — Project Acecent
// Launch calculation engine: processes held cards, burned fuel, penalties

const FUEL_PER_BURN_UNIT = 1000; // 1 burn value unit = 1000 ft base

// Altitude tiers
const ALTITUDE_TIERS = [
  { name: 'Launch Failure',  emoji: '📉', min: 0,       max: 9999   },
  { name: 'Troposphere',     emoji: '🌤️', min: 10000,   max: 49999  },
  { name: 'Stratosphere',    emoji: '🌥️', min: 50000,   max: 99999  },
  { name: 'Mesosphere',      emoji: '🌌', min: 100000,  max: 249999 },
  { name: 'Thermosphere',    emoji: '🔥', min: 250000,  max: 499999 },
  { name: 'Exosphere',       emoji: '🌠', min: 500000,  max: 899999 },
  { name: 'Orbital',         emoji: '🛸', min: 900000,  max: Infinity },
];

function getTier(altitude) {
  return ALTITUDE_TIERS.find(t => altitude >= t.min && altitude <= t.max) || ALTITUDE_TIERS[0];
}

// Build a gameState context object for effect functions
function buildGameStateContext(heldCards, burnedCards, rng) {
  const heldSuitCounts = {};
  for (const card of heldCards) {
    heldSuitCounts[card.suit] = (heldSuitCounts[card.suit] || 0) + 1;
  }

  // Check for pairs in held hand
  const rankCounts = {};
  for (const card of heldCards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }
  const handHasPair = Object.values(rankCounts).some(v => v >= 2);

  return {
    heldCards,
    burnedCards,
    rng,
    handHasPair,
    heldSuitCount: (suit) => heldSuitCounts[suit] || 0,
    burnedSuitCount: (suit) => burnedCards.filter(c => c.suit === suit).length,
  };
}

// Calculate fuel from burned cards
function calculateFuel(burnedCards, heldCards, gs) {
  let fuel = 0;
  const log = [];

  // Check for King of Spades fuel doubler
  const hasKingSpades = heldCards.some(c => c.id === 'K_spades');
  // Check for Queen of Diamonds fuel efficiency
  const hasQueenDiamonds = heldCards.some(c => c.id === 'Q_diamonds');

  for (const card of burnedCards) {
    let cardFuel = card.burnValue * FUEL_PER_BURN_UNIT;
    let multiplier = 1;

    if (hasKingSpades && card.suit === 'spades') {
      multiplier *= 2;
    }
    if (hasQueenDiamonds) {
      multiplier *= 1.2;
    }

    const finalFuel = Math.round(cardFuel * multiplier);
    fuel += finalFuel;

    const multNote = multiplier > 1 ? ` (✖️${multiplier.toFixed(1)}x boosted)` : '';
    log.push(`⛽ ${card.emoji} ${card.rank}${card.suitSymbol} burned: +${finalFuel.toLocaleString()} ft${multNote}`);
  }

  return { fuel, log };
}

// Engine stress penalty: burning 4+ cards without Hearts stabilizer
function checkEnginePenalties(burnedCards, heldCards, log) {
  const penalties = [];
  const hasHeartsPenaltyBlock = heldCards.some(c =>
    c.id === 'K_hearts' || c.id === 'Q_hearts' || c.id === 'A_hearts' || c.id === 'Q_clubs'
  );

  if (burnedCards.length >= 4 && !hasHeartsPenaltyBlock) {
    penalties.push({ type: 'engineStress', altitudeMult: 0.85 });
    log.push('⚠️ ENGINE STRESS: 4+ cards burned without Life Support! ✖️0.85x altitude');
  }

  // Red/black conflict: 3+ cards of mixed red/black suits
  const redSuits = ['hearts', 'diamonds'];
  const blackSuits = ['spades', 'clubs'];
  const redCount = heldCards.filter(c => redSuits.includes(c.suit)).length;
  const blackCount = heldCards.filter(c => blackSuits.includes(c.suit)).length;

  const hasConflictBlock = heldCards.some(c => c.id === 'K_hearts');

  if (redCount >= 2 && blackCount >= 2 && !hasConflictBlock) {
    penalties.push({ type: 'suitConflict', altitudeMult: 0.9 });
    log.push('⚠️ SIGNAL INTERFERENCE: Mixed suit conflict! ✖️0.9x altitude');
  }

  return penalties;
}

// Process all held card effects in order
function processHeldEffects(heldCards, gs) {
  const log = [];
  let flatBonus = 0;
  let multipliers = [];
  let blockPenaltyCount = 0;
  let blockSuitPenalty = false;

  // Process in a defined order: shields first, then bonuses, then multipliers
  const ordered = [...heldCards].sort((a, b) => {
    const priority = (card) => {
      if (card.id === 'K_hearts' || card.id === 'Q_hearts' || card.id === 'A_hearts') return 0;
      if (card.holdEffect?.fn) {
        const result = card.holdEffect.fn(gs);
        if (result.altitudeMult) return 2;
        if (result.blockPenalty || result.blockSuitPenalty) return 0;
      }
      return 1;
    };
    return priority(a) - priority(b);
  });

  for (const card of ordered) {
    if (!card.holdEffect) continue;

    const result = card.holdEffect.fn(gs);

    if (result.altitudeFlat) {
      flatBonus += result.altitudeFlat;
    }
    if (result.altitudeMult) {
      multipliers.push(result.altitudeMult);
    }
    if (result.blockPenalty) {
      blockPenaltyCount++;
    }
    if (result.blockSuitPenalty) {
      blockSuitPenalty = true;
    }
    if (result.wildcard) {
      // Jack of Clubs: computed after we know base
      // Store for later resolution
      result._wildcard = true;
    }

    log.push(result.message);
  }

  return { flatBonus, multipliers, blockPenaltyCount, blockSuitPenalty, log };
}

// Master launch calculation
function calculateLaunch(heldCards, burnedCards, rng) {
  const gs = buildGameStateContext(heldCards, burnedCards, rng);
  const fullLog = [];

  fullLog.push('🔧 ENGINE CHECK...');

  // 1. Fuel from burned cards
  const { fuel, log: fuelLog } = calculateFuel(burnedCards, heldCards, gs);
  fullLog.push(...fuelLog);
  fullLog.push(`⛽ Total fuel: ${fuel.toLocaleString()} ft`);

  // 2. Penalties
  const penalties = checkEnginePenalties(burnedCards, heldCards, fullLog);

  // 3. Held card effects
  const { flatBonus, multipliers, blockPenaltyCount, blockSuitPenalty, log: effectLog } = processHeldEffects(heldCards, gs);
  fullLog.push(...effectLog);

  // 4. Apply flat bonuses
  let altitude = fuel + flatBonus;
  if (flatBonus > 0) fullLog.push(`🚀 Flat bonuses: +${flatBonus.toLocaleString()} ft → ${altitude.toLocaleString()} ft`);

  // 5. Apply multipliers
  for (const mult of multipliers) {
    altitude = Math.round(altitude * mult);
    fullLog.push(`✖️ Multiplier ✖️${mult}x → ${altitude.toLocaleString()} ft`);
  }

  // 6. Apply penalties (with block logic)
  let remainingBlocks = blockPenaltyCount;
  for (const penalty of penalties) {
    if (penalty.type === 'suitConflict' && blockSuitPenalty) {
      fullLog.push('🛡️ Suit conflict penalty BLOCKED by King of Hearts!');
      continue;
    }
    if (remainingBlocks > 0) {
      fullLog.push(`🛡️ Penalty BLOCKED by life support card!`);
      remainingBlocks--;
      continue;
    }
    altitude = Math.round(altitude * penalty.altitudeMult);
    fullLog.push(`⚠️ Penalty applied → ${altitude.toLocaleString()} ft`);
  }

  // 7. Floor at 0
  altitude = Math.max(0, altitude);

  const tier = getTier(altitude);
  fullLog.push(`🎯 FINAL ALTITUDE: ${altitude.toLocaleString()} ft`);
  fullLog.push(`${tier.emoji} ${tier.name.toUpperCase()}`);

  return { altitude, tier, log: fullLog };
}

export { calculateLaunch, getTier, ALTITUDE_TIERS, FUEL_PER_BURN_UNIT };
