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
  let color = {}
  if (index < r.length) color = { r: r[index], g: g[index], b: b[index] }
  else color = { r: (1+Math.sin(0.7*index))/2, g: (1+Math.sin(1.3*index+1.5)/2), b: (1+Math.sin(3.5*index+2.3))/2}
  let jitter = getJitter(color, instance)
  let result = { r: color.r + jitter.r*0.5*ramp(color.r), g: color.g + jitter.g*0.4*ramp(color.g), b: color.b + jitter.b*0.7*ramp(color.b)}
  return result
}

const rotationMatrices=[[  1, 0, 0,  0, 1, 0,  0, 0, 1 ],
[  1, 0, 0,  0, 0, -1,  0, 1, 0 ],
[  1, 0, 0,  0, -1, 0,  0, 0, -1 ],
[  1, 0, 0,  0, 0, 1,  0, -1, 0 ],
[  0, 0, -1,  0, 1, 0,  1, 0, 0 ],
[  0, -1, 0,  0, 0, -1,  1, 0, 0 ],
[  0, 0, 1,  0, -1, 0,  1, 0, 0 ],
[  0, 1, 0,  0, 0, 1,  1, 0, 0 ],
[ -1, 0, 0,  0, 1, 0,  0, 0, -1 ],
[ -1, 0, 0,  0, 0, -1,  0, -1, 0 ],
[ -1, 0, 0,  0, -1, 0,  0, 0, 1 ],
[ -1, 0, 0,  0, 0, 1,  0, 1, 0 ],
[  0, 0, 1,  0, 1, 0, -1, 0, 0 ],
[  0, 1, 0,  0, 0, -1, -1, 0, 0 ],
[  0, 0, -1,  0, -1, 0, -1, 0, 0 ],
[  0, -1, 0,  0, 0, 1, -1, 0, 0 ],
[  0, -1, 0,  1, 0, 0,  0, 0, 1 ],
[  0, 0, 1,  1, 0, 0,  0, 1, 0 ],
[  0, 1, 0,  1, 0, 0,  0, 0, -1 ],
[  0, 0, -1,  1, 0, 0,  0, -1, 0 ],
[  0, 1, 0, -1, 0, 0,  0, 0, 1 ],
[  0, 0, -1, -1, 0, 0,  0, 1, 0 ],
[  0, -1, 0, -1, 0, 0,  0, 0, -1 ],
[  0, 0, 1, -1, 0, 0,  0, -1, 0 ],
[ -1, 0, 0,  0, 1, 0,  0, 0, 1 ],
[ -1, 0, 0,  0, 0, -1,  0, 1, 0 ],
[ -1, 0, 0,  0, -1, 0,  0, 0, -1 ],
[ -1, 0, 0,  0, 0, 1,  0, -1, 0 ],
[  0, 0, -1,  0, 1, 0, -1, 0, 0 ],
[  0, -1, 0,  0, 0, -1, -1, 0, 0 ],
[  0, 0, 1,  0, -1, 0, -1, 0, 0 ],
[  0, 1, 0,  0, 0, 1, -1, 0, 0 ],
[  1, 0, 0,  0, 1, 0,  0, 0, -1 ],
[  1, 0, 0,  0, 0, -1,  0, -1, 0 ],
[  1, 0, 0,  0, -1, 0,  0, 0, 1 ],
[  1, 0, 0,  0, 0, 1,  0, 1, 0 ],
[  0, 0, 1,  0, 1, 0,  1, 0, 0 ],
[  0, 1, 0,  0, 0, -1,  1, 0, 0 ],
[  0, 0, -1,  0, -1, 0,  1, 0, 0 ],
[  0, -1, 0,  0, 0, 1,  1, 0, 0 ],
[  0, -1, 0, -1, 0, 0,  0, 0, 1 ],
[  0, 0, 1, -1, 0, 0,  0, 1, 0 ],
[  0, 1, 0, -1, 0, 0,  0, 0, -1 ],
[  0, 0, -1, -1, 0, 0,  0, -1, 0 ],
[  0, 1, 0,  1, 0, 0,  0, 0, 1 ],
[  0, 0, -1,  1, 0, 0,  0, 1, 0 ],
[  0, -1, 0,  1, 0, 0,  0, 0, -1 ],
[  0, 0, 1,  1, 0, 0,  0, -1, 0 ]]


export function rotate(stateObjects, idx = 0) {
  let rotation = rotationMatrices[idx]
  let result={}
  for (let state in stateObjects) {
    let stateArray = state.split(" ")
    let x=stateArray[0] 
    let y=stateArray[1] 
    let z=stateArray[2]
    let newStateArray = [ Number(x*rotation[0] +y*rotation[1] +z*rotation[2]), Number(x*rotation[3] + y*rotation[4] + z*rotation[5]), Number(x*rotation[6] + y*rotation[7] + z*rotation[8])]
    result[newStateArray.join(" ")]=stateObjects[state]
  }
  return result
}

export function translate(stateObjects, vector) {
  var { x, y, z } = vector
  let result={}
  for (let state in stateObjects) {
    let stateArray = state.split(" ")
    let xv=Number(stateArray[0])
    let yv=Number(stateArray[1])
    let zv=Number(stateArray[2])
    let newStateArray = [ Number(x*1+xv), Number(y*1+yv), Number(z*1+zv)]
    result[newStateArray.join(" ")]=stateObjects[state]
  }
  return result
}