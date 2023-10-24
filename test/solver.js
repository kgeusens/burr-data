import * as DATA from '../index.js'
import { readFileSync} from 'fs'
import { rotatePoint, rotate } from '../burrUtils.js'
import * as DLX from 'dancing-links'

// https://billcutlerpuzzles.com/docs/CA6PB/analyzing.html

class Assembler {
    _puzzle
    _problemIndex
    get puzzle() { return this._puzzle }
    get problem() { return this.puzzle.problems.problem[this._problemIndex]}
    get puzzleVoxels() { return this.puzzle.shapes.voxel}
    get problemShapes() { return this.problem.shapes.shape}
    get resultVoxel() { return this.puzzleVoxels[this.problem.result.id]}
    get problemVoxels() {}
    constructor(puzzle, problemIdx = 0) {
        this._puzzle = puzzle
        this._problemIndex = problemIdx
    }
    calcRotations() {
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
    calcSelfSymmetries() {
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
        console.log(selfSymmetries)
    }
    getDLXmatrix() {
        let r = new DATA.VoxelInstance({ voxel:this.resultVoxel } )
        let rbb = r.boundingBox
        let matrix = []
        for (let psid in this.problemShapes) { // problemshapes
            psid = Number(psid)
            for (let rotidx = 0; rotidx<24;rotidx++) { // 24 rotations each
                let rotatedInstance = new DATA.VoxelInstance({ voxel: this.puzzleVoxels[this.problemShapes[psid].id], rotation: rotidx})
                let pbb = rotatedInstance.boundingBox
                for (let x = rbb.min[0] - pbb.min[0]; x <= rbb.max[0] - pbb.max[0];x++) {
                    for (let y = rbb.min[1] - pbb.min[1]; y <= rbb.max[1] - pbb.max[1];y++) {
                        for (let z = rbb.min[2] - pbb.min[2]; z <= rbb.max[2] - pbb.max[2];z++) {
                            let offset = {x:x, y:y, z:z}
                            let wm = rotatedInstance.worldmap.translateToClone(offset)
                            let map = r.worldmap.getDLXmap(wm)
                            if (map) {
                                map.data={id:this.problemShapes[psid].id, rotation:rotidx, hotspot:rotatedInstance.hotspot, offset:offset, instance: rotatedInstance}
                                // we need to add secondary constraints for the pieces (based on psid)
                                let mlen=map.secondaryRow.length
                                map.secondaryRow[mlen+this.problemShapes.length-1]=0
                                map.secondaryRow[mlen+psid]=1
                                matrix.push(map)
                            }
                        }
                    }
                }
            }
        }
        return matrix
    }
}

// I think "Node" can be the representation of a search node in the tree
class Node {
    pieceList = [] // static throughout the searchtree
    rotationList = [] // static throughout the searchtree
    hotspotList = [] // static throughout the searchtree
    offsetList = [] // changes throughout the searchtree.
//    #positionList = [] // calculated based on hostpost and offset
    instances = [] // VoxelInxstances of the rotated voxels (boundingBox starting at [0,0,0]), static
    worldmapList = [] // static worldmaps of the instances, remapped to its index in this list. eg worldmapList[2] is remapped to 2
    id
    parent=null
    root=null
    // Pass a single solution from the assembler.
    // Parse the information from the data property
    // instances are references to VoxelInstances created by the assembler. VoxelInstances are pre-translated over hotspot.
    // rotation: the rotation index applied to the voxel
    // hotspot : the default translation applied to the rotated voxel
    // offset : the additional translation for the VoxelInstance as calculated by the assembler
    // position : Sum of offset and hotspot. The full transformation for a voxel is determined by (rotation, position)
    // worldmap : worldmap of the instance. Still need to translate over offset to reflect correct state in solution.
    // parent : undefined by default, but needed when this is used as a node in the solution tree. Points back to the previous step.
    constructor(parentObject, movingPieceList, translation = [0,0,0]) {
        if (parentObject) {
            this.root = parentObject.root
            this.parent = parentObject
            this.pieceList = parentObject.pieceList
            this.rotationList = parentObject.rotationList
            this.hotspotList = parentObject.hotspotList
            this.instances = parentObject.instances
            this.worldmapList = parentObject.worldmapList //
            this.offsetList = [...parentObject.offsetList]
            if (movingPieceList) {
                for (let idx in this.pieceList) {
                    if (movingPieceList.includes(this.pieceList[idx])) {
                        let offset = this.offsetList[idx]
                        for (let i in offset) offset[i] += translation[i]
                    }
                }
            }
            // ID = the concatenation of the positionList, but normalized to the first element at [0,0,0]
            let pl = this.positionList
            let firstPos = pl[0]
            this.id = pl.map(v => [v[0] - firstPos[0], v[1] - firstPos[1], v[2] - firstPos[2]]).flat().join(" ")
        }
        else {
            this.root = this
        }
    }
    get positionList() { 
        return this.hotspotList.map((v, idx) => [v[0] + this.offsetList[idx][0],v[1] + this.offsetList[idx][1],v[2] + this.offsetList[idx][2]])
    }
    getWorldmap() {
        let resultWM = new DATA.WorldMap()
        for (let idx in this.worldmapList) {
            resultWM.place(this.worldmapList[idx].translateToClone(this.offsetList[idx]))
        }
        return resultWM
    }
    setFromAssembly(assembly) {
        // assembly is an array of pieces, it contains a property called "data" with info that we passed to the assembler.
        // Here we deconstruct that information into separate arrays.
        this.pieceList = assembly.map(v => Number(v.data.id))
        this.rotationList = assembly.map(v => Number(v.data.rotation))
        this.hotspotList = assembly.map(v => v.data.hotspot)
        this.offsetList = assembly.map(v => [v.data.offset.x, v.data.offset.y, v.data.offset.z])
        this.instances = assembly.map(v => v.data.instance)
        this.worldmapList = this.instances.map((v,idx) => v.worldmap.remap(idx))
        // ID = the concatenation of the positionList, but normalized to the first element at [0,0,0]
        let firstPos = this.positionList[0]
        this.id = this.positionList.map(v => [v[0] - firstPos[0], v[1] - firstPos[1], v[2] - firstPos[2]]).flat().join(" ")
    }
}

/*
A node is an item in the searchtree, and represents a number of pieces and their positions.
PREPARE(node) : 
prepares the full list of other nodes that can be reached in any direction, 
unless if it leads to a separation: in that case only the separation node is returned (the list is a singleton).

pseudo code:
0. moveslist = [] (empty list of nodes)
1. loop over the pieces (p) in the node
    A. loop over the 4 directions (d)
        0. mplcache = [] (empty)
        a. calculate mpl (the moving piece list) for piece p in direction d
            i.  if mpl is "everything" then skip and go to next direction
            i.  if mpl already in mplcache, skip and go to next direction
                else add mpl to mplcache
            ii. calculate maxMoves based on the bounding boxes of mpl and the node
            iii.loop over the steps (s) from 1 to maxMoves
                - check if mpl can move s steps in direction d
                - if so, 
                    + add a new node to the moveslist for the new positions of mpl
                    + if s == maxMoves, then this is a separation. STOP and return moveslist = [node] (singleton)
                - if not, skip and go to the next direction
2. return moveslist

for performance reasons, calculating mpl and the boundingBoxes can be done in 1 function

*/


// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("misusedKey.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)

let a = new Assembler(theXMPuzzle)
console.profile()
let solutions = DLX.findAll(a.getDLXmatrix())
console.profileEnd()
console.log(solutions.length)
let rootNode = new Node()
rootNode.setFromAssembly(solutions[0])
let node = new Node(rootNode, [1], [1,2,3])
console.log(node.getWorldmap())

