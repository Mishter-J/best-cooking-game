// Ember Kitchen — render: every pixel the player (and the judge) sees.
// One clear job: draw the kitchen from state. No rules, no input here.
import { CANVAS_H, CANVAS_W, COLORS, INGREDIENTS, PANTRY_ORDER, RECIPES, STATIONS } from './config.js';
import { matchingOrder, prepVerb } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// Draw one ingredient as a little drawn dish piece (no emoji, no images).
export function drawIngredient(ctx, id, x, y, s, done) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d8a2e';
    ctx.fillRect(-2, -s - 4, 4, 8);
    if (done) {
      ctx.strokeStyle = '#ffd9d9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s + 4, 0);
      ctx.lineTo(s - 4, 0);
      ctx.stroke();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-s * 0.5 + i * s * 0.5, (i % 2) * 3, s * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!done) {
      ctx.fillStyle = ing.dark;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'noodle') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-s, i * s * 0.55);
      ctx.bezierCurveTo(-s * 0.3, i * s * 0.55 - s * 0.5, s * 0.3, i * s * 0.55 + s * 0.5, s, i * s * 0.55);
      ctx.stroke();
    }
    if (done) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s * 0.4, -s * 0.4, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'egg') {
    if (done) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.75, s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (id === 'chili') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = s * 0.55;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -s * 0.2, s * 0.8, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.fillStyle = '#3d8a2e';
    ctx.fillRect(s * 0.55, -s - 2, 4, 8);
    if (done) {
      ctx.strokeStyle = '#ff8a8a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, s * 0.55, s * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.6);
    ctx.lineTo(s, s * 0.6);
    ctx.lineTo(s, -s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(-s * 0.3, s * 0.25, 2.5, 0, Math.PI * 2);
    ctx.arc(s * 0.35, s * 0.3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStation(ctx, key, hover, glow) {
  const st = STATIONS[key];
  ctx.save();
  ctx.fillStyle = key === 'window' ? '#8a5a2b' : '#a9713f';
  rr(ctx, st.x, st.y, st.w, st.h, 10);
  ctx.fill();
  ctx.strokeStyle = glow ? '#ffd166' : '#6b4423';
  ctx.lineWidth = glow ? 4 : 2;
  ctx.stroke();
  if (hover) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.18)';
    rr(ctx, st.x, st.y, st.w, st.h, 10);
    ctx.fill();
  }
  text(ctx, st.label, st.x + st.w / 2, st.y + 14, 11, '#fff3d6', 'center');
  ctx.restore();
}

function drawProgress(ctx, x, y, w, frac, done) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, x, y, w, 10, 5);
  ctx.fill();
  ctx.fillStyle = done ? '#5fb84a' : '#ffb703';
  if (frac > 0) {
    rr(ctx, x, y, w * Math.min(1, frac), 10, 5);
    ctx.fill();
  }
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.save();
  ctx.fillStyle = '#fff8e7';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = frac < 0.3 ? '#d92626' : '#6b4423';
  ctx.lineWidth = frac < 0.3 ? 3 : 2;
  ctx.stroke();
  text(ctx, `#${order.id} ${order.recipe.name}`, x + 10, y + 16, 13, COLORS.ink);
  text(ctx, `${order.recipe.price} coins`, x + w - 10, y + 16, 12, '#8a5a2b', 'right');
  order.recipe.needs.forEach((id, i) => {
    drawIngredient(ctx, id, x + 22 + i * 34, y + 44, 11, true);
  });
  ctx.fillStyle = '#e8dcc0';
  rr(ctx, x + 10, y + h - 16, w - 20, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#5fb84a' : frac > 0.25 ? '#ffb703' : '#d92626';
  rr(ctx, x + 10, y + h - 16, (w - 20) * frac, 8, 4);
  ctx.fill();
  ctx.restore();
}

function drawChef(ctx, chef, hands, moving) {
  const bob = moving ? Math.sin(performance.now() / 90) * 2 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // body / apron
  ctx.fillStyle = '#f4f1ea';
  rr(ctx, -15, -6, 30, 26, 9);
  ctx.fill();
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(-15, 8, 30, 6);
  // head
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -16, 12, 0, Math.PI * 2);
  ctx.fill();
  // chef hat
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-7, -26, 7, 0, Math.PI * 2);
  ctx.arc(0, -29, 8, 0, Math.PI * 2);
  ctx.arc(7, -26, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-11, -28, 22, 6);
  // eyes
  ctx.fillStyle = '#2b1a12';
  ctx.beginPath();
  ctx.arc(-4, -16, 1.6, 0, Math.PI * 2);
  ctx.arc(4, -16, 1.6, 0, Math.PI * 2);
  ctx.fill();
  if (hands) {
    ctx.fillStyle = 'rgba(43,26,18,0.85)';
    ctx.beginPath();
    ctx.arc(0, -44, 15, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, hands.id, 0, -44, 11, hands.kind === 'done');
  }
  ctx.restore();
}

