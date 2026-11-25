// main.js — the game loop, the state machine, input, and scoring.
// One file, one job: it wires kitchen.js, recipes.js, render.js and
// audio.js together and owns the shift. It draws nothing itself.

import { INGREDIENTS, makeOrder, plateMatchesDish, serveValue, nextOrderDelay } from './recipes.js';
import {
  STATIONS, STAND_SPOTS, newKitchen, walkChef, sendChefTo, tickPots,
  takeFromPantry, startChopping, chopOnce, startCooking, takeFromPot,
  addToPlate, clearPlate, setToast,
} from './kitchen.js';
import { render, W, H } from './render.js';
import { ensureAudio, playSfx, toggleMute, startMusic, stopMusic } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export const SHIFT_LENGTH = 180; // a 3-minute shift
const MAX_ORDERS = 4;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newGame() {
  const params = new URLSearchParams(location.search);
  const seed = params.has('seed') ? Number(params.get('seed')) || 1 : (Math.random() * 1e9) | 0;
  return {
    state: 'title',
    kitchen: newKitchen(),
    orders: [],
    elapsed: 0,
    shiftLength: SHIFT_LENGTH,
    coins: 0,
    hearts: 3,
    servedCount: 0,
    missedCount: 0,
    combo: 0,
    bestCombo: 0,
    shift: 1,
    nextOrderIn: 2,
    rng: mulberry32(seed),
    pendingAction: null, // { station } executed when the chef arrives
    hint: 'Click the PANTRY to fetch your first ingredient.',
    frozen: false, // staged screenshots freeze the simulation
  };
}

let game = newGame();

// --- Serving: the moment a plate meets an order. --------------------------
function tryServe() {
  const k = game.kitchen;
  if (k.plate.length === 0) {
    setToast(k, 'Plate is empty — cook something first!', '#ffb0a0');
    playSfx('error');
    return;
  }
  for (const order of game.orders) {
    if (plateMatchesDish(k.plate, order.dish)) {
      const base = serveValue(order);
      const comboMult = 1 + Math.min(game.combo, 4) * 0.25;
      const earned = Math.round(base * comboMult);
      game.coins += earned;
      game.servedCount++;
      game.combo++;
      game.bestCombo = Math.max(game.bestCombo, game.combo);
      game.orders = game.orders.filter((o) => o !== order);
      k.plate = [];
      setToast(k, order.dish.name + ' served to ' + order.customer + '! +' + earned + ' coins', '#7ed957');
      playSfx('serve');
      setTimeout(() => playSfx('coin'), 120);
      game.hint = 'Beautiful! Next order — what does it need?';
      return;
    }
  }
  setToast(k, 'No order wants this dish — check the board!', '#ffb0a0');
  playSfx('error');
}

function eventSound(event) {
  const ok = ['pickup', 'chop', 'chop-done', 'cook-start', 'cook-done', 'plated', 'serve', 'coin'];
  if (ok.includes(event)) playSfx(event === 'chop-done' ? 'chop-done' : event);
  else if (event === 'burnt-cleared') playSfx('burnt');
  else if (event && event !== 'nothing-to-chop' && event !== 'empty-hands') playSfx('error');
}

