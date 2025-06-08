export function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function collidesWithMap(x, y, w, h, mapObjects) {
  return mapObjects.some(obj => {
    if (obj.type === 'flower') return false;
    return isColliding({ x, y, w, h }, obj);
  });
}