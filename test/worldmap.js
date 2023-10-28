import * as DATA from '../index.js'
import { readFileSync} from 'fs'
import { rotatePoint, rotate } from '../burrUtils.js'
import * as DLX from 'dancing-links'

// https://billcutlerpuzzles.com/docs/CA6PB/analyzing.html

class NewWorldMap {
	_map // sparse array
	_varimap // sparse array
    static worldMax=200
    static worldOrigin=100
    static worldOriginIndex = NewWorldMap.worldOrigin*(NewWorldMap.worldMax*NewWorldMap.worldMax + NewWorldMap.worldMax + 1)
    static worldSteps = [1, NewWorldMap.worldMax, NewWorldMap.worldMax*NewWorldMap.worldMax]
    static hashToPoint(hash) {
        let h = hash
        let x = h % NewWorldMap.worldMax; h = (h - x)/NewWorldMap.worldMax
        let y = h % NewWorldMap.worldMax; h = (h - y)/NewWorldMap.worldMax
        let z = h
        return [x-NewWorldMap.worldOrigin,y-NewWorldMap.worldOrigin,z-NewWorldMap.worldOrigin]
    }
    static pointToHash(point) {return (NewWorldMap.worldOriginIndex + NewWorldMap.worldMax*(point[2]*NewWorldMap.worldMax + point[1]) + point[0]) }
    
	constructor(source = {}, copy=true ) {
		let { _map = [], _varimap = [] } = source
		if (copy) {
			this._map = []
            for (let idx in _map) this._map[idx] = _map[idx]
			this._varimap = []
            for (let idx in _varimap) this._varimap[idx] = _varimap[idx]
		}
		else {
			this._map = _map
			this._varimap = _varimap
		}
	}
    get size() { 
        let count=0; 
        this._map.forEach(v => {if (v>=0) count++})
        this._varimap.forEach(v => {if (v>=0) count++})
        return count
    }
    get boundingBox() {
        let bb = new DATA.BoundingBox()
        bb.max = [-1*NewWorldMap.worldOrigin,-1*NewWorldMap.worldOrigin,-1*NewWorldMap.worldOrigin]
        bb.min = [NewWorldMap.worldOrigin,NewWorldMap.worldOrigin,NewWorldMap.worldOrigin]
        this._map.forEach( (val, idx) => {
            let p = NewWorldMap.hashToPoint(idx)
            for (let dim of [0,1,2]) {
                if (p[dim] < bb.min[dim]) bb.min[dim] = p[dim]
                if (p[dim] > bb.max[dim]) bb.max[dim] = p[dim]
            }
        } )
        return bb
    }
    setHash(idx,val) { this._map[idx] = val }
    setPoint(p,val) { this.setHash(NewWorldMap.pointToHash(p),val) }
    getHash(idx) { return this._map[idx] }
    getPoint(p) { return this.getHash(NewWorldMap.pointToHash(p))}
    clearHash(idx) { delete this._map[idx];delete this._varimap[idx]}
    clearPoint(p) { this.clearHash(NewWorldMap.pointToHash(p)) }
    hasHash(idx) { return (this._map[idx]>=0 || this._varimap[idx]>=0) }
    hasPoint(p) { return this.hasHash(NewWorldMap.pointToHash(p)) }
    canMove(valArray, translation) {
        // check if the pieces in valArray can move along translation
        for (let idx in this._map) {
            if ( valArray.includes(this._map[idx])  ) {
                // check if this can move
                let idxOffset = NewWorldMap.worldSteps[0]*translation[0] + NewWorldMap.worldSteps[1]*translation[1] + NewWorldMap.worldSteps[2]*translation[2]
                let targetIdx = idx*1 + idxOffset
                let targetVal = this._map[targetIdx]
                if (!(targetVal === undefined || valArray.includes(targetVal))) return false
            }
        }
        return true
    }
    move(valArray, translation) {
        // does not check if move is valid
        // build new array, because "delete" of old entries is too expensive
        let newArray = []
        for (let idx in this._map) {
            if ( valArray.includes(this._map[idx])  ) {
                // check if this can move
                let idxOffset = NewWorldMap.worldSteps[0]*translation[0] + NewWorldMap.worldSteps[1]*translation[1] + NewWorldMap.worldSteps[2]*translation[2]
                let targetIdx = idx*1 + idxOffset
                newArray[targetIdx] = this._map[idx]
            }
            else {
                newArray[idx] = this._map[idx]
            }
        }
        this._map = newArray
        return this
    }
    canPlace(worldmap) {
        // check that the destination is free
        for (let idx in worldmap._map) {
            if (this.hasHash(idx)) return false
        }
        return true
    }
    place(worldmap) {
        // does not check if placement is possible
        for (let idx in worldmap._map) {
            this._map[idx] = worldmap._map[idx]
        }
        return this
    }
    getMovingPieces(valArray, translation) {
        // valArray needs to be a dense array
        // extend the valArray to the pieces we drag along
        // translation is supposed to be only 1 step away, but you could use different values
        let mpl = valArray.map(v => v) // copy the array, result is dense starting at 0
        let oldlen=0
        while (oldlen != mpl.length) {
            oldlen = mpl.length
            for (let idx in this._map) {
                if ( mpl.includes(this._map[idx])  ) {
                    // check if this idx has conflicts
                    let idxOffset = NewWorldMap.worldSteps[0]*translation[0] + NewWorldMap.worldSteps[1]*translation[1] + NewWorldMap.worldSteps[2]*translation[2]
                    let targetIdx = idx*1 + idxOffset
                    let targetVal = this._map[targetIdx]
                    if (!(targetVal === undefined || mpl.includes(targetVal))) {
                        // conflict
                        mpl.push(targetVal) // fastest operation on earth
                    }
                }
            }
        }
        return mpl // valArray is not modified
    }
    remap(newval) {
        for (let idx in this._map) this._map[idx] = newval
        for (let idx in this._varimap) this._varimap[idx] = newval
        return this
    }
	filter(valArray) {
        let res=[]
        for (let idx in this._map) {if (valArray.includes(this._map[idx])) res[idx]=this._map[idx]}
        return res
	}
	get pieceList() {
        let pl = []
        for (let idx in this._map) {
            if (!pl.includes(this._map[idx])) pl.push(this._map[idx])
        }
		return pl
//		return pl.sort((a,b)=>a-b)
	}
    clone() {
        return new NewWorldMap(this)
    }
}


// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("misusedKey.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)

let wm = new NewWorldMap()
wm.setPoint([0,0,0], 1)
wm.setPoint([1,0,0], 2)
wm.setPoint([2,0,0], 3)
wm.setPoint([3,0,-5], 1)
let wm2 = new NewWorldMap()
wm2.setPoint([0,1,0], 1)
wm2.setPoint([1,1,0], 2)
wm2.setPoint([2,1,0], 3)
wm2.setPoint([3,1,-5], 1)
console.profile()
for (let i=0;i<10;i++) {
    //wm.canMove([1],[0,1,0])
    //wm2.canPlace(wm)
    wm.clone()
}
console.profileEnd()
let r = wm.clone()
for (let i in r._map) console.log(NewWorldMap.hashToPoint(i))
console.log(theXMPuzzle.getWorldMap())