// --- Actions: what happens when the chef reaches a station. ---------------
function doStationAction(stationId) {
  const k = game.kitchen;
  if (stationId === 'pantry') {
    k.pantryOpen = true;
    playSfx('click');
    return;
  }
  if (stationId === 'board') {
    if (k.chopping) {
      const ev = chopOnce(k);
      eventSound(ev);
      if (ev === 'chop-done') {
        setToast(k, 'Chopped! Now boil it, or plate it.', '#7ed957');
        game.hint = 'Chopped and ready — plate it or cook it next.';
      }
      return;
    }
    const ev = startChopping(k);
    eventSound(ev);
    if (ev === 'chop-start') {
      setToast(k, 'Chopping… click the board again!', '#ffd98a');
      game.hint = 'Keep clicking the board to finish chopping.';
    } else if (ev === 'empty-hands') {
      setToast(k, 'Hands empty — grab an ingredient first.', '#ffb0a0');
    } else if (ev === 'already-prepped') {
      setToast(k, 'That is already prepped — plate it!', '#ffb0a0');
    }
    return;
  }
  if (stationId === 'stove') {
    // Prefer taking a finished pot; otherwise start cooking in a free pot.
    for (let i = 0; i < k.pots.length; i++) {
      const pot = k.pots[i];
      if (pot && (pot.state === 'done' || pot.state === 'burnt')) {
        const ev = takeFromPot(k, i);
        eventSound(ev);
        if (ev === 'cook-done') {
          setToast(k, 'Hot off the stove! Plate it while it is fresh.', '#7ed957');
          game.hint = 'Cooked! Carry it to the plating counter.';
        } else if (ev === 'burnt-cleared') {
          setToast(k, 'Burnt… tossed. The stove forgives, the customer does not.', '#ffb0a0');
        }
        return;
      }
    }
    const ev = startCooking(k);
    eventSound(ev);
    if (ev === 'cook-start') {
      setToast(k, 'On the stove! Watch the ring — do not let it burn.', '#ffd98a');
      game.hint = 'Cooking… grab something else while it simmers.';
    } else if (ev === 'empty-hands') {
      setToast(k, 'Hands empty — grab an ingredient first.', '#ffb0a0');
    } else if (ev === 'pots-busy') {
      setToast(k, 'Both pots are busy!', '#ffb0a0');
    } else if (ev === 'already-prepped') {
      setToast(k, 'That is already prepped — plate it!', '#ffb0a0');
    }
    return;
  }
  if (stationId === 'plate') {
    const ev = addToPlate(k);
    eventSound(ev);
    if (ev === 'plated') {
      const matched = game.orders.some((o) => plateMatchesDish(k.plate, o.dish));
      if (matched && k.plate.length > 0) {
        setToast(k, 'That is a full order — serve it at the window!', '#7ed957');
        game.hint = 'Dish complete! Run it to the SERVE WINDOW.';
      } else {
        setToast(k, 'Plated. Keep building the dish.', '#ffd98a');
        game.hint = 'Check the order board — what else does it need?';
      }
    } else if (ev === 'not-prepped') {
      setToast(k, 'Raw food never goes on the plate — chop or cook it first.', '#ffb0a0');
    } else if (ev === 'plate-full') {
      setToast(k, 'Plate is full — serve it or trash it.', '#ffb0a0');
    }
    return;
  }
  if (stationId === 'serve') {
    tryServe();
    return;
  }
  if (stationId === 'trash') {
    const ev = clearPlate(k);
    if (ev === 'trashed') {
      setToast(k, 'Cleared. Fresh start!', '#ffd98a');
      playSfx('click');
    }
    return;
  }
}

function goToStation(stationId) {
  const k = game.kitchen;
  const spot = STAND_SPOTS[stationId];
  const c = k.chef;
  const alreadyThere = Math.hypot(c.x - spot.x, c.y - spot.y) < 12 && !c.moving;
  if (alreadyThere) {
    doStationAction(stationId);
    return;
  }
  k.pantryOpen = false;
  sendChefTo(k, spot.x, spot.y);
  game.pendingAction = stationId;
}

// --- Input: mouse + keyboard. ----------------------------------------------
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * W,
    y: ((e.clientY - r.top) / r.height) * H,
  };
}

function stationAt(x, y) {
  for (const s of Object.values(STATIONS)) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s.id;
  }
  return null;
}

