// Ember Kitchen — main: the game loop, movement and station rules.
// One clear job: wire input + state + render together, frame by frame.
import { CANVAS_H, CANVAS_W, CHEF_SPEED, INGREDIENTS, STATIONS } from './config.js';
import { createInput, consumeClick, moveVector, pressedKey } from './input.js';
import { createState, serveOrder, startShift, tickOrders, tickShift, tickWork, matchingOrder } from './state.js';
import { render, stationAt, pantryBinAt, startButtonAt } from './render.js';
import { applyShot } from './shots.js';
import {
  ensureAudio,
  sfxBad,
  sfxChop,
  sfxDing,
  sfxPickup,
  sfxServe,
  sfxSizzle,
  sfxTick,
  toggleMute,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = createState();
const input = createInput(canvas);

const params = new URLSearchParams(window.location.search);
const shot = Number(params.get('shot') || 0);
if (shot >= 1 && shot <= 4) applyShot(state, shot);

let paused = false;
let last = performance.now();
let lastTickSecond = -1;

function near(stationKey) {
  const st = STATIONS[stationKey];
  const cx = st.x + st.w / 2;
  const cy = st.y + st.h / 2;
  const dx = state.chef.x - cx;
  const dy = state.chef.y - cy;
  return Math.hypot(dx, dy) < 150;
}

function flash(text) {
  state.flash = { text, until: performance.now() + 1800 };
}

function handleStation(key, click) {
  if (key === 'pantry') {
    const bin = pantryBinAt(click.x, click.y);
    if (!bin) return;
    if (state.hands) {
      flash('Hands full — plate or bin it first');
      sfxBad();
      return;
    }
    state.hands = { kind: 'raw', id: bin };
    sfxPickup();
    return;
  }
  if (key === 'board') {
    if (state.board?.done) {
      if (state.hands) return flash('Hands full — plate or bin it first');
      state.hands = { kind: 'done', id: state.board.id };
      state.board = null;
      sfxPickup();
      return;
    }
    if (state.board) return flash('Still chopping…');
    if (!state.hands || state.hands.kind !== 'raw') return flash('Bring a raw ingredient to chop');
    if (INGREDIENTS[state.hands.id].prep !== 'chop') {
      flash(`${INGREDIENTS[state.hands.id].name} does not need chopping`);
      sfxBad();
      return;
    }
    state.board = { id: state.hands.id, progress: 0, done: false };
    state.hands = null;
    sfxChop();
    return;
  }
  if (key === 'stove') {
    if (state.stove?.done) {
      if (state.hands) return flash('Hands full — plate or bin it first');
      state.hands = { kind: 'done', id: state.stove.id };
      state.stove = null;
      sfxPickup();
      return;
    }
    if (state.stove) return flash('Still cooking…');
    if (!state.hands || state.hands.kind !== 'raw') return flash('Bring a raw ingredient to cook');
    if (INGREDIENTS[state.hands.id].prep !== 'cook') {
      flash(`${INGREDIENTS[state.hands.id].name} does not need cooking`);
      sfxBad();
      return;
    }
    state.stove = { id: state.hands.id, progress: 0, done: false };
    state.hands = null;
    sfxSizzle();
    return;
  }
  if (key === 'plate') {
    if (!state.hands) return flash('Bring a finished ingredient to the plate');
    if (state.hands.kind !== 'done' && INGREDIENTS[state.hands.id].prep !== 'raw') {
      flash(`${INGREDIENTS[state.hands.id].name} still needs prep — board or stove first`);
      sfxBad();
      return;
    }
    if (state.plate.length >= 3) return flash('The plate is full');
    if (state.plate.includes(state.hands.id)) return flash('That is already on the plate');
    state.plate.push(state.hands.id);
    state.hands = null;
    sfxDing();
    const match = matchingOrder(state);
    if (match) flash(`Plate matches ${match.recipe.name} — serve it!`);
    return;
  }
  if (key === 'window') {
    const match = matchingOrder(state);
    if (!match) {
      flash('No order matches this plate yet');
      sfxBad();
      return;
    }
    serveOrder(state, match);
    sfxServe();
    return;
  }
  if (key === 'trash') {
    if (!state.hands) return;
    state.hands = null;
    flash('Binned it');
    sfxBad();
  }
}

function handleClick(click) {
  ensureAudio();
  if (state.phase === 'title') {
    if (startButtonAt(click.x, click.y)) startShift(state);
    return;
  }
  if (state.phase === 'over') {
    if (click.x >= 380 && click.x <= 580 && click.y >= 340 && click.y <= 388) startShift(state);
    return;
  }
  const key = stationAt(click.x, click.y);
  if (key) {
    handleStation(key, click);
    return;
  }
  // Otherwise: click-to-move.
  state.chef.tx = Math.max(40, Math.min(CANVAS_W - 40, click.x));
  state.chef.ty = Math.max(100, Math.min(CANVAS_H - 40, click.y));
}

function update(dt) {
  if (pressedKey(input, 'm')) toggleMute();
  if (pressedKey(input, 'p')) paused = !paused;
  if (pressedKey(input, 'r') && state.phase !== 'title') startShift(state);
  if (pressedKey(input, ' ') && state.phase === 'title') startShift(state);
  if (pressedKey(input, 'e')) {
    // E interacts with the nearest station.
    const order = ['pantry', 'board', 'stove', 'plate', 'window', 'trash'];
    const nearKey = order.find((k) => near(k));
    if (nearKey) handleStation(nearKey, { x: state.chef.x, y: state.chef.y });
  }

  const click = consumeClick(input);
  if (click) handleClick(click);

  if (paused || state.phase !== 'playing') return;

  // Keyboard movement overrides click-to-move while keys are held.
  const { dx, dy } = moveVector(input);
  if (dx !== 0 || dy !== 0) {
    state.chef.x = Math.max(40, Math.min(CANVAS_W - 40, state.chef.x + dx * CHEF_SPEED * dt));
    state.chef.y = Math.max(100, Math.min(CANVAS_H - 40, state.chef.y + dy * CHEF_SPEED * dt));
    state.chef.tx = state.chef.x;
    state.chef.ty = state.chef.y;
  } else {
    const mdx = state.chef.tx - state.chef.x;
    const mdy = state.chef.ty - state.chef.y;
    const dist = Math.hypot(mdx, mdy);
    if (dist > 4) {
      const step = Math.min(dist, CHEF_SPEED * dt);
      state.chef.x += (mdx / dist) * step;
      state.chef.y += (mdy / dist) * step;
    }
  }

  tickShift(state, dt);
  if (state.phase !== 'playing') return;
  tickOrders(state, dt);
  tickWork(state, dt, 'board');
  tickWork(state, dt, 'stove');

  const second = Math.floor(state.timeLeft);
  if (state.timeLeft <= 10 && second !== lastTickSecond) {
    lastTickSecond = second;
    sfxTick();
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(ctx, state, input);
  if (paused && state.phase === 'playing') {
    ctx.fillStyle = 'rgba(43,26,18,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#fff3d6';
    ctx.font = '700 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — press P to keep cooking', CANVAS_W / 2, CANVAS_H / 2);
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
