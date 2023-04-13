import * as DATA from '../index.js'
import { readFileSync} from 'fs'

// Read a test xmpuzzle file and load it (this is the raw file from burrtools)
const xmlFile = readFileSync("test.xmpuzzle");
const thePuzzle = DATA.Puzzle.puzzleFromXMPuzzle(xmlFile)
console.log(thePuzzle.saveToXML())
// Read a plain text xml file and load it (in the xmpuzzle format)
const xmpuzzleFile = readFileSync("test.xml");
const theXMPuzzle = DATA.Puzzle.puzzleFromXML(xmpuzzleFile)
console.log(theXMPuzzle.saveToXML())
// Build an empty puzzle object
const emptyPuzzle = new DATA.Puzzle()
console.log(emptyPuzzle.saveToXML())
