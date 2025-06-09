import { Environment } from './environment.js';
import { isColliding } from './util.js';

// inner bounds of the map without the fence
const INNER_X = 32, INNER_Y = 32;
const INNER_W = 800 - 64, INNER_H = 600 - 64;

function collides(x, y, w, h, objects) {
  return objects.some(o => isColliding({ x, y, w, h }, o));
}

function place(objects, type, w, h, count) {
  for (let i = 0; i < count; i++) {
    for (let a = 0; a < 50; a++) {
      const x = INNER_X + Math.random() * (INNER_W - w);
      const y = INNER_Y + Math.random() * (INNER_H - h);
      if (!collides(x, y, w, h, objects)) {
        objects.push(new Environment(type, x, y, w, h));
        break;
      }
    }
  }
}

export function createMap() {
  const objects = [];

  // field boundaries
  objects.push(new Environment('fence', 0,   0,   800, 32));
  objects.push(new Environment('fence', 0,   568, 800, 32));
  objects.push(new Environment('fence', 0,   0,   32,  600));
  objects.push(new Environment('fence', 768, 0,   32,  600));

  // random obstacles
  place(objects, 'tree',   64, 64, 5);
  place(objects, 'flower', 32, 32, 10);
  for (let i = 0; i < 3; i++) {
    const horiz = Math.random() < 0.5;
    place(objects, 'fence', horiz ? 200 : 32, horiz ? 32 : 200, 1);
  }
  place(objects, 'lake', 96, 96, 2);

  return objects;
}