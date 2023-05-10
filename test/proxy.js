
import * as DATA from '../index.js'

const handler = {
    get(target, property) {
        if (property == "getVoxelPosition") {
            return function(...args) {
                let s = target[property].apply(target,args)
                return new Proxy(s,handler)
            }
        }
        if (typeof target[property] == "function") {
            return function(...args) {
                return target[property].apply(target,args)
            }
        }
        else return target[property];
    },
    set(target, property, value) {
        target[property] = value
        if (property == "state") {
            console.log(theVoxel.stateString)
        }
        return true
    }
}

const proxyPuzzle = new Proxy(DATA.Puzzle, handler)
const proxyVoxel = new Proxy(DATA.Voxel,handler)

import { readFileSync} from 'fs'

// Read a test xmpuzzle file and load it (this is the raw file from burrtools)
//const xmlFile = readFileSync("test.xmpuzzle");
//const thePuzzle = DATA.Puzzle.puzzleFromXMPuzzle(xmlFile)
//console.log(thePuzzle.saveToXML())

// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("test.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)
const theVoxel = new Proxy(theXMPuzzle.shapes.voxel[1], handler)
//theVoxel.getVoxelPosition(0,0,0).state=0
theVoxel.getVoxelPosition(0,0,0).state=0
console.log(theVoxel.setVoxelState(0,0,0,1))
console.log(theVoxel.getVoxelState(0,0,0))
//console.log(theXMPuzzle.saveToXML())
//console.log(theXMPuzzle.shapes.voxel[1].stateString)
//console.dir(theXMPuzzle, {depth: null})
//console.log(theXMPuzzle.largestShape)
