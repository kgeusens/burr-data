import * as DATA from '../index.js'
import { readFileSync} from 'fs'

// Read a test xmpuzzle file and load it (this is the raw file from burrtools)
//const xmlFile = readFileSync("test.xmpuzzle");
//const thePuzzle = DATA.Puzzle.puzzleFromXMPuzzle(xmlFile)
//console.log(thePuzzle.saveToXML())

// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("magicDrawer.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)
//theXMPuzzle.problems.problem[0].shapes.shape[0].group=0
//theXMPuzzle.problems.problem[0].shapes.shape[0].group=2
console.log(theXMPuzzle.saveToXML())
//console.log(theXMPuzzle.shapes.voxel[1].stateString)
//console.dir(theXMPuzzle, {depth: null})
//console.log(theXMPuzzle.largestShape)
let sep=theXMPuzzle.problems.problem[0].solutions.solution[0].separation[0]
//console.dir(sep.statePositions, {depth:null})
//console.dir(sep.statePositionsAll, {depth:null})
console.dir(sep.movePositionsAll, {depth:null})
//console.log(sep.movePositionsAll.length)
console.dir(sep.stateCountAll, {depth:null})
console.log(theXMPuzzle.problems.problem[0].solutions.solution[0].complexity)

// Build an empty puzzle object and test some methods
//const emptyPuzzle = new DATA.Puzzle()
//emptyPuzzle.addShape({ "@attributes" : {x: 1, y: 2, z: 3}})
//emptyPuzzle.addShape()
//emptyPuzzle.getShape(1).clone(emptyPuzzle.getShape(0))
//emptyPuzzle.getShape(0).setSize(2, 3, 4)
//console.dir(emptyPuzzle, {depth: null})
//console.log(emptyPuzzle.saveToXML())

