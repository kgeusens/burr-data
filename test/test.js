import * as DATA from '../index.js'
import { readFileSync} from 'fs'
import * as TOOLS from '../burrUtils.js'

// Read a test xmpuzzle file and load it (this is the raw file from burrtools)
//const xmlFile = readFileSync("test.xmpuzzle");
//const thePuzzle = DATA.Puzzle.puzzleFromXMPuzzle(xmlFile)
//console.log(thePuzzle.saveToXML())


// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("test.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)
//theXMPuzzle.comment.set("uri", "/puzzle/loc")
//theXMPuzzle.problems.problem[0].shapes.shape[0].group=0
//theXMPuzzle.problems.problem[0].shapes.shape[0].group=2
theXMPuzzle.meta["test"]='ikel'
theXMPuzzle.meta["moves"]=200
console.log(theXMPuzzle.meta["designer"])
theXMPuzzle.meta={override: "done"}
console.log(theXMPuzzle)
theXMPuzzle.meta={}
console.log(theXMPuzzle)//console.log(theXMPuzzle.comment)
//console.log(theXMPuzzle.moves)
//console.log(theXMPuzzle.saveToXML())
//console.log(theXMPuzzle.shapes.voxel[1].stateString)
//console.dir(theXMPuzzle, {depth: null})
//console.log(theXMPuzzle.largestShape)
//let puzzle = theXMPuzzle
//let voxels = puzzle.shapes.voxel
//let prob=puzzle.problems.problem[0]
//console.dir(prob.shapeMap)
//let sol=prob.solutions.solution[0]
//console.dir(sol.pieceMap)
//console.dir(sol.pieceNumbers)
//console.dir(sol.separation[0])
//console.dir(sol.separation[0])
//console.dir(sep.statePositions, {depth:null})
//console.log("statePositionsAll")
//console.dir(sep.statePositionsAll, {depth:null})
//console.log("movePositionsAll")
//console.dir(sep.movePositionsAll, {depth:null})
//console.log(sep.movePositionsAll.length)
//console.dir(sep.stateCountAll, {depth:null})
//console.log(theXMPuzzle.problems.problem[0].solutions.solution[0].complexity)
//console.dir(theXMPuzzle.getSolutionMap(0,0), { depth: null})
//let worldMap=puzzle.getWorldMap({solution: sol, problem: prob})
//console.log(worldMap.filter(2))
//console.log(worldMap.canPlace({'0 1 9': "Koen"}))
//console.log(worldMap.map)
//console.log(worldMap.checkMoveConflicts(1, {y: -1}))
//console.log(worldMap.checkMoveConflicts([0,1,3,5], {y: 1}))
//console.log(worldMap.canMove([0,1,3,5], {x:0, y:1, z: 0}))
//console.log(worldMap.getMovingPiecelist(1, {x:0, y:1, z: 0} ))
//console.log(worldMap.map)
//worldMap.delete(0)
//console.log(worldMap.map)
//console.log(worldMap.pieceList)
//console.log(worldMap.map)
// Build an empty puzzle object and test some methods
//const emptyPuzzle = new DATA.Puzzle()
//emptyPuzzle.addShape({ "@attributes" : {x: 1, y: 2, z: 3}})
//emptyPuzzle.addShape()
//emptyPuzzle.getShape(1).clone(emptyPuzzle.getShape(0))
//emptyPuzzle.getShape(0).setSize(2, 3, 4)
//console.dir(emptyPuzzle, {depth: null})
//console.log(emptyPuzzle.saveToXML())
//console.log(TOOLS.rotate({x:1, y:2, z:3}, 1))
//console.dir(voxels[1].rotatedCopy(17).translate({x: 0, y: 1, z: 1}), { depth: null })

