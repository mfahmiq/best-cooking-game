# The Golden Ladle

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/mfahmiq/best-cooking-game/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/mfahmiq/best-cooking-game/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A timed kitchen game — cook fast, serve faster. You are the chef of **The
Golden Ladle**, a small bistro with a big reputation to protect. Orders
arrive on the ticket board with a patience clock; fetch ingredients from
the pantry, chop them on the board, boil or fry them on the stove, plate
the dish, and serve it at the window before the customer walks out.

## How to play

Each order is a dish made of 2–3 prepared ingredients:

- **Garden Salad** — chopped tomato + chopped lettuce
- **Tomato Pasta** — chopped tomato + boiled pasta
- **Mushroom Soup** — chopped mushroom + boiled broth
- **Berry Pancakes** — fried batter (a pancake) + berry
- **Mushroom Pasta** — chopped mushroom + boiled pasta
- **Tomato Soup** — chopped tomato + boiled broth
- **Chef's Special** — chopped tomato + chopped mushroom + boiled pasta (arrives once the rush is on)

The loop, one click at a time:

1. **Pantry** — click it, pick an ingredient. You carry one thing at a time.
2. **Chopping Board** — click with a choppable ingredient, then click 3 times to chop it.
3. **Stove** — click with pasta, broth or batter to start a pot. It cooks in 5 seconds — collect it before it burns, 4 seconds later, or it is lost: a red ring shrinks around a finished pot as the burn closes in.
4. **Plating Counter** — click with a prepared item to put it on the plate (up to 3 items).
5. **Serve Window** — click with a finished dish to serve the matching order.

Serving fast pays a tip (up to +50%), and consecutive serves build a combo
that multiplies your coins — the live streak shows in the top bar. A missed order costs one reputation heart; lose
all three hearts, or let the 3-minute shift run out, and the day is over.
Your rating is 1–3 ladles by coins earned. In the last minute the dinner
rush hits and orders arrive faster.

## Controls

- **Mouse**: click a station to walk there — the action happens on arrival. Click empty floor to walk.
- **Keys**: **1** Pantry, **2** Board, **3** Stove, **4** Plate, **5** Serve, **6** Trash. **Enter** starts / plays again, **P** pauses, **M** mutes, **R** restarts, **Esc** closes the pantry.
- **Trash**: clears your hands and the plate when a dish goes wrong.

## Run it

No build step, no network: open `game/index.html` in a desktop browser,
or serve the folder with any static server. All art is drawn on canvas and
all sound and music is synthesised with WebAudio — there are no asset files.

## Files

- `game/index.html` — the page, loads the modules.
- `game/src/main.js` — the game loop, state machine, input, and scoring.
- `game/src/recipes.js` — the menu: ingredients, dishes, orders, tips.
- `game/src/kitchen.js` — stations, the chef's walk, every interaction, plus the stove's burn clock (`burnFrac`).
- `game/src/render.js` — the kitchen, the food, the chef, the order board.
- `game/src/audio.js` — synthesised WebAudio sounds and the music loop.
- `game/src/shots.js` — the staged states behind the screenshots.

Made by my AI agent for the make.fun best-cooking-game bounty:
https://make.fun/c/best-cooking-game-20261125-0137