canvas.addEventListener('click', (e) => {
  ensureAudio();
  const { x, y } = canvasPoint(e);
  if (game.state === 'title') {
    startShift();
    return;
  }
  if (game.state === 'over') {
    game = newGame();
    startShift();
    return;
  }
  if (game.state !== 'playing') return;
  const k = game.kitchen;
  if (k.pantryOpen) {
    // Pantry picker grid: 4 columns, same geometry as render.js draws.
    const ids = Object.keys(INGREDIENTS);
    let picked = null;
    ids.forEach((id, i) => {
      const bx = 370 + (i % 4) * 130;
      const by = 320 + Math.floor(i / 4) * 110;
      if (x >= bx && x <= bx + 110 && y >= by && y <= by + 95) picked = id;
    });
    if (picked) {
      const ev = takeFromPantry(k, picked);
      eventSound(ev);
      if (ev === 'pickup') {
        const ing = INGREDIENTS[picked];
        setToast(k, ing.name + ' in hand!', '#7ed957');
        game.hint = ing.prep === 'chop'
          ? 'Take it to the CHOPPING BOARD.'
          : ing.prep === 'none'
            ? 'Berries go straight on the plate!'
            : 'Take it to the STOVE to cook.';
      } else if (ev === 'hands-full') {
        setToast(k, 'Hands full — plate or trash what you carry.', '#ffb0a0');
      }
    } else {
      k.pantryOpen = false;
    }
    return;
  }
  const station = stationAt(x, y);
  if (station) {
    goToStation(station);
    return;
  }
  // Clicking empty floor just walks the chef there.
  game.pendingAction = null;
  sendChefTo(k, x, y);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    ensureAudio();
    if (game.state === 'title') startShift();
    else if (game.state === 'over') {
      game = newGame();
      startShift();
    }
    return;
  }
  if (game.state !== 'playing') return;
  const k = game.kitchen;
  if (e.key === 'Escape') {
    k.pantryOpen = false;
    return;
  }
  if (e.key === 'm' || e.key === 'M') {
    const m = toggleMute();
    setToast(k, m ? 'Muted.' : 'Sound on.', '#ffd98a');
    return;
  }
  if (e.key === 'p' || e.key === 'P') {
    game.state = 'paused';
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    game = newGame();
    startShift();
    return;
  }
  const keys = { 1: 'pantry', 2: 'board', 3: 'stove', 4: 'plate', 5: 'serve', 6: 'trash' };
  if (keys[e.key]) {
    ensureAudio();
    goToStation(keys[e.key]);
  }
});

// Clicking while paused resumes.
canvas.addEventListener('click', () => {
  if (game.state === 'paused') game.state = 'playing';
});

// --- Shift flow. ------------------------------------------------------------
function startShift() {
  game.state = 'playing';
  game.elapsed = 0;
  game.nextOrderIn = 1.5;
  startMusic();
  playSfx('new-order');
}

function endShift() {
  game.state = 'over';
  stopMusic();
  playSfx(game.hearts > 0 ? 'win' : 'expire');
}

function spawnOrder() {
  if (game.orders.length >= MAX_ORDERS) return;
  const order = makeOrder(game.elapsed, game.rng);
  game.orders.push(order);
  playSfx('new-order');
  setToast(game.kitchen, 'New order: ' + order.dish.name + ' for ' + order.customer + '!', '#ffd98a');
}

// --- The loop. ---------------------------------------------------------------
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const k = game.kitchen;

  if (game.state === 'playing' && !game.frozen) {
    game.elapsed += dt;
    // Orders arrive on a tightening schedule.
    game.nextOrderIn -= dt;
    if (game.nextOrderIn <= 0) {
      spawnOrder();
      game.nextOrderIn = nextOrderDelay(game.elapsed);
    }
    // Patience drains; an expired order costs a heart.
    for (const order of [...game.orders]) {
      order.patience -= dt;
      if (order.patience <= 0) {
        game.orders = game.orders.filter((o) => o !== order);
        game.missedCount++;
        game.hearts--;
        game.combo = 0;
        setToast(k, order.customer + ' walked out hungry! -1 reputation', '#ff8a70');
        playSfx('expire');
        if (game.hearts <= 0) {
          endShift();
          break;
        }
      }
    }
    // Stove pots cook and burn.
    tickPots(k, dt,
      () => playSfx('cook-done'),
      () => {
        setToast(k, 'Something burned on the stove!', '#ff8a70');
        playSfx('burnt');
      });
    // Shift timer ends the day.
    if (game.elapsed >= game.shiftLength) endShift();
  }

  // The chef walks; on arrival the queued station action fires.
  if (walkChef(k, dt) && game.pendingAction) {
    const action = game.pendingAction;
    game.pendingAction = null;
    if (game.state === 'playing') doStationAction(action);
  }

  render(ctx, game);
  requestAnimationFrame(frame);
}

// Staged screenshots (?shot=title etc.) freeze a representative moment.
const params = new URLSearchParams(location.search);
if (params.has('shot')) {
  stageShot(game, params.get('shot'));
}

requestAnimationFrame(frame);
