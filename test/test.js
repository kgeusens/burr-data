import * as DATA from '../index.js'
import { readFileSync} from 'fs'
import * as TOOLS from '../burrUtils.js'

// Read a test xmpuzzle file and load it (this is the raw file from burrtools)
//const xmlFile = readFileSync("test.xmpuzzle");
//const thePuzzle = DATA.Puzzle.puzzleFromXMPuzzle(xmlFile)
//console.log(thePuzzle.saveToXML())

// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("solved.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)
//theXMPuzzle.problems.problem[0].shapes.shape[0].group=0
//theXMPuzzle.problems.problem[0].shapes.shape[0].group=2
//console.log(theXMPuzzle.saveToXML())
//console.log(theXMPuzzle.shapes.voxel[1].stateString)
console.dir(theXMPuzzle, {depth: null})
//console.log(theXMPuzzle.largestShape)
let voxels = theXMPuzzle.shapes.voxel
let prob=theXMPuzzle.problems.problem[0]
//console.dir(prob.shapeMap)
let sol=prob.solutions.solution[0]
//console.dir(sol.pieceMap)
//console.dir(sol.pieceNumbers)
//console.dir(sol.separation[0])
//console.dir(sol.separation[0])
//let sep=sol.separation[0]
//console.dir(sep.statePositions, {depth:null})
//console.log("statePositionsAll")
//console.dir(sep.statePositionsAll, {depth:null})
//console.log("movePositionsAll")
//console.dir(sep.movePositionsAll, {depth:null})
//console.log(sep.movePositionsAll.length)
//console.dir(sep.stateCountAll, {depth:null})
//console.log(theXMPuzzle.problems.problem[0].solutions.solution[0].complexity)
//console.dir(theXMPuzzle.getSolutionMap(0,0), { depth: null})

// Build an empty puzzle object and test some methods
//const emptyPuzzle = new DATA.Puzzle()
//emptyPuzzle.addShape({ "@attributes" : {x: 1, y: 2, z: 3}})
//emptyPuzzle.addShape()
//emptyPuzzle.getShape(1).clone(emptyPuzzle.getShape(0))
//emptyPuzzle.getShape(0).setSize(2, 3, 4)
//console.dir(emptyPuzzle, {depth: null})
//console.log(emptyPuzzle.saveToXML())
//console.log(TOOLS.rotate({x:1, y:2, z:3}, 1))
console.log(voxels[0].stateString)
