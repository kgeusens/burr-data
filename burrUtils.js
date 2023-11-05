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

// SymmetryMap[rotx] = [...] if you're symmetric in rotx, then you are also symmetric in [...]
export const SymmetryMap = 
[
  [ 0 ],             [ 0, 1, 2, 3 ],
  [ 0, 2 ],          [ 0, 1, 2, 3 ],
  [ 0, 4, 8, 12 ],   [ 0, 5, 23 ],
  [ 0, 6 ],          [ 0, 7, 17 ],
  [ 0, 8 ],          [ 0, 9 ],
  [ 0, 10 ],         [ 0, 11 ],
  [ 0, 4, 8, 12 ],   [ 0, 13, 19 ],
  [ 0, 14 ],         [ 0, 15, 21 ],
  [ 0, 10, 16, 20 ], [ 0, 7, 17 ],
  [ 0, 18 ],         [ 0, 13, 19 ],
  [ 0, 10, 16, 20 ], [ 0, 15, 21 ],
  [ 0, 22 ],         [ 0, 5, 23 ]
]


// The index into SymmetryGroups is the ID of a symmetryGroup, called symgroupID
export const SymmetryGroups = 
[
  1,        5,      15,      65,
257,      513,    1025,    1285,
2049,     2565,    3855,    4369,
16385,    16705,   21845,  131201,
262145,   532481, 1115137, 2129921,
2392641,  4194305, 4342401, 4457473,
4728897,  5571845, 8388641, 8669217,
11183525, 16777215
]
/*
export function calcSymmetryGroups() {
  let mySymGroups = []
  let myHash
  let mySymGroup
  for (let i=0;i<24;i++) {
      for (let j=0;j<24;j++) {
          myHash=rotationsToHash([i,j])
          mySymGroup = calcSymmetryGroup(myHash)
          mySymGroups[mySymGroup]=mySymGroup
      }
      myHash=rotationsToHash([i])
      mySymGroup = calcSymmetryGroup(myHash)
      mySymGroups[mySymGroup]=mySymGroup
  }
  let result = []
  mySymGroups.forEach(v => result.push(v))
  return result
}
*/

// map a symgroupID to the rotations that need to be checked in DLX
export const RotationsToCheck =
[
  [ 0,  1,  2,  3,  4,  5,  6,  7, 8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 ],
  [ 0,  1,  4,  5,  8, 9, 12, 13, 16, 17, 20, 21 ],
  [ 0, 4, 8, 12, 16, 20 ],
  [ 0,  1, 2, 3,  4, 5, 7, 8, 9, 11, 13, 15 ],
  [ 0,  1, 2,  3,  4, 5,  6, 7, 16, 17, 18, 19 ],
  [ 0,  1, 2,  3,  4, 5,  6, 7, 16, 17, 18, 19 ],
  [ 0,  1, 2,  3,  4, 5,  6, 7, 16, 17, 18, 19 ],
  [ 0, 1, 4, 5, 16, 17 ],
  [ 0,  1, 2,  3,  4, 5,  6, 7, 16, 17, 18, 19 ],
  [ 0, 1, 4, 5, 16, 17 ],
  [ 0, 4, 16 ],
  [ 0, 1, 2, 3, 5, 7 ],
  [ 0,  1, 2,  3,  5, 6,  7, 9, 10, 11, 13, 15 ],
  [ 0, 1, 2, 3, 5, 7 ],
  [ 0, 1, 5 ],
  [ 0, 1, 2, 3, 4, 5, 8, 9 ],
  [ 0,  1, 2, 3,  4, 5,  6, 8, 9, 10, 12, 14 ],
  [ 0, 1, 2,  3, 5, 6, 9, 10 ],
  [ 0, 1, 2, 3, 4, 6 ],
  [ 0, 1,  2,  3, 6, 7, 10, 11 ],
  [ 0, 1, 2, 3 ],
  [ 0,  1, 2,  3,  4, 6,  7, 8, 10, 11, 12, 14 ],
  [ 0, 1, 2, 3 ],
  [ 0, 1, 2, 3, 4, 6 ],
  [ 0, 1, 2, 3 ],
  [ 0, 1, 4 ],
  [ 0, 1, 2,  3, 4, 7, 8, 11 ],
  [ 0, 1, 2, 3 ],
  [ 0, 1 ],
  [ 0 ]
]
/*
export function calcRotationsToCheck() {
  let rotationsToCheck=[]
  for (let symgroupID=0;symgroupID<SymmetryGroups.length;symgroupID++) {
    let symGroup = SymmetryGroups[symgroupID]
    let symmetryMembers = hashToRotations(symGroup)
    let skipMatrix = new Array(24)
    let sym=0
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
    rotationsToCheck.push(result)
  }
  return rotationsToCheck
}
*/

