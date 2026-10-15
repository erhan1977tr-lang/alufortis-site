import * as THREE from 'three';

// Isı yalıtımlı bir doğrama profilinin kesiti (mm). Çizim merkezlenir ve 0.04 ile ölçeklenir.
const S = 0.04;
const W = 70;
const H = 58;

const pt = (x: number, y: number) => new THREE.Vector2((x - W / 2) * S, (y - H / 2) * S);

const OUTLINE: [number, number][] = [
  [0, 0], [70, 0], [70, 40], [64, 40], [64, 58], [55, 58], [55, 44],
  [17, 44], [17, 52], [8, 52], [8, 40], [0, 40],
];

function rectPath(x0: number, y0: number, x1: number, y1: number) {
  const p = new THREE.Path();
  p.moveTo(...pt(x0, y0).toArray());
  p.lineTo(...pt(x1, y0).toArray());
  p.lineTo(...pt(x1, y1).toArray());
  p.lineTo(...pt(x0, y1).toArray());
  p.closePath();
  return p;
}

function outlinePath<T extends THREE.Path>(p: T): T {
  OUTLINE.forEach(([x, y], i) => (i === 0 ? p.moveTo(...pt(x, y).toArray()) : p.lineTo(...pt(x, y).toArray())));
  p.closePath();
  return p;
}

export function profileShape() {
  const shape = outlinePath(new THREE.Shape());
  // İki ana hazne; aradaki 10 mm'lik gövde ısı köprüsü bölgesi
  shape.holes.push(rectPath(4, 4, 29, 36));
  shape.holes.push(rectPath(41, 4, 66, 36));
  // Cam tarafındaki küçük hazne
  shape.holes.push(rectPath(58, 41, 61, 54));
  // Vida kanalı
  const screw = new THREE.Path();
  const c = pt(35, 20);
  screw.absarc(c.x, c.y, 3 * S, 0, Math.PI * 2, true);
  shape.holes.push(screw);
  return shape;
}

export function profileGeometry() {
  const g = new THREE.ExtrudeGeometry(profileShape(), {
    depth: 1,
    bevelEnabled: false,
    curveSegments: 24,
  });
  g.computeVertexNormals();
  return g;
}

// Ortasından profil çıkan kalıp diski
export function dieGeometry() {
  const disc = new THREE.Shape();
  disc.absarc(0, 0, 2.4, 0, Math.PI * 2, false);
  disc.holes.push(outlinePath(new THREE.Path()));
  return new THREE.ExtrudeGeometry(disc, {
    depth: 0.5,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 3,
    curveSegments: 96,
  });
}
