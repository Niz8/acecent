// ui.js — Project Acecent
// Rendering, card display, animation, phase transitions

import { PHASES } from './game.js';
import { copyShareCard } from './share.js';

// --- Card Rendering ---

function getSuitColor(suit) {
  if (suit === 'hearts' || suit === 'diamonds') return '#e8334a';
  if (suit === 'spades' || suit === 'clubs') return '#1a1a2e';
  return '#888';
}

function getConditionStatus(card, gameState) {
  if (!card.holdEffect || !card.holdEffect.condition) return 'neutral';
  return card.holdEffect.condition(buildLightGS(gameState)) ? 'active' : 'inactive';
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

function renderCard(card, gameState, isSelected) {
  const el = document.createElement('div');
  el.className = 'card' + (isSelected ? ' selected' : '');
  el.dataset.cardId = card.id;

  const suitColor = getSuitColor(card.suit);
  const conditionStatus = getConditionStatus(card, gameState);

  if (conditionStatus === 'active') el.classList.add('condition-met');
  if (conditionStatus === 'inactive') el.classList.add('condition-unmet');

  const holdHTML = card.holdEffect
    ? `<div class="card-effect hold-effect">
        <span class="effect-label">HOLD</span>
        <span class="effect-emoji">${card.holdEffect.emoji}</span>
        <span class="effect-desc">${card.holdEffect.desc}</span>
       </div>`
    : '';

  const burnHTML = card.burnEffect
    ? `<div class="card-effect burn-effect">
        <span class="effect-label">BURN</span>
        <span class="effect-emoji">${card.burnEffect.emoji}</span>
        <span class="effect-desc">${card.burnEffect.desc}</span>
       </div>`
    : '';

  el.innerHTML = `
    <div class="card-inner" style="border-color: ${isSelected ? '#f5c518' : 'transparent'}">
      <div class="card-header" style="color: ${suitColor}">
        <span class="card-rank">${card.rank}</span>
        <span class="card-suit-symbol">${card.suitSymbol}</span>
        <span class="card-emoji">${card.emoji}</span>
      </div>
      <div class="card-body">
        ${holdHTML}
        ${burnHTML}
      </div>
      <div class="card-footer">
        <span class="burn-value">🔥 ${card.burnValue}</span>
      </div>
    </div>
  `;

  return el;
}

// --- Phase Renderers ---

function renderNameEntry(container, gameState, onStart) {
  const savedName = localStorage.getItem('acecent_player_name') || '';

  container.innerHTML = `
    <div class="screen name-entry-screen">
      <div class="title-block">
        <div class="title-emoji">🚀</div>
        <h1 class="game-title">Project Acecent</h1>
        <p class="game-subtitle">Five cards. One shot. How high can you go?</p>
      </div>
      <div class="name-form">
        <label class="name-label">PILOT NAME</label>
        <input type="text" id="player-name-input" class="name-input"
          placeholder="Enter your callsign..."
          value="${savedName}"
          maxlength="20"
          autocomplete="off"
        />
        <button id="launch-btn" class="btn-primary">
          🚀 BEGIN MISSION
        </button>
      </div>
      <div class="scoreboard-notice">
        📡 Scoreboard — Coming Soon
      </div>
    </div>
  `;

  const input = container.querySelector('#player-name-input');
  const btn = container.querySelector('#launch-btn');

  input.focus();

  const tryStart = () => {
    const name = input.value.trim();
    if (!name) {
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 400);
      return;
    }
    gameState.setPlayerName(name);
    onStart();
  };

  btn.addEventListener('click', tryStart);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryStart(); });
}

