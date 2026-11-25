// shots.js — deterministic staged states for the screenshots in shots.json.
// A shot is a query (?shot=play etc.) that puts the game into a fixed,
// representative moment. The game itself renders these states; nothing is
// composited or faked. The cover shot (play) stages everything the bounty
// asks to see at once: kitchen, order board, ingredients on the counter,
// one dish mid-assembly, the timer, and a plate ready to serve.

import { DISHES } from './recipes.js';

function orderFor(dishId, customer, patience, patienceMax) {
  const dish = DISHES.find((d) => d.id === dishId);
  return {
    uid: 900 + Math.floor(Math.random() * 90),
    dish,
    customer,
    patience,
    patienceMax,
    reward: dish.price,
  };
}

export function stageShot(game, name) {
  const k = game.kitchen;
  game.frozen = true; // a staged shot is a fixed frame, not a simulation
  if (name === 'title') {
    game.state = 'title';
    return;
  }
  if (name === 'win') {
    // Shift complete: 3-ladle rating, healthy reputation, coins earned.
    game.state = 'over';
    game.elapsed = 180;
    game.coins = 247;
    game.hearts = 2;
    game.servedCount = 14;
    game.missedCount = 1;
    game.bestCombo = 5;
    game.orders = [];
    k.chef.x = 300;
    k.chef.y = 650;
    k.chef.tx = 300;
    k.chef.ty = 650;
    return;
  }
  if (name === 'serve') {
    // A finished Tomato Pasta on the plate, chef at the serve window,
    // the matching order waiting — the moment before the bell rings.
    game.state = 'playing';
    game.elapsed = 96;
    game.coins = 118;
    game.hearts = 3;
    game.servedCount = 7;
    game.missedCount = 0;
    game.combo = 3;
    game.bestCombo = 3;
    game.orders = [
      orderFor('tomato-pasta', 'Mira', 34, 46),
      orderFor('berry-pancakes', 'Bram', 22, 44),
      orderFor('garden-salad', 'Sinta', 12, 42),
    ];
    k.plate = [
      { id: 'tomato', prep: 'chop' },
      { id: 'pasta', prep: 'boil' },
    ];
    k.chef.x = 1000;
    k.chef.y = 350;
    k.chef.tx = 1000;
    k.chef.ty = 350;
    game.hint = 'Dish complete! Run it to the SERVE WINDOW.';
    return;
  }
  if (name === 'play') {
    // Mid-shift, mid-assembly: three orders ticking, the plate holds a
    // chopped tomato, the chef carries boiled pasta toward it, a pot of
    // broth simmers, and the pantry shelves are full behind them.
    game.state = 'playing';
    game.elapsed = 74;
    game.coins = 86;
    game.hearts = 3;
    game.servedCount = 5;
    game.missedCount = 0;
    game.combo = 2;
    game.bestCombo = 2;
    game.orders = [
      orderFor('tomato-pasta', 'Mira', 38, 48),
      orderFor('mushroom-soup', 'Dodi', 26, 46),
      orderFor('berry-pancakes', 'Lala', 14, 44),
    ];
    k.plate = [{ id: 'tomato', prep: 'chop' }];
    k.hand = { id: 'pasta', prep: 'boil' };
    k.pots = [{ item: { id: 'broth', prep: 'raw' }, t: 3.2, state: 'cooking' }, null];
    k.chef.x = 560;
    k.chef.y = 520;
    k.chef.tx = 600;
    k.chef.ty = 520;
    k.chef.moving = true;
    k.chef.bob = 1.2;
    game.hint = 'Cooked! Carry it to the plating counter.';
    return;
  }
}