// 
export function calcSymmetryGroup(rotGroup)  {
  // based on double rotations
  // returns a hash
  if (!Array.isArray(rotGroup)) rotGroup = hashToRotations(rotGroup)
  let rot
  let roti
  let rotj 
  let resGroup = rotGroup.slice()
  for (let i = 0;i<resGroup.length;i++) {
    // double rotate with the pieces on your left
    roti = resGroup[i]
    for (let j = 0;j<=i;j++) {
      // double rotate and check if result already in resGroup
      rotj = resGroup[j]
      rot = DoubleRotationMatrix[roti*24 + rotj]
      if (!(resGroup.includes(rot))) {
        resGroup.push(rot)
      }
      rot = DoubleRotationMatrix[rotj*24 + roti]
      if (!(resGroup.includes(rot))) {
        resGroup.push(rot)
      }
    }
  }
  return rotationsToHash(resGroup)
}

// DoubleRotationMatrix[rot1*24 + rot2] = rotx = rot1 followed by rot2
export const DoubleRotationMatrix = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,1,2,3,0,5,6,7,4,9,10,11,8,13,14,15,12,17,18,19,16,21,22,23,20,2,3,0,1,6,7,4,5,10,11,8,9,14,15,12,13,18,19,16,17,22,23,20,21,3,0,1,2,7,4,5,6,11,8,9,10,15,12,13,14,19,16,17,18,23,20,21,22,4,21,14,19,8,22,2,18,12,23,6,17,0,20,10,16,5,1,13,9,7,11,15,3,5,22,15,16,9,23,3,19,13,20,7,18,1,21,11,17,6,2,14,10,4,8,12,0,6,23,12,17,10,20,0,16,14,21,4,19,2,22,8,18,7,3,15,11,5,9,13,1,7,20,13,18,11,21,1,17,15,22,5,16,3,23,9,19,4,0,12,8,6,10,14,2,8,11,10,9,12,15,14,13,0,3,2,1,4,7,6,5,22,21,20,23,18,17,16,19,9,8,11,10,13,12,15,14,1,0,3,2,5,4,7,6,23,22,21,20,19,18,17,16,10,9,8,11,14,13,12,15,2,1,0,3,6,5,4,7,20,23,22,21,16,19,18,17,11,10,9,8,15,14,13,12,3,2,1,0,7,6,5,4,21,20,23,22,17,16,19,18,12,17,6,23,0,16,10,20,4,19,14,21,8,18,2,22,15,11,7,3,13,1,5,9,13,18,7,20,1,17,11,21,5,16,15,22,9,19,3,23,12,8,4,0,14,2,6,10,14,19,4,21,2,18,8,22,6,17,12,23,10,16,0,20,13,9,5,1,15,3,7,11,15,16,5,22,3,19,9,23,7,18,13,20,11,17,1,21,14,10,6,2,12,0,4,8,16,5,22,15,19,9,23,3,18,13,20,7,17,1,21,11,10,6,2,14,0,4,8,12,17,6,23,12,16,10,20,0,19,14,21,4,18,2,22,8,11,7,3,15,1,5,9,13,18,7,20,13,17,11,21,1,16,15,22,5,19,3,23,9,8,4,0,12,2,6,10,14,19,4,21,14,18,8,22,2,17,12,23,6,16,0,20,10,9,5,1,13,3,7,11,15,20,13,18,7,21,1,17,11,22,5,16,15,23,9,19,3,0,12,8,4,10,14,2,6,21,14,19,4,22,2,18,8,23,6,17,12,20,10,16,0,1,13,9,5,11,15,3,7,22,15,16,5,23,3,19,9,20,7,18,13,21,11,17,1,2,14,10,6,8,12,0,4,23,12,17,6,20,0,16,10,21,4,19,14,22,8,18,2,3,15,11,7,9,13,1,5]
/*
export const InverseRotations = new Array(24)
  let point = [ 1, 2, 3]
  let Z = {}
  let res
  for (let idx = 0;idx <24;idx++) {
      let rpoint=rotatePoint(point, idx)
      Z[rpoint.join(" ")] = idx
  }
  for (let rot1 = 0;rot1<24;rot1++) {
      for (let rot2 = 0;rot2<24;rot2++) {
          let rpoint=rotatePoint(rotatePoint(point,rot1),rot2)
          res = Z[rpoint.join(" ")]
          DoubleRotationMatrix.push(Z[rpoint.join(" ")])
          if (res == 0) InverseRotations[rot1]=rot2
      }
  }
*/