function renderHand(container, gameState, onRedraw, onLaunch) {
  const gs = gameState;
  const hand = gs.hand;

  container.innerHTML = `
    <div class="screen hand-screen">
      <div class="hand-header">
        <div class="pilot-tag">👤 ${gs.playerName}</div>
        <div class="redraw-counter">
          <span class="redraw-label">REDRAWS</span>
          <span class="redraw-count" id="redraw-count">${gs.redraws}</span>
        </div>
      </div>

      <div class="hand-instructions">
        <p>Select cards to <strong>burn as fuel</strong>, then redraw or launch.</p>
        <p class="hint">Cards with 🔄 BURN effects grant extra redraws when discarded!</p>
      </div>

      <div class="hand-cards" id="hand-cards"></div>

      <div class="burned-section">
        <div class="burned-label">⛽ FUEL TANK — ${gs.burnedCards.length} card${gs.burnedCards.length !== 1 ? 's' : ''} burned</div>
        <div class="burned-cards" id="burned-cards"></div>
      </div>

      <div class="hand-actions">
        <button id="redraw-btn" class="btn-secondary" ${!gs.canRedraw() ? 'disabled' : ''}>
          🔄 Burn & Redraw (${gs.redraws} left)
        </button>
        <button id="do-launch-btn" class="btn-primary" ${!gs.canLaunch() ? 'disabled' : ''}>
          🚀 LAUNCH
        </button>
      </div>
    </div>
  `;

  // Render hand cards
  const handContainer = container.querySelector('#hand-cards');
  for (const card of hand) {
    const isSelected = gs.selectedForDiscard.has(card.id);
    const cardEl = renderCard(card, gs, isSelected);
    cardEl.addEventListener('click', () => {
      gs.toggleSelectCard(card.id);
      renderHand(container, gameState, onRedraw, onLaunch);
    });
    handContainer.appendChild(cardEl);
  }

  // Render burned cards (small)
  const burnedContainer = container.querySelector('#burned-cards');
  for (const card of gs.burnedCards) {
    const chip = document.createElement('div');
    chip.className = 'burned-chip';
    chip.textContent = `${card.emoji} ${card.rank}${card.suitSymbol}`;
    burnedContainer.appendChild(chip);
  }

  container.querySelector('#redraw-btn').addEventListener('click', () => {
    if (gs.canRedraw()) {
      onRedraw();
    }
  });

  container.querySelector('#do-launch-btn').addEventListener('click', () => {
    if (gs.canLaunch()) {
      onLaunch();
    }
  });
}

// --- Rocket Animation ---

function playRocketAnimation(container, onComplete) {
  container.innerHTML = `
    <div class="screen launch-animation-screen">
      <div class="launch-bg">
        <div class="stars"></div>
        <div class="rocket-wrapper" id="rocket-wrapper">
          <div class="rocket-ship">🚀</div>
          <div class="exhaust">🔥</div>
        </div>
        <div class="launch-text" id="launch-text">T-MINUS ZERO</div>
      </div>
    </div>
  `;

  // Generate star field
  const stars = container.querySelector('.stars');
  for (let i = 0; i < 60; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = (Math.random() * 2) + 's';
    stars.appendChild(star);
  }

  const rocketWrapper = container.querySelector('#rocket-wrapper');
  const launchText = container.querySelector('#launch-text');

  // Short hop: rocket hops up then comes back, then scroll to results
  setTimeout(() => { launchText.textContent = 'IGNITION'; }, 300);
  setTimeout(() => { launchText.textContent = '🔥🔥🔥'; }, 800);
  setTimeout(() => {
    rocketWrapper.classList.add('hop');
    launchText.textContent = '🚀✨';
  }, 1200);
  setTimeout(() => {
    onComplete();
  }, 2400);
}

// --- Launch Sequence / Results ---

function renderLaunchSequence(container, result, gameState, onShare) {
  container.innerHTML = `
    <div class="screen result-screen">
      <div class="result-header">
        <div class="result-tier-emoji">${result.tier.emoji}</div>
        <div class="result-tier-name">${result.tier.name}</div>
        <div class="result-altitude">${result.altitude.toLocaleString()} ft</div>
        <div class="result-pilot">👤 ${gameState.playerName}</div>
      </div>

      <div class="launch-log" id="launch-log"></div>

      <div class="result-actions">
        <button id="share-btn" class="btn-primary">
          📋 Copy Share Card
        </button>
        <div id="share-confirm" class="share-confirm" style="display:none">
          ✅ Copied to clipboard!
        </div>
      </div>

      <div class="scoreboard-notice">
        📡 Daily Scoreboard — Not available in Alpha
      </div>
    </div>
  `;

  // Animate log entries one by one
  const logContainer = container.querySelector('#launch-log');
  result.log.forEach((line, i) => {
    setTimeout(() => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.textContent = line;
      logContainer.appendChild(entry);
      logContainer.scrollTop = logContainer.scrollHeight;
    }, i * 280);
  });

  container.querySelector('#share-btn').addEventListener('click', async () => {
    const todayResult = gameState.loadTodayResult();
    if (todayResult) {
      const { success } = await copyShareCard(todayResult);
      const confirm = container.querySelector('#share-confirm');
      confirm.style.display = 'block';
      confirm.textContent = success ? '✅ Copied to clipboard!' : '📋 Copy failed — try manually';
      setTimeout(() => { confirm.style.display = 'none'; }, 2500);
    }
  });
}

export {
  renderNameEntry,
  renderHand,
  renderLaunchSequence,
  playRocketAnimation,
};
