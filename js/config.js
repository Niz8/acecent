// config.js — Project Acecent
// Version and readme content live here

const VERSION = '0.4.0-alpha';

const README = {
  version: VERSION,
  sections: [
    {
      id: 'about',
      title: '🚀 What is Project Acecent?',
      content: `Project Acecent is a daily five-card strategy game with a space launch theme. Every day a new deck is seeded — the same for everyone. You get five cards, a fuel tank, and a limited number of redraws. Your goal: get as high as possible.

Compare your altitude with friends and see who reaches Orbital.`
    },
    {
      id: 'howtoplay',
      title: '🎴 How to Play',
      content: `1. You are dealt five cards from the daily deck.
2. Each card has a BURN value — cards you discard become rocket fuel and determine your base altitude.
3. Some cards have HOLD effects — keep them in your hand and they trigger at launch.
4. Some cards have BURN effects — discard them for fuel and get a bonus (like an extra redraw).
5. Select cards in your hand to mark them for burning, then hit Redraw to burn them and draw replacements.
6. You start with 2 redraws. Some cards give you more.
7. When you are happy with your hand, hit LAUNCH.
8. Your final altitude is calculated from your fuel plus any hold effects, multipliers, and penalties.
9. You get one launch per day. Make it count.`
    },
    {
      id: 'tiers',
      title: '🌌 Altitude Tiers',
      content: `📉 Launch Failure — 0 to 9,999 ft
🌤️ Troposphere — 10,000 to 49,999 ft
🌥️ Stratosphere — 50,000 to 99,999 ft
🌌 Mesosphere — 100,000 to 249,999 ft
🔥 Thermosphere — 250,000 to 499,999 ft
🌠 Exosphere — 500,000 to 899,999 ft
🛸 Orbital — 900,000 ft and above

Orbital requires near-perfect play. Most players land in Stratosphere or Mesosphere on a good day.`
    },
    {
      id: 'cards',
      title: '⭐ Special Cards',
      subtitle: 'Note: Only cards with special effects are listed here. All cards have fuel (burn) value. More effects coming in future updates.',
      suits: [
        {
          name: 'Spades ♠️',
          theme: 'Thrust — raw power, spade combos, fuel multipliers',
          color: '#3a7bd5',
          cards: [
            { card: 'A♠️', type: 'HOLD', desc: '1.5x final altitude — only if you hold no pairs' },
            { card: 'K♠️', type: 'HOLD', desc: '2x fuel value from all burned Spades' },
            { card: 'Q♠️', type: 'HOLD', desc: '+15,000 ft if you hold 3 or more Spades' },
            { card: 'J♠️', type: 'HOLD', desc: '+8,000 ft flat' },
            { card: '10♠️', type: 'HOLD', desc: '1.5x fuel from all burned Spades — stacks with King' },
            { card: '7♠️', type: 'HOLD', desc: '+5,000 ft if you hold any other Spade' },
            { card: '2♠️', type: 'BURN', desc: 'Burns for 3x its face value in fuel' },
          ]
        },
        {
          name: 'Hearts ♥️',
          theme: 'Life Support — penalty blocking and crew synergy',
          color: '#e8334a',
          cards: [
            { card: 'A♥️', type: 'HOLD', desc: 'Blocks one penalty + 10,000 ft' },
            { card: 'K♥️', type: 'HOLD', desc: 'Blocks ALL suit conflict penalties' },
            { card: 'Q♥️', type: 'HOLD', desc: 'Blocks one penalty' },
            { card: 'J♥️', type: 'HOLD', desc: 'Blocks one penalty + 4,000 ft' },
            { card: '9♥️', type: 'HOLD', desc: '+3,000 ft per Heart held including this one' },
            { card: '6♥️', type: 'HOLD', desc: 'Blocks one penalty' },
            { card: '5♥️', type: 'HOLD', desc: 'Blocks one penalty' },
            { card: '4♥️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '3♥️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '2♥️', type: 'BURN', desc: '+1 redraw when burned' },
          ]
        },
        {
          name: 'Diamonds ♦️',
          theme: 'Engineering — synergy and pairs. All Diamonds burn for half value.',
          color: '#e8334a',
          cards: [
            { card: 'A♦️', type: 'HOLD', desc: '+30,000 ft if you hold 3 of a kind OR 4 of the same suit' },
            { card: 'K♦️', type: 'HOLD', desc: '+20,000 ft — only if you burned zero Diamonds all game' },
            { card: 'Q♦️', type: 'HOLD', desc: '+8,000 ft if you hold a pair' },
            { card: 'J♦️', type: 'HOLD', desc: '+6,000 ft if you hold no Spades' },
            { card: '10♦️', type: 'HOLD', desc: '+4,000 ft per unique suit in your held hand' },
            { card: '3♦️', type: 'HOLD', desc: '+5,000 ft if you hold a pair' },
            { card: '2♦️', type: 'HOLD', desc: '+3,000 ft if you hold a pair' },
          ]
        },
        {
          name: 'Clubs ♣️',
          theme: 'Mission Control — redraws, burn bonuses, extended peek',
          color: '#3a7bd5',
          cards: [
            { card: 'A♣️', type: 'BURN', desc: '+2 redraws when burned' },
            { card: 'K♣️', type: 'HOLD', desc: '+10,000 ft flat' },
            { card: 'Q♣️', type: 'BURN', desc: 'Reveals one additional next card suit for the rest of the game' },
            { card: 'J♣️', type: 'HOLD', desc: 'Wildcard: takes whichever is better between +8,000 ft or 1.2x altitude' },
            { card: '8♣️', type: 'HOLD', desc: '1.1x altitude multiplier per 2 Clubs held' },
            { card: '5♣️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '4♣️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '3♣️', type: 'BURN', desc: '+1 redraw when burned' },
            { card: '2♣️', type: 'BURN', desc: '+1 redraw when burned' },
          ]
        },
        {
          name: 'Jokers 🃏',
          theme: 'Wild — high risk, high reward',
          color: '#cc88ff',
          cards: [
            { card: 'Red Joker 🃏', type: 'HOLD', desc: 'ALL SYSTEMS GO — +50,000 ft flat' },
            { card: 'Black Joker 🃏', type: 'HOLD', desc: 'ANOMALY — random effect ranging from 2x altitude to a significant penalty. Risky.' },
          ]
        }
      ]
    },
    {
      id: 'penalties',
      title: '⚠️ Penalties',
      content: `Two global penalties are checked at launch:

ENGINE STRESS: If you burned 4 or more cards and hold no Hearts life support card, your final altitude is reduced to 85%. Hold any Heart with a shield effect to protect against this.

SIGNAL INTERFERENCE: If you hold 2 or more red cards AND 2 or more black cards, your altitude is reduced to 90%. The King of Hearts blocks this specifically.

Penalties are applied after multipliers. Penalty-blocking cards are processed first.`
    },
    {
      id: 'patchnotes',
      title: '📋 Patch Notes',
      patches: [
        {
          version: '0.4.0-alpha',
          date: 'April 2026',
          notes: [
            'Major card rework across all suits',
            'Diamonds: all burn for half value — holding is the strategy',
            'Diamonds: 2 and 3 now HOLD pair bonuses, Queen reworked to pair bonus',
            'Diamonds: King gives +20,000 ft but only if zero diamonds burned',
            'Diamonds: Ace gives +30,000 ft for 3 of a kind or 4 of same suit',
            'Diamonds: Jack reworked — +6,000 ft if no spades held',
            'Spades: 10 now HOLD 1.5x spade fuel (stacks multiplicatively with King)',
            'Spades: 7 reworked — +5,000 ft if you hold any other spade',
            'Clubs: Queen reworked — BURN to gain permanent extra peek for rest of game',
            'Clubs: 4 now gives +1 redraw on burn',
            'Hearts: Jack reworked — blocks one penalty + 4,000 ft',
            'Hearts: 5 and 6 now block one penalty each',
            'Multiplicative stacking — holding multiple synergy cards compounds correctly',
            'Firestore security rules locked down',
          ]
        },
        {
          version: '0.3.0-alpha',
          date: 'April 2026',
          notes: [
            'Chip tap now scrolls to card in detail view — no longer selects for burn',
            'Only tapping detail card selects it for burning',
            'Selected card count shown near redraw button',
            'Orange selected state now overwrites green condition glow on chips and cards',
            'Detail scroll position preserved after selecting a card',
            'Penalty status bar shows engine stress and signal interference warnings live',
            'Next card suit peek shown at end of quick-view strip',
            'Leaderboard close button now returns to result screen correctly',
            'Already-played screen now has View Leaderboard button',
            'Removed debug Script started text',
          ]
        },
        {
          version: '0.2.0-alpha',
          date: 'April 2026',
          notes: [
            'New quick-view strip showing hand at a glance',
            'Horizontal scrolling detail cards with light background',
            'Suit symbols now visible on dark backgrounds',
            'Firebase daily leaderboard — scores submitted after launch',
            'README/patch notes modal on first load and version bumps',
            'Floating help button accessible from any screen',
            'Privacy disclaimer on name entry screen',
            'Vibe code disclaimer and version number in footer',
            'Launch Failure no longer implies casualties',
          ]
        },
        {
          version: '0.1.0-alpha',
          date: 'April 2026',
          notes: [
            'Initial alpha release',
            'Full 54-card deck with seeded daily shuffle',
            'Five card draw with hold and burn effects',
            'Two base redraws, expandable via burn cards',
            'Seven altitude tiers from Launch Failure to Orbital',
            'Rocket hop launch animation',
            'Share card copied to clipboard',
            'Display name saved between sessions',
            'Already-played screen with share card for return visits',
          ]
        }
      ]
    }
  ]
};

export { VERSION, README };
