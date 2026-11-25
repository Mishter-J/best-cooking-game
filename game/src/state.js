// Ember Kitchen — state: the shift, the orders, the plate, the score.
// One clear job: hold and change game state. No drawing, no input here.
import {
  CHOP_SECONDS,
  COOK_SECONDS,
  INGREDIENTS,
  MAX_HEARTS,
  MAX_ORDERS,
  ORDER_PATIENCE,
  ORDER_SPAWN_EVERY,
  RECIPES,
  SHIFT_SECONDS,
} from './config.js';

export function finishedId(ingredientId) {
  // The id of an ingredient once its prep is done (chop/cook/raw all end
  // as the same finished piece the plate accepts).
  return ingredientId;
}

export function prepVerb(ingredientId) {
  const prep = INGREDIENTS[ingredientId].prep;
  return prep === 'chop' ? 'Chop it' : prep === 'cook' ? 'Cook it' : 'Ready to plate';
}

export function createState() {
  return {
    phase: 'title', // 'title' | 'playing' | 'over'
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    score: 0,
    served: 0,
    lost: 0,
    hearts: MAX_HEARTS,
    orders: [], // { recipe, patience, maxPatience, id }
    nextOrderId: 1,
    spawnTimer: 4,
    chef: { x: 480, y: 540, tx: 480, ty: 540 },
    hands: null, // { kind: 'raw'|'done', id } — what the chef carries
    board: null, // { id, progress, done } on the chopping board
    stove: null, // { id, progress, done } on the stove
    plate: [], // finished ingredient ids on the plating counter
    flash: null, // { text, until } floating message
    rush: false, // last 30 seconds
    startedAt: 0,
  };
}

export function startShift(state) {
  const fresh = createState();
  Object.assign(state, fresh, { phase: 'playing', startedAt: performance.now() });
}

export function pickRecipe(excludeIds) {
  const pool = RECIPES.filter((r) => !excludeIds.includes(r.id));
  const list = pool.length ? pool : RECIPES;
  return list[Math.floor(Math.random() * list.length)];
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  const recipe = pickRecipe(state.orders.map((o) => o.recipe.id));
  state.orders.push({
    id: state.nextOrderId++,
    recipe,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
  });
}

export function plateMatchesOrder(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const sortedPlate = [...plate].sort();
  const sortedNeeds = [...recipe.needs].sort();
  return sortedPlate.every((id, i) => id === sortedNeeds[i]);
}

export function matchingOrder(state) {
  return state.orders.find((o) => plateMatchesOrder(state.plate, o.recipe)) ?? null;
}

export function serveOrder(state, order) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.coins += order.recipe.price;
  state.score += order.recipe.price * 10 + Math.ceil(order.patience);
  state.served += 1;
  state.plate = [];
  state.flash = { text: `+${order.recipe.price} coins — ${order.recipe.name} served!`, until: performance.now() + 1800 };
}

export function tickOrders(state, dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnOrder(state);
    state.spawnTimer = ORDER_SPAWN_EVERY;
  }
  for (const order of state.orders) order.patience -= dt;
  const expired = state.orders.filter((o) => o.patience <= 0);
  if (expired.length) {
    state.orders = state.orders.filter((o) => o.patience > 0);
    state.hearts -= expired.length;
    state.lost += expired.length;
    state.flash = { text: 'An order walked out hungry…', until: performance.now() + 1800 };
    if (state.hearts <= 0) state.phase = 'over';
  }
}

export function tickShift(state, dt) {
  state.timeLeft -= dt;
  state.rush = state.timeLeft <= 30 && state.timeLeft > 0;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.phase = 'over';
  }
}

export function tickWork(state, dt, which) {
  const slot = which === 'board' ? state.board : state.stove;
  if (slot && !slot.done) {
    slot.progress += dt;
    const need = which === 'board' ? CHOP_SECONDS : COOK_SECONDS;
    if (slot.progress >= need) slot.done = true;
  }
}
