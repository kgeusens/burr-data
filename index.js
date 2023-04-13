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
	#state=[]
	"@attributes"={x:1, y:1, z:1, type:0}
	text="_"
	constructor(flatObject = {}) {
		this.#source=flatObject
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { "@attributes" : {x=1, y=1, z=1, type=0, ...attrs}, text="_", ...props } = flatObject
		this.x=x; this.y=y; this.z=z;
		this.type=type
		this.setSize(this.x, this.y, this.z)
//		this.stateString = text
	}
	get x() { return this["@attributes"].x}
	set x(v) { this.setSize(v, this.y, this.z); return v }
	get y() { return this["@attributes"].y}
	set y(v) { this.setSize(this.x, v, this.z); return v }
	get z() { return this["@attributes"].z}
	set z(v) { this.setSize(this.x, this.y, v); return v }
	get type() { return this["@attributes"].type}
	set type(v) { this["@attributes"].type = v; return v }
	setSize(x, y, z) { 
		this["@attributes"].x = x
		this["@attributes"].y = y
		this["@attributes"].z = z
		for (let x=0;x<=this.x-1;x++) {
			if (this.#state[x] == undefined) this.#state[x]=[];
			for (let y=0;y<=this.y-1;y++) {
				if (this.#state[x][y] == undefined) this.#state[x][y]=[];
				for (let z=0;z<=this.z-1;z++) {
					if (this.#state[x][y][z] == undefined) this.#state[x][y][z]={state:0}
				}
			}
		}
		this.text=this.stateString
	}
	get stateString() {
		var ss = ""
		for (let z=0;z<=this.z-1;z++) {
			for (let y=0;y<=this.y-1;y++) {
				for (let x=0;x<=this.x-1;x++) {
					switch(this.#state[x][y][z].state) {
						case 0:
							ss+="_"
							break;
						case 1:
							ss+="#"
							break;
						default:
							ss+="+"
					}
				}
			}
		}
		return ss
	}
	set stateString(s) {
		let colorlessStateString = s.replace(/\d+/g,"")
		this.text=colorlessStateString
		let tv=0
		for (let x=0;x<=this.x-1;x++) {
			for (let y=0;y<=this.y-1;y++) {
				for (let z=0;z<=this.z-1;z++) {
					tv=colorlessStateString[x + y*this.x + z*this.x*this.y]
					switch(tv) {
						case "+":
							this.#state[x][y][z].state=2
							break;
						case "#":
							this.#state[x][y][z].state=1
							break;
						default:
							this.#state[x][y][z].state=0
					}
				}
			}
		}
	}
	getVoxelPosition(x, y, z) { return this.#state[x][y][z]}
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
	getShape(idx) { return this.shapes.voxel[idx] }
	addShape(obj) { 
		let newVoxel = new Voxel(obj)
		if (!this.shapes.voxel) this.shapes.voxel=[]
		this.shapes.voxel.push(newVoxel); 
		return this.shapes.voxel.length - 1
	}
}
