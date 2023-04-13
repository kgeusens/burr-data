import * as DATA from '../index.js'
import { readFileSync} from 'fs'

// Read a test xmpuzzle file and load it (this is the raw file from burrtools)
const xmlFile = readFileSync("test.xmpuzzle");
const thePuzzle = DATA.Puzzle.puzzleFromXMPuzzle(xmlFile)
//console.log(thePuzzle.saveToXML())
// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("test.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)
//console.log(theXMPuzzle.saveToXML())
// Build an empty puzzle object and test some methods
const emptyPuzzle = new DATA.Puzzle()
emptyPuzzle.addShape()
emptyPuzzle.addShape({ "@attributes" : {x: 1, y: 2, z: 3}})
console.log(emptyPuzzle.shapes.voxel[1])
//emptyPuzzle.getShape(1).setSize(5, 2, 3)
console.dir(emptyPuzzle, {depth: null})
console.log(emptyPuzzle.saveToXML())

