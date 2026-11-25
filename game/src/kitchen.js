// kitchen.js — the simulation: stations, the chef's walk, every interaction.
// One file, one job: the rules of the room. It knows nothing about pixels.

// Station layout is the strategy: the pantry sits far left, the stove far
// right, the serve window top-right. Every dish crosses the room, and the
// slow step (the stove) is opposite the pantry, so no single spot serves
// every order. A compact cluster was rejected: it would kill route planning.
export const STATIONS = {
  pantry:  { id: 'pantry',  name: 'Pantry',  x: 130, y: 300, w: 150, h: 220 },
  board:   { id: 'board',   name: 'Chopping Board', x: 380, y: 560, w: 190, h: 140 },
  stove:   { id: 'stove',   name: 'Stove',   x: 760, y: 560, w: 190, h: 120 },
  plate:   { id: 'plate',   name: 'Plating Counter', x: 480, y: 300, w: 240, h: 130 },
  serve:   { id: 'serve',   name: 'Serve Window', x: 1010, y: 180, w: 150, h: 130 },
  trash:   { id: 'trash',   name: 'Trash',   x: 1010, y: 560, w: 130, h: 110 },
};

// Where the chef stands to use each station.
export const STAND_SPOTS = {
  pantry: { x: 300, y: 410 },
  board:  { x: 475, y: 520 },
  stove:  { x: 855, y: 520 },
  plate:  { x: 600, y: 520 },
  serve:  { x: 1000, y: 350 },
  trash:  { x: 1000, y: 520 },
};

export const CHOPS_NEEDED = 3;   // clicks to chop one ingredient
export const COOK_SECONDS = 5;   // seconds on the stove until done
export const BURN_SECONDS = 4;   // grace after done before it burns

export function newKitchen() {
  return {
    chef: { x: 600, y: 480, tx: 600, ty: 480, moving: false, bob: 0 },
    hand: null,            // { id, prep } the chef carries, or null
    plate: [],             // prepared items on the plating counter
    chopping: null,        // { item, done } in progress on the board
    pots: [null, null],    // two stove pots: null | { item, t, state }
    pantryOpen: false,     // ingredient picker showing
    toast: null,           // { text, color, t } floating message
    toastT: 0,
  };
}

export function setToast(k, text, color) {
  k.toast = { text, color: color || '#fff' };
  k.toastT = 2.2;
}

// The chef walks toward a target at a fixed speed; returns true on arrival.
export function walkChef(k, dt) {
  const c = k.chef;
  if (!c.moving) return true;
  const dx = c.tx - c.x;
  const dy = c.ty - c.y;
  const d = Math.hypot(dx, dy);
  const speed = 340; // px per second
  if (d <= speed * dt) {
    c.x = c.tx;
    c.y = c.ty;
    c.moving = false;
    return true;
  }
  c.x += (dx / d) * speed * dt;
  c.y += (dy / d) * speed * dt;
  c.bob += dt * 14;
  return false;
}

export function sendChefTo(k, x, y) {
  k.chef.tx = x;
  k.chef.ty = y;
  k.chef.moving = true;
}

// Tick the stove pots. A pot finishes cooking, then burns if ignored:
// the clock keeps running while it sits 'done', so a forgotten pot is
// lost 4 seconds after it is ready (before this fix a done pot was
// skipped here and could never burn, so the stove had no pressure).
export function tickPots(k, dt, onDone, onBurnt) {
  for (let i = 0; i < k.pots.length; i++) {
    const pot = k.pots[i];
    if (!pot || pot.state === 'burnt') continue;
    pot.t += dt;
    if (pot.state === 'cooking' && pot.t >= COOK_SECONDS) {
      pot.state = 'done';
      if (onDone) onDone(i);
    } else if (pot.state === 'done' && pot.t >= COOK_SECONDS + BURN_SECONDS) {
      pot.state = 'burnt';
      if (onBurnt) onBurnt(i);
    }
  }
  if (k.toastT > 0) k.toastT -= dt;
}

// How close a finished pot is to burning, 0 to 1: the renderer draws it
// as a shrinking red ring, so a pot about to burn reads at a glance.
export function burnFrac(pot) {
  if (!pot || pot.state !== 'done') return 0;
  return Math.min(1, (pot.t - COOK_SECONDS) / BURN_SECONDS);
}

// --- Interactions: each returns a short event string for sound + toast. ---

export function takeFromPantry(k, ingredientId) {
  if (k.hand) return 'hands-full';
  k.hand = { id: ingredientId, prep: 'raw' };
  k.pantryOpen = false;
  return 'pickup';
}

export function startChopping(k) {
  if (!k.hand) return 'empty-hands';
  const ing = k.hand;
  if (ing.prep !== 'raw') return 'already-prepped';
  if (k.chopping) return 'board-busy';
  k.chopping = { item: ing, done: 0 };
  k.hand = null;
  return 'chop-start';
}

export function chopOnce(k) {
  if (!k.chopping) return 'nothing-to-chop';
  k.chopping.done += 1;
  if (k.chopping.done >= CHOPS_NEEDED) {
    const item = { id: k.chopping.item.id, prep: 'chop' };
    k.chopping = null;
    k.hand = item;
    return 'chop-done';
  }
  return 'chop';
}

export function startCooking(k) {
  if (!k.hand) return 'empty-hands';
  const ing = k.hand;
  if (ing.prep !== 'raw') return 'already-prepped';
  const free = k.pots.findIndex((p) => p === null);
  if (free === -1) return 'pots-busy';
  k.pots[free] = { item: ing, t: 0, state: 'cooking' };
  k.hand = null;
  return 'cook-start';
}

export function takeFromPot(k, index) {
  const pot = k.pots[index];
  if (!pot) return 'empty-pot';
  if (pot.state === 'cooking') return 'not-ready';
  if (pot.state === 'burnt') {
    k.pots[index] = null;
    return 'burnt-cleared';
  }
  if (k.hand) return 'hands-full';
  const prep = pot.item.id === 'batter' ? 'fry' : 'boil';
  k.hand = { id: pot.item.id, prep };
  k.pots[index] = null;
  return 'cook-done';
}

export function addToPlate(k) {
  if (!k.hand) return 'empty-hands';
  if (k.hand.prep === 'raw') return 'not-prepped';
  if (k.plate.length >= 3) return 'plate-full';
  k.plate.push(k.hand);
  k.hand = null;
  return 'plated';
}

export function clearPlate(k) {
  if (k.plate.length === 0 && !k.hand) return 'nothing-to-trash';
  k.plate = [];
  k.hand = null;
  if (k.chopping) k.chopping = null;
  return 'trashed';
}
