// recipes.js — the menu of The Golden Ladle: ingredients, dishes, orders.
// One file, one job: data only. No drawing, no input, no sound lives here.

// Every ingredient needs at most ONE prep step (chop, boil or fry, or
// none). Two-step ingredients were rejected: they double the chores
// without adding any planning depth.
export const INGREDIENTS = {
  tomato:   { id: 'tomato',   name: 'Tomato',   prep: 'chop', color: '#e8442e', dark: '#a11f16', price: 2 },
  lettuce:  { id: 'lettuce',  name: 'Lettuce',  prep: 'chop', color: '#7ed957', dark: '#3f8f2a', price: 2 },
  mushroom: { id: 'mushroom', name: 'Mushroom', prep: 'chop', color: '#e8dcc8', dark: '#8a6d4b', price: 3 },
  pasta:    { id: 'pasta',    name: 'Pasta',    prep: 'boil', color: '#f5c542', dark: '#c78d1e', price: 3 },
  broth:    { id: 'broth',    name: 'Broth',    prep: 'boil', color: '#d98e32', dark: '#96590f', price: 3 },
  batter:   { id: 'batter',   name: 'Batter',   prep: 'fry',  color: '#f7e3b0', dark: '#d9a441', price: 3 },
  berry:    { id: 'berry',    name: 'Berry',    prep: 'none', color: '#8e44ad', dark: '#5b2a6e', price: 4 },
};

// A prepared item is an ingredient id plus the prep that was done to it:
//   'chopped tomato', 'boiled pasta', 'fried batter', 'berry' (served raw).
// The plate only ever holds prepared items, so a dish is just a set of them.
export function preparedName(item) {
  if (!item) return '';
  const ing = INGREDIENTS[item.id];
  if (item.prep === 'none' || ing.prep === 'none') return ing.name;
  if (item.prep === 'chop') return 'Chopped ' + ing.name;
  if (item.prep === 'boil') return 'Boiled ' + ing.name;
  return 'Golden ' + ing.name; // fried batter -> Golden Batter (a pancake)
}

// A dish is a list of prepared items, in any order. The Chef's Special is
// the only 3-component dish and only appears once the rush is on.
export const DISHES = [
  {
    id: 'garden-salad', name: 'Garden Salad', price: 12,
    needs: [{ id: 'tomato', prep: 'chop' }, { id: 'lettuce', prep: 'chop' }],
    blurb: 'Crisp, bright, straight from the garden.',
  },
  {
    id: 'tomato-pasta', name: 'Tomato Pasta', price: 16,
    needs: [{ id: 'tomato', prep: 'chop' }, { id: 'pasta', prep: 'boil' }],
    blurb: 'The house classic — sunny and saucy.',
  },
  {
    id: 'mushroom-soup', name: 'Mushroom Soup', price: 15,
    needs: [{ id: 'mushroom', prep: 'chop' }, { id: 'broth', prep: 'boil' }],
    blurb: 'Earthy, warm, and quietly fancy.',
  },
  {
    id: 'berry-pancakes', name: 'Berry Pancakes', price: 18,
    needs: [{ id: 'batter', prep: 'fry' }, { id: 'berry', prep: 'none' }],
    blurb: 'Golden stacks crowned with berries.',
  },
  {
    id: 'mushroom-pasta', name: 'Mushroom Pasta', price: 17,
    needs: [{ id: 'mushroom', prep: 'chop' }, { id: 'pasta', prep: 'boil' }],
    blurb: 'Woodland comfort in a bowl.',
  },
  {
    id: 'tomato-soup', name: 'Tomato Soup', price: 14,
    needs: [{ id: 'tomato', prep: 'chop' }, { id: 'broth', prep: 'boil' }],
    blurb: 'Slow-simmered sunshine.',
  },
  {
    id: 'chefs-special', name: "Chef's Special", price: 26, late: true,
    needs: [
      { id: 'tomato', prep: 'chop' },
      { id: 'mushroom', prep: 'chop' },
      { id: 'pasta', prep: 'boil' },
    ],
    blurb: 'Three parts, one standing ovation.',
  },
];

export const CUSTOMERS = [
  'Mira', 'Bram', 'Sinta', 'Dodi', 'Lala', 'Raka', 'Nia', 'Tono',
  'Ayu', 'Gilang', 'Putri', 'Eko', 'Sari', 'Fajar', 'Wulan', 'Bimo',
];

let orderUid = 1;

// An order: a dish, a customer, and a patience clock. Serving fast pays a
// tip on top of the dish price; serving late pays almost nothing.
export function makeOrder(elapsedSec, rng) {
  const pool = DISHES.filter((d) => !d.late || elapsedSec >= 60);
  const dish = pool[Math.floor(rng() * pool.length)];
  const customer = CUSTOMERS[Math.floor(rng() * CUSTOMERS.length)];
  // Patience shrinks as the shift wears on: 55s early, down to 32s late.
  const patienceMax = Math.max(32, 55 - elapsedSec * 0.12);
  return {
    uid: orderUid++,
    dish,
    customer,
    patience: patienceMax,
    patienceMax,
    reward: dish.price,
  };
}

// Does the plate (array of prepared items) match this dish, exactly?
export function plateMatchesDish(plate, dish) {
  if (plate.length !== dish.needs.length) return false;
  const have = plate.map((p) => p.id + ':' + p.prep).sort().join('|');
  const want = dish.needs.map((n) => n.id + ':' + n.prep).sort().join('|');
  return have === want;
}

// Coins for serving now: dish price plus up to +50% tip for a fast serve.
export function serveValue(order) {
  const frac = Math.max(0, order.patience / order.patienceMax);
  return order.reward + Math.round(order.reward * 0.5 * frac);
}

// How long until the next order arrives, in seconds. The rush tightens.
export function nextOrderDelay(elapsedSec) {
  return Math.max(7, 16 - elapsedSec * 0.07);
}
