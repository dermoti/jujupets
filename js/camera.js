export function createCamera(viewW, viewH, worldW, worldH) {
  let x = 0;
  let y = 0;

  function clamp() {
    const maxX = Math.max(0, worldW - viewW);
    const maxY = Math.max(0, worldH - viewH);
    x = Math.max(0, Math.min(maxX, x));
    y = Math.max(0, Math.min(maxY, y));
  }

  return {
    get x() { return x; },
    get y() { return y; },
    get viewW() { return viewW; },
    get viewH() { return viewH; },

    move(dx, dy) {
      x += dx;
      y += dy;
      clamp();
    },

    centerOn(wx, wy) {
      x = wx - viewW / 2;
      y = wy - viewH / 2;
      clamp();
    },

    setPosition(nx, ny) {
      x = nx;
      y = ny;
      clamp();
    },
  };
}
