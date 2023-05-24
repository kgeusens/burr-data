import {XMLBuilder, XMLParser} from 'fast-xml-parser';

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
  	},
	updateTag: (tagname, jPath, attrs) => { if (tagname === "private") return false}
}

export class State {
	dx
	dy
	dz
	"@attributes" = { }
	text
	constructor(flatObject) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { "@attributes" : {...attrs}, text, dx, dy, dz, ...props } = flatObject
		// step 1: process explicit destructured attributes
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		this.text = text
		// step 4: process explicit properties
		this.dx = dx; this.dy = dy; this.dz = dz
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
	}
	get x() { return this.dx.text.split(" ") }
	get y() { return this.dy.text.split(" ") }
	get z() { return this.dz.text.split(" ") }
	get memberPositions() {
		// returns array of positions, 1 entry per member in the separation
		// memberPositions[0] = { x: 3, y: 2, z: -1} is position of first piece in sep
		let arr=[]
		for (let idx in this.x) {
			let position={x: this.x[idx], y: this.y[idx], z: this.z[idx]}
			arr.push(position)
		}
		return arr
	}
}

export class Pieces {
	"@attributes" = { count : 0 }
	text = ""
	constructor(flatObject) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { "@attributes" : {count = 0, ...attrs}, text = "", ...props } = flatObject
		// step 1: process explicit destructured attributes
		this["@attributes"].count = count
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		this.text = text
		// step 4: process explicit properties
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
	}
	get count() { return this["@attributes"].count }
	get members() { return this.text.split(" ")}
	get asString() { return this.text }
}

export class Separation {
	pieces = {}
	state = []
	separation = []
	"@attributes" = {} // type (left or removed)
	text
	constructor(flatObject) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { "@attributes" : {...attrs}, text, pieces, state = [], separation = [], ...props } = flatObject
		// step 1: process explicit destructured attributes
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		this.text = text
		// step 4: process explicit properties
		this.pieces = new Pieces(pieces)
		for(let stat of state) {
			this.state.push(new State(stat))
		}
		for(let sep of separation) {
			this.separation.push(new Separation(sep))
		}
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
	}
	get statePositions() {
		// Array of the memberPositions for reach state in the separation
		// the memberPositions need to be remapped to the piece number of the problem
		// statePositions[1][2] = empty | { x: 3, y: 5, z:-1 }
		//              = position of 3d piece in problem, for 2nd state of separation
		let arr=[]
		for (let state of this.state) {
			let memPos = state.memberPositions
			let piecePos = []
			for (let idx in memPos) {
				piecePos[this.members[idx]] = memPos[idx]
			}
			arr.push(piecePos)
		}
		return arr
	}
	get length() {
		// number of states in this separation
		return this.state.length
	}
	get members() {
		// Array of pieces in this separation
		return this.pieces.members
	}
	get piecelistMap() {
		let o = {}
		o[this.pieces.asString] = this
		return o
	}
	// normalized positions as string (first position needs to be "0 0 0")
	get stateString() {

	}
	// recursive getters below
	//
	// stateCountAll returns a serialized array of the length of the separation tree
	// stateCountAll = [ "10", "7", "4", "3"] ( instead of 10.7.4.3 )
	get stateCountAll() {
		let m = [String(this.length)]
		for (let sep of this.separation) {
			m.push(...sep.stateCountAll)
		}
		return m
	}
	// piecelistMapAll["1 2 5"] = the separation that has pieces "1 2 5" (in the separationtree)
	get piecelistMapAll() {
		let o = this.piecelistMap
		for (let sep of this.separation) {
			Object.assign(o, sep.piecelistMapAll)
		}
		return o
	}
	//
	get statePositionsAll() {
		let a = [...this.statePositions]
		console.log(this.members)
		for (let sep of this.separation) {
			a.push(...sep.statePositionsAll)
		}
		return a
	}
}

export class Assembly {
	"@attributes" = {}
	text
	constructor(flatObject) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { 
			"@attributes" : {...attrs}, 
			text, 
			...props 
		} = flatObject
		// step 3: process text content
		this.text = text
	}
}

export class Solution {
	assembly
	separation = []
	"@attributes" = {} // asmNum, solNum
	text
	constructor(flatObject) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { 
			"@attributes" : {...attrs}, 
			text, 
			assembly,
			separation = [],
			...props 
		} = flatObject
		// step 1: process explicit destructured attributes
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		this.text = text
		// step 4: process explicit properties
		this.assembly = new Assembly(assembly)
		for(let sep of separation) {
			this.separation.push(new Separation(sep))
		}
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
	}
}

