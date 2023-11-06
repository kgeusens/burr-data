import * as DATA from '../index.js'
import { readFileSync} from 'fs'
import { rotatePoint, rotate, RotationsToCheck, DoubleRotationMatrix, reduceRotations } from '../burrUtils.js'
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
    get uniqueAssemblies() {
        // The unique hash of an assembly can be defined by the sorted sequence of shapid + shaperotation
        //Remove rotations if resultVoxel is symmetric
        let len = this.assemblies.length
        let asm
        let hash
        let symrot
        let cache={}
        let rVoxelSyms = new DATA.VoxelInstance({ voxel:this._cache.resultVoxel })._voxel.calcSelfSymmetries()
        let newrot
        let result = []
        // KG : if rVoxelSyms is [0] only, we should skip this step
        if (rVoxelSyms.length <= 1) return this.assemblies
        for (let idx=0;idx < len;idx++) {
            // loop over all the assemblies
            // We check if the rotated id is already in the cache.
            // * if it is: skip, this is not unique
            // * if it is: add it to the cache, keep it in the results, and process the rotations
            //      - no need to calc "rotidx 0" because that has no effect (already cached)
            //      - rotate the pieces, calc the new id, and mark it in the cache
            asm = this.assemblies[idx]
            // asm = [ { index: int, data: {id: int, rotation: int} } ]
            // asm should be sorted by data.id so creating the hash is easy
            // We still need to take selfymmetries of individual pieces into account
            // this quickly becomes a very expensive operation O(n2)
            for (let symidx=0; symidx <rVoxelSyms.length ; symidx++) {
                symrot = rVoxelSyms[symidx]
                hash = "id"
                for (let i=0;i<asm.length;i++) {
                    newrot = DoubleRotationMatrix[asm[i].data.rotation*24 + symrot]
                    // newrot needs to be mapped using calcSymPartitionMap using the self Symmetries of the piece.
                    // we can access this from the cache using the shapeid and rotation
//                    let syms = this._cache.getShapeInstance(asm[i].data.id, 0)._voxel.calcSelfSymmetries()
//                    hash += " " + asm[i].data.id + " " + calcSymPartitionMap(syms)[newrot]
                    hash += " " + asm[i].data.id + " " + newrot
                }
                if (symrot == 0) {
                    if (cache[hash]) {
                        break
                    } 
                    else result.push(asm)
                }
                cache[hash] = true
            }
        }
        //Remove permutations of identical instances (shapes with count > 1)
        return result
    }
    sort(asm) {
        // asm = [ { index: int, data: {id: int, rotation: int} } ]
        // in place sort of the asm array, sorted by data.id
        // map will be a sparse array
        let map = []
        let id=""
        for (let i=0; i<asm.length; i++) {
            map[asm[i].data.id] = asm[i]
        }
        let count = 0
        map.forEach((v,i) => {
            asm[count++] = v
        })
    }
    getDLXmatrix() {
        this._assemblies = null
        let r = new DATA.VoxelInstance(
            { voxel:this._cache.resultVoxel } )
        let rbb = r.boundingBox
        let matrix = []
        // make use of selfsymmetries of pieces
        // if a piece is selfsymmetric, we can leave out a number of symmetries to check.
        // Before we start we can heavily optimize for symmetric puzzles using the idea of
        // a symmetryBreaker: find the piece with the longest "rotations to check" relative to the solution's selfsymmetries
        // and update it's "rotations to check"
        let rotationLists=[]
        let voxel
        let breakerID = -1
        let breakerReduction = 0
        let breakerSize = 30000
        let symgroupID
        let rotlist
        let rotlistLength
        let reducedRotlist
        let reducedRotlistLength
        let rsymgroupID=r._voxel.calcSelfSymmetries()
        for (let psid in this._cache._shapeMap) {
            voxel = this._cache.getShapeInstance(psid, 0)._voxel
            symgroupID = voxel.calcSelfSymmetries()
            rotlist = RotationsToCheck[symgroupID]
            rotlistLength = rotlist.length
            reducedRotlist = reduceRotations(rsymgroupID, rotlist)
            reducedRotlistLength = reducedRotlist.length
            rotationLists[psid]=[...rotlist]
            if ((rotlistLength - reducedRotlistLength) >=  breakerReduction) {
                if ((rotlistLength - reducedRotlistLength) ==  breakerReduction) {
                    if (voxel.size < breakerSize) {
                        breakerSize = voxel.size
                        breakerID = psid
                    }
                }
                else {
                    breakerID=psid
                    breakerReduction = rotlistLength - reducedRotlistLength
                }
            }
            console.log(psid, rotlistLength, reducedRotlist.length, voxel.size)
//            console.log(voxel) // want to check number of voxels
        }
        // reduce the breaker
        if (breakerID >= 0) { 
            rotationLists[breakerID] = reduceRotations(rsymgroupID, rotationLists[breakerID])
            console.log(rotationLists[breakerID])
        }
        console.log(breakerID)
        for (let psid in this._cache._shapeMap) { // problemshapes //KG
            psid = Number(psid)
            // we do not need to check every single rotation, but simplify based on symmetries
            let rotlist = rotationLists[psid]
            for (let rotidx of rotlist) { 
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
        this._assemblies.forEach(v => this.sort(v))
        return this._assemblies
    }
    getAssemblyNode(idx) {
        let rootNode = new Node()
        rootNode.setFromAssembly(this.assemblies[idx])
        return rootNode
    }
    checkAssembly() { // KG: need to fix
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
// Properties of root only (changes per separation):
//    _pieceList = [] // map to shape instance, static throughout a separation tree
//    _rotationList = [] // static throughout the searchtree
//    _hotspotList = [] // static throughout the searchtree
// Property of top of the search tree
//    _assembly
//    _assemblyID
// Private properties for every Node
    _offsetList = [] // changes throughout the searchtree.
    _id // cache for id, reset to undefined if you want it to be recalculated
    _parent=null // parent of this separation tree. null if top of search tree
    _root=null // root of the separation tree
    isSeparation // did we remove the pieces from the puzzle
    movingPieceList // pieces that needed to move to get here from the parent
    moveDirection // the step that the pieces needed to make to get here ;)
    constructor(parentObject, movingPieceList, translation = [0,0,0], separation = false) {
        if (parentObject) {
            this._root = parentObject.root
            this._parent = parentObject
            this.isSeparation = separation
            this._offsetList = parentObject._offsetList.slice() // flatcopy the array
            if (movingPieceList) {
                this.movingPieceList = movingPieceList.slice()
                this.moveDirection = translation.slice()
                let v
                for (let i=0;i<movingPieceList.length;i++) {
                    v = movingPieceList[i]*3
                    this._offsetList[v] += translation[0]
                    this._offsetList[v+1] += translation[1]
                    this._offsetList[v+2] += translation[2]
                }
            }
        }
        else {
            this._root = this
        }
    }
    getNextID(movingPieceList, translation) {
        let nPieces = this.pieceList.length
        let offsetList = this._offsetList.slice()
        let v
        for (let i=0;i<movingPieceList.length;i++) {
            v = movingPieceList[i]*3
            offsetList[v] += translation[0]
            offsetList[v+1] += translation[1]
            offsetList[v+2] += translation[2]
        }
        let id = "id"
        for (let idx = 0;idx < nPieces;idx++) {
            id += " " + (offsetList[idx*3] - offsetList[0]) + " " + (offsetList[idx*3+1] - offsetList[1]) + " " + (offsetList[idx*3 + 2] - offsetList[2])
        }
        return id
    }
    get root() { return this._root}
    get parent() { return this._parent}
    get pieceList() { return this._root._pieceList }
    get rotationList() { return this._root._rotationList }
    get hotspotList() { return this._root._hotspotList }
    get assembly() { return this._root._assembly}
    get assemblyID() { return this._root._assemblyID }
    get id() { 
        if (this._id) return this._id
        else {
            let nPieces = this.pieceList.length
            let offsetList = this._offsetList
            this._id = "id"
            for (let idx = 0;idx < nPieces;idx++) {
                this._id += " " + (offsetList[idx*3] - offsetList[0]) + " " + (offsetList[idx*3+1] - offsetList[1]) + " " + (offsetList[idx*3 + 2] - offsetList[2])
            }
        }
        return this._id
    }
    setFromAssembly(assembly, rootVoxel) {
        // assembly is an array of pieces, it contains a property called "data" with info that we passed to the assembler.
        // Here we deconstruct that information into separate arrays.
        // We are a rootNode, so set our root properties
        this._pieceList = assembly.map(v => Number(v.data.id))
        this._rotationList = assembly.map(v => Number(v.data.rotation))
        this._hotspotList=[]
        this._offsetList = []
        assembly.forEach(v => {
            this._hotspotList.push(v.data.hotspot[0], v.data.hotspot[1], v.data.hotspot[2])
            this._offsetList.push(v.data.offset[0], v.data.offset[1], v.data.offset[2])
        })
//        assembly.forEach(v => this._offsetList.push(v.data.offset[0], v.data.offset[1], v.data.offset[2]))
        this._id = undefined
        // now calculate the assemblyID relative to the resultVoxel
        let hash = "id"
        /*
        let symgroup = rootVoxel.calcSelfSymmetries()
        let partitionMap = calcSymPartitions(symgroup)
        for (let i=0;i<assembly.length;i++) {
            hash += " " + assembly[i].data.id + " " + partitionMap[assembly[i].data.rotation]
        }
        */
        this._assembly = assembly
        this._assemblyID = hash
    }
    separate() {
        // returns an array of new rootNodes
        // check if this is a separation.
        // if not : return an empty array
        // if it is, return 2 new rootnodes for the solver to work with
        let newNodes = []
        if (this.isSeparation) {
            // only add a new rootNode if it will contain more than 1 piece
            let nPieces = this.pieceList.length
            if ((nPieces - this.movingPieceList.length) > 1) {
                // so at this point, we know we are a separation
                // movingPieceList and movingDirection tells us what to work with
                let newRoot = new Node()
                newRoot._parent = this
                newRoot._root = newRoot
                newRoot._assembly = this._assembly
                newRoot._assemblyID = this._assemblyID
                // only keep the pieces that are not moving. Filter out the moving pieces
                newRoot._pieceList = this.pieceList.filter((v,idx) => !this.movingPieceList.includes(idx))
                // same for the other lists
                newRoot._rotationList = this.rotationList.filter((v,idx) => !this.movingPieceList.includes(idx))
                newRoot._hotspotList = []
                newRoot._offsetList = []
                for (let idx = 0;idx < nPieces;idx++) { 
                    if (!this.movingPieceList.includes(idx)) {
                        newRoot._hotspotList.push(this.hotspotList[idx*3], this.hotspotList[idx*3+1], this.hotspotList[idx*3+2])
                        newRoot._offsetList.push(this._offsetList[idx*3], this._offsetList[idx*3+1], this._offsetList[idx*3+2])
                    }
                }
                newNodes.push(newRoot)
            }
            if ((this.movingPieceList.length) > 1) {
                // This is normally the smallest partition
                let newRoot = new Node()
                newRoot._parent = this
                newRoot._root = newRoot
                // KG: we can combine below filter loops into 1 loop for speed if needed, and save on calls to includes
                // only keep the pieces that are moving. Filter out the static pieces
                newRoot._pieceList = this.pieceList.filter((v,idx) => this.movingPieceList.includes(idx))
                // same for the other lists
                newRoot._rotationList = this.rotationList.filter((v,idx) => this.movingPieceList.includes(idx))
                newRoot._hotspotList = []
                newRoot._offsetList = []
                for (let idx = 0;idx < nPieces;idx++) { 
                    if (this.movingPieceList.includes(idx)) {
                        newRoot._hotspotList.push(this.hotspotList[idx*3], this.hotspotList[idx*3+1], this.hotspotList[idx*3+2])
                        newRoot._offsetList.push(this.parent._offsetList[idx*3], this.parent._offsetList[idx*3+1], this.parent._offsetList[idx*3+2])
                    }
                }
                newNodes.push(newRoot)
            }
            return newNodes
        }
    }
}

class MovementCache {
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
        let moves = this._movementCache[hash]
        if (!moves) {
            let s1 = this.getShapeInstance(id1, rot1)
            let s2 = this.getShapeInstance(id2, rot2)
            let intersection = new DATA.BoundingBox()
            let union = new DATA.BoundingBox()
            let bb1 = s1.boundingBox
            let bb2 = s2.boundingBox
            let s1wm = s1._worldMap
            let s2wm = s2._worldMap
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
            let yStart=intersection.min[1];let yStop=intersection.max[1]
            let zStart=intersection.min[2];let zStop=intersection.max[2]
            let xStart=union.min[0];let xStop=union.max[0]
            for (let y = yStart; y<=yStop;y++) {
                for (let z = zStart; z<=zStop;z++) {
                    let gap = 32000
                    for (let x = xStart; x<=xStop;x++) { 
                        if (s1wm.hasHash(DATA.PieceMap.XYZToHash(x, y, z))) 
                        {
                            gap = 0
                        }
                        else 
                        if (s2wm.hasHash(DATA.PieceMap.XYZToHash(x-dx, y-dy,z-dz))) {
                            if (gap < mx) mx = gap
                        }
                        else { // s1 is empty, s2 is empty
                            gap++
                        }
                    }
                }
            }
            xStart=intersection.min[0];xStop=intersection.max[0]
            zStart=intersection.min[2];zStop=intersection.max[2]
            yStart=union.min[1];yStop=union.max[1]
            for (let x = xStart; x<=xStop;x++) {
                for (let z = zStart; z<=zStop;z++) {
                    let gap = 32000
                    for (let y = yStart; y<=yStop;y++) {
                        if (s1wm.hasHash(DATA.PieceMap.XYZToHash(x, y, z))) 
                        {
                            gap = 0
                        }
                        else 
                        if (s2wm.hasHash(DATA.PieceMap.XYZToHash(x-dx, y-dy,z-dz))) {
                            if (gap < my) my = gap
                        }
                        else { // s1 is empty, s2 is empty
                            gap++
                        }
                    }
                }
            }
            xStart=intersection.min[0];xStop=intersection.max[0]
            yStart=intersection.min[1];yStop=intersection.max[1]
            zStart=union.min[2];zStop=union.max[2]
            for (let x = xStart; x<=xStop;x++) {
                for (let y = yStart; y<=yStop;y++) {
                    let gap = 32000
                    for (let z = zStart; z<=zStop;z++) {
                        if (s1wm.hasHash(DATA.PieceMap.XYZToHash(x, y, z))) 
                        {
                            gap = 0
                        }
                        else 
                        if (s2wm.hasHash(DATA.PieceMap.XYZToHash(x-dx, y-dy,z-dz))) {
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
        this._cache = new MovementCache(puzzle, problemIdx)
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
                        let s1 = node.pieceList[i]; let r1 = node.rotationList[i];let o1 = i*3
                        let s2 = node.pieceList[j]; let r2 = node.rotationList[j];let o2 = j*3
                        let olist = node._offsetList
                        let maxMoves = cache.getMaxValues(s1, r1, s2, r2, olist[o2] - olist[o1], olist[o2+1] - olist[o1+1], olist[o2+2] - olist[o1+2])
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
                            let ijStart = j*numRow + i*3
                            let ikStart = k*numRow + i*3
                            let kjStart = j*numRow + k*3
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
                                            if ( matrix[j*numRow + a*3 + dim] >  matrix[i*numRow + a*3 + dim] + matrix[ijStart + dim]) {
                                                again = true
                                                break
                                            }
                                        }
                                    }
                                    if (!again) {
                                        for (let b=0;b<j;b++) {
                                            if ( matrix[b*numRow + i*3 + dim] >  matrix[b*numRow + j*3 + dim] + matrix[ijStart + dim]) { 
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
                    let vRow = matrix[k*numRow + i*3 + dim]
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
                            return [{step: [...offset], mpl: pRow, separation: true, parent:node}]
                        }
                        for (let step = 1;step <= vMoveRow;step++) {
                            offset[dim] = -1*step
                            movelist.push({step: [...offset], mpl: pRow, separation: false, parent:node})
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
                    let vCol = matrix[i*numRow + k*3 + dim]
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
                            return [{step: [...offset], mpl: pCol, separation: true, parent:node}]
                        }
                        for (let step = 1;step <= vMoveCol;step++) {
                            offset[dim] = step
                            movelist.push({step: [...offset], mpl: pCol, separation: false,parent:node})
                        }
                    }
                }
            }
        }
        return movelist
    }
    prepare(node) {
        let movelist = this.getMovevementList(node)
        if (DEBUG) {
            console.log("prepare", node.id)
            for (let move of movelist) {
                console.log("mpl", move.mpl, "dir", move.step, newNode.id)
            }
        }
        return movelist
    }
    solve(startNode) {
        let parking = []
        parking.push(startNode)

        let node
        let level
        let closedCache = [] // a single global cache
        let separated
        while (parking.length > 0) {
            startNode = parking.pop()
            let curListFront = 0;
            let newListFront = 1;
            let openlist = [[], []]
            separated = false
        
            closedCache.push(startNode.id)
            openlist[curListFront].push(startNode)
        
            level = 1
            while (!openlist[curListFront].length == 0 && !separated) {
                node = openlist[curListFront].pop()
                let st
                let movesList = this.prepare(node)
                while ((st = movesList.pop()) && !separated) {
                    // st = {mpl, step, separation, parent}
                    if (closedCache.includes(st.parent.getNextID(st.mpl, st.step))) {
                        continue
                    }
                    st = new Node(st.parent, st.mpl, st.step, st.separation)
                    // never seen this node before, add it to cache
                    closedCache.push(st.id)
                    // check for separation
                    if (!st.isSeparation) {
                        // it is not a separation, so add it for later analysis and continue to next node
                        openlist[newListFront].push(st)
                        continue
                    }
                    else {
                        // this is a separation, put the sub problems on the parking lot and contintue to the next one on the parking
                        separated = true // FLAG STOP TO GO TO NEXT ON PARKING
                        if (DEBUG) console.log ("SEPARATION FOUND level", level)
                        for (let newRoot of st.separate()) {
                            parking.push(newRoot)
                        }
                    }
                }
                //
                if (openlist[curListFront].length == 0 && !separated) {
                    if (DEBUG) console.log("Next Level", level++)
    //                console.log(closedCache[newFront])
                    curListFront = 1 - curListFront;
                    newListFront = 1 - newListFront;
                }
            }
            // if we get here, we can check the separated flag to see if it is a dead end, or a separation
            // if it is a separation, continue to the next on the parking, else return false
            if (!separated) {
                if (DEBUG) console.log("DEAD END level", level)
                return false
            }
        }
        // SUCCESS
        return true
    }
    solveAll() {
//        let all = this.assembler.uniqueAssemblies
        let all = this.assembler.assemblies
        for (let idx=0; idx<all.length; idx++) {
//        for (let idx=0; idx<22016; idx++) {
            if (DEBUG) console.log("solving assembly", idx)
            let rootNode = this.assembler.getAssemblyNode(idx)
            let result = this.solve(rootNode)
            if (DEBUG && result) console.log("SOLUTION FOUND")
            if (result) console.log("SOLUTION FOUND", rootNode.assemblyID)
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

console.time("assemble")
console.log(s.assembler.assemblies.length)
console.timeEnd("assemble")

console.profile()
    //    s.assembler.debug(20)
    console.time("solveAll")
    s.solveAll()
    console.timeEnd("solveAll")
console.profileEnd()

/*
s.assembler.assemble()
s.assembler.assemblies.forEach((a,i) => {
    let msg = "assembly "
    let m = []
    a.forEach(p => m[p.data.id] = " id " + p.data.id + " rot " + p.data.rotation)
    m.forEach(p => {
        msg += p
    })
    console.log(msg, "assemblyid",i)
})
//console.dir(s.assembler.assemblies, {depth: null})
*/
