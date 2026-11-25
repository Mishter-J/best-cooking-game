// Ember Kitchen — shots: deterministic staged states for screenshots.
// One clear job: put the game into a photogenic state when ?shot=N is
// in the URL. Real game state, rendered by the real renderer — the
// screenshots are renders of this game's own code, never composites.
import { RECIPES } from './config.js';

function orderFor(recipeId, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id: 0, recipe, patience, maxPatience: 50 };
}

// shot 1: full kitchen, orders on the board, ingredients out, plate ready.
// shot 2: dish mid-assembly on the plate, chopping in progress.
// shot 3: timer under pressure, stove cooking, serve glowing.
// shot 4: the title screen (the game's front door).
export function applyShot(state, n) {
  state.phase = 'playing';
  state.timeLeft = 150;
  state.coins = 23;
  state.score = 410;
  state.served = 3;
  state.hearts = 3;
  state.orders = [];
  state.plate = [];
  state.board = null;
  state.stove = null;
  state.hands = null;
  state.flash = null;
  state.rush = false;
  state.spawnTimer = 8;

  if (n === 1) {
    state.orders = [orderFor('noodle-bowl', 38), orderFor('garden-salad', 24), orderFor('cheese-noodle', 44)];
    state.orders[0].id = 7;
    state.orders[1].id = 8;
    state.orders[2].id = 9;
    state.plate = ['noodle', 'egg'];
    state.board = { id: 'chili', progress: 1.2, done: false };
    state.stove = { id: 'tomato', progress: 3.1, done: false };
    state.hands = { kind: 'raw', id: 'tomato' };
    state.chef = { x: 560, y: 470, tx: 560, ty: 470 };
    state.flash = { text: 'Chilli on the board — plate is nearly ready!', until: performance.now() + 60000 };
  } else if (n === 2) {
    state.timeLeft = 132;
    state.orders = [orderFor('noodle-bowl', 30), orderFor('sunrise-plate', 41)];
    state.orders[0].id = 7;
    state.orders[1].id = 8;
    state.plate = ['noodle'];
    state.board = { id: 'chili', progress: 1.8, done: true };
    state.stove = { id: 'egg', progress: 2.2, done: false };
    state.hands = { kind: 'done', id: 'chili' };
    state.chef = { x: 480, y: 340, tx: 480, ty: 340 };
    state.flash = { text: 'Chilli chopped! Add it to the plate.', until: performance.now() + 60000 };
  } else if (n === 3) {
    state.timeLeft = 24;
    state.rush = true;
    state.coins = 41;
    state.served = 6;
    state.orders = [orderFor('noodle-bowl', 12), orderFor('garden-salad', 8)];
    state.orders[0].id = 12;
    state.orders[1].id = 13;
    state.plate = ['noodle', 'egg', 'chili'];
    state.stove = { id: 'egg', progress: 4, done: true };
    state.chef = { x: 760, y: 500, tx: 760, ty: 500 };
    state.flash = { text: 'SERVE NOW — the bowl is complete!', until: performance.now() + 60000 };
  } else {
    state.phase = 'title';
  }
}
