// render.js — every pixel of The Golden Ladle, drawn on one canvas.
// One file, one job: drawing only. It never changes game state.
// All art is original canvas shapes; all food is drawn, never emoji.

import { INGREDIENTS, preparedName } from './recipes.js';
import { STATIONS, CHOPS_NEEDED, COOK_SECONDS, BURN_SECONDS, burnFrac } from './kitchen.js';

export const W = 1200;
export const H = 800;

// Warm bistro palette: terracotta floor, cream walls, wood counters.
const PAL = {
  wall: '#f7e8c9',
  wallTrim: '#e8c98f',
  floorA: '#c96f3f',
  floorB: '#b85f33',
  wood: '#8a5a2b',
  woodLight: '#a9713a',
  steel: '#c8ccd2',
  steelDark: '#9aa0a8',
  cream: '#fff8e7',
  ink: '#3a2415',
  red: '#d23b2e',
  green: '#4d9b3a',
  gold: '#f5c542',
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, bold) {
  ctx.fillStyle = color || PAL.ink;
  ctx.font = (bold ? 'bold ' : '') + size + 'px Trebuchet MS, Verdana, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- Food icons: one small original illustration per ingredient. --------
// Prep changes the drawing: chopped food becomes slices, boiled pasta sits
// in a bowl, fried batter becomes a pancake stack, berries stay whole.
export function drawFoodIcon(ctx, item, x, y, r) {
  const ing = INGREDIENTS[item.id];
  ctx.save();
  ctx.translate(x, y);
  if (item.prep === 'chop') {
    // Slices: three wedges fanned out, in the ingredient's colours.
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 7);
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.35, r * 0.42, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ing.dark;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.35, r * 0.22, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    return;
  }
  if (item.prep === 'boil') {
    // A bowl of the boiled thing, with steam curls.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.85, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = PAL.steelDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.35);
    ctx.quadraticCurveTo(-r * 0.5, -r * 0.7, -r * 0.3, -r * 0.95);
    ctx.moveTo(r * 0.25, -r * 0.35);
    ctx.quadraticCurveTo(r * 0.05, -r * 0.7, r * 0.25, -r * 0.95);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (item.prep === 'fry') {
    // A golden pancake stack with a berry on top.
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i % 2 ? '#e8b64c' : '#f5cf7a';
      rr(ctx, -r * 0.8, r * (0.55 - i * 0.32), r * 1.6, r * 0.3, r * 0.14);
      ctx.fill();
    }
    ctx.fillStyle = INGREDIENTS.berry.color;
    ctx.beginPath();
    ctx.arc(0, -r * 0.55, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  // Raw ingredient, whole.
  if (item.id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4d9b3a';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(Math.cos(a) * r * 0.42, -r * 0.55 + Math.sin(a) * r * 0.42);
      ctx.lineTo(Math.cos(a + 0.5) * r * 0.2, -r * 0.55 + Math.sin(a + 0.5) * r * 0.2);
    }
    ctx.fill();
  } else if (item.id === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45 + r * 0.1, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.id === 'mushroom') {
    ctx.fillStyle = '#f3e6cf';
    rr(ctx, -r * 0.28, -r * 0.1, r * 0.56, r * 0.9, r * 0.2);
    ctx.fill();
    ctx.fillStyle = '#b07a4a';
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.85, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.45, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.6, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.id === 'pasta') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * (0.75 - i * 0.22), Math.PI * 0.15, Math.PI * 1.15);
      ctx.stroke();
    }
  } else if (item.id === 'broth') {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.85, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = PAL.steelDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a4a12';
    ctx.beginPath();
    ctx.arc(-r * 0.2, 0, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.25, r * 0.15, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.id === 'batter') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.15, r * 0.18, 0, Math.PI * 2);
    ctx.arc(r * 0.3, r * 0.3, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.id === 'berry') {
    ctx.fillStyle = ing.color;
    const spots = [[-0.35, 0.15], [0.3, 0.05], [0, -0.4], [-0.05, 0.45]];
    for (const [dx, dy] of spots) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#4d9b3a';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.75, r * 0.3, r * 0.14, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// --- The kitchen room. ---------------------------------------------------
function drawFloorAndWalls(ctx) {
  ctx.fillStyle = PAL.wall;
  ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = PAL.wallTrim;
  ctx.fillRect(0, 200, W, 10);
  // Tile floor: alternating terracotta squares.
  for (let y = 210; y < H; y += 70) {
    for (let x = 0; x < W; x += 70) {
      ctx.fillStyle = ((x / 70 + y / 70) % 2 === 0) ? PAL.floorA : PAL.floorB;
      ctx.fillRect(x, y, 70, 70);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = 210; y < H; y += 70) ctx.fillRect(0, y, W, 2);
  for (let x = 0; x < W; x += 70) ctx.fillRect(x, 210, 2, H - 210);
  // A hanging sign and a window on the back wall, for a look of its own.
  ctx.fillStyle = '#7a4a21';
  rr(ctx, 430, 18, 340, 54, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  text(ctx, '★ THE GOLDEN LADLE ★', 600, 46, 26, '#ffd98a', 'center', true);
  ctx.fillStyle = '#bfe3f0';
  rr(ctx, 60, 30, 120, 130, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(105, 80, 26, 0, Math.PI * 2);
  ctx.arc(140, 110, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 5;
  ctx.strokeRect(60, 30, 120, 130);
}

function drawStationBase(ctx, s, fill, label, labelColor) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, s.x + 4, s.y + 6, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = fill;
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.stroke();
  // Light stations (the plating counter is cream) need a dark label:
  // white text on cream was unreadable in the screenshots.
  text(ctx, label, s.x + s.w / 2, s.y + s.h - 14, 15, labelColor || '#fff', 'center', true);
}

export function drawKitchen(ctx, game) {
  const k = game.kitchen;
  drawFloorAndWalls(ctx);

  // Pantry: a shelf unit with jars of every ingredient.
  const p = STATIONS.pantry;
  drawStationBase(ctx, p, PAL.wood, 'PANTRY — click for ingredients');
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = PAL.woodLight;
    ctx.fillRect(p.x + 12, p.y + 67 + i * 52, p.w - 24, 8);
  }
  const ids = Object.keys(INGREDIENTS);
  ids.forEach((id, i) => {
    const jx = p.x + 32 + (i % 3) * 48;
    const jy = p.y + 48 + Math.floor(i / 3) * 52;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    rr(ctx, jx - 16, jy - 16, 32, 34, 6);
    ctx.fill();
    drawFoodIcon(ctx, { id, prep: 'raw' }, jx, jy, 13);
  });
  // The last jar (berry) sits on the third shelf alone.
  text(ctx, '7 fresh ingredients', p.x + p.w / 2, p.y + p.h - 34, 12, '#ffe9b0', 'center');

  // Chopping board: a wooden board with a knife; chopping shows progress.
  const b = STATIONS.board;
  drawStationBase(ctx, b, PAL.woodLight, 'CHOPPING BOARD');
  ctx.fillStyle = '#e8c98f';
  rr(ctx, b.x + 25, b.y + 18, b.w - 50, 52, 8);
  ctx.fill();
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 2;
  rr(ctx, b.x + 25, b.y + 18, b.w - 50, 52, 8);
  ctx.stroke();
  // Knife lying beside the board.
  ctx.save();
  ctx.translate(b.x + b.w - 28, b.y + 44);
  ctx.rotate(-0.5);
  ctx.fillStyle = PAL.steel;
  rr(ctx, 0, -4, 34, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#3a2415';
  rr(ctx, 34, -4, 16, 8, 4);
  ctx.fill();
  ctx.restore();
  if (k.chopping) {
    drawFoodIcon(ctx, { id: k.chopping.item.id, prep: 'raw' }, b.x + b.w / 2, b.y + 44, 20);
    const frac = k.chopping.done / CHOPS_NEEDED;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, b.x + 30, b.y + 78, b.w - 60, 10, 5);
    ctx.fill();
    ctx.fillStyle = PAL.gold;
    rr(ctx, b.x + 30, b.y + 78, (b.w - 60) * frac, 10, 5);
    ctx.fill();
    text(ctx, 'CLICK to chop! (' + k.chopping.done + '/' + CHOPS_NEEDED + ')', b.x + b.w / 2, b.y + 100, 13, '#fff', 'center', true);
  } else {
    text(ctx, 'bring something to chop', b.x + b.w / 2, b.y + 100, 13, '#ffe9b0', 'center');
  }

  // Stove: two burners with pots; each pot shows its own timer ring.
  const s = STATIONS.stove;
  drawStationBase(ctx, s, '#5a5f66', 'STOVE');
  for (let i = 0; i < 2; i++) {
    const cx = s.x + 48 + i * 94;
    const cy = s.y + 46;
    ctx.fillStyle = '#2e3236';
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.stroke();
    const pot = k.pots[i];
    if (pot) {
      // Pot body.
      ctx.fillStyle = pot.state === 'burnt' ? '#3a2a1a' : '#dfe3e8';
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#666';
      ctx.stroke();
      if (pot.state === 'cooking') {
        drawFoodIcon(ctx, { id: pot.item.id, prep: 'raw' }, cx, cy, 15);
        // Timer ring: fills as it cooks, flashes red near burning.
        const frac = Math.min(1, pot.t / COOK_SECONDS);
        ctx.strokeStyle = pot.t > COOK_SECONDS - 1.5 ? '#ff5a3c' : PAL.gold;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 32, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
      } else if (pot.state === 'done') {
        drawFoodIcon(ctx, { id: pot.item.id, prep: pot.item.id === 'batter' ? 'fry' : 'boil' }, cx, cy, 16);
        ctx.fillStyle = '#2e7d32';
        text(ctx, 'READY!', cx, cy - 42, 13, '#2e7d32', 'center', true);
        // Burn ring: red, shrinking as the pot nears burning, so a
        // forgotten pot screams before it is lost.
        const bf = burnFrac(pot);
        if (bf > 0) {
          ctx.strokeStyle = bf > 0.6 ? '#ff5a3c' : '#e8a13c';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(cx, cy, 32, -Math.PI / 2, -Math.PI / 2 + (1 - bf) * Math.PI * 2);
          ctx.stroke();
        }
      } else {
        text(ctx, 'BURNT!', cx, cy - 42, 13, '#ff5a3c', 'center', true);
        text(ctx, 'click to clear', cx, cy + 44, 11, '#fff', 'center');
      }
    } else {
      text(ctx, 'pot ' + (i + 1), cx, cy, 12, '#cfd4da', 'center');
    }
  }

  // Plating counter: the white plate, showing each prepared item on it.
  const pl = STATIONS.plate;
  drawStationBase(ctx, pl, '#f3ede0', 'PLATING COUNTER', PAL.ink);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(pl.x + pl.w / 2, pl.y + 48, 92, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAL.steelDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  k.plate.forEach((item, i) => {
    drawFoodIcon(ctx, item, pl.x + pl.w / 2 - 55 + i * 55, pl.y + 48, 20);
  });
  if (k.plate.length === 0) {
    text(ctx, 'plate your dish here', pl.x + pl.w / 2, pl.y + 48, 13, '#8a7a5a', 'center');
  } else {
    const names = k.plate.map(preparedName).join(' + ');
    text(ctx, names, pl.x + pl.w / 2, pl.y + 92, 12, PAL.ink, 'center', true);
  }

  // Serve window: a hatch with a bell; orders are collected here.
  const sv = STATIONS.serve;
  drawStationBase(ctx, sv, '#7a4a21', 'SERVE WINDOW');
  ctx.fillStyle = '#2e1a0c';
  rr(ctx, sv.x + 14, sv.y + 14, sv.w - 28, 52, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(sv.x + sv.w / 2, sv.y + 40, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(sv.x + sv.w / 2 - 2, sv.y + 40, 4, 8);
  text(ctx, 'ring the bell!', sv.x + sv.w / 2, sv.y + 88, 12, '#ffe9b0', 'center');

  // Trash: a bin for mistakes.
  const t = STATIONS.trash;
  drawStationBase(ctx, t, '#6b7280', 'TRASH');
  ctx.fillStyle = '#4b5563';
  rr(ctx, t.x + 40, t.y + 16, 50, 52, 6);
  ctx.fill();
  ctx.fillStyle = '#9ca3af';
  rr(ctx, t.x + 34, t.y + 10, 62, 12, 6);
  ctx.fill();

  // The chef, walking with a bob, carrying one item overhead.
  const c = k.chef;
  const bobY = c.moving ? Math.abs(Math.sin(c.bob)) * -6 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bobY);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 34 - bobY, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body + apron.
  ctx.fillStyle = '#fff';
  rr(ctx, -18, -6, 36, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#e8442e';
  rr(ctx, -18, 14, 36, 20, 8);
  ctx.fill();
  // Head + toque.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -16, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-8, -28, 9, 0, Math.PI * 2);
  ctx.arc(0, -32, 10, 0, Math.PI * 2);
  ctx.arc(8, -28, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -30, 28, 8);
  // Eyes + smile.
  ctx.fillStyle = '#3a2415';
  ctx.beginPath();
  ctx.arc(-5, -17, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -17, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2415';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -12, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Carried item, held high.
  if (k.hand) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, -52, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PAL.steelDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawFoodIcon(ctx, k.hand, 0, -52, 15);
  }
  ctx.restore();

  // Pantry picker: a modal grid of the 7 ingredients.
  if (k.pantryOpen) {
    ctx.fillStyle = 'rgba(20,10,5,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PAL.cream;
    rr(ctx, 330, 250, 540, 300, 16);
    ctx.fill();
    ctx.strokeStyle = PAL.wood;
    ctx.lineWidth = 4;
    rr(ctx, 330, 250, 540, 300, 16);
    ctx.stroke();
    text(ctx, 'Pick an ingredient', 600, 290, 26, PAL.ink, 'center', true);
    const ids2 = Object.keys(INGREDIENTS);
    ids2.forEach((id, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const bx = 370 + col * 130;
      const by = 320 + row * 110;
      ctx.fillStyle = '#fff';
      rr(ctx, bx, by, 110, 95, 10);
      ctx.fill();
      ctx.strokeStyle = '#d9c9a8';
      ctx.lineWidth = 2;
      rr(ctx, bx, by, 110, 95, 10);
      ctx.stroke();
      drawFoodIcon(ctx, { id, prep: 'raw' }, bx + 55, by + 34, 24);
      text(ctx, INGREDIENTS[id].name, bx + 55, by + 76, 14, PAL.ink, 'center', true);
    });
    text(ctx, 'click an ingredient — Esc closes', 600, 525, 14, '#8a7a5a', 'center');
  }
}

// --- Order board, HUD, screens. ------------------------------------------
export function drawOrders(ctx, game) {
  // Tickets hang in a row under the HUD: the order board. They start at
  // x=200 so the first ticket never sits on top of the wall window (the
  // old x=60 left the window frame crossing the first ticket).
  const y = 100;
  const w = 190;
  const gap = 12;
  const x0 = 200;
  game.orders.forEach((order, i) => {
    const x = x0 + i * (w + gap);
    const frac = Math.max(0, order.patience / order.patienceMax);
    const urgent = frac < 0.3;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, x + 3, y + 4, w, 92, 10);
    ctx.fill();
    ctx.fillStyle = '#fffdf4';
    rr(ctx, x, y, w, 92, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? PAL.red : '#d9c9a8';
    ctx.lineWidth = urgent ? 3 : 2;
    rr(ctx, x, y, w, 92, 10);
    ctx.stroke();
    // Ticket header: dish + customer. The name alone (no "for") keeps
    // long dish names from colliding with the customer at this width.
    text(ctx, order.dish.name, x + 12, y + 16, 16, PAL.ink, 'left', true);
    text(ctx, order.customer, x + w - 12, y + 16, 12, '#8a7a5a', 'right');
    // Component icons: what the dish needs.
    order.dish.needs.forEach((need, j) => {
      drawFoodIcon(ctx, need, x + 28 + j * 44, y + 46, 16);
    });
    text(ctx, order.reward + ' coins', x + w - 12, y + 46, 12, '#8a6d1e', 'right', true);
    // Patience bar: green -> amber -> red as it drains.
    ctx.fillStyle = '#e8ddc4';
    rr(ctx, x + 12, y + 72, w - 24, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? PAL.green : frac > 0.25 ? '#e8a13c' : PAL.red;
    if (frac > 0) {
      rr(ctx, x + 12, y + 72, (w - 24) * frac, 10, 5);
      ctx.fill();
    }
    if (urgent) text(ctx, 'HURRY!', x + w - 12, y + 64, 11, PAL.red, 'right', true);
  });
  if (game.orders.length === 0) {
    text(ctx, 'No orders right now — take a breath, chef.', 480, y + 46, 16, '#fff', 'left');
  }
}

export function drawHud(ctx, game) {
  // Top bar: shift clock, coins, reputation hearts, day progress.
  ctx.fillStyle = '#2e1a0c';
  ctx.fillRect(0, 0, W, 88);
  text(ctx, 'THE GOLDEN LADLE', 24, 30, 24, '#ffd98a', 'left', true);
  text(ctx, 'Shift ' + game.shift + '  •  ' + game.servedCount + ' served', 24, 60, 14, '#e8c98f', 'left');
  // Shift timer: a bar plus mm:ss, centred.
  const remain = Math.max(0, game.shiftLength - game.elapsed);
  const mm = Math.floor(remain / 60);
  const ss = Math.floor(remain % 60);
  const timeText = mm + ':' + String(ss).padStart(2, '0');
  text(ctx, '⏱ ' + timeText, 600, 30, 26, remain < 30 ? '#ff8a70' : '#fff', 'center', true);
  const tfrac = remain / game.shiftLength;
  ctx.fillStyle = '#4a2c14';
  rr(ctx, 420, 52, 360, 12, 6);
  ctx.fill();
  ctx.fillStyle = remain < 30 ? '#ff5a3c' : PAL.gold;
  if (tfrac > 0) {
    rr(ctx, 420, 52, 360 * tfrac, 12, 6);
    ctx.fill();
  }
  // Coins and reputation hearts, right side.
  text(ctx, '🪙 ' + game.coins + ' coins', 1050, 30, 22, '#ffd98a', 'center', true);
  // Combo: consecutive serves multiply coins, so show the streak live.
  if (game.combo >= 2) {
    text(ctx, 'COMBO x' + game.combo, 880, 30, 20, '#ff9d5c', 'right', true);
  }
  let hx = 1010;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < game.hearts ? '#ff5a6e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(hx - 7, 58, 8, 0, Math.PI * 2);
    ctx.arc(hx + 7, 58, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 13, 58);
    ctx.lineTo(hx, 74);
    ctx.lineTo(hx + 13, 58);
    ctx.closePath();
    ctx.fill();
    hx += 34;
  }
  text(ctx, 'reputation', 1050, 82, 11, '#e8c98f', 'center');
  // Context hint at the bottom: what to do next.
  if (game.hint) {
    ctx.fillStyle = 'rgba(20,10,5,0.75)';
    rr(ctx, 300, H - 44, 600, 32, 16);
    ctx.fill();
    text(ctx, game.hint, 600, H - 27, 15, '#ffe9b0', 'center');
  }
  // Toast: a floating message after each action.
  const k = game.kitchen;
  if (k.toast && k.toastT > 0) {
    ctx.globalAlpha = Math.min(1, k.toastT);
    ctx.fillStyle = 'rgba(20,10,5,0.8)';
    const tw = ctx.measureText(k.toast.text).width + 36;
    rr(ctx, 600 - tw / 2, 210, tw, 34, 17);
    ctx.fill();
    text(ctx, k.toast.text, 600, 228, 16, k.toast.color, 'center', true);
    ctx.globalAlpha = 1;
  }
}

export function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(30,14,6,0.72)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '🍳', 600, 150, 90, '#fff', 'center');
  text(ctx, 'THE GOLDEN LADLE', 600, 240, 56, '#ffd98a', 'center', true);
  text(ctx, 'A timed kitchen game — cook fast, serve faster', 600, 290, 22, '#fff', 'center');
  const lines = [
    'Orders arrive on the board. Fetch ingredients from the PANTRY,',
    'CHOP them on the board, BOIL or FRY them on the stove,',
    'PLATE the dish and SERVE it at the window before patience runs out.',
    'Serve fast for tips. Three missed orders and your reputation is toast.',
  ];
  lines.forEach((l, i) => text(ctx, l, 600, 350 + i * 30, 17, '#ffe9b0', 'center'));
  ctx.fillStyle = '#e8442e';
  rr(ctx, 480, 500, 240, 56, 12);
  ctx.fill();
  text(ctx, '▶  START YOUR SHIFT', 600, 529, 20, '#fff', 'center', true);
  text(ctx, 'Click or press Enter  •  M mutes  •  R restarts', 600, 590, 15, '#e8c98f', 'center');
  text(ctx, 'Mouse: click a station to walk there, then click to use it', 600, 620, 15, '#e8c98f', 'center');
  text(ctx, 'Keys: 1 Pantry  2 Board  3 Stove  4 Plate  5 Serve  6 Trash', 600, 650, 15, '#e8c98f', 'center');
}

export function drawEnd(ctx, game) {
  ctx.fillStyle = 'rgba(30,14,6,0.78)';
  ctx.fillRect(0, 0, W, H);
  const won = game.hearts > 0;
  text(ctx, won ? '🏆 SHIFT COMPLETE!' : '💔 SHIFT OVER', 600, 170, 48, won ? '#ffd98a' : '#ff8a70', 'center', true);
  text(ctx, won ? 'The Golden Ladle shines another day.' : 'The crowd drifted away hungry.', 600, 220, 20, '#fff', 'center');
  // Ladle rating: 1-3 ladles by coins earned.
  const ladles = game.coins >= 220 ? 3 : game.coins >= 140 ? 2 : 1;
  let lx = 600 - (ladles - 1) * 45;
  for (let i = 0; i < ladles; i++) {
    text(ctx, '🥄', lx, 290, 52, '#ffd98a', 'center');
    lx += 45;
  }
  text(ctx, 'Rating: ' + ladles + ' of 3 ladles', 600, 340, 18, '#ffe9b0', 'center');
  // One centred line per stat: a two-column table let long values run
  // left into their own labels, so the rows are single lines instead.
  const rows = [
    'Dishes served:  ' + game.servedCount,
    'Orders missed:  ' + game.missedCount,
    'Coins earned:  ' + game.coins + '   (best combo x' + game.bestCombo + ')',
    'Shift:  3 minutes of beautiful chaos',
  ];
  rows.forEach((line, i) => {
    text(ctx, line, 600, 400 + i * 34, 18, '#ffe9b0', 'center');
  });
  ctx.fillStyle = '#e8442e';
  rr(ctx, 480, 560, 240, 56, 12);
  ctx.fill();
  text(ctx, '↻  COOK AGAIN', 600, 589, 20, '#fff', 'center', true);
  text(ctx, 'Press Enter or click to play again', 600, 650, 15, '#e8c98f', 'center');
}

// The one entry point: draw the whole frame for the current state.
export function render(ctx, game) {
  drawKitchen(ctx, game);
  if (game.state === 'playing' || game.state === 'paused') {
    drawOrders(ctx, game);
    drawHud(ctx, game);
    if (game.state === 'paused') {
      ctx.fillStyle = 'rgba(30,14,6,0.6)';
      ctx.fillRect(0, 0, W, H);
      text(ctx, 'PAUSED', 600, 380, 56, '#ffd98a', 'center', true);
      text(ctx, 'Press P or click to keep cooking', 600, 430, 18, '#fff', 'center');
    }
  } else if (game.state === 'title') {
    drawTitle(ctx, game);
  } else if (game.state === 'over') {
    drawOrders(ctx, game);
    drawHud(ctx, game);
    drawEnd(ctx, game);
  }
}
