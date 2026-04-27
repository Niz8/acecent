// ui.js — Project Acecent
// Rendering, card display, animation, phase transitions

import { copyShareCard } from ‘./share.js’;

// — Suit helpers —
// Force emoji presentation variant with U+FE0F to avoid black-on-black on iOS
const SUIT_DISPLAY = {
spades:   { symbol: ‘♠️’, color: ‘#3a7bd5’ },   // blue so it’s visible on dark
hearts:   { symbol: ‘♥️’, color: ‘#e8334a’ },
diamonds: { symbol: ‘♦️’, color: ‘#e8334a’ },
clubs:    { symbol: ‘♣️’, color: ‘#3a7bd5’ },
joker:    { symbol: ‘🃏’, color: ‘#cc88ff’ },
};

function getSuitSymbol(suit) {
return SUIT_DISPLAY[suit]?.symbol || ‘?’;
}

function getSuitColor(suit) {
return SUIT_DISPLAY[suit]?.color || ‘#aaa’;
}

function buildLightGS(gameState) {
const heldSuitCounts = {};
const rankCounts = {};
for (const c of gameState.hand) {
heldSuitCounts[c.suit] = (heldSuitCounts[c.suit] || 0) + 1;
rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
}
return {
heldCards: gameState.hand,
burnedCards: gameState.burnedCards,
handHasPair: Object.values(rankCounts).some(v => v >= 2),
heldSuitCount: (suit) => heldSuitCounts[suit] || 0,
rng: gameState.rng,
};
}

function getConditionStatus(card, gameState) {
if (!card.holdEffect && !card.burnEffect) return ‘neutral’;
if (!card.holdEffect?.condition) return ‘neutral’;
return card.holdEffect.condition(buildLightGS(gameState)) ? ‘active’ : ‘inactive’;
}

// — Quick-view chip (top strip) —
function renderChip(card, gameState, isSelected) {
const el = document.createElement(‘div’);
const conditionStatus = getConditionStatus(card, gameState);
let cls = ‘hand-chip’;
if (isSelected) cls += ’ chip-selected’;
if (conditionStatus === ‘active’) cls += ’ chip-active’;
el.className = cls;
el.dataset.cardId = card.id;

const sym = getSuitSymbol(card.suit);
const col = getSuitColor(card.suit);

el.innerHTML = `<span class="chip-rank">${card.rank}</span><span class="chip-suit" style="color:${col}">${sym}</span> ${isSelected ? '<span class="chip-burn-tag">🔥</span>' : ''}`;
return el;
}

// — Full detail card (horizontal scroll area) —
function renderDetailCard(card, gameState, isSelected) {
const el = document.createElement(‘div’);
const conditionStatus = getConditionStatus(card, gameState);
let cls = ‘detail-card’;
if (isSelected) cls += ’ detail-selected’;
if (conditionStatus === ‘active’) cls += ’ detail-condition-met’;
if (conditionStatus === ‘inactive’) cls += ’ detail-condition-unmet’;
el.className = cls;
el.dataset.cardId = card.id;

const sym = getSuitSymbol(card.suit);
const col = getSuitColor(card.suit);

const holdHTML = card.holdEffect
? `<div class="detail-effect hold-effect"> <span class="effect-tag">HOLD ${card.holdEffect.emoji}</span> <span class="effect-desc">${card.holdEffect.desc}</span> </div>`
: ‘’;

const burnHTML = card.burnEffect
? `<div class="detail-effect burn-effect"> <span class="effect-tag">BURN ${card.burnEffect.emoji}</span> <span class="effect-desc">${card.burnEffect.desc}</span> </div>`
: ‘’;

const noEffect = !card.holdEffect && !card.burnEffect
? `<div class="detail-no-effect">No special effect — solid fuel value</div>`
: ‘’;

el.innerHTML = `<div class="detail-card-inner"> <div class="detail-header"> <span class="detail-rank" style="color:${col}">${card.rank}</span> <span class="detail-suit" style="color:${col}">${sym}</span> <span class="detail-emoji">${card.emoji}</span> </div> <div class="detail-effects"> ${holdHTML} ${burnHTML} ${noEffect} </div> <div class="detail-footer"> <span class="detail-burn-val">🔥 Fuel: ${card.burnValue}</span> ${isSelected ? '<span class="detail-selected-tag">BURNING ⛽</span>' : '<span class="detail-tap-hint">tap to select</span>'} </div> </div>`;

return el;
}

// — Phase Renderers —

function renderNameEntry(container, gameState, onStart) {
const savedName = localStorage.getItem(‘acecent_player_name’) || ‘’;

container.innerHTML = `<div class="screen name-entry-screen"> <div class="title-block"> <div class="title-emoji">🚀</div> <h1 class="game-title">Project Acecent</h1> <p class="game-subtitle">Five cards. One shot. How high can you go?</p> </div> <div class="name-form"> <label class="name-label">PILOT NAME</label> <input type="text" id="player-name-input" class="name-input" placeholder="Enter your callsign..." value="${savedName}" maxlength="20" autocomplete="off" /> <button id="launch-btn" class="btn-primary"> 🚀 BEGIN MISSION </button> </div> <div class="scoreboard-notice"> 📡 Scoreboard — Coming Soon </div> </div>`;

const input = container.querySelector(’#player-name-input’);
const btn = container.querySelector(’#launch-btn’);
input.focus();

const tryStart = () => {
const name = input.value.trim();
if (!name) {
input.classList.add(‘shake’);
setTimeout(() => input.classList.remove(‘shake’), 400);
return;
}
gameState.setPlayerName(name);
onStart();
};

btn.addEventListener(‘click’, tryStart);
input.addEventListener(‘keydown’, (e) => { if (e.key === ‘Enter’) tryStart(); });
}

function renderHand(container, gameState, onRedraw, onLaunch) {
const gs = gameState;
const hand = gs.hand;

container.innerHTML = `
<div class="screen hand-screen">

```
  <div class="hand-header">
    <div class="pilot-tag">👤 ${gs.playerName}</div>
    <div class="redraw-counter">
      <span class="redraw-label">REDRAWS</span>
      <span class="redraw-count">${gs.redraws}</span>
    </div>
  </div>

  <div class="hand-instructions">
    Tap a card to select it for burning as ⛽ fuel, then redraw or launch.
  </div>

  <!-- Quick-view strip -->
  <div class="quickview-strip-wrap">
    <div class="quickview-strip" id="quickview-strip"></div>
  </div>

  <!-- Horizontal scroll detail cards -->
  <div class="detail-scroll-wrap">
    <div class="detail-scroll" id="detail-scroll"></div>
  </div>

  <!-- Fuel tank -->
  <div class="burned-section">
    <div class="burned-label">⛽ FUEL TANK — ${gs.burnedCards.length} card${gs.burnedCards.length !== 1 ? 's' : ''} burned</div>
    <div class="burned-chips" id="burned-chips"></div>
  </div>

  <!-- Actions -->
  <div class="hand-actions">
    <button id="redraw-btn" class="btn-secondary" ${!gs.canRedraw() ? 'disabled' : ''}>
      🔄 Redraw (${gs.redraws} left)
    </button>
    <button id="do-launch-btn" class="btn-primary">
      🚀 LAUNCH
    </button>
  </div>

</div>
```

`;

// Quick-view strip
const strip = container.querySelector(’#quickview-strip’);
for (const card of hand) {
const isSelected = gs.selectedForDiscard.has(card.id);
const chip = renderChip(card, gameState, isSelected);
chip.addEventListener(‘click’, () => {
gs.toggleSelectCard(card.id);
renderHand(container, gameState, onRedraw, onLaunch);
});
strip.appendChild(chip);
}

// Detail scroll
const scroll = container.querySelector(’#detail-scroll’);
for (const card of hand) {
const isSelected = gs.selectedForDiscard.has(card.id);
const detailCard = renderDetailCard(card, gameState, isSelected);
detailCard.addEventListener(‘click’, () => {
gs.toggleSelectCard(card.id);
renderHand(container, gameState, onRedraw, onLaunch);
});
scroll.appendChild(detailCard);
}

// Burned chips
const burnedChips = container.querySelector(’#burned-chips’);
for (const card of gs.burnedCards) {
const chip = document.createElement(‘div’);
chip.className = ‘burned-chip’;
const sym = getSuitSymbol(card.suit);
const col = getSuitColor(card.suit);
chip.innerHTML = `${card.emoji} ${card.rank}<span style="color:${col}">${sym}</span>`;
burnedChips.appendChild(chip);
}

container.querySelector(’#redraw-btn’).addEventListener(‘click’, () => {
if (gs.canRedraw()) onRedraw();
});

container.querySelector(’#do-launch-btn’).addEventListener(‘click’, () => {
if (gs.canLaunch()) onLaunch();
});
}

// — Rocket Animation —

function playRocketAnimation(container, onComplete) {
container.innerHTML = `<div class="screen launch-animation-screen"> <div class="launch-bg"> <div class="stars" id="stars"></div> <div class="rocket-wrapper" id="rocket-wrapper"> <div class="rocket-ship">🚀</div> <div class="exhaust">🔥</div> </div> <div class="launch-text" id="launch-text">T-MINUS ZERO</div> </div> </div>`;

const stars = container.querySelector(’#stars’);
for (let i = 0; i < 60; i++) {
const star = document.createElement(‘div’);
star.className = ‘star’;
star.style.left = Math.random() * 100 + ‘%’;
star.style.top = Math.random() * 100 + ‘%’;
star.style.animationDelay = (Math.random() * 2) + ‘s’;
stars.appendChild(star);
}

const rocketWrapper = container.querySelector(’#rocket-wrapper’);
const launchText = container.querySelector(’#launch-text’);

setTimeout(() => { launchText.textContent = ‘IGNITION’; }, 300);
setTimeout(() => { launchText.textContent = ‘🔥🔥🔥’; }, 800);
setTimeout(() => {
rocketWrapper.classList.add(‘hop’);
launchText.textContent = ‘🚀✨’;
}, 1200);
setTimeout(() => { onComplete(); }, 2400);
}

// — Results —

function renderLaunchSequence(container, result, gameState) {
container.innerHTML = `
<div class="screen result-screen">
<div class="result-header">
<div class="result-tier-emoji">${result.tier.emoji}</div>
<div class="result-tier-name">${result.tier.name}</div>
<div class="result-altitude">${result.altitude.toLocaleString()} ft</div>
<div class="result-pilot">👤 ${gameState.playerName}</div>
</div>

```
  <div class="launch-log" id="launch-log"></div>

  <div class="result-actions">
    <button id="share-btn" class="btn-primary">📋 Copy Share Card</button>
    <div id="share-confirm" class="share-confirm" style="display:none">✅ Copied!</div>
  </div>

  <div class="scoreboard-notice">📡 Daily Scoreboard — Not available in Alpha</div>
</div>
```

`;

const logContainer = container.querySelector(’#launch-log’);
result.log.forEach((line, i) => {
setTimeout(() => {
const entry = document.createElement(‘div’);
entry.className = ‘log-entry’;
entry.textContent = line;
logContainer.appendChild(entry);
logContainer.scrollTop = logContainer.scrollHeight;
}, i * 280);
});

container.querySelector(’#share-btn’).addEventListener(‘click’, async () => {
const todayResult = gameState.loadTodayResult();
if (todayResult) {
const { success } = await copyShareCard(todayResult);
const confirm = container.querySelector(’#share-confirm’);
confirm.style.display = ‘block’;
confirm.textContent = success ? ‘✅ Copied!’ : ‘📋 Copy failed — try manually’;
setTimeout(() => { confirm.style.display = ‘none’; }, 2500);
}
});
}

export {
renderNameEntry,
renderHand,
renderLaunchSequence,
playRocketAnimation,
};