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