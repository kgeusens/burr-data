import * as DATA from '../index.js'
import { readFileSync} from 'fs'
import { rotatePoint, rotate } from '../burrUtils.js'
import * as DLX from 'dancing-links'
import { log } from 'console'

// https://billcutlerpuzzles.com/docs/CA6PB/analyzing.html

class Assembler {
    _puzzle
    _problemIndex
    _assemblies=null
    get puzzle() { return this._puzzle }
    get problem() { return this.puzzle.problems.problem[this._problemIndex]}
    get puzzleVoxels() { return this.puzzle.shapes.voxel}
    get problemShapes() { return this.problem.shapes.shape}
    get resultVoxel() { return this.puzzleVoxels[this.problem.result.id]}
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
        this._assemblies = null
        let r = new DATA.VoxelInstance(
            { voxel:this.resultVoxel } )
        let rbb = r.boundingBox
        let matrix = []
        for (let psid in this.problemShapes) { // problemshapes
            psid = Number(psid)
            for (let rotidx = 0; rotidx<24;rotidx++) { // 24 rotations each
//                console.log("psid", psid, "rot", rotidx)
                let rotatedInstance = new DATA.VoxelInstance({ voxel: this.puzzleVoxels[this.problemShapes[psid].id], rotation: rotidx})
                let pbb = rotatedInstance.boundingBox
                for (let x = rbb.min[0] - pbb.min[0]; x <= rbb.max[0] - pbb.max[0];x++) {
                    for (let y = rbb.min[1] - pbb.min[1]; y <= rbb.max[1] - pbb.max[1];y++) {
                        for (let z = rbb.min[2] - pbb.min[2]; z <= rbb.max[2] - pbb.max[2];z++) {
                            let offset = [x, y, z]
//                            console.log("offset", offset)
//                            let wm = rotatedInstance.worldmap.clone().translate(offset)
                            let wm = rotatedInstance.worldmap.translateToClone(offset)
                            let map = r.worldmap.getDLXmap(wm)
//                            let map = null
                            if (map) {
                                map.data={id:Number(this.problemShapes[psid].id), rotation:rotidx, hotspot:rotatedInstance.hotspot, offset:offset, instance: rotatedInstance}
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
    assemble() {
        this._assemblies = DLX.findAll(this.getDLXmatrix())
        return this._assemblies.length
    }
    getAssembly(idx) {
        let rootNode = new Node()
        rootNode.setFromAssembly(this._assemblies[idx])
        return rootNode
    }
    checkAssembly() {
        // count all voxels
        for (let idx in this._assemblies) {
//            console.log("checking assembly", idx)
            let rootNode = new Node()
            rootNode.setFromAssembly(this._assemblies[idx])
            let wm = rootNode.getWorldmap()
//            console.log(wm)
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
    solve() {
        for (let idx in this._assemblies) {
            console.log("solving assembly", idx)
            let rootNode = new Node()
            rootNode.setFromAssembly(this._assemblies[idx])
            solve(rootNode)
        }
    }
    debug(idx=0) {
        let rootNode = new Node()
        rootNode.setFromAssembly(this._assemblies[idx])
//        rootNode.debug()
//        solve(rootNode)
        for (let i=0;i<1000000;i++) {
            let tempNode = new Node(rootNode)
        }
        return
        let node1 = new Node(rootNode, [0], [0, -1, 0])
        let node2 = new Node(node1, [0], [0, -1, 0])
        let node = rootNode
        console.log("rootnode")
        console.log("  offsetList", node.offsetList)
        console.log("  positionList", node.positionList)
        console.log("node1")
        node=node1
        console.log("  offsetList", node.offsetList)
        console.log("  positionList", node.positionList)
        console.log("node2")
        node=node2
        console.log("  offsetList", node.offsetList)
        console.log("  positionList", node.positionList)
    }
}

// I think "Node" can be the representation of a search node in the tree
class Node {
    pieceList = [] // static throughout the searchtree
    rotationList = [] // static throughout the searchtree
    hotspotList = [] // static throughout the searchtree
    offsetList = [] // changes throughout the searchtree.
//    positionList = [] // calculated based on hostpost and offset
    instances = [] // static VoxelInxstances of the rotated voxels (boundingBox starting at [0,0,0])
    worldmapList = [] // static worldmaps of the instances, remapped to its index in this list. eg worldmapList[2] is remapped to 2
    id // (key) id = the concatenation of positionList, but normalized to the first element at [0,0,0]
    #parent=null
    #root=null
    isSeparation = false
    movingPieceList
    moveDirection
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
            this.#root = parentObject.root
            this.#parent = parentObject
            this.pieceList = parentObject.pieceList
            this.rotationList = parentObject.rotationList
            this.hotspotList = parentObject.hotspotList
            this.instances = parentObject.instances
            this.worldmapList = parentObject.worldmapList //
            for (let idx in parentObject.offsetList) this.offsetList[idx] = [...parentObject.offsetList[idx]]
            if (movingPieceList) {
                this.movingPieceList = [...movingPieceList]
                this.moveDirection = [...translation]
                movingPieceList.forEach((v, idx) =>{
                    let offset = this.offsetList[v]
                    for (let i in offset) offset[i] += translation[i]
                })
            }
            let pl = this.positionList
            let firstPos = pl[0]
            this.id = pl.map(v => [v[0] - firstPos[0], v[1] - firstPos[1], v[2] - firstPos[2]]).reduce((res,v,i)=>{
                return res + " " + v.join(" ")
            }, "id")
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
    getWorldmaps() {
        let resultWM = new DATA.GroupMap()
        let pieceWM = []
        this.worldmapList.forEach((v,idx) => {
                let pwm = this.worldmapList[idx].translateToClone(this.offsetList[idx])
                pieceWM[idx] = pwm
                resultWM.place(pwm,idx)
            })
        return {resultWM:resultWM, pieceWM:pieceWM}
    }
    setFromAssembly(assembly) {
        // assembly is an array of pieces, it contains a property called "data" with info that we passed to the assembler.
        // Here we deconstruct that information into separate arrays.
        this.pieceList = assembly.map(v => Number(v.data.id))
        this.rotationList = assembly.map(v => Number(v.data.rotation))
        this.hotspotList = assembly.map(v => v.data.hotspot)
        this.offsetList = assembly.map(v => [v.data.offset[0], v.data.offset[1], v.data.offset[2]])
        this.instances = assembly.map(v => v.data.instance)
        // KG : worldmaps of pieces no longer need to remap. The remapping is done when the GroupMap is created.
        this.worldmapList = this.instances.map((v,idx) => v.worldmap)
        // ID = the concatenation of the positionList, but normalized to the first element at [0,0,0]
        let firstPos = this.positionList[0]
        this.id = this.positionList.map(v => [v[0] - firstPos[0], v[1] - firstPos[1], v[2] - firstPos[2]]).flat().join(" ")
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
            console.log("miss")
            instance = new DATA.VoxelInstance({ voxel: this.puzzleVoxels[this._shapeMap[id]], rotation: rot})
            this._instanceCache[hash]=instance
        }
        return instance
    }
    getMaxValues(id1, rot1, id2, rot2, dx, dy, dz, direction = 1) {
        // calculates and caches how far piece1 can move in positive directions before hitting piece2
        // [dx, dy, dz] is the relative offset of piece2 compared to piece1
        // axiom: (p1 -> p2) = (p2 -> p1) in opposite direction
        // Means when we calculate the positive direction of p1 -> p2, we also know the negative direction of p2 -> p1
        // therefor we only cache positive directions.
        // If ever you need to lookup a negative direction, just swap the positions of the 2 pieces before lookup
        // For convenience, you can specify "direction" and we will do the swapped lookup for you ;)
        if (direction != 1) {
            dx = -1*dx;dy=-1*dy;dz=-1*dz
            let id=id1;id1=id2;id2=id
            let rot=rot1;rot1=rot2;rot2=rot
        }
        let hash = id1 + " " + rot1 + " " + id2 + " " + rot2 + " " + dx + " " + dy + " " + dz
        let s1 = this.getShapeInstance(id1, rot1)
        let s2 = this.getShapeInstance(id2, rot2)
        let moves = this._movementCache[hash]
        if (!moves) {
            console.log("miss")
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
        else console.log("hit") // KG : DEBUG
        return moves
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

function prepare(node) {
    function getMovingPiecelist(valArray, translation, rwm, pwmList) {
		let mpl = []
		let mplVal = [...valArray]
        let hashOffset = DATA.GroupMap.worldSteps[0]*translation[0] + DATA.GroupMap.worldSteps[1]*translation[1] + DATA.GroupMap.worldSteps[2]*translation[2]
		for (let piece of valArray) { mpl[piece] = true}
        // now loop over mplval and append conflicting pieces if not yet in the list. One iteration should do the trick
        for (let i=0;i<mplVal.length;i++) {
            let pwm = pwmList[mplVal[i]] // the worldmap of the piece
            pwm._map.forEach((val, hash) => {
                // check
                let targetHash = hash*1 + hashOffset
                let targetVal = rwm.getHash(targetHash)
                if (!(targetVal === undefined || mpl[targetVal])) {
                    // conflict
                    mpl[targetVal]=true;mplVal.push(targetVal) // fastest operation on earth
                }
            })
            if (mplVal.length == node.pieceList.length) break
        }
        return mplVal // valArray is not modified
    }
    function canMove(idxList, translation, rwm, pwmList) {
        return rwm.canMove(idxList,translation)
    }
    function getMaxMoves(mpl, dim=0, step) {
        let maxmpl = 0
        let minmpl = 30000
        let maxrest = 0
        let minrest = 30000
        for (let idx in node.pieceList) {
            let max = node.instances[idx].boundingBox.max[dim] + node.offsetList[idx][dim]
            let min = node.instances[idx].boundingBox.min[dim] + node.offsetList[idx][dim]
            if (idx in mpl) {
                if (max>maxmpl) maxmpl = max
                if (min<minmpl) minmpl = min
            } 
            else {
                if (max>maxrest) maxrest = max
                if (min<minrest) minrest = min
            }
        }
        if (step == 1) return maxrest - minmpl
        else return maxmpl - minrest
    }
    
    let moveslist = []
    let {resultWM, pieceWM} = node.getWorldmaps()
    let mplCache = [] // 0
//    console.log("prepare")
    for (let pidx in node.pieceList) { // 1
        for (let dim of [0,1,2]) {
            for (let minstep of [1, -1]) {
                let dir = [0,0,0]
                dir[dim] = minstep
                let mpl = getMovingPiecelist([pidx*1], dir, resultWM, pieceWM) // a
                if (mpl.length == node.pieceList.length) continue // i
                let newNode = new Node(node, mpl, dir)
                if (mplCache.includes(newNode.id)) continue // i
                mplCache.push(newNode.id)
                moveslist.push(newNode)
                // ii.
                let maxMoves = getMaxMoves(mpl, dim, minstep)
                let move = 2
//                console.log("mpl", mpl, "dir", dir)
                while (move <= maxMoves) {
                    dir[dim]=minstep*move
                    if (canMove(mpl, dir, resultWM, pieceWM)) {
//                        console.log("mpl", mpl, "dir", dir)
                        let newNode = new Node(node, mpl, dir)
                        if (mplCache.includes(newNode.id)) break // i
                        mplCache.push(newNode.id)
                        moveslist.push(newNode)
                    } 
                    else break
                    move++
                }
                // if move > maxMoves then this is a separation
                if (move > maxMoves) {
                    newNode.isSeparation = true
                    return [newNode]
                }
            }
        }
    }   
    return moveslist
}

function solve(startNode) {
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
        let movesList = prepare(node)
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
            console.log ("SEPARATION FOUND")
            return st
        }
        // if we get here, we have exhausted this layer of the search tree
        // move to the next layer
        if (openlist[curListFront].length == 0) {
//            console.log("Finished Level", level++)
//            console.log(closedCache[newFront])
            curListFront = 1 - curListFront;
            newListFront = 1 - newListFront;
            closed[oldFront]=[]
            closedCache[oldFront]=[]
            oldFront = curFront;
            curFront = newFront;
            newFront = (newFront + 1) % 3;
        }
    }
    console.log("DEAD END")
    // the entire tree has been processed, no separation found
    return null
}

function profileRun(assembler)
{
    let ri = new DATA.VoxelInstance( { voxel:a.resultVoxel } )
    for (let c = 0;c<16666;c++) {
        ri.worldmap.translate([1,0,0])
        ri.worldmap.translate([0,1,0])
        ri.worldmap.translate([0,0,1])
        ri.worldmap.translate([-1,0,0])
        ri.worldmap.translate([0,-1,0])
        ri.worldmap.translate([0,0,-1])
    }
}

// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("misusedKey.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)

let a = new Assembler(theXMPuzzle)
let cache = new movementCache(theXMPuzzle)
console.log(cache.getMaxValues(0,0,6,12,3,0,0))
console.log(cache.getMaxValues(6,12,0,0,-3,0,0,-1))
let count="count not calculated"

count = a.assemble()
console.profile()
//    a.solve()
//    a.debug(240)
//    profileRun(a)
console.profileEnd()
console.log(count)

//a.checkAssembly()
//a.debug()
//a.solve()