// map a symmetry group id (symgroupID) to a "partitionMap"
// Rotations with the same number are part of the same partition (based on the symmetry group)
// useful to calculate a unique id for an assembly
export const SymmetryGroupPartitionMaps =
[
  [ 0,  1,  2,  3,  4,  5,  6,  7, 8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 ],
  [ 0,  1,  0,  1,  4,  5,  4,  5, 8,  9,  8,  9, 12, 13, 12, 13, 16, 17, 16, 17, 20, 21, 20, 21 ],
  [ 0,  0,  0,  0,  4,  4,  4,  4, 8,  8,  8,  8, 12, 12, 12, 12, 16, 16, 16, 16, 20, 20, 20, 20 ],
  [ 0, 1,  2,  3, 4,  5,  0,  7,  8, 9,  4, 11, 2, 13,  8, 15, 7, 3, 15, 11, 5,  9, 13,  1  ],
  [ 0,  1,  2,  3,  4,  5,  6,  7, 0,  3,  2,  1,  4,  7,  6,  5, 16, 17, 18, 19, 18, 17, 16, 19 ],
  [ 0,  1,  2,  3,  4,  5,  6,  7, 1,  0,  3,  2,  5,  4,  7,  6, 16, 17, 18, 19, 19, 18, 17, 16 ],
  [ 0,  1,  2,  3,  4,  5,  6,  7, 2,  1,  0,  3,  6,  5,  4,  7, 16, 17, 18, 19, 16, 19, 18, 17 ],
  [ 0,  1,  0,  1,  4,  5,  4,  5, 0,  1,  0,  1,  4,  5,  4,  5, 16, 17, 16, 17, 16, 17, 16, 17 ],
  [ 0,  1,  2,  3,  4,  5,  6,  7, 3,  2,  1,  0,  7,  6,  5,  4, 16, 17, 18, 19, 17, 16, 19, 18 ],
  [ 0,  1,  0,  1,  4,  5,  4,  5, 1,  0,  1,  0,  5,  4,  5,  4, 16, 17, 16, 17, 17, 16, 17, 16 ],
  [ 0,  0,  0,  0,  4,  4,  4,  4, 0,  0,  0,  0,  4,  4,  4,  4, 16, 16, 16, 16, 16, 16, 16, 16 ],
  [ 0, 1, 2, 3, 0, 5, 2, 7, 0, 3, 2, 1, 0, 7, 2, 5, 5, 1, 7, 3, 7, 1, 5, 3 ],
  [ 0, 1,  2,  3,  2,  5, 6,  7, 6, 9, 10, 11, 10, 13, 0, 15, 13, 9,  5,  1, 15,  3, 7, 11 ],
  [ 0, 1, 2, 3, 2, 5, 0, 7, 0, 3, 2, 1, 2, 7, 0, 5, 7, 3, 5, 1, 5, 3, 7, 1 ],
  [ 0, 1, 0, 1, 0, 5, 0, 5, 0, 1, 0, 1, 0, 5, 0, 5, 5, 1, 5, 1, 5, 1, 5, 1 ],
  [ 0, 1, 2, 3, 4, 5, 1, 0, 8, 9, 5, 4, 3, 2, 9, 8, 4, 0, 3, 8, 1, 5, 9, 2 ],
  [ 0, 1,  2,  3,  4, 5,  6,  1, 8, 9, 10,  5, 12, 3, 14,  9, 8, 4,  0, 12,  2, 6, 10, 14 ],
  [ 0, 1,  2, 3, 1, 5, 6,  2, 5, 9, 10, 6, 9, 0, 3, 10, 9, 5,  1, 0, 3, 2, 6, 10 ],
  [ 0, 1, 2, 3, 4, 1, 6, 3, 2, 1, 0, 3, 6, 1, 4, 3, 0, 6, 2, 4, 0, 4, 2, 6 ],
  [ 0,  1,  2,  3,  3,  2, 6, 7, 7,  6, 10, 11, 11, 10, 1, 0, 1, 10,  6,  2, 11,  0, 3, 7 ],
  [ 0, 1, 2, 3, 3, 2, 0, 1, 1, 0, 3, 2, 2, 3, 1, 0, 1, 3, 0, 2, 2, 0, 3, 1 ],
  [ 0,  1,  2,  3,  4,  3,  6, 7, 8,  7, 10, 11, 12, 11, 14, 1, 2, 14, 10,  6,  8, 12,  0, 4 ],
  [ 0, 1, 2, 3, 2, 3, 1, 0, 1, 0, 3, 2, 3, 2, 0, 1, 2, 0, 3, 1, 1, 3, 0, 2 ],
  [ 0, 1, 2, 3, 4, 3, 6, 1, 2, 1, 0, 3, 6, 3, 4, 1, 2, 4, 0, 6, 2, 6, 0, 4 ],
  [ 0, 1, 2, 3, 1, 3, 0, 2, 3, 2, 1, 0, 2, 0, 3, 1, 2, 3, 1, 0, 3, 2, 0, 1 ],
  [ 0, 1, 0, 1, 4, 1, 4, 1, 0, 1, 0, 1, 4, 1, 4, 1, 0, 4, 0, 4, 0, 4, 0, 4 ],
  [ 0, 1,  2,  3, 4, 0,  3, 7, 8, 4,  7, 11, 1, 8, 11, 2, 3, 2, 11,  7, 4, 8,  1, 0 ],
  [ 0, 1, 2, 3, 2, 0, 3, 1, 3, 2, 1, 0, 1, 3, 0, 2, 3, 2, 0, 1, 2, 3, 1, 0 ],
  [ 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0 ],
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
]


