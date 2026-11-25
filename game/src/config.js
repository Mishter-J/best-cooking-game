// Ember Kitchen — config: every recipe, ingredient, station and timing.
// One clear job: the game's data. No logic lives here.
export const CANVAS_W = 960;
export const CANVAS_H = 600;

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 50;
export const ORDER_SPAWN_EVERY = 10;
export const CHOP_SECONDS = 2;
export const COOK_SECONDS = 4;
export const MAX_HEARTS = 3;

// Ingredient id -> how it is prepared before it can be plated.
// prep: 'chop' | 'cook' | 'raw'
export const INGREDIENTS = {
  tomato: { name: 'Tomato', prep: 'chop', color: '#e5484d', dark: '#b3272e' },
  lettuce: { name: 'Lettuce', prep: 'chop', color: '#5fb84a', dark: '#3d8a2e' },
  noodle: { name: 'Noodle', prep: 'cook', color: '#f5c542', dark: '#c99a1e' },
  egg: { name: 'Egg', prep: 'cook', color: '#fdf3d0', dark: '#e8c96a' },
  chili: { name: 'Chilli', prep: 'chop', color: '#d92626', dark: '#8f1414' },
  cheese: { name: 'Cheese', prep: 'raw', color: '#ffb703', dark: '#d18f00' },
};

// A recipe lists the finished ingredient ids the plate must hold.
export const RECIPES = [
  {
    id: 'noodle-bowl',
    name: 'Sunny Noodle Bowl',
    needs: ['noodle', 'egg', 'chili'],
    price: 14,
    color: '#f5c542',
  },
  {
    id: 'garden-salad',
    name: 'Garden Crunch Salad',
    needs: ['tomato', 'lettuce'],
    price: 9,
    color: '#5fb84a',
  },
  {
    id: 'cheese-noodle',
    name: 'Ember Cheese Noodle',
    needs: ['noodle', 'tomato', 'cheese'],
    price: 13,
    color: '#ffb703',
  },
  {
    id: 'sunrise-plate',
    name: 'Golden Sunrise Plate',
    needs: ['egg', 'cheese', 'lettuce'],
    price: 12,
    color: '#fdf3d0',
  },
];

// Station rectangles on the 960x600 canvas (x, y, w, h).
export const STATIONS = {
  pantry: { x: 320, y: 84, w: 624, h: 66, label: 'PANTRY — pick an ingredient' },
  board: { x: 330, y: 196, w: 190, h: 104, label: 'CHOPPING BOARD' },
  stove: { x: 560, y: 196, w: 200, h: 104, label: 'STOVE' },
  plate: { x: 330, y: 380, w: 310, h: 100, label: 'PLATING COUNTER' },
  window: { x: 700, y: 380, w: 244, h: 100, label: 'SERVE WINDOW' },
  trash: { x: 880, y: 520, w: 64, h: 64, label: 'BIN' },
};

// Pantry bins sit inside the pantry rect, one per ingredient, in this order.
export const PANTRY_ORDER = ['tomato', 'lettuce', 'noodle', 'egg', 'chili', 'cheese'];

export const CHEF_SPEED = 260;
export const CHEF_RADIUS = 20;

// Warm kitchen palette.
export const COLORS = {
  wall: '#7a4a2b',
  floorA: '#c89b6a',
  floorB: '#bd8f5e',
  hud: '#2b1a12',
  cream: '#fff3d6',
  ink: '#2b1a12',
  gold: '#ffb703',
};
