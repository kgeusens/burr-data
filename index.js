import {XMLBuilder, XMLParser} from 'fast-xml-parser';
import {rotate, translate} from './burrUtils.js'

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
	get piecePositions() {
		// returns array of positions, 1 entry per member in the separation
		// piecePositions[0] = { x: 3, y: 2, z: -1} is position of first piece in sep
		// piecePositions on State is sequential
		let arr=[]
		for (let idx in this.x) {
			let position={x: Number(this.x[idx]), y: Number(this.y[idx]), z: Number(this.z[idx])}
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
	get pieceNumbers() { return this.text.split(" ").map((val) => Number(val))}
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
	get piecePositions() {
		// Array of the piecePositions for each state in the separation
		// it is a sparse matrix with the indices remapped (state = sequential, but on separations it is sparse)
		// piecePositions[1][5] = empty | { x: 3, y: 5, z:-1 }
		//              = position of piece with id 5 in problem, for 2nd state of separation
		let arr=[]
		for (let state of this.state) {
			let memPos = state.piecePositions
			let piecePos = []
			for (let idx in memPos) {
				piecePos[this.pieceNumbers[idx]] = memPos[idx]
			}
			arr.push(piecePos)
		}
		return arr
	}
	get length() {
		// number of states in this separation
		return this.state.length
	}
	get pieceNumbers() {
		// Array of pieces in this separation
		return this.pieces.pieceNumbers
	}
	// normalized positions as string (first position needs to be "0 0 0")
	get stateString() {
	}
	// recursive getters below
	//
	// stateCountAll returns a serialized array of the length of the separation tree
	// stateCountAll = [ "10", "7", "4", "3"] ( instead of 10.7.4.3 )
	get stateCountAll() {
		let m = [String(this.length - 1)]
		for (let sep of this.separation) {
			m.push(...sep.stateCountAll)
		}
		return m
	}
	/*
	// piecelistMapAll["1 2 5"] = the separation that has pieces "1 2 5" (in the separationtree)
	get piecelistMapAll() {
		let o = {}
		o[this.pieces.asString] = this
		for (let sep of this.separation) {
			Object.assign(o, sep.piecelistMapAll)
		}
		return o
	}
	*/
	//
	get piecePositionsAll() {
		let a = [...this.piecePositions]
		for (let sep of this.separation) {
			a.push(...sep.piecePositionsAll)
		}
		return a
	}
	get movePositionsAll() {
		let a = [...this.piecePositions]
		for (let sep of this.separation) {
			let spa = sep.movePositionsAll
			let firstEl=spa.shift()
			let lastEl=a[a.length-1]
			for (let idx in this.pieceNumbers) {
				if ((lastEl[idx] === undefined) && firstEl[idx]) {
					lastEl[idx] = firstEl[idx]
				}
			}
			a.push(...spa)
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
	// process the string from the assembly and get position + rotation of pieces
	get pieceMap() {
		let assArray = this.text.split(" ")
		let theMap = []
		let pieceIdx = 0
		while (assArray.length > 0) {
			while (assArray[0] == "x") {
				assArray.shift()
				pieceIdx++
			}
			if (assArray.length >= 4) {
				theMap[pieceIdx] = { pieceID: Number(pieceIdx), position: { x: Number(assArray.shift()), y : Number(assArray.shift()), z: Number(assArray.shift()) }, rotation: Number(assArray.shift()) }
				pieceIdx++
			} else if (assArray.length > 0) { console.log("ERROR", assArray.length); break}
		}
		return theMap
	}
	// return the numbers of the pieces that have a value in the assembly
	get pieceNumbers() {
		let pieces = []
		for (let i in this.pieceMap) {
			pieces.push(Number(i))
		}
		return pieces
	}
	get piecePositions() {
		let arr = []
		for (let idx in this.pieceMap) {
			arr[idx] = this.pieceMap[idx].position
		}
		return arr
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
	get complexity() { return this.separation[0]?this.separation[0].stateCountAll.join("."):"0"}
	get pieceMap() {
		return this.assembly.pieceMap
	}
	get pieceNumbers() {
		return this.assembly.pieceNumbers
	}
	get moves() { 
		return this.separation[0]?this.separation[0].length - 1:0 
	}
}

export class Voxel {
	private = { state: [], stateMap: {} }
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
//		for (let prop in props) {
//			this[prop] = props[prop]
//		}
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
		this.text=this.stateString
	}
	get stateMap() { return this.private.stateMap }
	set stateMap(m) { this.private.stateMap = m; this.text=this.stateString }
	get stateString() {
		let ss = ""
		for (let z=0;z<=this.z-1;z++) {
			for (let y=0;y<=this.y-1;y++) {
				for (let x=0;x<=this.x-1;x++) {
					let state=this.getVoxelState(x, y, z)
					switch(state) {
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
		this.private.stateMap={}
		for (let x=0;x<=this.x-1;x++) {
			for (let y=0;y<=this.y-1;y++) {
				for (let z=0;z<=this.z-1;z++) {
					tv=colorlessStateString[x + y*this.x + z*this.x*this.y]
					switch(tv) {
						case "+":
							this.private.stateMap[[x, y, z].join(" ")]={state: 2}
							break;
						case "#":
							this.private.stateMap[[x, y, z].join(" ")]={state: 1}
							break;
						default:
					}
				}
			}
		}
	}
	getVoxelPosition(x, y, z) {
		return this.private.stateMap[[x, y, z].join(" ")]
	}
	getVoxelState(x,y,z) { 
		let vp=this.getVoxelPosition(x,y,z); return vp? vp.state : 0 
	}
	setVoxelState(x,y,z,s) {
		let vp=this.getVoxelPosition(x, y, z)
		if (!vp) this.private.stateMap[[x, y, z].join(" ")] = {state: s}
		this.getVoxelPosition(x,y,z).state=s 
	}
	getWorldMap(id=0) {
		let theMap={}
		for (let x=0;x<this.x;x++) {
			for (let y=0;y<this.y;y++) { 
				for (let z=0;z<this.z;z++) { 
					if (this.getVoxelState(x, y, z) == 1) theMap[[x,y,z].join(" ")] = id
				}
			}
		}
		return new WorldMap(theMap)
	}
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
	toOBJ(name = "shape") {
		let group = this.name?this.name:name
		let OBJ="\ng " + group + '\n\n'
		let vnodes = ""
		let faces = ""
		// generate the v nodes (vertices)
		for (let z = 0; z <= this.z; z++) {
			for (let y = 0; y <= this.y; y++) {
				for (let x = 0; x <= this.x; x++) {
					vnodes += "v " + [x, y, z].join(" ") + '\n'
				}
			}
		}
		// generate the faces
		for (let z = 0; z < this.z; z++) {
			for (let y = 0; y < this.y; y++) {
				for (let x = 0; x < this.x; x++) {
					// check every face for a neighbor and generate facet if no neighbor
					if (this.getVoxelState(x, y, z)) {
						if ( !this.getVoxelState(x-1, y, z) ) {
							let sv=1 + x + y*(this.x + 1) + z*(this.x + 1)*(this.y + 1)
							let dx = 1
							let dy = this.x + 1
							let dz = (this.x + 1) * (this.y + 1)
							faces += "f " + [sv, sv + dz, sv + dy + dz, sv + dy].join(" ") + '\n'
						}
						if ( !this.getVoxelState(x+1, y, z) ) {
							let sv=1 + (x + 1) + y*(this.x + 1) + z*(this.x + 1)*(this.y + 1)
							let dx = 1
							let dy = this.x + 1
							let dz = (this.x + 1) * (this.y + 1)
							faces += "f " + [sv, sv + dy, sv + dy + dz, sv + dz].join(" ") + '\n'
						}
						if ( !this.getVoxelState(x, y-1, z) ) {
							let sv=1 + x + y*(this.x + 1) + z*(this.x + 1)*(this.y + 1)
							let dx = 1
							let dy = this.x + 1
							let dz = (this.x + 1) * (this.y + 1)
							faces += "f " + [sv, sv + dx, sv + dx + dz, sv + dz].join(" ") + '\n'
						}
						if ( !this.getVoxelState(x, y+1, z) ) {
							let sv=1 + x + (y+1)*(this.x + 1) + z*(this.x + 1)*(this.y + 1)
							let dx = 1
							let dy = this.x + 1
							let dz = (this.x + 1) * (this.y + 1)
							faces += "f " + [sv, sv + dz, sv + dx + dz, sv + dx].join(" ") + '\n'
						}
						if ( !this.getVoxelState(x, y, z-1) ) {
							let sv=1 + x + y*(this.x + 1) + z*(this.x + 1)*(this.y + 1)
							let dx = 1
							let dy = this.x + 1
							let dz = (this.x + 1) * (this.y + 1)
							faces += "f " + [sv, sv + dy, sv + dx + dy, sv + dx].join(" ") + '\n'
						}
						if ( !this.getVoxelState(x, y, z+1) ) {
							let sv=1 + x + y*(this.x + 1) + (z+1)*(this.x + 1)*(this.y + 1)
							let dx = 1
							let dy = this.x + 1
							let dz = (this.x + 1) * (this.y + 1)
							faces += "f " + [sv, sv + dx, sv + dx + dy, sv + dy].join(" ") + '\n'
						}
					}
				}
			}
		}
		return OBJ + vnodes + faces
	}
	test(name = "shape", offset = 0.1, bezel = 0.1 ) {
		let group = this.name?this.name:name
		let OBJ="\ng " + group + '\n\n'
		let vnodes = []
		let faces = []
		let cubeTemplate = []
		let cubeFaces = {
			left: [0,4,6,2],
			right: [1,3,7,5],
			front: [8,9,13,12],
			back: [10,14,15,11],
			bottom: [16,18,19,17],
			top: [20,21,23,22]
		}
		let cubeNodes = {
			left:  [0,8,16, 2,10,18, 4,12,20, 6,14,22],
			right: [1,3,5,7,9,11,13,15,17,19,21,23],
			front: [0,8,16, 1,9,17, 4,12,20, 5,13,21],
			back: [2,10,18, 3,11,19, 6,14,22, 7,15,23],
			bottom: [0,8,16, 1,9,17, 2,10,18, 3,11,19],
			top: [4,12,20, 5,13,21, 6,14,22, 7,15,23]
		}
		// create the cube template
		let idx=0
		for (let z = 0; z < 2; z++) {
			for (let y = 0; y < 2; y++) {
				for (let x = 0; x < 2; x++) {
					cubeTemplate[idx] = cubeTemplate[idx+8] = cubeTemplate[idx+16] = [x, y, z].join(" ")
					idx++
				}
			}
		}
		// generate the faces
		let nfaces=0
		for (let z = 0; z < this.z; z++) {
			for (let y = 0; y < this.y; y++) {
				for (let x = 0; x < this.x; x++) {
					let template = [...cubeTemplate]
					for (let n in template) {
						let tn = template[n].split(" ")
						tn[0] = tn[0]*1 + x
						tn[1] = tn[1]*1 + y
						tn[2] = tn[2]*1 + z
						template[n] = tn
					} // transform the template values into an array
					if (this.getVoxelState(x, y, z)) { // this voxel is not empty
						if ( !this.getVoxelState(x-1, y, z) ) { // left is empty
							// shift the template nodes to the right
							for (let node of cubeNodes.left) {
								let tn = template[node]
								tn[0] += offset
							}
							// add the face
							for (let node of cubeFaces.left) {
								vnodes[vnodes.length] = template[node]
							}
							faces[nfaces] = [ 1 + nfaces*4, 2 + nfaces*4, 3 + nfaces*4, 4 + nfaces*4 ]
							nfaces+=1
						}
						if ( !this.getVoxelState(x+1, y, z) ) {
							for (let node of cubeNodes.right) {
								//shift the nodes to the left
								let tn = template[node]
								tn[0] -= offset
							}
							// add the face
							for (let node of cubeFaces.right) {
								vnodes[vnodes.length] = template[node]
							}
							faces[nfaces] = [ 1 + nfaces*4, 2 + nfaces*4, 3 + nfaces*4, 4 + nfaces*4 ]
							nfaces+=1
						}
						if ( !this.getVoxelState(x, y-1, z) ) {
							for (let node of cubeNodes.front) {
								let tn = template[node]
								tn[1] += offset
							}
							// add the face
							for (let node of cubeFaces.front) {
								vnodes[vnodes.length] = template[node]
							}
							faces[nfaces] = [ 1 + nfaces*4, 2 + nfaces*4, 3 + nfaces*4, 4 + nfaces*4 ]
							nfaces+=1
						}
						if ( !this.getVoxelState(x, y+1, z) ) {
							for (let node of cubeNodes.back) {
								let tn = template[node]
								tn[1] -= offset
							}
							// add the face
							for (let node of cubeFaces.back) {
								vnodes[vnodes.length] = template[node]
							}
							faces[nfaces] = [ 1 + nfaces*4, 2 + nfaces*4, 3 + nfaces*4, 4 + nfaces*4 ]
							nfaces+=1
						}
						if ( !this.getVoxelState(x, y, z-1) ) {
							for (let node of cubeNodes.bottom) {
								let tn = template[node]
								tn[2] += offset
							}
							// add the face
							for (let node of cubeFaces.bottom) {
								vnodes[vnodes.length] = template[node]
							}
							faces[nfaces] = [ 1 + nfaces*4, 2 + nfaces*4, 3 + nfaces*4, 4 + nfaces*4 ]
							nfaces+=1
						}
						if ( !this.getVoxelState(x, y, z+1) ) {
							for (let node of cubeNodes.top) {
								let tn = template[node]
								tn[2] -= offset
							}
							// add the face
							for (let node of cubeFaces.top) {
								vnodes[vnodes.length] = template[node]
							}
							faces[nfaces] = [ 1 + nfaces*4, 2 + nfaces*4, 3 + nfaces*4, 4 + nfaces*4 ]
							nfaces+=1
						}
					}
				}
			}
		}
		for (let v of vnodes) OBJ += "v " + v.join(" ") + "\n"
		for (let f of faces) OBJ += "f " + f.join(" ") + "\n"
		return OBJ
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

const metaHandler = {
	get(target, prop)	 {
		return target[prop]
	},
	set(target, prop, val) {
		target.set(prop,val)
		return true
	}
}

export class Metadata {
	#parent
	constructor(parent) {
		this.#parent=parent
	}
	get(target, prop, receiver) {
		console.log("get")
		let value = Reflect.get(...arguments);
		return typeof value == 'function' ? value.bind(target) : value;		
	}
	set(prop, val) { this[prop] = val; this.#parent.updateText() }
	clear() { for (let p in this) {
		delete this[p]
		this.#parent.updateText()
	}}
}

export class Comment {
//	#meta
	private = { proxy:{}, meta: {} } // designer, date, name, PWBP: {uri, goal, category, subcategory, ...}
	"@attributes" = {} // popup
	text=""
	updateText() { this.text=JSON.stringify(this.private.meta) }
	// meta can be used as an array to store extra info, persistently in the xml comment field
	// meta["designer"]="Koen Geusens" // adds the designer prop
	// meta = {designer: "Koen", moves: 10, name: "little puzzle"} // replaces all props and adds desinger, moves, name
	get meta() { return this.private.proxy }
	set meta(obj) {
		this.private.meta.clear()
		for (let m in obj) {
			this.meta[m] = obj[m]
		}
		this.updateText()
	}
	constructor(flatObject, parent=undefined) {
		this.private.meta = new Metadata(this)
		this.private.proxy=new Proxy(this.private.meta, metaHandler)
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { "@attributes" : { ...attrs}, text, ...props } = flatObject
		// step 1: process explicit destructured attributes
		// step 2: process generic other attributes
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		// step 3: process text content (mostly undefined)
		// try to parse the text as a JSON object.
		this.text = text
		try { 
			let meta = JSON.parse(text)
			for (let m in meta) {
				this.meta[m] = meta[m]
			}
		}
		catch(err) { }
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
		if (!solutions.solution) solutions.solution=[]
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
		}
	}
	get shapeMap() {
		let theMap = []
		for (let shape of this.shapes.shape) {
			let count = shape.count?shape.count:shape.max
			for (let i = 0; i<count;i++)
			{
				theMap.push(Number(shape.id)) 
			}
		}
		return theMap
	}
	get moves() {
		let m = 0
		for (let sol of this.solutions.solution) {
			m = Math.max(m, sol.moves)
		}
		return m
	}
}

export class WorldMap {
	// map will contain entries of the form:
	//   '1 2 3': 5
	// meaning position { x:1, y: 2, z: 3} is occupied by piece 5
	_map = {}
	constructor(map = {}) {
		this._map = map
	}
	get map() { return this._map }
	set map(m) { this._map = m }
	remap(v) {
		for (pos in this.map){
			this.map[pos] = v
		}
		return this.map
	}
	get pieceList() {
		return Object.values(this.map).filter((val, idx, arr) => arr.indexOf(val) === idx ).sort()
	}
	filter(searchValues) {
		// searchValues should be an array of values to return
		if (!Array.isArray(searchValues)) searchValues = [searchValues]
		return new WorldMap(Object.fromEntries( Object.entries(this.map).filter((val, idx, arr) => searchValues.includes(val[1]))))
	}
	delete(searchValues) {
		// searchValues should be an array of values to return
		let delMap = this.filter(searchValues)
		for (let pos in delMap.map) {
			delete this._map[pos]
		}
	}
	canPlace(map) {
		for (let pos in map) {
			if (pos in this.map) {
				console.log("conflict", pos, this.map[pos])
				return false
			}
		}
		return true
	}
	place(worldmap) {
		Object.assign(this._map, worldmap.map)
		return this.map
	}
	rotate(idx) {
		let result = rotate(this.map, idx)
		this.map = result
		return result
	}
	translate(translation) {
		let result = translate(this.map, translation)
		this.map = result
		return result
	}
	checkMoveConflicts(pieceList, translation) {
		// Array. Return the list of pieces that interfere with our translated position
		if (!Array.isArray(pieceList)) pieceList = [ pieceList ]
		let pieceMap = this.filter(pieceList).translate(translation)
		let conflictList = []
		for (let pos in pieceMap) {
			if (this.map[pos] >= 0) {
				// something is there
				if (pieceList.includes(this.map[pos])) {
					// it is one of our own pieces
				}
				else {
					// we have a conflict, add the conflicting piece to the stack
					if (!conflictList.includes(this.map[pos])) conflictList.push(this.map[pos])
				}
			}
		}
		return conflictList.sort()
	}
	canMove(pieceList, translation) {
		// true or false, check if we can move the piecList in the translation direction
		if (!Array.isArray(pieceList)) pieceList = [ pieceList ]
		let pieceMap = this.filter(pieceList).translate(translation)
		for (let pos in pieceMap) {
			if (this.map[pos] >= 0) {
				// something is there
				if (pieceList.includes(this.map[pos])) {
					// it is one of our own pieces
				}
				else {
					// conflict
					return false
				}
			}
		}
		return true
	}
	getMovingPiecelist(pieceList, translation) {
		// starting from pieceList, extend to all the pieces we would drag along in the translation direction
		if (!Array.isArray(pieceList)) pieceList = [ pieceList ]
		let theList = pieceList
		let conflicts=this.checkMoveConflicts(theList, translation)
		while (conflicts.length > 0) {
			theList.push(...conflicts)
			conflicts=this.checkMoveConflicts(theList, translation)
		}
		return theList.sort()		
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
			comment = {}, // optional
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
		this.comment = new Comment(comment, this)
		// step 5: process generic child properties (not used but you never know)
		for (let prop in props) {
			this[prop] = props[prop]
		}
    }
	get meta() { return this.comment.meta }
	set meta(obj) { this.comment.meta=obj;return this.comment.meta }
	get largestShape() { return this.shapes.voxel.reduce((result, item) => {if (item.volume >= result.volume) { return item } else return result})}
	saveToXML() {
		const builder = new XMLBuilder(XMLoptions)
		const parser = new XMLParser(XMLoptions)
		const tmpXML = builder.build({ puzzle: this })
		const cleanObject = parser.parse(tmpXML)
		return builder.build(cleanObject)
	}
	saveToJSON() {
		const parser = new XMLParser(XMLoptions);
		return parser.parse(this.saveToXML())
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
	getWorldMap(options = {}) {
		var {solution = {}, problem, pieceNumbers, piecePositions } = options
		// get rotations from solution.assembly
		// get shape from puzzle (this)
		// get pieces and their positions from pieceNumbers and piecePositions
		//    Theses are in the format of separations:
		//      piecePositions is sparse, format of state
		//      pieceNumbers is sequential, maps to index in problem.shapeMap
		// getWorldMap({solution: sol, problem: prob, pieceNumbers: [1, 2], piecePositions: [{x: 1, y: 2, z: 3}, {x: 2, y: 3, z: 4}]})
		let worldMap=new WorldMap()
        let pieceMap = solution.pieceMap
		if (!pieceNumbers || !piecePositions) {
			pieceNumbers = solution.assembly.pieceNumbers
			piecePositions = solution.assembly.piecePositions
		}

        for (let idx in pieceNumbers) {
			// idx is sequential
			let pieceID = pieceNumbers[idx]
            let shapeID=problem.shapeMap[pieceID]
            let shape=this.shapes.voxel[shapeID]
			let rotationIndex = pieceMap[pieceID].rotation
			let position = piecePositions[pieceID]
			let shapeMap = shape.getWorldMap(pieceID)
			shapeMap.rotate(rotationIndex)
			shapeMap.translate(position)
			worldMap.place(shapeMap)
		}
		return worldMap
	}
	get moves() {
		return this.problems.problem[0]?this.problems.problem[0].moves:0
	}
}