/*
export function calcSymmetryGroupPartitionMaps() {
  let result = []
  SymmetryGroups.forEach((v,i) => result.push(calcSymmetryGroupPartitionMap(i)))
  return result
}
*/

export function calcSymmetryGroupPartitionMap(symgroupID) {
  let symmetryMembers
  if (!(Array.isArray(symgroupID))) symmetryMembers = hashToRotations(SymmetryGroups[symgroupID])
  else symmetryMembers = symgroupID

  let skipMatrix = new Array(24)
  let sym=0
  let group
  for (let rot = 0;rot < 24; rot++) {
    if (!(skipMatrix[rot]>=0)) {
      group = []
      for (let idx=0;idx<symmetryMembers.length;idx++) {
        sym = symmetryMembers[idx]
        let res = DoubleRotationMatrix[rot + 24*sym]
        group.push(res)
        skipMatrix[res] = group
      }
    }
  }
  let result = []
  for (let i=0;i<skipMatrix.length;i++) {
    result.push(Math.min(...skipMatrix[i]))
  }
  // now we have mapping of rotation to group
  return result
}


/*
export function calcSymPartitionMap(symmetryMembers) {
  // Maps rotations
  // Map(x) takes rotation x, and rotates it again over every symmetry member
  // The result is a group of rotations that are equivalent according to the symmetrygroup.
  // The resulting group is then identified by the smallest rotation id and stored in the map
  // This is useful to quickly identify equivalent assemblies and calculating unique assembly ids
  // This can later be cached in a static lookup table instead of caluclating dynamically.
  let skipMatrix = new Array(24)
  let sym=0
  let group
  for (let rot = 0;rot < 24; rot++) {
    if (!(skipMatrix[rot]>=0)) {
      group = []
      for (let idx=0;idx<symmetryMembers.length;idx++) {
        sym = symmetryMembers[idx]
        let res = DoubleRotationMatrix[rot + 24*sym]
        group.push(res)
        skipMatrix[res] = group
      }
    }
  }
  let result = []
  for (let i=0;i<skipMatrix.length;i++) {
    result.push(Math.min(...skipMatrix[i]))
  }
  // now we have mapping of rotation to group
  return result
}
*/
// let's define symmetries and rotations as a bitmap of 24 bits, with rotation 0 being the lowest value bit
// that makes it easy and very fast to compare etc
// [] = hash 0
// [0] = hash 1
// [3] = hash 8 (3d LSB)
export function rotationsToHash(rotationArray) {
  let hash = 0
  rotationArray.forEach(v => hash = (hash | (1 << (v))))
  return hash
}
export function hashToRotations(hash) {
  let result = []
  let bit
  for (let i = 0;i<24;i++) {
    bit = 1 << (i)
    if (hash & bit) 
      result.push(i)
  }
return result
}