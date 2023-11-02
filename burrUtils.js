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

export function rotateMap(map, idx = 0) {
  // map is in the form of Map.entries() and is iterable in for..of
  // returns a new map
  let rotation = rotationMatrices[idx]
  let result=new Map()
  for (let [pos, val] of map) {
    let posArray = pos.split(" ")
    let x=Number(posArray[0])
    let y=Number(posArray[1])
    let z=Number(posArray[2])
    let newPosArray = [ x*rotation[0] +y*rotation[1] +z*rotation[2], x*rotation[3] + y*rotation[4] + z*rotation[5], x*rotation[6] + y*rotation[7] + z*rotation[8]]
    result.set(newPosArray.join(" "),val)
  }
  return result
}

export function translateMap(map, arr) {
  // map is in the form of Map.entries() and is iterable in for..of
  // returns a new map
  let result=new Map()
  for (let [pos, val] of map) {
    let posArray = pos.split(" ")
    let xv=Number(posArray[0])
    let yv=Number(posArray[1])
    let zv=Number(posArray[2])
    let newPosArray = [ arr[0]*1+xv, arr[1]*1+yv, arr[2]*1+zv]
    result.set(newPosArray.join(" "),val)
  }
  return result
}

export function rotatePoint(point, idx = 0) {
  // point is an array [x, y, z]
  let rotation = rotationMatrices[idx]
  let result = [ Number(point[0]*rotation[0] +point[1]*rotation[1] +point[2]*rotation[2]), Number(point[0]*rotation[3] + point[1]*rotation[4] + point[2]*rotation[5]), Number(point[0]*rotation[6] + point[1]*rotation[7] + point[2]*rotation[8])]
  return result
}

export function rotateXYZ(x, y, z, idx=0) {
  // point is an array [x, y, z]
  let rotation = rotationMatrices[idx]
  return [ Number(x*rotation[0] +y*rotation[1] +z*rotation[2]), Number(x*rotation[3] + y*rotation[4] + z*rotation[5]), Number(x*rotation[6] + y*rotation[7] + z*rotation[8])]
}

export function translate(stateObjects, vector) {
  var { x=0, y=0, z=0 } = vector
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

export function translatePoint(point, vector) {
  // point is an array [x, y, z]
  let result = [ Number(point[0]*1 + vector[0]), Number(point[1]*1 + vector[1]), Number(point[2]*1 + vector[2])]
  return result
}

/*export function calcRotations() {
  let point = [ 1, 2, 3]
  let rx = [0,1,2,3]
  let ry = [0,4,8,12]
  let rz = [0,16,10,20]
  let U = {}
  let Z = {}
  for (let idx = 0;idx <24;idx++) {
      let rpoint=rotatePoint(point, idx)
      Z[rpoint.join(" ")] = idx
  }
  for (let z = 0;z<4;z++) {
      for (let y = 0;y<4;y++) {
          for (let x = 0;x<4;x++) {
              if (x*y*z == 0) {
                  let rpoint=rotatePoint(rotatePoint(rotatePoint(point,rx[x]),ry[y]),rz[z])
                  if (!(rpoint.join(" ") in U)) {
                      U[rpoint.join(" ")]=[x, y, z].join(" ")
                  }
                  console.log(x, y, z, rpoint, Z[rpoint.join(" ")])
              }
          }
      }
   }
}
*/

export const SymmetryGroups = calcSymmetryGroups()
export function calcSymmetryGroups() {
  function merge(source,add) {
      let merged = false
      for (let pos in add) 
      {
          if (!(pos in source)) {
              source[pos] = 1
              merged = true
          }
      }
      return merged
  }
  let selfSymmetries = [[0]]
  for (let idx = 1; idx <24; idx++) {
      let source = {}
      source["1 2 3"]=1
      selfSymmetries[idx]=[]
      while (merge(source,rotate(source,idx))) {}
      // source is now selfSymmetric for rotation idx
      for (let rotidx=0;rotidx < 24;rotidx++) {
          let rotatedSource=rotate(source,rotidx)
          if (!merge(rotatedSource, source)) {
              selfSymmetries[idx].push(rotidx)
          }
      }
  }
  return selfSymmetries
}

export const DoubleRotationMatrix = calcDoubleRotations()
export function calcDoubleRotations() {
  let point = [ 1, 2, 3]
  let rx = [0,1,2,3]
  let ry = [0,4,8,12]
  let rz = [0,16,10,20]
  let U = {}
  let Z = {}
  let matrix = []
  for (let idx = 0;idx <24;idx++) {
      let rpoint=rotatePoint(point, idx)
      Z[rpoint.join(" ")] = idx
  }
  for (let rot1 = 0;rot1<24;rot1++) {
      for (let rot2 = 0;rot2<24;rot2++) {
          let rpoint=rotatePoint(rotatePoint(point,rot1),rot2)
          matrix.push(Z[rpoint.join(" ")])
      }
  }
  return matrix
}

export function calcRotationsToCheck(symmetryMembers) {
  let skipMatrix = new Array(24)
  let sym=0
  let res = []
  for (let rot = 0;rot < 24; rot++) {
    if (!skipMatrix[rot]) {
      for (let idx=1;idx<symmetryMembers.length;idx++) {
        sym = symmetryMembers[idx]
        let res = DoubleRotationMatrix[sym*24 + rot]
        skipMatrix[res] = true
      }
    }
  }
  // now we have the ones to skip, but we need the ones to check
  let result = []
  for (let rot = 0;rot < 24; rot++) {
    if (!skipMatrix[rot]) result.push(rot)
  }
  return result
}