export class VoxelPosition {
	private = { state: { state: 0 } }
	constructor(flatObject = {}) {
		var { state = 0, color } = flatObject
		this.private.state.state = state
		this.private.state.color = color
	}
	get state() { return this.private.state.state }
	set state(s) { 
		this.private.state.state = s
		return s
	}
	set color(c) {
		this.private.state.color = c
	}
	get color() {
		return this.private.state.color
	}
} // end class VoxelPositionState

export class Voxel {
	private = { state: [] }
	"@attributes"={x:1, y:1, z:1, type:0} // hx, hy, hz, name, weight
	text="_"
	constructor(flatObject = {}) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { "@attributes" : {x=1, y=1, z=1, type=0, ...attrs}, text, ...props } = flatObject
		// step 1: process explicit destructured attributes
		this.x=x; this.y=y; this.z=z;
		this.type=type
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		if (!text) text = "_".repeat(this.x*this.y*this.z)
		// step 4: process explicit properties
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
		this.setSize(x, y, z)
		this.stateString = text
	}
	get x() { return this["@attributes"].x*1}
	set x(v) { this.setSize(v, this.y, this.z); return v }
	get y() { return this["@attributes"].y*1}
	set y(v) { this.setSize(this.x, v, this.z); return v }
	get z() { return this["@attributes"].z*1}
	set z(v) { this.setSize(this.x, this.y, v); return v }
	get type() { return this["@attributes"].type}
	set type(v) { this["@attributes"].type = v; return v }
	get name() { return this["@attributes"].name }
	set name(n) { this["@attributes"].name = n; return n}
	get weight() { 
		let w=this["@attributes"].weight
		return (w!=undefined)?w:1
	}
	set weight(w) { 
		this["@attributes"].weight = w
		if (w==1) delete this["@attributes"].weight
	} 
	get volume() { return this.x * this.y * this.z }
	setSize(x, y, z) { 
		this["@attributes"].x = x
		this["@attributes"].y = y
		this["@attributes"].z = z
		for (let x=0;x<=this.x-1;x++) {
			if (this.private.state[x] == undefined) this.private.state[x]=[];
			for (let y=0;y<=this.y-1;y++) {
				if (this.private.state[x][y] == undefined) this.private.state[x][y]=[];
				for (let z=0;z<=this.z-1;z++) {
					if (this.private.state[x][y][z] == undefined) this.private.state[x][y][z]=new VoxelPosition()
				}
			}
		}
		this.text=this.stateString
	}
	get stateString() {
		let ss = ""
		for (let z=0;z<=this.z-1;z++) {
			for (let y=0;y<=this.y-1;y++) {
				for (let x=0;x<=this.x-1;x++) {
					switch(this.private.state[x][y][z].state) {
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
		if (colorlessStateString.length != this.x * this.y * this.z) {
			throw new Error("Voxel state string has wrong size");
		}
		this.text=colorlessStateString
		let tv=0
		for (let x=0;x<=this.x-1;x++) {
			for (let y=0;y<=this.y-1;y++) {
				for (let z=0;z<=this.z-1;z++) {
					tv=colorlessStateString[x + y*this.x + z*this.x*this.y]
					switch(tv) {
						case "+":
							this.private.state[x][y][z].state=2
							break;
						case "#":
							this.private.state[x][y][z].state=1
							break;
						default:
							this.private.state[x][y][z].state=0
					}
				}
			}
		}
	}
	getVoxelPosition(x, y, z) { 
		if ( x >= 0 && y >=0 && z >= 0 && x < this.x && y < this.y && z < this.z ) return this.private.state[x][y][z]
	}
	getVoxelState(x,y,z) { let vp=this.getVoxelPosition(x,y,z); return vp? vp.state : 0 }
	setVoxelState(x,y,z,s) { this.getVoxelPosition(x,y,z).state=s }
	clone(orig) {
		var { "@attributes" : { ...attrs}, ...props } = orig
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		for (let prop in props) {
			this[prop] = props[prop]
		}
		this.setSize(this.x, this.y, this.z)
		this.stateString = this.text
	}
}

export class Result {
	"@attributes" = {} // id
	text
	get id() { return this["@attributes"].id }
	set id(val) { this["@attributes"].id = val }
	constructor(flatObject) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { "@attributes" : { id = 0, ...attrs}, text, ...props } = flatObject
		// step 1: process explicit destructured attributes
		this["@attributes"].id = id
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		this.text = text
		// step 4: process explicit properties
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
	}
}

export class Shape {
	"@attributes" = {} //	id, count, min, max, group 
	text
	get id() { return this["@attributes"].id }
	set id(idx) { this["@attributes"].id = idx }
	get count() { 
		let c=this["@attributes"].count 
		return (c!=undefined)?c:1
	}
	set count(c) { 
		this["@attributes"].count = c
	}
	get min() { return this["@attributes"].min }
	get max() { return this["@attributes"].max }
	get group() { 
		let g=this["@attributes"].group
		return (g!=undefined)?g:0
	}
	set group(g) { 
		this["@attributes"].group = g
		if (g==0) delete this["@attributes"].group
	} 
	constructor(flatObject = {}) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { "@attributes" : {count = 0, ...attrs}, text, ...props } = flatObject
		// step 1: process explicit destructured attributes
		this.count = count
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		this.text = text
		// step 4: process explicit properties
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
	}
}

export class Problem {
	shapes = { shape: [] }
	result = {}
	bitmap
	solutions = { solution: [] }
	"@attributes" = { } // state, assemblies, solutions, time
	text
	constructor(flatObject = {}) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { 
			"@attributes" : {...attrs}, 
			text,
			shapes = { shape: [] },
			solutions = { solution: [] },
			result,
			...props
		} = flatObject

		// step 1: process explicit destructured attributes
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		this.text = text
		// step 4: process explicit properties
		for(let shp of shapes.shape) {
			this.shapes.shape.push(new Shape(shp))
		}
		for(let sol of solutions.solution) {
			this.solutions.solution.push(new Solution(sol))
		}
		if (result) this.result = new Result(result)
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
	}
	getShapeFromId(idx) {
		let s=this.shapes.shape.find((val) => val.id == idx)
		if (!s) {
			s=new Shape()
			s.id = idx
//			this.shapes.shape.push(s)
		}
		return s
	}
	setShape(shp) {
		let idx=this.shapes.shape.findIndex((val) => val.id == shp.id)
		if (idx == -1 && shp.count >=0 ) this.shapes.shape.push(shp)
		else {
			if (idx >= 0 && shp.count == 0) { 
				this.shapes.shape.splice(idx,1)
			}
//			else if ( idx >=0 ) this.shapes.shape[idx] = shp
		}
	}
}

