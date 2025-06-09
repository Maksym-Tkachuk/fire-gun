import { Environment } from './environment.js';
import { isColliding } from './util.js';

// inner bounds of the map without the fence
const INNER_X = 32, INNER_Y = 32;
const INNER_W = 800 - 64, INNER_H = 600 - 64;

function collides(x, y, w, h, objects) {
  return objects.some(o => isColliding({ x, y, w, h }, o));
}

function place(objects, type, w, h, count, avoid = []) {
  for (let i = 0; i < count; i++) {
    for (let a = 0; a < 50; a++) {
      const x = INNER_X + Math.random() * (INNER_W - w);
      const y = INNER_Y + Math.random() * (INNER_H - h);
      const rect = { x, y, w, h };
      const skip = avoid.some(zone => isColliding(rect, zone));
      if (!skip && !collides(x, y, w, h, objects)) {
        objects.push(new Environment(type, x, y, w, h));
        break;
      }
    }
  }
}

const SAFE_ZONE = { x: 384, y: 284, w: 32, h: 32 };

function baseMap(objects) {
  place(objects, 'tree',   64, 64, 2, [SAFE_ZONE]);
  place(objects, 'flower', 32, 32, 5, [SAFE_ZONE]);
  const horiz = Math.random() < 0.5;
  place(objects, 'fence', horiz ? 150 : 32, horiz ? 32 : 150, 1, [SAFE_ZONE]);
  place(objects, 'lake', 96, 96, 1, [SAFE_ZONE]);
}

function forestMap(objects) {
  place(objects, 'tree',   64, 64, 4, [SAFE_ZONE]);
  place(objects, 'flower', 32, 32, 8, [SAFE_ZONE]);
  for (let i = 0; i < 2; i++) {
    const horiz = Math.random() < 0.5;
    place(objects, 'fence', horiz ? 200 : 32, horiz ? 32 : 200, 1, [SAFE_ZONE]);
  }
  place(objects, 'lake', 96, 96, 1, [SAFE_ZONE]);
}

function openMap(objects) {
  place(objects, 'tree',   64, 64, 1, [SAFE_ZONE]);
  place(objects, 'flower', 32, 32, 3, [SAFE_ZONE]);
  if (Math.random() < 0.5) {
    const horiz = Math.random() < 0.5;
    place(objects, 'fence', horiz ? 200 : 32, horiz ? 32 : 200, 1, [SAFE_ZONE]);
  }
}

export function createMap() {
  const objects = [];

  // no outer boundary fences

  const generators = [baseMap, forestMap, openMap];
  const gen = generators[Math.floor(Math.random()*generators.length)];
  gen(objects);

  return objects;
}