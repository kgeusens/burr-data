import * as DATA from '../index.js'
import { readFileSync} from 'fs'

// Read a test xmpuzzle file and load it (this is the raw file from burrtools)
//const xmlFile = readFileSync("test.xmpuzzle");
//const thePuzzle = DATA.Puzzle.puzzleFromXMPuzzle(xmlFile)
//console.log(thePuzzle.saveToXML())

// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("solved.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)
//console.log(theXMPuzzle.saveToXML())
//console.log(theXMPuzzle.shapes.voxel[1].stateString)
const s=theXMPuzzle.problems.problem[0].getShapeFromId(1)
s.count=0
theXMPuzzle.problems.problem[0].setShape(s)
console.dir(theXMPuzzle.problems.problem[0].shapes, {depth: null})
//console.log(theXMPuzzle.largestShape)

// Build an empty puzzle object and test some methods
//const emptyPuzzle = new DATA.Puzzle()
//emptyPuzzle.addShape({ "@attributes" : {x: 1, y: 2, z: 3}})
//emptyPuzzle.addShape()
//emptyPuzzle.getShape(1).clone(emptyPuzzle.getShape(0))
//emptyPuzzle.getShape(0).setSize(2, 3, 4)
//console.dir(emptyPuzzle, {depth: null})
//console.log(emptyPuzzle.saveToXML())

