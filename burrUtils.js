export const rotationMatrix = [ [0,0,0],
[1,0,0], // OK
[2,0,0], // OK
[3,0,0], // OK
[0,3,0], // OK
[1,3,0], // OK
[0,1,2], // OK
[3,3,0], // OK
[0,2,0], // OK
[1,2,0], // OK
[0,0,2], // OK
[3,2,0], // OK
[0,1,0], // OK
[1,1,0], // OK
[0,3,2], // OK
[3,1,0], // OK
[0,0,1], // OK
[0,1,1], // OK
[0,2,1], // OK
[0,3,1], // OK
[0,0,3], // OK
[0,3,3], // OK
[0,2,3], // OK
[0,1,3]  // OK
];

export const KG = "Koen Geusens"

export function rotationVector(idx) {
    var result = new Array();
    const pie = Math.PI/2;

    for(let i = 0;i<3;i++) {
      result.push(rotationMatrix[idx][i]*pie)
    }

    return result;
};

export function rotate(idx) { return rotationVector(idx); }

const r = [
  0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.6,
  0.0, 0.6, 0.6, 0.0, 0.6, 0.0, 0.6, 1.0, 1.0  
]

const g = [
  0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.6, 0.0,
  0.6, 0.6, 0.0, 1.0, 1.0, 0.6, 0.0, 0.6, 0.0
]

const b = [
  1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.6, 0.0, 0.0,
  0.6, 0.0, 0.6, 0.6, 0.0, 1.0, 1.0, 0.0, 0.6
]

const jr = [
  0.0,
 -0.3,  0.3, -0.3,  0.3, -0.3,  0.3, -0.3,  0.3,  0.3,
 -0.3, -0.3,  0.3,  0.3, -0.3, -0.3,  0.3,  0.0,  0.0,
  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.3, -0.3,
 -0.4,  0.4, -0.4,  0.4, -0.4,  0.4, -0.4,  0.4,  0.4,
 -0.4, -0.4,  0.4,  0.4, -0.4, -0.4,  0.4,  0.0,  0.0,
  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.4, -0.4
]

const jg = [
  0.0,
 -0.3,  0.3,  0.3, -0.3, -0.3,  0.3,  0.3, -0.3,  0.3,
 -0.3,  0.3, -0.3,  0.0,  0.0,  0.0,  0.0,  0.3, -0.3,
 -0.3,  0.3,  0.0,  0.0,  0.3, -0.3,  0.0,  0.0,
 -0.4,  0.4,  0.4, -0.4, -0.4,  0.4,  0.4, -0.4,  0.4,
 -0.4,  0.4, -0.4,  0.0,  0.0,  0.0,  0.0,  0.4, -0.4,
 -0.4,  0.4,  0.0,  0.0,  0.4, -0.4,  0.0,  0.0
]

const jb = [
  0.0,
 -0.3,  0.3,  0.3, -0.3,  0.3, -0.3, -0.3,  0.3,  0.0,
  0.0,  0.0,  0.0,  0.3, -0.3,  0.3, -0.3,  0.3, -0.3,
  0.3, -0.3,  0.3, -0.3,  0.0,  0.0,  0.0,  0.0,
 -0.4,  0.4,  0.4, -0.4,  0.4, -0.4, -0.4,  0.4,  0.0,
  0.0,  0.0,  0.0,  0.4, -0.4,  0.4, -0.4,  0.4, -0.4,
  0.4, -0.4,  0.4, -0.4,  0.0,  0.0,  0.0,  0.0
]

function ramp(val) {
  return 0.5 + 0.5*Math.abs(1 - 2*val)
}

function getJitter(c, sub) {
  let j = 0;
  let x = 0;

  while (j < jr.length) {
    x = c.r + jr[j];
    if ((x < 0) || (x > 1)) {
      j++;
      continue;
    }
    x = c.g + jg[j];
    if ((x < 0) || (x > 1)) {
      j++;
      continue;
    }
    x = c.b + jb[j];
    if ((x < 0) || (x > 1)) {
      j++;
      continue;
    }

    if (sub == 0)
      break;

    sub--;
    j++;
  }

  if (j == jr.length) j = 0;

  let jit = { r: jr[j], g: jg[j], b: jb[j] }
  return jit;
}

export function pieceColor(index, instance=0) {
  let color = { r: r[index], g: g[index], b: b[index] }
  let jitter = getJitter(color, instance)
  let result = { r: color.r + jitter.r*0.5*ramp(color.r), g: color.g + jitter.g*0.4*ramp(color.g), b: color.b + jitter.b*0.7*ramp(color.b)}
  return result
}