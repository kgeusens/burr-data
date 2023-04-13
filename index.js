import {XMLBuilder, XMLParser} from 'fast-xml-parser';
import {gunzipSync} from 'zlib'

const XMLAlwaysArrayName = [
	"voxel",
	"shape",
	"problem",
	"solution",
	"separation",
	"state"
];
      
const XMLoptions = { 
	textNodeName: "text", 
	format: true, 
	ignoreAttributes: false, 
	indentBy: " ", 
	suppressEmptyNode: true, 
	alwaysCreateTextNode: true, 
	attributesGroupName: "@attributes", 
	attributeNamePrefix: '',
  	isArray: (name, jpath, isLeafNode, isAttribute) => { 
		if( XMLAlwaysArrayName.indexOf(name) !== -1) return true;
  	}
}

export class State {
	#source
	dx
	dy
	dz
	constructor(flatObject) {
		this.#source = flatObject
		if (flatObject["@attributes"]) this["@attributes"] = flatObject["@attributes"]
		if (flatObject.text) this.text = flatObject.text
		this.dx = flatObject.dx
		this.dy = flatObject.dy
		this.dz = flatObject.dz
	}
}

export class Pieces {
	#source
	constructor(flatObject) {
		this.#source = flatObject
		if (flatObject["@attributes"]) this["@attributes"] = flatObject["@attributes"]
		if (flatObject.text) this.text = flatObject.text
	}
}

export class Separation {
	#source
	pieces
	state
	separation
	constructor(flatObject) {
		this.#source = flatObject
		if (flatObject["@attributes"]) this["@attributes"] = flatObject["@attributes"]
		if (flatObject.text) this.text = flatObject.text
		this.pieces = new Pieces(flatObject.pieces)
		this.state=[]
		for(let stat of flatObject.state) {
			this.state.push(new State(stat))
		}
		this.separation = []
		if (Array.isArray(flatObject.separation)) for(let sep of flatObject.separation) {
			this.separation.push(new Separation(sep))
		}
	}
}

export class Assembly {
	#source
	constructor(flatObject) {
		this.#source = flatObject
		if (flatObject["@attributes"]) this["@attributes"] = flatObject["@attributes"]
		if (flatObject.text) this.text = flatObject.text
	}
}

export class Solution {
	#source
	assembly
	separation
	constructor(flatObject) {
		this.#source = flatObject
		if (flatObject["@attributes"]) this["@attributes"] = flatObject["@attributes"]
		if (flatObject.text) this.text = flatObject.text
		this.assembly = new Assembly(flatObject.assembly)
		this.separation = []
		if (Array.isArray(flatObject.separation)) for(let sep of flatObject.separation) {
			this.separation.push(new Separation(sep))
		}
	}
}

export class Voxel {
	#source
	constructor(flatObject) {
		this.#source=flatObject
		if (flatObject["@attributes"]) this["@attributes"] = flatObject["@attributes"]
		if (flatObject.text) this.text = flatObject.text
	}
}

export class Shape {
	#source
	constructor(flatObject) {
		this.#source = flatObject
		if (flatObject["@attributes"]) this["@attributes"] = flatObject["@attributes"]
		if (flatObject.text) this.text = flatObject.text
	}
}

export class Problem {
	#source
	shapes
	result
	bitmap
	solutions
	constructor(flatObject) {
		this.#source = flatObject
		if (flatObject["@attributes"]) this["@attributes"] = flatObject["@attributes"]
		if (flatObject.text) this.text = flatObject.text
		this.shapes = {shape: []}
		for(let shp of flatObject.shapes.shape) {
			this.shapes.shape.push(new Shape(shp))
		}
		if (flatObject.result) { 
			this.result = flatObject.result 
		}
		if (flatObject.bitmap) { 
			this.bitmap = flatObject.bitmap
		}
		if(flatObject.solutions) {
			this.solutions = {solution: []}
			for(let sol of flatObject.solutions.solution) {
				this.solutions.solution.push(new Solution(sol))
			}
		}
	}
}

export class Puzzle {
	#source
	gridType
	colors
	shapes
	problems
	comment
    constructor(flatObject) {
		this.#source = flatObject
		if (!flatObject) { flatObject = {} }
		if (flatObject["@attributes"]) { 
			this["@attributes"] = flatObject["@attributes"]
		} else {
			this["@attributes"] = { version: 2 }
		}
		if (flatObject.text) this.text = flatObject.text
		if (flatObject.gridType) {
			this.gridType = flatObject.gridType 
		} else {
			this.gridType = { "@attributes": { type: 0 } }
		}
		this.colors = {}
		if (flatObject.colors) {
			this.colors = flatObject.colors
		}
		this.shapes = {}
		if (flatObject.shapes) {
			if(flatObject.shapes.voxel) {
				this.shapes = {voxel: []}
				for(let vox of flatObject.shapes.voxel) {
					this.shapes.voxel.push(new Voxel(vox)) 
				}
			}
		}
		this.problems = {}
		if (flatObject.problems) { 
			if (flatObject.problems.problem) {
				this.problems = {problem: []}
				for(let pblm of flatObject.problems.problem) {
					this.problems.problem.push(new Problem(pblm)) 
				}
			}
		}
		if (flatObject.comment) {
			this.comment = flatObject.comment
		}
    }
	saveToXML() {
		const builder = new XMLBuilder(XMLoptions)
		return builder.build({ puzzle: this })
	}
	static puzzleFromXML(xml) {
		const parser = new XMLParser(XMLoptions);
		var result = parser.parse(xml)
		return new Puzzle(result.puzzle)
	}
	static puzzleFromXMPuzzle(xmpuzzle) {
		const parser = new XMLParser(XMLoptions);
		const xml = gunzipSync(xmpuzzle)
		var result = parser.parse(xml)
		return new Puzzle(result.puzzle)
	}
}
