import * as DATA from '../index.js'
import { readFileSync} from 'fs'
import { rotatePoint, rotate, calcRotationsToCheck } from '../burrUtils.js'
import * as DLX from 'dancing-links'
import { log } from 'console'

// https://billcutlerpuzzles.com/docs/CA6PB/analyzing.html

class Assembler {
    _cache
    _assemblies
    constructor(cache) {
        this._cache = cache
    }
    get assemblies() {
        if (!this._assemblies) this._assemblies=this.assemble()
        return this._assemblies
    }
    getDLXmatrix() {
        this._assemblies = null
        let r = new DATA.VoxelInstance(
            { voxel:this._cache.resultVoxel } )
        let rbb = r.boundingBox
        let matrix = []
        // make use of selfsymmetries of pieces
        // if a piece is selfsymmetric, we can leave out a number of symmetries to check.
        for (let psid in this._cache._shapeMap) { // problemshapes //KG
            psid = Number(psid)
            // we do not need to check every single rotation, but simplify based on symmetries
            let syms = this._cache.getShapeInstance(psid, 0)._voxel.calcSelfSymmetries()
            let rotlist = calcRotationsToCheck(syms)
            for (let rotidx of rotlist) { // 24 rotations each
//            for (let rotidx=0;rotidx<24;rotidx++) { // 24 rotations each
//                console.log("psid", psid, "rot", rotidx)
                let rotatedInstance = this._cache.getShapeInstance(psid, rotidx) // KG
                let pbb = rotatedInstance.boundingBox
                for (let x = rbb.min[0] - pbb.min[0]; x <= rbb.max[0] - pbb.max[0];x++) {
                    for (let y = rbb.min[1] - pbb.min[1]; y <= rbb.max[1] - pbb.max[1];y++) {
                        for (let z = rbb.min[2] - pbb.min[2]; z <= rbb.max[2] - pbb.max[2];z++) {
                            let offset = [x, y, z]
//                            console.log("offset", offset)
                            let wm = rotatedInstance.worldmap.translateToClone(offset)
                            let map = r.worldmap.getDLXmap(wm)
                            if (map) {
                                map.data={id:psid, rotation:rotidx, hotspot:rotatedInstance.hotspot, offset:offset}
                                // we need to add secondary constraints for the pieces (based on psid)
                                let mlen=map.secondaryRow.length
                                map.secondaryRow[mlen+this._cache._shapeMap.length-1]=0
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
    assemble() {
        this._assemblies = DLX.findAll(this.getDLXmatrix())
        return this._assemblies
    }
    getAssemblyNode(idx) {
        let rootNode = new Node()
        rootNode.setFromAssembly(this.assemblies[idx])
        return rootNode
    }
    checkAssembly() {
        // count all voxels
        for (let idx in this._assemblies) {
//            console.log("checking assembly", idx)
            let rootNode = new Node()
            rootNode.setFromAssembly(this._assemblies[idx])
            let wm = rootNode.getWorldmap()
            let resultwm = this.resultVoxel.worldmap
            let count = 0
            // check that worldmap positions map to the result
            for ( let hash in wm._map ) {
                count++
                if (!resultwm.hasHash(hash)) console.log("ERROR in position", hash, idx)
            }
            // check for duplicates (expensive check) based on rotations and offsets
            let voxelList=[]
            for ( let i in rootNode.pieceList ) voxelList[rootNode.pieceList[i]] = i
            let id = "id"
            let idList = []
            for ( let i in voxelList ) {
                id += " " + i + " " + rootNode.rotationList[voxelList[i]] + " " + rootNode.offsetList[voxelList[i]].join(" ")
                if (idList.includes(id)) console.log("ERROR duplicate assembly")
                idList.push(id)
            }
        }
    }
}

// I think "Node" can be the representation of a search node in the tree
class Node {
// Properties of root only:
//    _pieceList = [] // map to shape instance, static throughout a separation tree
//    _rotationList = [] // static throughout the searchtree
//    _hotspotList = [] // static throughout the searchtree
// Private properties for every Node
    offsetList = [] // changes throughout the searchtree.
    _id // cache for id, reset to undefined if you want it to be recalculated
//    positionList = [] // KG: should be cached again? Not sure if this is worth it since it is only called once or twice per node
//    reverse for id: maybe it should not be cached but rather calculated, since it is only used once or twice in the lifecycle of node
//    id // (key) id = the concatenation of positionList, but normalized to the first element at [0,0,0]
    _parent=null // parent of this separation tree. null if top of search tree
    _root=null // root of the separation tree
    isSeparation // did we remove the pieces from the puzzle
    movingPieceList // pieces that needed to move to get here from the parent
    moveDirection // the step that the pieces needed to make to get here ;)
    // Pass a single solution from the assembler.
    // Parse the information from the data property
    // rotation: the rotation index applied to the voxel
    // hotspot : the default translation applied to the rotated voxel
    // offset : the additional translation for the VoxelInstance as calculated by the assembler
    // parent : undefined by default, but needed when this is used as a node in the solution tree. Points back to the previous step.
    constructor(parentObject, movingPieceList, translation = [0,0,0], separation = false) {
        if (parentObject) {
            this._root = parentObject.root
            this._parent = parentObject
//            this.pieceList = this.root.pieceList
//            this.rotationList = this.root.rotationList
//            this.hotspotList = this.root.hotspotList
            this.isSeparation = separation
            // KG : currently an offsetList ia an array of arrays. Maybe a flat array will speed things up?
            // also requires us to do a deep copy of offsetlist for every node, where a flat copy is more efficient!!
            for (let idx in parentObject.offsetList) this.offsetList[idx] = parentObject.offsetList[idx].slice()
            if (movingPieceList) {
                this.movingPieceList = movingPieceList.slice()
                this.moveDirection = translation.slice()
                let v
                for (let i=0;i<movingPieceList.length;i++) {
                    v = movingPieceList[i]
                    this.offsetList[v][0] += translation[0]
                    this.offsetList[v][1] += translation[1]
                    this.offsetList[v][2] += translation[2]
                }
            }
            /*
            let pl = this.positionList
            let firstPos = pl[0]
            this.id = "id"
            pl.forEach(v => {this.id += " " + (v[0] - firstPos[0]) + " " + (v[1] - firstPos[1])+" "+(v[2] - firstPos[2])})
            */
        }
        else {
            this._root = this
        }
    }
    get root() { return this._root}
    get parent() { return this._parent}
    get pieceList() { return this._root._pieceList }
    get rotationList() { return this._root._rotationList }
    get hotspotList() { return this._root._hotspotList }
    get positionList() { 
        return this.hotspotList.map((v, idx) => [v[0] + this.offsetList[idx][0],v[1] + this.offsetList[idx][1],v[2] + this.offsetList[idx][2]])
    }
    get id() { 
        if (this._id) return this._id
        else {
            let firstPos = this.positionList[0]
            this._id = "id"
            this.positionList.forEach(v => {this._id += " " + (v[0] - firstPos[0]) + " " + (v[1] - firstPos[1])+" "+(v[2] - firstPos[2])})
        }
        return this._id
    }
    setFromAssembly(assembly) {
        // assembly is an array of pieces, it contains a property called "data" with info that we passed to the assembler.
        // Here we deconstruct that information into separate arrays.
        // We are a rootNode, so set our root properties
        this._pieceList = assembly.map(v => Number(v.data.id))
        this._rotationList = assembly.map(v => Number(v.data.rotation))
        this._hotspotList = assembly.map(v => v.data.hotspot)
        this.offsetList = assembly.map(v => [v.data.offset[0], v.data.offset[1], v.data.offset[2]])
        // ID = the concatenation of the positionList, but normalized to the first element at [0,0,0]
//        let firstPos = this.positionList[0]
//        this.id = "id " + this.positionList.map(v => [v[0] - firstPos[0], v[1] - firstPos[1], v[2] - firstPos[2]]).flat().join(" ")
    }
    separate() {
        // returns an array of new rootNodes
        // check if this is a separation.
        // if not : return an empty array
        // if it is, return 2 new rootnodes for the solver to work with
        let newNodes = []
        if (this.isSeparation) {
            // only add a new rootNode if it will contain more than 1 piece
            if ((this.pieceList.length - this.movingPieceList.length) > 1) {
                // so at this point, we know we are a separation
                // movingPieceList and movingDirection tells us what to work with
                let newRoot = new Node()
                newRoot._parent = this
                newRoot._root = newRoot
                // only keep the pieces that are not moving. Filter out the moving pieces
                newRoot._pieceList = this.pieceList.filter((v,idx) => !this.movingPieceList.includes(idx))
                // same for the other lists
                newRoot._rotationList = this.rotationList.filter((v,idx) => !this.movingPieceList.includes(idx))
                newRoot._hotspotList = this.hotspotList.filter((v,idx) => !this.movingPieceList.includes(idx))
                // for offsetList, we need to deep copy. Maybe best do a for loop.
                newRoot.offsetList = []
                for (let idx = 0; idx < this.offsetList.length; idx++) {
                    if (!this.movingPieceList.includes(idx)) newRoot.offsetList.push(this.offsetList[idx].slice())
                }
                newNodes.push(newRoot)
            }
            if ((this.movingPieceList.length) > 1) {
                let newRoot = new Node()
                newRoot._parent = this
                newRoot._root = newRoot
                // KG: we can combine below filter loops into 1 loop for speed if needed, and save on calls to includes
                // only keep the pieces that are moving. Filter out the static pieces
                newRoot._pieceList = this.pieceList.filter((v,idx) => this.movingPieceList.includes(idx))
                // same for the other lists
                newRoot._rotationList = this.rotationList.filter((v,idx) => this.movingPieceList.includes(idx))
                newRoot._hotspotList = this.hotspotList.filter((v,idx) => this.movingPieceList.includes(idx))
                // for offsetList, we need to deep copy. Maybe best do a for loop.
                newRoot.offsetList = []
                for (let idx = 0; idx < this.offsetList.length; idx++) {
                    // need to get the original positions of the moving pieces from our parent!
                    if (this.movingPieceList.includes(idx)) newRoot.offsetList.push(this.parent.offsetList[idx].slice())
                }
                newNodes.push(newRoot)
            }
            return newNodes
        }
    }
}

class movementCache {
    _puzzle
    _problemIndex
    _instanceCache = {}
    _movementCache = {}
    _shapeMap

    get puzzle() { return this._puzzle }
    get problem() { return this.puzzle.problems.problem[this._problemIndex]}
    get puzzleVoxels() { return this.puzzle.shapes.voxel}
    get problemShapes() { return this.problem.shapes.shape}
    get resultVoxel() { return this.puzzleVoxels[this.problem.result.id]}
    constructor(puzzle, problemIdx = 0) {
        this._puzzle = puzzle
        this._problemIndex = problemIdx
        this._shapeMap=this.problem.shapeMap
    }

    getShapeInstance(id, rot) {
        // id is the index into shapeMap 
        let hash=id + " " + rot
        let instance = this._instanceCache[hash]
        if (!instance) {
            instance = new DATA.VoxelInstance({ voxel: this.puzzleVoxels[this._shapeMap[id]], rotation: rot})
            this._instanceCache[hash]=instance
        }
        return instance
    }
    getMaxValues(id1, rot1, id2, rot2, dx, dy, dz) {
        // calculates and caches how far piece1 can move in positive directions before hitting piece2
        // [dx, dy, dz] is the relative offset of piece2 compared to piece1
        // axiom: (p1 -> p2) = (p2 -> p1) in opposite direction
        // Means when we calculate the positive direction of p1 -> p2, we also know the negative direction of p2 -> p1
        // therefor we only cache positive directions.
        // If ever you need to lookup a negative direction, just swap the positions of the 2 pieces before lookup
        let hash = id1 + " " + rot1 + " " + id2 + " " + rot2 + " " + dx + " " + dy + " " + dz
        let s1 = this.getShapeInstance(id1, rot1)
        let s2 = this.getShapeInstance(id2, rot2)
        let moves = this._movementCache[hash]
        if (!moves) {
            let intersection = new DATA.BoundingBox()
            let union = new DATA.BoundingBox()
            let bb1 = s1.boundingBox
            let bb2 = s2.boundingBox
            let mx=32000; let my=32000; let mz=32000
            intersection.min[0] = Math.max(bb1.min[0], bb2.min[0] + dx)
            intersection.min[1] = Math.max(bb1.min[1], bb2.min[1] + dy)
            intersection.min[2] = Math.max(bb1.min[2], bb2.min[2] + dz)
            intersection.max[0] = Math.min(bb1.max[0], bb2.max[0] + dx)
            intersection.max[1] = Math.min(bb1.max[1], bb2.max[1] + dy)
            intersection.max[2] = Math.min(bb1.max[2], bb2.max[2] + dz)
            union.min[0] = Math.min(bb1.min[0], bb2.min[0] + dx)
            union.min[1] = Math.min(bb1.min[1], bb2.min[1] + dy)
            union.min[2] = Math.min(bb1.min[2], bb2.min[2] + dz)
            union.max[0] = Math.max(bb1.max[0], bb2.max[0] + dx)
            union.max[1] = Math.max(bb1.max[1], bb2.max[1] + dy)
            union.max[2] = Math.max(bb1.max[2], bb2.max[2] + dz)

            for (let y = intersection.min[1]; y<=intersection.max[1];y++) {
                for (let z = intersection.min[2]; z<=intersection.max[2];z++) {
                    let gap = 32000
                    for (let x = union.min[0]; x<=union.max[0];x++) { 
                        if (s1.worldmap.hasPoint([x, y, z])) { // s1 is filled
                            gap = 0
                        }
                        else 
                        if (s2.worldmap.hasPoint([x-dx, y-dy,z-dz])) { // s1 is empty, s2 is filled
                            if (gap < mx) mx = gap
                        }
                        else { // s1 is empty, s2 is empty
                            gap++
                        }
                    }
                }
            }
            for (let x = intersection.min[0]; x<=intersection.max[0];x++) {
                for (let z = intersection.min[2]; z<=intersection.max[2];z++) {
                    let gap = 32000
                    for (let y = union.min[1]; y<=union.max[1];y++) {
                        if (s1.worldmap.hasPoint([x, y, z])) { // s1 is filled
                            gap = 0
                        }
                        else 
                        if (s2.worldmap.hasPoint([x-dx, y-dy,z-dz])) { // s1 is empty, s2 is filled
                            if (gap < my) my = gap
                        }
                        else { // s1 is empty, s2 is empty
                            gap++
                        }
                    }
                }
            }
            for (let x = intersection.min[0]; x<=intersection.max[0];x++) {
                for (let y = intersection.min[1]; y<=intersection.max[1];y++) {
                    let gap = 32000
                    for (let z = union.min[2]; z<=union.max[2];z++) {
                        if (s1.worldmap.hasPoint([x, y, z])) { // s1 is filled
                            gap = 0
                        }
                        else 
                        if (s2.worldmap.hasPoint([x-dx, y-dy,z-dz])) { // s1 is empty, s2 is filled
                            if (gap < mz) mz = gap
                        }
                        else { // s1 is empty, s2 is empty
                            gap++
                        }
                    }
                }
            }
            moves = [mx, my, mz]
            this._movementCache[hash] = moves
        }
        return [moves[0], moves[1], moves[2]]
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
    A. loop over the 6 directions (d)
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

class Solver {
    _puzzle
    _problemIndex
    _assembler
    _cache
    constructor(puzzle, problemIdx = 0) {
        this._puzzle = puzzle
        this._problemIndex = problemIdx
        this._cache = new movementCache(puzzle, problemIdx)
        this._assembler = new Assembler(this._cache)
    }
    get assembler() { return this._assembler }
    getMovevementList(node) {
        function calcCutlerMatrix(node, cache) {
            // needs the movementcache
            // the shapeid can be found in the content of the pieceList
            let nPieces = node.pieceList.length
            let matrix = []
//            let matrix = new Array(nPieces*nPieces*3)
//            let numRow = nPieces
            let numRow = nPieces*3
            // pieceList maps to the shapeMap idx
            for (let j=0;j<nPieces;j++) { 
                for (let i=0;i<nPieces;i++) {
                    if (i==j) matrix.push(0,0,0)
                    else {
                        let s1 = node.pieceList[i]; let r1 = node.rotationList[i];let o1 = node.offsetList[i]
                        let s2 = node.pieceList[j]; let r2 = node.rotationList[j];let o2 = node.offsetList[j]
                        let maxMoves = cache.getMaxValues(s1, r1, s2, r2, o2[0] - o1[0], o2[1] - o1[1], o2[2] - o1[2])
                        matrix.push(maxMoves[0], maxMoves[1], maxMoves[2])
                    }
                }
            }
            // Phase 2: algorithm from Bill Cutler
            let again = true
            while (again) {
                again = false
                for (let j=0;j<nPieces;j++) { 
                    for (let i=0;i<nPieces;i++) {
                        if (i == j) continue // diagonal is 0, nothing to do
                        for ( let k=0;k<nPieces;k++ ) {
                            // (i,j) <= (i,k) + (k,j)
                            if (k == j) continue 
                            i=Number(i);j=Number(j);k=Number(k)
                            let ijStart = j*numRow + i
                            let ikStart = k*numRow + i
                            let kjStart = j*numRow + k
                            for (let dim = 0; dim <=2; dim++) {
                                let min = matrix[ikStart + dim] + matrix[kjStart + dim]
                                if (min < matrix[ijStart + dim]) {
                                    matrix[ijStart + dim] = min
                                    // optimize: check if this update impacts already updated values
                                    // if ai + ij < aj for any a < i then run again
                                    // if ij + jb < ib for any b < j then run again
                                    // else we keep 'again' on false and just continue
                                    if (!again) {
                                        for (let a=0;a<i;a++) {
                                            if ( matrix[j*numRow + a + dim] >  matrix[i*numRow + a + dim] + matrix[ijStart + dim]) {
                                                again = true
                                                break
                                            }
                                        }
                                    }
                                    if (!again) {
                                        for (let b=0;b<j;b++) {
                                            if ( matrix[b*numRow + i + dim] >  matrix[b*numRow + j + dim] + matrix[ijStart + dim]) { 
                                                again = true
                                                break
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return matrix
        }

        let matrix = calcCutlerMatrix(node, this._cache)
        // Continue to calculate the maxMoves before hitting anything else
        //
        /*
            --->i
            |
            j

            [
            [ 0, 0, 0 ], [ 0, 3, 1 ], [ 0, 3, 0 ], [ 0, 3, 0 ], [ 0, 3, 0 ], [ 0, 3, 0 ], [ 0, 3, 0 ], 

            [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ],

            [ 0, 0, 0 ], [ 0, 0, 1 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], 

            [ 0, 0, 0 ], [ 0, 0, 1 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ],

            [ 0, 0, 0 ], [ 0, 0, 1 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ],

            [ 0, 0, 0 ], [ 0, 0, 1 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ],

            [ 0, 0, 0 ], [ 0, 0, 1 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ]
            ]

            Rij   (*,j) = negatieve richting (dus eigenlijk [-x,-y,-z])
            Kolom (i,*) = positieve richting ([x,y,z])
            Dus als je +x wil opzoeken ga je over de kolom kijken
            en als je -x wil opzoeken ga je over de rij kijken

            Ergens 30000 = separation
            Ergens een consistent nummer = max moves in die richting

            Zelfde waarden betekent zelfde "move group"
            bvb (in 1 dimensie voor eenvoud) voor 7 pieces
            eerste rijs = [0,3,0,3,2,2,2] 
            betekent dat 
            * het eerste (ikzelf) en het derde stuk samen bewegen
            * ze samen kunnen bewegen over afstand 2 (kleinste waarde over ">0" waarden)
            * als die afstand == 30000 dan is dit een group removal

            Algoritme voor move analyse van "piece k" wordt dan:
            * overloop kolom k (positieve beweging) of rij k (negatieve beweging) inclusief jezelf (=altijd 0)
            * onthoud de posities ([p]) met waarde = 0 (hier zit "k" gegarandeerd ook in)
            * onthoud de kleinste ">0" waarde (vmove). vmove==undefined als alle posities==0
            * return (vmove, [p]) => vmove is de max afstand, [p] is de group die samen beweegt
            * als vmove==30000 dan is dit een separation en mag je stoppen (return only the separation)
        */
        let movelist = []
        let nPieces = node.pieceList.length
        let numRow = nPieces * 3
        // Rows first
        for (let dim = 0;dim <3; dim++) {
            for (let k = 0; k<nPieces; k++) { // overloop kolom k (positieve beweging) of rij k (negatieve beweging) inclusief jezelf (=altijd 0)
                k=Number(k)
                let pRow=[]
                let vMoveRow
                for (let i=0;i<nPieces;i++) {
                    i=Number(i);
                    let vRow = matrix[k*numRow + i + dim]
                    if (vRow == 0) pRow.push(i) // onthoud de posities ([p]) met waarde = 0
                    else vMoveRow = Math.min(vRow, vMoveRow?vMoveRow:30000) //onthoud de kleinste ">0" waarde (vmove).
                }
                // we now have the results for piece k in dimension dim
                let offset = [0,0,0]
                if (vMoveRow) {
                    // we have a partition
                    // only process it if it is not longer than half of the pieces (eg 3 out of 6, or 3 out of 7, but not 4)
                    if (pRow.length <= Math.floor(nPieces/2)) {
                        // process separation
                        if (vMoveRow >= 30000) { 
                            offset[dim] = -30000
                            return [{step: [...offset], mpl: pRow, separation: true}]
                        }
                        for (let step = 1;step <= vMoveRow;step++) {
                            offset[dim] = -1*step
                            movelist.push({step: [...offset], mpl: pRow, separation: false})
                        }
                    }
                }
            }
        }
        // Columns next
        for (let dim = 0;dim <3; dim++) {
            let kmax = nPieces
            for (let k = 0; k<kmax; k++) { // overloop kolom k (positieve beweging) of rij k (negatieve beweging) inclusief jezelf (=altijd 0)
                let pCol=[]
                let vMoveCol
                for (let i=0;i<nPieces;i++) {
                    i=Number(i);
                    let vCol = matrix[i*numRow + k + dim]
                    if (vCol == 0) {pCol.push(i)} // onthoud de posities ([p]) met waarde = 0
                    else vMoveCol = Math.min(vCol, vMoveCol?vMoveCol:30000) //onthoud de kleinste ">0" waarde (vmove).
                }
                // we now have the results for piece k in dimension dim
                let offset = [0,0,0]
                if (vMoveCol) { 
                    // we have a partition
                    // only add it to movelist if it is not longer than half of the pieces (eg 3 out of 6, or 3 out of 7, but not 4)
                    if (pCol.length <= Math.floor(nPieces/2)) {
                            // process separation
                        if (vMoveCol >= 30000) { 
                            offset[dim] = 30000
                            return [{step: [...offset], mpl: pCol, separation: true}]
                        }
                        for (let step = 1;step <= vMoveCol;step++) {
                            offset[dim] = step
                            movelist.push({step: [...offset], mpl: pCol, separation: false})
                        }
                    }
                }
            }
        }
        return movelist
    }
    prepare(node) {
//        console.log("prepare", node.movingPieceList, node.moveDirection, node.id)
        let movelist = this.getMovevementList(node)
        let nodelist = []
        if (DEBUG) console.log("prepare", node.id)
        for (let move of movelist) {
            let newNode = new Node(node, move.mpl, move.step, move.separation)
            nodelist.push(newNode)
            if (DEBUG) console.log("mpl", move.mpl, "dir", move.step, newNode.id)
        }
        return nodelist
    }
    solve(startNode) {
        let curListFront = 0;
        let newListFront = 1;
        let openlist = [[], []]
        let closedCache = []
    
        closedCache.push(startNode.id)
        openlist[curListFront].push(startNode)
    
        let node
        let level = 1
        while (!openlist[curListFront].length == 0) {
            node = openlist[curListFront].pop()
            let st
            let movesList = this.prepare(node)
            while (st = movesList.pop()) {
                if (closedCache.includes(st.id)) {
                    continue
                }
                // never seen this node before, add it to cache
                closedCache.push(st.id)
                // check for separation
                if (!st.isSeparation) {
                    // it is not a separation, so add it for later analysis and continue to next node
                    openlist[newListFront].push(st)
                    continue
                }
                // this is a separation, continue to analyse the two subproblems
                if (DEBUG) console.log ("SEPARATION FOUND level", level)
                let newRoots = st.separate()
                let result
                for (let newRoot of newRoots) {
                    result = this.solve(newRoot)
                    if (!result) return false
                }
                return true
            }
            // if we get here, we have exhausted this layer of the search tree
            // move to the next layer
            if (openlist[curListFront].length == 0) {
                if (DEBUG) console.log("Next Level", level++)
//                console.log(closedCache[newFront])
                curListFront = 1 - curListFront;
                newListFront = 1 - newListFront;
            }
        }
        if (DEBUG) console.log("DEAD END level", level)

        // the entire tree has been processed, no separation found
        return false
    }
    solveAll() {
//        for (let idx=0; idx<this.assembler.assemblies; idx++) {
        for (let idx=0; idx<2000; idx++) {
//        for (let idx in this.assembler.assemblies) {
            idx = Number(idx)
            console.log("solving assembly", idx)
            let rootNode = this.assembler.getAssemblyNode(idx)
            let result = this.solve(rootNode)
            if (result) console.log("SOLUTION FOUND")
        }
    }
    debug(id) {
        let rootNode = this.assembler.getAssemblyNode(id)
        let movelist = this.prepare(rootNode)
        this.getMovevementList(movelist[0])
        this.solve(rootNode)
    }
}

// Read a plain text xml file and load it (in the xmpuzzle format)
let DEBUG=false

const xmpuzzleFile = readFileSync("two face 3.xml");
//const xmpuzzleFile = readFileSync("misusedKey.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)

let s = new Solver(theXMPuzzle)
s.assembler.assemble()
console.log(s.assembler._assemblies.length)
console.profile()
    let r
//    s.assembler.debug(20)
//    r = s.solve(s.assembler.getAssemblyNode(1337))
    r = s.solveAll()
console.profileEnd()
/*
s.assembler.assemble()
s.assembler._assemblies.forEach((a,i) => {
    let msg = "assembly "
    let m = []
    a.forEach(p => m[p.data.id] = " id " + p.data.id + " rot " + p.data.rotation)
    m.forEach(p => {
        msg += p
    })
    console.log(msg, "assemblyid",i)
})
//console.dir(s.assembler._assemblies, {depth: null})
*/