export class Puzzle {
	gridType = {"@attributes" : { type : 0 }}
	colors = {}
	shapes = { voxel: [] }
	problems = { problem: [] }
	comment = {}
	text
	"@attributes" = { } // version
    constructor(flatObject = {}) {
		// initialize objects for deep destructuring (has to exist)
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		// destructure the argument object
		var { 
			"@attributes" : {
				version = 2, // version is mandatory, default 2
				...attrs}, 
			text, // should be undefined for Puzzle
			gridType, // mandatory simple object currently initialized by class
			colors, // optional
			shapes = {voxel: [new Voxel()]}, // array
			problems = {problem: [new Problem()]}, // array
			comment, // optional
			...props } = flatObject

		// step 1: process explicit destructured attributes
		this["@attributes"].version = version
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		this.text = text
		// step 4: process explicit properties
		for (let vox of shapes.voxel) {
			this.shapes.voxel.push(new Voxel(vox)) 
		}
		for (let pblm of problems.problem) {
			this.problems.problem.push(new Problem(pblm)) 
		}
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
    }
	get largestShape() { return this.shapes.voxel.reduce((result, item) => {if (item.volume >= result.volume) { return item } else return result})}
	saveToXML() {
		const builder = new XMLBuilder(XMLoptions)
		const parser = new XMLParser(XMLoptions)
		const tmpXML = builder.build({ puzzle: this })
		const cleanObject = parser.parse(tmpXML)
		return builder.build(cleanObject)
	}
	static puzzleFromXML(xml) {
		const parser = new XMLParser(XMLoptions);
		var result = parser.parse(xml)
		return new Puzzle(result.puzzle)
	}
	getShape(idx) { return this.shapes.voxel[idx] }
	deleteShape(idx) {
		if ( (idx >= 0) && (idx < this.shapes.voxel.length) ) return this.shapes.voxel.splice(idx,1)
	 }
	addShape(obj) { 
		let newVoxel = new Voxel(obj)
		if (!this.shapes.voxel) this.shapes.voxel=[]
		this.shapes.voxel.push(newVoxel); 
		return this.shapes.voxel.length - 1
	}
	addProblem() {
		let pbl = new Problem()
		if (!this.problems.problem) this.problems.problem=[]
		this.problems.problem.push(pbl)
		return this.problems.problem.length - 1
	}
	deleteProblem(idx) {
		if ( (idx >= 0) && (idx < this.problems.problem.length) ) return this.problems.problem.splice(idx,1)
	}
}