export function render(ctx, state, input) {
  // floor
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_W, 76);
  for (let y = 76; y < CANVAS_H; y += 40) {
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.fillStyle = ((x + y) / 40) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, 40, 40);
    }
  }
  // wall sign (left of centre — the timer owns the centre)
  text(ctx, 'EMBER KITCHEN', 300, 26, 22, '#ffd166', 'center');
  text(ctx, 'cook fast · serve with love', 300, 50, 12, '#fff3d6', 'center');

  if (state.phase === 'title') {
    drawTitle(ctx, state);
    return;
  }
  if (state.phase === 'over') {
    drawKitchen(ctx, state, input);
    drawGameOver(ctx, state);
    return;
  }
  drawKitchen(ctx, state, input);
}

function drawKitchen(ctx, state, input) {
  const hover = stationAt(input.mouse.x, input.mouse.y);
  const match = matchingOrder(state);

  // order board (left column)
  ctx.fillStyle = '#3a2417';
  rr(ctx, 12, 84, 288, 280, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', 156, 106, 14, '#ffd166', 'center');
  if (!state.orders.length) {
    text(ctx, 'No orders yet —', 156, 150, 13, '#fff3d6', 'center');
    text(ctx, 'the lunch rush is coming!', 156, 172, 13, '#fff3d6', 'center');
  }
  state.orders.forEach((o, i) => drawOrderTicket(ctx, o, 22, 122 + i * 78, 268, 68));

  // rush banner under the board
  if (state.rush) {
    ctx.fillStyle = '#d92626';
    rr(ctx, 12, 372, 288, 34, 8);
    ctx.fill();
    text(ctx, 'RUSH HOUR — orders coming fast!', 156, 390, 13, '#fff', 'center');
  } else {
    ctx.fillStyle = 'rgba(43,26,18,0.75)';
    rr(ctx, 12, 372, 288, 34, 8);
    ctx.fill();
    text(ctx, 'Tip: WASD / arrows to move · click a station', 156, 390, 11, '#fff3d6', 'center');
  }

  // stations
  drawStation(ctx, 'pantry', hover === 'pantry', false);
  drawStation(ctx, 'board', hover === 'board', !!state.board?.done);
  drawStation(ctx, 'stove', hover === 'stove', !!state.stove?.done);
  drawStation(ctx, 'plate', hover === 'plate', match !== null);
  drawStation(ctx, 'window', hover === 'window', match !== null);
  drawStation(ctx, 'trash', hover === 'trash', false);

  // pantry bins
  PANTRY_ORDER.forEach((id, i) => {
    const bx = STATIONS.pantry.x + 14 + i * 100;
    const by = STATIONS.pantry.y + 34;
    ctx.fillStyle = '#fff8e7';
    rr(ctx, bx, by, 88, 26, 6);
    ctx.fill();
    drawIngredient(ctx, id, bx + 16, by + 13, 9, false);
    text(ctx, INGREDIENTS[id].name, bx + 30, by + 13, 11, COLORS.ink);
  });

  // chopping board slot
  if (state.board) {
    drawIngredient(ctx, state.board.id, 425, 248, 20, state.board.done);
    drawProgress(ctx, 350, 288, 150, state.board.progress / 2, state.board.done);
    text(ctx, state.board.done ? 'Chopped! Click to take' : 'Chopping…', 425, 272, 11, '#fff3d6', 'center');
  } else {
    text(ctx, 'empty — bring something to chop', 425, 250, 11, '#e8dcc0', 'center');
  }

  // stove slot
  if (state.stove) {
    drawIngredient(ctx, state.stove.id, 660, 248, 20, state.stove.done);
    drawProgress(ctx, 580, 288, 150, state.stove.progress / 4, state.stove.done);
    text(ctx, state.stove.done ? 'Cooked! Click to take' : 'Cooking… sizzle!', 660, 272, 11, '#fff3d6', 'center');
  } else {
    text(ctx, 'empty — bring something to cook', 660, 250, 11, '#e8dcc0', 'center');
  }

  // plating counter: the plate with its contents
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(485, 432, 62, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 2;
  ctx.stroke();
  state.plate.forEach((id, i) => {
    drawIngredient(ctx, id, 445 + i * 40, 430, 13, true);
  });
  if (!state.plate.length) text(ctx, 'plate is empty', 485, 432, 11, '#8a7a5a', 'center');

  // serve window
  if (match) {
    ctx.fillStyle = '#5fb84a';
    rr(ctx, 716, 396, 212, 68, 10);
    ctx.fill();
    text(ctx, 'SERVE NOW!', 822, 420, 18, '#fff', 'center');
    text(ctx, match.recipe.name, 822, 444, 12, '#fff', 'center');
  } else {
    text(ctx, 'serve a finished plate here', 822, 432, 12, '#e8dcc0', 'center');
  }

  // bin (label drawn by drawStation)

  // chef
  const moving = Math.abs(state.chef.x - state.chef.tx) > 2 || Math.abs(state.chef.y - state.chef.ty) > 2;
  drawChef(ctx, state.chef, state.hands, moving);

  // HUD: timer, coins, served, hearts
  drawHud(ctx, state);

  // flash message
  if (state.flash && performance.now() < state.flash.until) {
    ctx.fillStyle = 'rgba(43,26,18,0.85)';
    rr(ctx, 300, 520, 360, 34, 8);
    ctx.fill();
    text(ctx, state.flash.text, 480, 538, 14, '#ffd166', 'center');
  }

  // hands hint
  if (state.hands) {
    const ing = INGREDIENTS[state.hands.id];
    const hint =
      state.hands.kind === 'done'
        ? `${ing.name} is ready — take it to the plate`
        : `${ing.name}: ${prepVerb(state.hands.id)}`;
    text(ctx, `Carrying: ${hint}`, 480, 586, 13, '#fff3d6', 'center');
  }
}

function drawHud(ctx, state) {
  const mm = Math.floor(state.timeLeft / 60);
  const ss = Math.floor(state.timeLeft % 60).toString().padStart(2, '0');
  const timerColor = state.timeLeft <= 30 ? '#ff6b6b' : '#fff3d6';
  text(ctx, `${mm}:${ss}`, 560, 26, 26, timerColor, 'center');
  text(ctx, `COINS ${state.coins}`, 700, 26, 16, '#ffd166', 'center');
  text(ctx, `SERVED ${state.served}`, 830, 26, 16, '#fff3d6', 'center');
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < state.hearts ? '♥ ' : '♡ ';
  text(ctx, hearts.trim(), 110, 26, 18, '#ff6b6b', 'center');
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,26,18,0.82)';
  rr(ctx, 180, 110, 600, 380, 16);
  ctx.fill();
  text(ctx, 'SIZZLE & SERVE', 480, 160, 44, '#ffd166', 'center');
  text(ctx, '— Ember Kitchen —', 480, 200, 20, '#fff3d6', 'center');
  text(ctx, 'Orders pile up on the board. Chop it, cook it, plate it, serve it', 480, 244, 15, '#fff3d6', 'center');
  text(ctx, '— before the customer walks out hungry.', 480, 268, 15, '#fff3d6', 'center');
  text(ctx, 'Move: WASD / arrows / click   ·   Interact: click a station', 480, 312, 14, '#ffd166', 'center');
  text(ctx, 'Pantry → board / stove → plate → serve window', 480, 338, 14, '#fff3d6', 'center');
  ctx.fillStyle = '#5fb84a';
  rr(ctx, 380, 372, 200, 52, 10);
  ctx.fill();
  text(ctx, 'START THE SHIFT', 480, 399, 18, '#fff', 'center');
  text(ctx, '180 seconds · 3 hearts · how many can you serve?', 480, 452, 13, '#e8dcc0', 'center');
  text(ctx, 'R restarts · M mutes · P pauses', 480, 476, 12, '#8a7a5a', 'center');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,26,18,0.85)';
  rr(ctx, 230, 130, 500, 330, 16);
  ctx.fill();
  text(ctx, state.hearts <= 0 ? 'THE KITCHEN CLOSED EARLY' : 'SHIFT OVER!', 480, 180, 30, '#ffd166', 'center');
  text(ctx, `Dishes served: ${state.served}    Coins earned: ${state.coins}`, 480, 232, 17, '#fff3d6', 'center');
  text(ctx, `Score: ${state.score}`, 480, 266, 20, '#fff', 'center');
  const verdict =
    state.served >= 8 ? 'Head chef material — the rush never stood a chance.'
    : state.served >= 4 ? 'A solid shift. The regulars will be back.'
    : 'A quiet shift… the board is waiting for your comeback.';
  text(ctx, verdict, 480, 304, 14, '#e8dcc0', 'center');
  ctx.fillStyle = '#5fb84a';
  rr(ctx, 380, 340, 200, 48, 10);
  ctx.fill();
  text(ctx, 'COOK AGAIN  (R)', 480, 365, 16, '#fff', 'center');
  text(ctx, 'Your best shift is still ahead of you.', 480, 420, 13, '#8a7a5a', 'center');
}

export function stationAt(x, y) {
  for (const [key, st] of Object.entries(STATIONS)) {
    if (x >= st.x && x <= st.x + st.w && y >= st.y && y <= st.y + st.h) return key;
  }
  return null;
}

export function pantryBinAt(x, y) {
  const st = STATIONS.pantry;
  if (y < st.y + 30 || y > st.y + 64) return null;
  for (let i = 0; i < PANTRY_ORDER.length; i++) {
    const bx = st.x + 14 + i * 100;
    if (x >= bx && x <= bx + 88) return PANTRY_ORDER[i];
  }
  return null;
}

export function startButtonAt(x, y) {
  return x >= 380 && x <= 580 && y >= 372 && y <= 424;
}

export { RECIPES };
