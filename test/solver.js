import * as DATA from '../index.js'
import { readFileSync} from 'fs'
import { rotatePoint, rotate } from '../burrUtils.js'
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
        this._assemblies = null
        let r = new DATA.VoxelInstance(
            { voxel:this._cache.resultVoxel } )
        let rbb = r.boundingBox
        let matrix = []
        for (let psid in this._cache._shapeMap) { // problemshapes //KG
            psid = Number(psid)
            for (let rotidx = 0; rotidx<24;rotidx++) { // 24 rotations each
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
    pieceList = [] // map to shape instance
    rotationList = [] // static throughout the searchtree
    hotspotList = [] // static throughout the searchtree
    offsetList = [] // changes throughout the searchtree.
//    positionList = [] // calculated based on hotspot and offset
    id // (key) id = the concatenation of positionList, but normalized to the first element at [0,0,0]
    #parent=null
    #root=null
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
            this.#root = parentObject.root
            this.#parent = parentObject
            this.pieceList = parentObject.pieceList
            this.rotationList = parentObject.rotationList
            this.hotspotList = parentObject.hotspotList
            this.isSeparation = separation
            for (let idx in parentObject.offsetList) this.offsetList[idx] = [...parentObject.offsetList[idx]]
            if (movingPieceList) {
                this.movingPieceList = [...movingPieceList]
                this.moveDirection = [...translation]
                movingPieceList.forEach((v, idx) =>{
                    this.offsetList[v][0] += translation[0]
                    this.offsetList[v][1] += translation[1]
                    this.offsetList[v][2] += translation[2]
                })
            }
            let pl = this.positionList
            let firstPos = pl[0]
            this.id = "id"
            pl.forEach(v => {this.id += " " + (v[0] - firstPos[0]) + " " + (v[1] - firstPos[1])+" "+(v[2] - firstPos[2])})
        }
        else {
            this.#root = this
        }
    }
    get root() { return this.#root}
    get parent() { return this.#parent}
    get positionList() { 
        return this.hotspotList.map((v, idx) => [v[0] + this.offsetList[idx][0],v[1] + this.offsetList[idx][1],v[2] + this.offsetList[idx][2]])
    }
    setFromAssembly(assembly) {
        // assembly is an array of pieces, it contains a property called "data" with info that we passed to the assembler.
        // Here we deconstruct that information into separate arrays.
        this.pieceList = assembly.map(v => Number(v.data.id))
        this.rotationList = assembly.map(v => Number(v.data.rotation))
        this.hotspotList = assembly.map(v => v.data.hotspot)
        this.offsetList = assembly.map(v => [v.data.offset[0], v.data.offset[1], v.data.offset[2]])
        // ID = the concatenation of the positionList, but normalized to the first element at [0,0,0]
        let firstPos = this.positionList[0]
        this.id = "id " + this.positionList.map(v => [v[0] - firstPos[0], v[1] - firstPos[1], v[2] - firstPos[2]]).flat().join(" ")
    }
    debug() {
        for (let idx in this.worldmapList) {
            console.log("debug node: idx", idx)
            this.worldmapList[idx].translateToClone(this.offsetList[idx])._map.forEach((val, hash) => console.log(hash, DATA.GroupMap.hashToPoint(hash)))
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
            let matrix = []
            let numRow = node.pieceList.length
            // pieceList maps to the shapeMap idx
            for (let j in node.pieceList) { 
                for (let i in node.pieceList) {
                    if (i==j) matrix.push([0,0,0])
                    else {
                        let s1 = node.pieceList[i]; let r1 = node.rotationList[i];let o1 = node.offsetList[i]
                        let s2 = node.pieceList[j]; let r2 = node.rotationList[j];let o2 = node.offsetList[j]
                        let maxMoves = cache.getMaxValues(s1, r1, s2, r2, o2[0] - o1[0], o2[1] - o1[1], o2[2] - o1[2])
                        matrix.push(maxMoves)
                    }
                }
            }
            // Phase 2: algorithm from Bill Cutler
            let again = true
            while (again) {
                again = false
                for (let j in node.pieceList) {
                    for (let i in node.pieceList) {
                        if (i == j) continue // diagonal is 0, nothing to do
                        for ( let k in node.pieceList ) {
                            // (i,j) <= (i,k) + (k,j)
                            if (k == j) continue 
                            i=Number(i);j=Number(j);k=Number(k)
                            let ij = matrix[j*numRow + i]
                            let ik = matrix[k*numRow + i]
                            let kj = matrix[j*numRow + k]
                            for (let dim = 0; dim <=2; dim++) {
                                let min = ik[dim] + kj[dim]
                                if (min < ij[dim]) {
                                    ij[dim] = min
                                    again = true
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
        let numRow = node.pieceList.length
        // Rows first
        for (let dim = 0;dim <3; dim++) {
            for (let k = 0; k<node.pieceList.length; k++) { // overloop kolom k (positieve beweging) of rij k (negatieve beweging) inclusief jezelf (=altijd 0)
                k=Number(k)
                let pRow=[]
                let vMoveRow
                for (let i in node.pieceList) {
                    i=Number(i);
                    let vRow = matrix[k*numRow + i][dim]
                    if (vRow == 0) pRow.push(i) // onthoud de posities ([p]) met waarde = 0
                    else vMoveRow = Math.min(vRow, vMoveRow?vMoveRow:30000) //onthoud de kleinste ">0" waarde (vmove).
                }
                // we now have the results for piece k in dimension dim
                let offset = [0,0,0]
                if (vMoveRow) {
                    // we have a partition
                    // only process it if it is not longer than half of the pieces (eg 3 out of 6, or 3 out of 7, but not 4)
                    if (pRow.length <= Math.floor(node.pieceList.length/2)) {
//                    if (true) {
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
            let kmax = node.pieceList.length
            for (let k = 0; k<kmax; k++) { // overloop kolom k (positieve beweging) of rij k (negatieve beweging) inclusief jezelf (=altijd 0)
                let pCol=[]
                let vMoveCol
                for (let i in node.pieceList) {
                    i=Number(i);
                    let vCol = matrix[i*numRow + k][dim]
                    if (vCol == 0) {pCol.push(i)} // onthoud de posities ([p]) met waarde = 0
                    else vMoveCol = Math.min(vCol, vMoveCol?vMoveCol:30000) //onthoud de kleinste ">0" waarde (vmove).
                }
                // we now have the results for piece k in dimension dim
                let offset = [0,0,0]
                if (vMoveCol) { 
                    // we have a partition
                    // only add it to movelist if it is not longer than half of the pieces (eg 3 out of 6, or 3 out of 7, but not 4)
                    if (pCol.length <= Math.floor(node.pieceList.length/2)) {
//                    if (true) {
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
        for (let move of movelist) {
            let newNode = new Node(node, move.mpl, move.step, move.separation)
            nodelist.push(newNode)
//            console.log("mpl", move.mpl, "dir", move.step, newNode.id)
        }
        return nodelist
    }
    solve(startNode) {
        let curListFront = 0;
        let newListFront = 1;
        let oldFront = 0;
        let curFront = 1;
        let newFront = 2;
        let closed = [[], [], []]
        let openlist = [[], []]
        let closedCache = [[], [], []]
    
        closed[curFront].push(startNode)
        closedCache[curFront].push(startNode.id)
        openlist[curListFront].push(startNode)
    
        let node
        let level = 1
        while (!openlist[curListFront].length == 0) {
            node = openlist[curListFront].pop()
            let st
            let movesList = this.prepare(node)
            while (st = movesList.pop()) {
                if (closedCache[oldFront].includes(st.id) || closedCache[curFront].includes(st.id) || closedCache[newFront].includes(st.id)) {
                    continue
                }
                // never seen this node before, add it to new layer
                closed[newFront].push(st)
                closedCache[newFront].push(st.id)
                // check for separation
                if (!st.isSeparation) {
                    // it is not a separation, so add it for later analysis and continue to next node
                    openlist[newListFront].push(st)
                    continue
                }
                // this is a separation, continue to analyse the two subproblems
                // not implemented yet
//                console.log ("SEPARATION FOUND")
                return st
            }
            // if we get here, we have exhausted this layer of the search tree
            // move to the next layer
            if (openlist[curListFront].length == 0) {
//                console.log("Next Level", level++)
//                console.log(closedCache[newFront])
                curListFront = 1 - curListFront;
                newListFront = 1 - newListFront;
                closed[oldFront]=[]
                closedCache[oldFront]=[]
                oldFront = curFront;
                curFront = newFront;
                newFront = (newFront + 1) % 3;
            }
        }
//        console.log("DEAD END")
        // the entire tree has been processed, no separation found
        return null
    }
    solveAll() {
        for (let idx in this.assembler.assemblies) {
            idx = Number(idx)
//            console.log("solving assembly", idx)
            let rootNode = this.assembler.getAssemblyNode(idx)
            this.solve(rootNode)
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
const xmpuzzleFile = readFileSync("misusedKey.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)

let s = new Solver(theXMPuzzle)

console.profile()
    let r
//    s.assembler.debug(20)
//    r = s.solve(s.assembler.getAssemblyNode(20))
    r = s.solveAll()
console.profileEnd()
console.log(s.assembler._assemblies.length)
