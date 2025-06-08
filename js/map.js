import { Environment } from './environment.js';

export const mapLayout = [
  { type: 'fence',  x: 0,           y: 0,            w: 800,    h: 32 },
  { type: 'fence',  x: 0,           y: 568,          w: 800,    h: 32 },
  { type: 'fence',  x: 0,           y: 0,            w: 32,     h: 600 },
  { type: 'fence',  x: 768,         y: 0,            w: 32,     h: 600 },
  { type: 'fence',  x: 200,         y: 100,          w: 400,    h: 32 },
  { type: 'tree',   x: 100,         y: 300,          w: 64,     h: 64 },
  { type: 'tree',   x: 600,         y: 350,          w: 64,     h: 64 },
  { type: 'flower', x: 400,         y: 450,          w: 32,     h: 32 },
];

export function createMap() {
  return mapLayout.map(o =>
    new Environment(o.type, o.x, o.y, o.w, o.h)
  );
}