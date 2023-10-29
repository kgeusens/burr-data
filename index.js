import {XMLBuilder, XMLParser} from 'fast-xml-parser';
import {rotate, rotatePoint, translate, translatePoint, rotateMap, translateMap} from './burrUtils.js'

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

export class BoundingBox {
	min= [0,0,0]
	max= [0,0,0]
	constructor(point) {
		for (let idx in point)
		{
			this.min[idx] = this.max[idx] = point[idx]*1
		}
	}
}

export class Voxel {
	private = { worldmap: new MapWorldMap() } // worldmap is used to track state at positions
	"@attributes"={x:1, y:1, z:1, type:0} // hx, hy, hz, name, weight
	text="_"
	constructor(flatObject = {}) {
		if (!flatObject["@attributes"]) flatObject["@attributes"]={}
		var { "@attributes" : {x=1, y=1, z=1, type=0, ...attrs}, text, ...props } = flatObject
		// step 1: process explicit destructured attributes
		this.x=Number(x); this.y=Number(y); this.z=Number(z);
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
		this.setSize(this.x, this.y, this.z)
		this.stateString = text // initializes the worldmap
		true
	}
	get boundingBox() { return this.private.boundingBox	}
	get worldmap() { return this.private.worldmap}
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
	}
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
		this.private.worldmap = new MapWorldMap()
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
							this.private.worldmap.setStatePoint([x, y, z],2)
							break;
						case "#":
							this.private.worldmap.setStatePoint([x, y, z],1)
							break;
						default:
					}
				}
			}
		}
	}
	getVoxelState(x,y,z) {
		return this.private.worldmap.getStatePoint([x,y,z])
	}
	setVoxelState(x,y,z,s) {
		this.private.worldmap.setStatePoint([x,y,z],s)
	}
	copyFrom(orig) { // used to be called clone(orig) but this does not generate a clone, so I renamed for consistency
		var { "@attributes" : { ...attrs}, ...props } = orig
		for (let attr in attrs) {
			this["@attributes"][attr] = attrs[attr]
		}
		for (let prop in props) {
			this[prop] = props[prop]
		}
		this.private.worldmap = orig.private.worldmap.clone()
//		this.setSize(this.x, this.y, this.z) // already copied from original and no side effects needed
//		this.stateString = this.text // worldmap already cloned from original, so side effect (worldmap update) not needed
	}
	toOBJ(name = "shape") {
		let group = this.name?this.name:name
		let OBJ="\ng " + group + '\n\n'
		let result = this.createMesh(0,0,1)
		for (let v of result.vnodes) OBJ += "v " + v + "\n"
		for (let f of result.faces) OBJ += "f " + f + "\n"
		return OBJ
	}
	getVertexData(params = {}) {
		// Can be used as VertexData for the MeshBuilder in Babylonjs
		let {name, offset=0, bevel=0, base=0} = params
		// positions and indices start at 0
		let result = this.createMesh(offset, bevel, 0)
		let positions = []
		let indices = []
		for (let v of result.vnodes) { positions.push(v.split(" ").map(v => Number(v))) }
		for (let f of result.faces)  {
			let idx = f.split(" ").map(v => Number(v))
			indices.push(idx[0], idx[2], idx[1]) } // faces should rotate other direction
		return {positions: positions.flat(), indices: indices.flat()}
	}
	createMesh(offset = 0.01, bezel = 0.05, base=0 ) {
		function getNeighbors(box, direction) {
			const { x=0, y=0, z=0 } = direction
			let neighbors = []
			neighbors.push({x: box.x + x, y: box.y + y, z: box.z + z})
			return neighbors
		}
		function removeDoubles(vnodes = [], faces = []) {
			let newNodes = []
			let newFaces=[]
			for (let node of vnodes)
			{
				if (!newNodes.includes(node)) newNodes.push(node)
			}
			for (let face of faces)
			{
				let faceNodes = face.split(" ")
				for (let idx of [0,1,2]) {
					let oldNodeIdx = faceNodes[idx]-1
					let nodeValue = vnodes[oldNodeIdx]
					let newNodeIdx = newNodes.indexOf(nodeValue)
					faceNodes[idx] = newNodeIdx+base
				}
				let newFace = faceNodes.join(" ")
				// remove double faces and empty faces
				if (faceNodes[0] != faceNodes[1] && faceNodes[1] != faceNodes[2] && faceNodes[0] != faceNodes[2] && !newFaces.includes(newFace)) newFaces.push(newFace)
			}
			return {vnodes: newNodes, faces:newFaces}
		}
		let vnodes = []
		let faces = []
		// boxes are size one
		// first box is centered around (0,0,0), so it starts at (-0.5, -0.5, -0.5)
		const boxSize = {x: 2, y: 2, z: 2}
		const translation = {x: 1, y: 2, z: 3}
		let dimensions = ["x", "y", "z"]
		let steps = [-1, 1]

		for (let z = 0; z < this.z; z++) {
			for (let y = 0; y < this.y; y++) {
				for (let x = 0; x < this.x; x++) {
					// Looping over every potential box
					let box = {x: x, y: y, z: z}
					if (this.getVoxelState(x, y, z)) { // this box is not empty
						//
						// process the faces
						// 
						for (let dim of dimensions) {
							for (let step of steps) {
								// the combination dim,step determines the face we are analyzing
								let direction = {}
								direction[dim] = step
								let neighbors = getNeighbors(box , direction)
								let neighbor = neighbors[0]
								let vnodeOffset = vnodes.length
								if (!this.getVoxelState(neighbor.x, neighbor.y, neighbor.z)) { // the neighbor is empty : draw face
									//
									// DRAW THE FACE
									//
									let tempSteps = {}
									for (let d of dimensions) { tempSteps[d] = [-0.5 + offset + bezel, 0.5 - offset - bezel] }
									tempSteps[dim] = [step*(0.5 - offset)]
									for (let cx of tempSteps.x) {
										for (let cy of tempSteps.y) {
											for (let cz of tempSteps.z) {
												vnodes.push((x + cx).toFixed(2) + " " + (y + cy).toFixed(2) + " " + (z + cz).toFixed(2) )
											}
										}
									}
									if ( (step == -1) && (dim != "y") || (step == 1) && (dim == "y")) {
										faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
										faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
									} else {
										faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (4 + vnodeOffset)].join(" ") ) 
										faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (2 + vnodeOffset)].join(" ") ) 
									}
									// Now extend the faces if needed
									for (let dim1 of dimensions.filter(v => v!=dim) ) { // iterate over the the other dimensions in the face
										for (let step1 of steps) {
											let direction = {}
											direction[dim1] = step1
											let neighbors = getNeighbors(box , direction)
											let neighbor = neighbors[0]
											if (this.getVoxelState(neighbor.x, neighbor.y, neighbor.z)) { // neighbor present: extend face
												//
												// DRAW THE FACE EXTENSION on face dim, direction dim1
												//
												let dim2 = (dimensions.filter(v => v!=dim && v!=dim1))[0]
												let tempSteps={}
												let vnodeOffset = vnodes.length
												tempSteps[dim] = [step*(0.5 - offset)]
												tempSteps[dim1] = [(0.5 - offset - bezel)*step1, 0.5*step1]
												tempSteps[dim2] = [(0.5 - offset - bezel)*-1, (0.5 - offset - bezel)]
												for (let cx of tempSteps.x) {
													for (let cy of tempSteps.y) {
														for (let cz of tempSteps.z) {
															vnodes.push((x + cx).toFixed(2) + " " + (y + cy).toFixed(2) + " " + (z + cz).toFixed(2) )
														}
													}
												}
												if (( (step == -1 && (dim == "x" || dim == "z") ) || (step == +1 && dim == "y") ) && (step1 == +1) || 
													( (step == +1 && (dim == "x" || dim == "z") ) || (step == -1 && dim == "y") ) && (step1 == -1) ) {
													faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
													faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
												} else {
													faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (4 + vnodeOffset)].join(" ") ) 
													faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (2 + vnodeOffset)].join(" ") ) 
												}
											}
										}
									}
									// Check the face corners
									for (let dim1 of dimensions.filter(v => v!=dim) ) { // iterate over the the other dimensions in the face
										for (let step1 of steps) {
											let dim2 = (dimensions.filter(v => v!=dim && v!=dim1))[0]
											for (let step2 of steps) {
												let direction1 = {};direction1[dim1] = step1;let neighbor1=getNeighbors(box , direction1)[0]
												let direction2 = {};direction2[dim2] = step2;let neighbor2=getNeighbors(box , direction2)[0]
												let direction12 = {};direction12[dim1] = step1;direction12[dim2] = step2;let neighbor12=getNeighbors(box , direction12)[0]
												if (this.getVoxelState(neighbor1.x, neighbor1.y, neighbor1.z) && 
													this.getVoxelState(neighbor2.x, neighbor2.y, neighbor2.z) && 
													this.getVoxelState(neighbor12.x, neighbor12.y, neighbor12.z)
												) 
												{
													//
													// DRAW THE FACE CORNER (flat)
													//
													let vnodeOffset = vnodes.length
													let tempOffset = {}
													tempOffset[dim] = (0.5 - offset)*step; tempOffset[dim1]=(0.5 - offset - bezel)*step1; tempOffset[dim2]=(0.5 - offset - bezel)*step2
													vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
													tempOffset[dim] = (0.5 - offset)*step; tempOffset[dim1]=(0.5)*step1; tempOffset[dim2]=(0.5 - offset - bezel)*step2
													vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
													tempOffset[dim] = (0.5 - offset)*step; tempOffset[dim1]=(0.5)*step1; tempOffset[dim2]=(0.5)*step2
													vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
													tempOffset[dim] = (0.5 - offset)*step; tempOffset[dim1]=(0.5 - offset - bezel)*step1; tempOffset[dim2]=(0.5)*step2
													vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
													faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
													faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
												}
											}
										}
									}
								}
							}
						}
						//
						// process the edges
						//
						let index = 0
						for (let dimidx1 in dimensions.slice(0,2)) {
							let dim1=dimensions[dimidx1]
							for (let step1 of steps) {
								for (let dim2 of dimensions.filter((v,i) => i>dimidx1) ) {
									for (let step2 of steps) {
										let dimAxis = dimensions.filter(v => v!=dim1 && v!=dim2)
										let direction1 = {}
										direction1[dim1] = step1
										let neighbor1 = getNeighbors(box , direction1)[0]
										let direction2 = {}
										direction2[dim2] = step2
										let neighbor2 = getNeighbors(box , direction2)[0]
										let direction12 = {}
										direction12[dim1] = step1; direction12[dim2] = step2
										let neighbor12 = getNeighbors(box , direction12)[0]
										index++
										if ( (!this.getVoxelState(neighbor1.x, neighbor1.y, neighbor1.z) && !this.getVoxelState(neighbor2.x, neighbor2.y, neighbor2.z)) || 
											 (this.getVoxelState(neighbor1.x, neighbor1.y, neighbor1.z) && this.getVoxelState(neighbor2.x, neighbor2.y, neighbor2.z) && !this.getVoxelState(neighbor12.x, neighbor12.y, neighbor12.z)) ) 
										{
											//
											// DRAW THE BEZEL (2 neighbors missing) or (L-SHAPED)
											//
											let tempOffset = {}
											let vnodeOffset = vnodes.length
											// different distances for (L-SHAPED) versus (2 neighbors missing)
											let dist1 = this.getVoxelState(neighbor1.x, neighbor1.y, neighbor1.z)?0.5:0.5-offset
											let dist2 = this.getVoxelState(neighbor1.x, neighbor1.y, neighbor1.z)?0.5-offset:0.5-offset-bezel
											tempOffset[dimAxis] = -0.5 + offset + bezel; tempOffset[dim1]=dist1*step1; tempOffset[dim2]=dist2*step2
											vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
											tempOffset[dimAxis] = -0.5 + offset + bezel; tempOffset[dim1]=dist2*step1; tempOffset[dim2]=dist1*step2
											vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
											tempOffset[dimAxis] = +0.5 - offset - bezel; tempOffset[dim1]=dist2*step1; tempOffset[dim2]=dist1*step2
											vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
											tempOffset[dimAxis] = +0.5 - offset - bezel; tempOffset[dim1]=dist1*step1; tempOffset[dim2]=dist2*step2
											vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
											if ( [1, 4, 6, 7, 9, 12 ].includes(index)) {
												faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
											} else {
												faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (2 + vnodeOffset)].join(" ") )
											}
											// now check if we need to extend the bezel
											for (let stepAxis of steps) {
												let direction = {}
												direction[dimAxis] = stepAxis
												let neighbor = getNeighbors(box , direction)[0]
												if (this.getVoxelState(neighbor.x, neighbor.y, neighbor.z) && !this.getVoxelState(neighbor1.x, neighbor1.y, neighbor1.z)) {
													//
													// DRAW THE BEZEL EXTENSION (not for L-SHAPED)
													//
													let tempOffset = {}
													let vnodeOffset = vnodes.length
													tempOffset[dimAxis] = 0.5*stepAxis; tempOffset[dim1]=dist1*step1; tempOffset[dim2]=dist2*step2
													vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
													tempOffset[dimAxis] = 0.5*stepAxis; tempOffset[dim1]=dist2*step1; tempOffset[dim2]=dist1*step2
													vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
													tempOffset[dimAxis] = (0.5 - offset - bezel)*stepAxis; tempOffset[dim1]=dist2*step1; tempOffset[dim2]=dist1*step2
													vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
													tempOffset[dimAxis] = (0.5 - offset - bezel)*stepAxis; tempOffset[dim1]=dist1*step1; tempOffset[dim2]=dist2*step2
													vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
													let product = dimAxis=="y"?step1 * step2 * stepAxis:-1*(step1 * step2 * stepAxis)
													if (product == 1) {
														faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
														faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
													} else {
														faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
														faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (2 + vnodeOffset)].join(" ") )
													}
												}
											}
										}
									}
								}
							}
						}
						//
						// process the corners
						//
						let cindex=0
						for (let stepx of steps) {
							let step = {x: stepx}
							for (let stepy of steps) {
								step["y"] = stepy
								for (let stepz of steps) {
									step["z"]=stepz
									cindex++
									if (!this.getVoxelState(x + stepx, y, z) && !this.getVoxelState(x, y + stepy, z) && !this.getVoxelState(x, y, z + stepz)) {
										//
										// DRAW THE CORNER (large triangle)
										//
										let vnodeOffset = vnodes.length
										vnodes.push((x + stepx*(0.5 - offset)).toFixed(2) + " " + (y + stepy*(0.5 - offset - bezel)).toFixed(2) + " " + (z + stepz*(0.5 - offset - bezel)).toFixed(2) )
										vnodes.push((x + stepx*(0.5 - offset - bezel)).toFixed(2) + " " + (y + stepy*(0.5 - offset)).toFixed(2) + " " + (z + stepz*(0.5 - offset - bezel)).toFixed(2) )
										vnodes.push((x + stepx*(0.5 - offset - bezel)).toFixed(2) + " " + (y + stepy*(0.5 - offset - bezel)).toFixed(2) + " " + (z + stepz*(0.5 - offset)).toFixed(2) )
										if ( [2, 3, 5, 8].includes(cindex)) {
											faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
										} else {
											faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (2 + vnodeOffset)].join(" ") )
										}
									}
									if (this.getVoxelState(x + stepx, y, z) && this.getVoxelState(x, y + stepy, z) && this.getVoxelState(x, y, z + stepz)) { // 3-SIDED
										// 3-SIDED
										if (!this.getVoxelState(x, y + stepy, z + stepz) && !this.getVoxelState(x + stepx, y, z + stepz) && !this.getVoxelState(x + stepx, y + stepy, z)) // no EDGED
										{
											//
											// DRAW THE CORNER (hexagon)
											//
											let vnodeOffset = vnodes.length
											vnodes.push((x + stepx*(0.5)).toFixed(2) + " " + (y + stepy*(0.5 - offset)).toFixed(2) + " " + (z + stepz*(0.5 - offset - bezel)).toFixed(2) )
											vnodes.push((x + stepx*(0.5 - offset)).toFixed(2) + " " + (y + stepy*(0.5)).toFixed(2) + " " + (z + stepz*(0.5 - offset - bezel)).toFixed(2) )
											vnodes.push((x + stepx*(0.5 - offset - bezel)).toFixed(2) + " " + (y + stepy*(0.5)).toFixed(2) + " " + (z + stepz*(0.5 - offset)).toFixed(2) )
											vnodes.push((x + stepx*(0.5 - offset - bezel)).toFixed(2) + " " + (y + stepy*(0.5 - offset)).toFixed(2) + " " + (z + stepz*(0.5)).toFixed(2) )
											vnodes.push((x + stepx*(0.5 - offset)).toFixed(2) + " " + (y + stepy*(0.5 - offset - bezel)).toFixed(2) + " " + (z + stepz*(0.5)).toFixed(2) )
											vnodes.push((x + stepx*(0.5)).toFixed(2) + " " + (y + stepy*(0.5 - offset - bezel)).toFixed(2) + " " + (z + stepz*(0.5 - offset)).toFixed(2) )
											if ( [2, 3, 5, 8].includes(cindex)) {
												faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (5 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (5 + vnodeOffset), (6 + vnodeOffset)].join(" ") )
											} else {
												faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (2 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (5 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (6 + vnodeOffset), (5 + vnodeOffset)].join(" ") )
											}
										}
										// Case for 3-SIDED 1-EDGED
										for (let dimFree of dimensions) {
											let dim1 = dimensions.filter(v => v!= dimFree)[0]
											let dim2 = dimensions.filter(v => v!= dimFree)[1]
											let direction01 = {x:0, y:0, z:0};direction01[dim1] = step[dim1];direction01[dimFree] = step[dimFree];let neighbor01=getNeighbors(box , direction01)[0]
											let direction02 = {x:0, y:0, z:0};direction02[dim2] = step[dim2];direction02[dimFree] = step[dimFree];let neighbor02=getNeighbors(box , direction02)[0]
											let direction12 = {x:0, y:0, z:0};direction12[dim1] = step[dim1];direction12[dim2] = step[dim2];let neighbor12=getNeighbors(box , direction12)[0]
											if (!this.getVoxelState(neighbor01.x, neighbor01.y, neighbor01.z) && 
												!this.getVoxelState(neighbor02.x, neighbor02.y, neighbor02.z) && 
												this.getVoxelState(neighbor12.x, neighbor12.y, neighbor12.z)) 
											{
												//
												// DRAW 3-SIDED 1-EDGED corner
												//
												let vnodeOffset = vnodes.length
												let tempOffset = {}
												let product = stepx*stepy*stepz
												tempOffset[dim1]=0.5*step[dim1];tempOffset[dim2]=(0.5-offset-bezel)*step[dim2];tempOffset[dimFree]=(0.5-offset)*step[dimFree]
												vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
												tempOffset[dim1]=(0.5)*step[dim1];tempOffset[dim2]=(0.5)*step[dim2];tempOffset[dimFree]=(0.5-offset)*step[dimFree]
												vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
												tempOffset[dim1]=(0.5-offset - bezel)*step[dim1];tempOffset[dim2]=(0.5)*step[dim2];tempOffset[dimFree]=(0.5-offset)*step[dimFree]
												vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
												tempOffset[dim1]=(0.5-offset - bezel)*step[dim1];tempOffset[dim2]=(0.5-offset)*step[dim2];tempOffset[dimFree]=(0.5)*step[dimFree]
												vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
												tempOffset[dim1]=(0.5-offset)*step[dim1];tempOffset[dim2]=(0.5-offset-bezel)*step[dim2];tempOffset[dimFree]=(0.5)*step[dimFree]
												vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
												if (((product == +1)&&(dimFree=="x"||dimFree=="z")) || ((product == -1)&&(dimFree=="y"))) {
													faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
													faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
													faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (5 + vnodeOffset)].join(" ") )
												} else {
													faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (2 + vnodeOffset)].join(" ") )
													faces.push([(1 + vnodeOffset), (5 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
													faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
												}
											}
										}
										// case for 3-sided 2-edged
										for (let dimFull of dimensions) {
											let dim1 = dimensions.filter(v => v!= dimFull)[0]
											let dim2 = dimensions.filter(v => v!= dimFull)[1]
											let direction01 = {x:0, y:0, z:0};direction01[dim1] = step[dim1];direction01[dimFull] = step[dimFull];let neighbor01=getNeighbors(box , direction01)[0]
											let direction02 = {x:0, y:0, z:0};direction02[dim2] = step[dim2];direction02[dimFull] = step[dimFull];let neighbor02=getNeighbors(box , direction02)[0]
											let direction12 = {x:0, y:0, z:0};direction12[dim1] = step[dim1];direction12[dim2] = step[dim2];let neighbor12=getNeighbors(box , direction12)[0]
											if (this.getVoxelState(neighbor01.x, neighbor01.y, neighbor01.z) && 
												this.getVoxelState(neighbor02.x, neighbor02.y, neighbor02.z) && 
												!this.getVoxelState(neighbor12.x, neighbor12.y, neighbor12.z)) 
											{
												//
												// DRAW 3-SIDED 2-EDGED corner (a bevel extension)
												//
												let vnodeOffset = vnodes.length
												let tempOffset = {}
												let product = stepx*stepy*stepz
												tempOffset[dim1]=(0.5)*step[dim1];tempOffset[dim2]=(0.5-offset)*step[dim2];tempOffset[dimFull]=(0.5-offset-bezel)*step[dimFull]
												vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
												tempOffset[dim1]=(0.5-offset)*step[dim1];tempOffset[dim2]=(0.5)*step[dim2];tempOffset[dimFull]=(0.5-offset-bezel)*step[dimFull]
												vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
												tempOffset[dim1]=(0.5-offset)*step[dim1];tempOffset[dim2]=(0.5)*step[dim2];tempOffset[dimFull]=(0.5)*step[dimFull]
												vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
												tempOffset[dim1]=(0.5)*step[dim1];tempOffset[dim2]=(0.5-offset)*step[dim2];tempOffset[dimFull]=(0.5)*step[dimFull]
												vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
												if (((product == +1)&&(dimFull=="x"||dimFull=="z")) || ((product == -1)&&(dimFull=="y"))) {
													faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
													faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
												} else {
													faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
													faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (2 + vnodeOffset)].join(" ") )
												}
											}
										}
										// case for 3-sided 3-edged
										if (this.getVoxelState(x, y + stepy, z + stepz) && this.getVoxelState(x + stepx, y, z + stepz) && this.getVoxelState(x + stepx, y + stepy, z) && !this.getVoxelState(x + stepx, y + stepy, z+stepz))
										{
											//
											// DRAW THE CORNER (SMALL triangle)
											//
											let vnodeOffset = vnodes.length
											vnodes.push((x + stepx*(0.5)).toFixed(2) + " " + (y + stepy*(0.5 - offset)).toFixed(2) + " " + (z + stepz*(0.5)).toFixed(2) )
											vnodes.push((x + stepx*(0.5)).toFixed(2) + " " + (y + stepy*(0.5)).toFixed(2) + " " + (z + stepz*(0.5 - offset)).toFixed(2) )
											vnodes.push((x + stepx*(0.5 - offset)).toFixed(2) + " " + (y + stepy*(0.5)).toFixed(2) + " " + (z + stepz*(0.5)).toFixed(2) )
											if ( [2, 3, 5, 8].includes(cindex)) {
												faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
											} else {
												faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (2 + vnodeOffset)].join(" ") )
											}
											}
									}
									// Check for L-SHAPED
									for (let dimFree of dimensions) {
										let dim1 = dimensions.filter(v => v!= dimFree)[0]
										let dim2 = dimensions.filter(v => v!= dimFree)[1]
										let direction1 = {x:0, y:0, z:0};direction1[dim1] = step[dim1];let neighbor1=getNeighbors(box , direction1)[0]
										let direction2 = {x:0, y:0, z:0};direction2[dim2] = step[dim2];let neighbor2=getNeighbors(box , direction2)[0]
										let direction0 = {x:0, y:0, z:0};direction0[dimFree] = step[dimFree];let neighbor0=getNeighbors(box , direction0)[0]
										let direction12 = {x:0, y:0, z:0};direction12[dim1] = step[dim1];direction12[dim2] = step[dim2];let neighbor12=getNeighbors(box , direction12)[0]
										if (this.getVoxelState(neighbor1.x, neighbor1.y, neighbor1.z) && 
											this.getVoxelState(neighbor2.x, neighbor2.y, neighbor2.z) && 
											!this.getVoxelState(neighbor12.x, neighbor12.y, neighbor12.z) && 
											!this.getVoxelState(neighbor0.x, neighbor0.y, neighbor0.z))
										{
											//
											// DRAW L-SHAPED
											//
											let vnodeOffset = vnodes.length
											let tempOffset = {}
											let product = stepx*stepy*stepz
											tempOffset[dim1]=(0.5-offset-bezel)*step[dim1];tempOffset[dim2]=(0.5-offset-bezel)*step[dim2];tempOffset[dimFree]=(0.5-offset)*step[dimFree]
											vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
											tempOffset[dim1]=(0.5)*step[dim1];tempOffset[dim2]=(0.5-offset-bezel)*step[dim2];tempOffset[dimFree]=(0.5-offset)*step[dimFree]
											vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
											tempOffset[dim1]=(0.5)*step[dim1];tempOffset[dim2]=(0.5-offset)*step[dim2];tempOffset[dimFree]=(0.5-offset-bezel)*step[dimFree]
											vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
											tempOffset[dim1]=(0.5-offset)*step[dim1];tempOffset[dim2]=(0.5)*step[dim2];tempOffset[dimFree]=(0.5-offset-bezel)*step[dimFree]
											vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
											tempOffset[dim1]=(0.5-offset-bezel)*step[dim1];tempOffset[dim2]=(0.5)*step[dim2];tempOffset[dimFree]=(0.5-offset)*step[dimFree]
											vnodes.push((x+tempOffset.x).toFixed(2) + " " + (y+tempOffset.y).toFixed(2) + " " + (z+tempOffset.z).toFixed(2) )
											if (((product == +1)&&(dimFree=="x"||dimFree=="z")) || ((product == -1)&&(dimFree=="y"))) {
												faces.push([(1 + vnodeOffset), (2 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (5 + vnodeOffset)].join(" ") )
											} else {
												faces.push([(1 + vnodeOffset), (3 + vnodeOffset), (2 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (4 + vnodeOffset), (3 + vnodeOffset)].join(" ") )
												faces.push([(1 + vnodeOffset), (5 + vnodeOffset), (4 + vnodeOffset)].join(" ") )
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		let result = removeDoubles(vnodes,faces)
//		for (let v of result.vnodes) OBJ += v + "\n"
//		for (let f of result.faces) OBJ += f + "\n"
		return result // {vnodes, faces}
	}
}

export class VoxelInstance {
	// This is not a data representation, but a helper class to facilitate the solver function (DLX from Donald A. Knuth)
	// WorldMap has been updated to facilitate variVoxels
	// it introduces boundingBox and hotspot
	// it overrides the dimensions of the original voxel
	// it rotates and translates the original voxel to place its boundingBox in the beginning of the first quadrant
	_voxel
	_worldMap // transformed clone of the voxel worldmap (rotation + offset translation)
	offset = [0,0,0] // offset of the boundingBox
	rotation = 0
	hotspot = [0,0,0] // folows the transformations, including the offset
	get x() { return Number(this.dimension[0]) }
	get y() { return Number(this.dimension[1]) }
	get z() { return Number(this.dimension[2]) }
	get worldmap() { return this._worldMap }
	get dimension() { return this.worldmap.dimension }
	get boundingBox() { return this.worldmap.boundingBox }
	constructor(flatObject) {
		// voxel is mandatory, rotation is optional, offset is optional
		if (flatObject) {
			let {voxel, rotation = 0, offset = [0,0,0]} = flatObject
			this._voxel = voxel
			this.rotation = rotation
			this.offset = offset
			// clone and rotate the voxel worldmap
			this._worldMap = voxel.worldmap.clone()
			this._worldMap.rotate(rotation)
			// move the worldmap so that the boundingBox starts at [0,0,0]
			let bb = this._worldMap.boundingBox
			let trans = [-1*bb.min[0], -1*bb.min[1], -1*bb.min[2]]
			this._worldMap.translate([trans[0] + offset[0], trans[1] + offset[1], trans[2] + offset[2]])
			// update the hotspot. Include offset
			this.hotspot = rotatePoint(this.hotspot, rotation)
			// KG : do I need to translate the hotspot over offset??
			// currently offset is never used, we only rotate, so the answer will need to wait
			// We probably do, since this property is used to track the position of the origin of the original voxel and that changes whenever we change the worldmap.
			this.hotspot = translatePoint(this.hotspot, [trans[0] + offset[0], trans[1] + offset[1], trans[2] + offset[2]])
		}
	}
	clone() {
		let c = new VoxelInstance()
		c._voxel = this._voxel
		c._worldMap = this._worldMap.clone()
		c._offset = [...this.offset]
		c.rotation = this.rotation
		c.hotspot = [...this.hotspot]
		return c
	}
	translate(translation) {
		this._worldMap.translate(translation)
		this.hotspot = translatePoint(this.hotspot, translation)
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
	get id() { return Number(this["@attributes"].id) }
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

export class ArrayWorldMap {
	_map // sparse array
	_varimap // sparse array
    static worldOrigin=100
	// coordinates range is [-worldOrigin ..0.. +worldOrigin]
    static worldMax=2*ArrayWorldMap.worldOrigin + 1
    static worldOriginIndex = ArrayWorldMap.worldOrigin*(ArrayWorldMap.worldMax*ArrayWorldMap.worldMax + ArrayWorldMap.worldMax + 1)
    static worldSteps = [1, ArrayWorldMap.worldMax, ArrayWorldMap.worldMax*ArrayWorldMap.worldMax]
    static worldSize = ArrayWorldMap.worldMax*ArrayWorldMap.worldMax*ArrayWorldMap.worldMax
    static hashToPoint(hash) {
        let h = hash
        let x = h % ArrayWorldMap.worldMax; h = (h - x)/ArrayWorldMap.worldMax
        let y = h % ArrayWorldMap.worldMax; h = (h - y)/ArrayWorldMap.worldMax
        let z = h
        return [x-ArrayWorldMap.worldOrigin,y-ArrayWorldMap.worldOrigin,z-ArrayWorldMap.worldOrigin]
    }
    static pointToHash(point) {return (ArrayWorldMap.worldOriginIndex + ArrayWorldMap.worldMax*(point[2]*ArrayWorldMap.worldMax + point[1]) + point[0]) }
    
	constructor(source = {}, copy=true ) {
		let { _map = [], _varimap = [] } = source
		if (copy) {
			this._map = []
            for (let idx in _map) this._map[idx] = _map[idx]
			this._varimap = []
            for (let idx in _varimap) this._varimap[idx] = _varimap[idx]
		}
		else {
			this._map = _map
			this._varimap = _varimap
		}
	}
    get size() { 
        let count=0; 
        this._map.forEach(v => {if (v>=0) count++})
        this._varimap.forEach(v => {if (v>=0) count++})
        return count
    }
    get boundingBox() {
        let bb = new BoundingBox()
        bb.max = [-1*ArrayWorldMap.worldOrigin,-1*ArrayWorldMap.worldOrigin,-1*ArrayWorldMap.worldOrigin]
        bb.min = [ArrayWorldMap.worldOrigin,ArrayWorldMap.worldOrigin,ArrayWorldMap.worldOrigin]
		for (let idx in this._map) {
            let p = ArrayWorldMap.hashToPoint(idx)
            for (let dim of [0,1,2]) {
                if (p[dim] < bb.min[dim]) bb.min[dim] = p[dim]
                if (p[dim] > bb.max[dim]) bb.max[dim] = p[dim]
            }
		}
        return bb
    }
	get dimension() {
		let bb = this.boundingBox
		return [bb.max[0] - bb.min[0],bb.max[1] - bb.min[1],bb.max[2] - bb.min[2]]
	}
    setHash(idx,val) { this._map[idx] = val }
    setPoint(p,val) { this.setHash(ArrayWorldMap.pointToHash(p),val) }
    getHash(idx) { return this._map[idx] }
    getPoint(p) { return this.getHash(ArrayWorldMap.pointToHash(p))}
	getStateHash(idx) { 
		if (this._map[idx] >=0) return 1
		if (this._varimap[idx] >= 0) return 2
		else return 0
	}
	getStatePoint(p) { return this.getStateHash(ArrayWorldMap.pointToHash(p)) }
	setStateHash(idx, s) {
		if (s==0) { delete this._map[idx];delete this._varimap[idx] }
		if (s==1) { this._map[idx]=1;delete this._varimap[idx] }
		if (s==2) { delete this._map[idx];this._varimap[idx]=1 }
	}
	setStatePoint(p,s) { this.setStateHash(ArrayWorldMap.pointToHash(p),s)}
	clearHash(idx) { delete this._map[idx];delete this._varimap[idx]}
    clearPoint(p) { this.clearHash(ArrayWorldMap.pointToHash(p)) }
    hasHash(idx) { return (this._map[idx]>=0 || this._varimap[idx]>=0) }
    hasPoint(p) { return this.hasHash(ArrayWorldMap.pointToHash(p)) }
    canMove(valArray, translation) {
        // check if the pieces in valArray can move along translation
        for (let idx in this._map) {
            if ( valArray.includes(this._map[idx])  ) {
                // check if this can move
                let idxOffset = ArrayWorldMap.worldSteps[0]*translation[0] + ArrayWorldMap.worldSteps[1]*translation[1] + ArrayWorldMap.worldSteps[2]*translation[2]
                let targetIdx = idx*1 + idxOffset
                let targetVal = this._map[targetIdx]
                if (!(targetVal === undefined || valArray.includes(targetVal))) return false
            }
        }
        return true
    }
    move(valArray, translation) {
        // does not check if move is valid
        // build new array, because "delete" of old entries is too expensive
		// update in place
        let newArray = []
        for (let idx in this._map) {
            if ( valArray.includes(this._map[idx])  ) {
                // check if this can move
                let idxOffset = ArrayWorldMap.worldSteps[0]*translation[0] + ArrayWorldMap.worldSteps[1]*translation[1] + ArrayWorldMap.worldSteps[2]*translation[2]
                let targetIdx = idx*1 + idxOffset
                newArray[targetIdx] = this._map[idx]
            }
            else {
                newArray[idx] = this._map[idx]
            }
        }
        this._map = newArray
        return this
    }
    translate(translation) {
		// update in place
        let newArray = []
        for (let idx in this._map) {
            let idxOffset = ArrayWorldMap.worldSteps[0]*translation[0] + ArrayWorldMap.worldSteps[1]*translation[1] + ArrayWorldMap.worldSteps[2]*translation[2]
            let targetIdx = idx*1 + idxOffset
            newArray[targetIdx] = this._map[idx]
        }
        this._map = newArray
        return this
    }
	rotate(rotationIdx) {
		let newArray = []
		for (let idx in this._map) {
//			idx = Number(idx)
			let pos=ArrayWorldMap.hashToPoint(idx)
			newArray[ArrayWorldMap.pointToHash(rotatePoint(pos, rotationIdx))] = this._map[idx]
		}
		this._map = newArray
	}
    canPlace(worldmap) {
        // check that the destination is free
        for (let idx in worldmap._map) {
            if (this.hasHash(idx)) return false
        }
        return true
    }
    place(worldmap) {
        // does not check if placement is possible
        for (let idx in worldmap._map) {
            this._map[idx] = worldmap._map[idx]
        }
        return this
    }
    getMovingPieces(valArray, translation) {
        // valArray needs to be a dense array
        // extend the valArray to the pieces we drag along
        // translation is supposed to be only 1 step away, but you could use different values
        let mpl = valArray.map(v => v) // copy the array, result is dense starting at 0
        let oldlen=0
        while (oldlen != mpl.length) {
            oldlen = mpl.length
            for (let idx in this._map) {
                if ( mpl.includes(this._map[idx])  ) {
                    // check if this idx has conflicts
                    let idxOffset = ArrayWorldMap.worldSteps[0]*translation[0] + ArrayWorldMap.worldSteps[1]*translation[1] + ArrayWorldMap.worldSteps[2]*translation[2]
                    let targetIdx = idx*1 + idxOffset
                    let targetVal = this._map[targetIdx]
                    if (!(targetVal === undefined || mpl.includes(targetVal))) {
                        // conflict
                        mpl.push(targetVal) // fastest operation on earth
                    }
                }
            }
        }
        return mpl // valArray is not modified
    }
    remap(newval) {
        for (let idx in this._map) this._map[idx] = newval
        for (let idx in this._varimap) this._varimap[idx] = newval
        return this
    }
	filter(valArray) {
        let res=[]
        for (let idx in this._map) {if (valArray.includes(this._map[idx])) res[idx]=this._map[idx]}
        return res
	}
	get pieceList() {
        let pl = []
        for (let idx in this._map) {
            if (!pl.includes(this._map[idx])) pl.push(this._map[idx])
        }
		return pl
//		return pl.sort((a,b)=>a-b)
	}
    clone() {
        return new ArrayWorldMap(this)
    }
	getDLXmap(smallWorldmap) {
		// This is specific for the Dancing Link algorithm (algoritm X) of Donald A. Knuth 
		// See https://www.npmjs.com/package/dancing-links
		// This transforms smallWorldmap into a constraint row in the matrix.
		// return undefined if there is at least one voxel that covers a hole (should not happen)
		// "This" worldmap is the reference (header row) to which the row should map.
		// Since worldmap has been revamped into an "absolute" world of indices, there is no longer a need to
		// use the intermediate remapping array. Just use the indices of worldmap for use in the constraints
		let constraint = {data:{} , primaryRow : [], secondaryRow : []}
		// setup a lookup array that maps the pixel hashes to their position in the dense array
		let filledHashSequence=[]
		let count=0
		for (let hash in this._map) {
			filledHashSequence.push(hash)
			count++
		}
		constraint.primaryRow[count - 1] = 0
		let variHashSequence=[]
		count=0
		for (let hash in this._varimap) {
			variHashSequence.push(hash)
			count++
		}
		constraint.secondaryRow[count - 1] = 0
		// hack to make sure the sparse arrays have the correct "length"
		// Loop over the indices of smallworldmap, and check if it is present in this._map or this._varimap
		// return undefined if it is present in neither
		for (let hash in smallWorldmap._map) {
			let fullidx = filledHashSequence.indexOf(hash)
			let variidx = variHashSequence.indexOf(hash)
			if ((fullidx == -1) && (variidx == -1 )) return undefined
			if ( fullidx != -1) constraint.primaryRow[fullidx] = 1
			else constraint.secondaryRow[variidx] = 1
		}
		return constraint
	}
}

export class MapWorldMap {
	_map // Map
	_varimap // Map
    static worldOrigin=100
	// coordinates range is [-worldOrigin ..0.. +worldOrigin]
    static worldMax=2*MapWorldMap.worldOrigin + 1
    static worldOriginIndex = MapWorldMap.worldOrigin*(MapWorldMap.worldMax*MapWorldMap.worldMax + MapWorldMap.worldMax + 1)
    static worldSteps = [1, MapWorldMap.worldMax, MapWorldMap.worldMax*MapWorldMap.worldMax]
    static worldSize = MapWorldMap.worldMax*MapWorldMap.worldMax*MapWorldMap.worldMax
    static hashToPoint(hash) {
        let h = Number(hash)
        let x = h % MapWorldMap.worldMax; h = (h - x)/MapWorldMap.worldMax
        let y = h % MapWorldMap.worldMax; h = (h - y)/MapWorldMap.worldMax
        let z = h
        return [x-MapWorldMap.worldOrigin,y-MapWorldMap.worldOrigin,z-MapWorldMap.worldOrigin]
    }
    static pointToHash(point) {return (MapWorldMap.worldOriginIndex + MapWorldMap.worldMax*(point[2]*MapWorldMap.worldMax + point[1]) + point[0]) }
    
	constructor(source = {}, copy=true ) {
		let { _map, _varimap} = source
		if (copy) {
			this._map = new Map(_map)
			this._varimap = new Map(_varimap)
		}
		else {
			this._map = _map
			this._varimap = _varimap
		}
	}
    get size() { 
        let count=0; 
        this._map.forEach(v => count++)
        this._varimap.forEach(v => count++)
        return count
    }
    get boundingBox() {
        let bb = new BoundingBox()
        bb.max = [-1*MapWorldMap.worldOrigin,-1*MapWorldMap.worldOrigin,-1*MapWorldMap.worldOrigin]
        bb.min = [MapWorldMap.worldOrigin,MapWorldMap.worldOrigin,MapWorldMap.worldOrigin]
		this._map.forEach((val, hash) => {
            let p = MapWorldMap.hashToPoint(hash)
            for (let dim of [0,1,2]) {
                if (p[dim] < bb.min[dim]) bb.min[dim] = p[dim]
                if (p[dim] > bb.max[dim]) bb.max[dim] = p[dim]
            }
		})
        return bb
    }
	get dimension() {
		let bb = this.boundingBox
		return [bb.max[0] - bb.min[0],bb.max[1] - bb.min[1],bb.max[2] - bb.min[2]]
	}
    setHash(idx,val) { this._map.set(idx,val) }
    setPoint(p,val) { this.setHash(MapWorldMap.pointToHash(p),val) }
    getHash(idx) { return this._map.get(idx) }
    getPoint(p) { return this.getHash(MapWorldMap.pointToHash(p))}
	getStateHash(idx) { 
		if (this._map.has(idx)) return 1
		if (this._varimap.has(idx)) return 2
		else return 0
	}
	getStatePoint(p) { return this.getStateHash(MapWorldMap.pointToHash(p)) }
	setStateHash(idx, s) {
		if (s==0) { this._map.delete(idx);this._varimap.delete(idx) }
		if (s==1) { this._map.set(idx,1);this._varimap.delete(idx) }
		if (s==2) { delete this._map.delete(idx);this._varimap.set(idx,1) }
	}
	setStatePoint(p,s) { this.setStateHash(MapWorldMap.pointToHash(p),s)}
	clearHash(idx) { this._map.delete(idx);this._varimap.delete(idx)}
    clearPoint(p) { this.clearHash(MapWorldMap.pointToHash(p)) }
    hasHash(idx) { return (this._map.has(idx) || this._varimap.has(idx)) }
    hasPoint(p) { return this.hasHash(MapWorldMap.pointToHash(p)) }
    canMove(valArray, translation) {
        // check if the pieces in valArray can move along translation
        for (let [hash, val] of this._map.entries()) {
            if ( valArray.includes(val)  ) {
                // check if this can move
                let idxOffset = MapWorldMap.worldSteps[0]*translation[0] + MapWorldMap.worldSteps[1]*translation[1] + MapWorldMap.worldSteps[2]*translation[2]
                let targetIdx = hash*1 + idxOffset
                let targetVal = this.getHash(targetIdx)
                if (!(targetVal === undefined || valArray.includes(targetVal))) return false
            }
        }
        return true
    }
    move(valArray, translation) {
        // does not check if move is valid
		// update in place
        let newMap = new Map()

		this._map.forEach((val, hash) => {
            if ( valArray.includes(val)  ) {
                // check if this can move
                let hashOffset = MapWorldMap.worldSteps[0]*translation[0] + MapWorldMap.worldSteps[1]*translation[1] + MapWorldMap.worldSteps[2]*translation[2]
                let targetHash = hash*1 + hashOffset
				newMap.set(targetHash, val)
            }
            else {
				newMap.set(hash,val)
            }
		})
        this._map = newMap
        return this
    }
    translate(translation) {
		// update in place
        let newMap = new Map()
//		let newArray = []
		this._map.forEach((val, hash) => {
            let hashOffset = MapWorldMap.worldSteps[0]*translation[0] + MapWorldMap.worldSteps[1]*translation[1] + MapWorldMap.worldSteps[2]*translation[2]
            let targetHash = hash*1 + hashOffset
//			newArray.push([targetHash, val])
            newMap.set(targetHash, val)
		})
        this._map = newMap
//		this._map.clear()
//		newArray.forEach( v=> this._map.set(v[0],v[1]))
        return this
    }
	translateToClone(translation) {
		// update to clone
		// 
        let newMap = new Map()
		this._map.forEach((val, hash) => {
            let hashOffset = MapWorldMap.worldSteps[0]*translation[0] + MapWorldMap.worldSteps[1]*translation[1] + MapWorldMap.worldSteps[2]*translation[2]
            let targetHash = hash*1 + hashOffset
            newMap.set(targetHash, val)
		})
		return new MapWorldMap({_map:newMap, _varimap: undefined}, false)
    }
	rotate(rotationIdx) {
		let newMap = new Map()
		this._map.forEach((val, hash) => {
			let pos=MapWorldMap.hashToPoint(hash)
			newMap.set(MapWorldMap.pointToHash(rotatePoint(pos, rotationIdx)),val)
		})
		this._map = newMap
	}
    canPlace(worldmap) {
        // check that the destination is free
        for (let [hash, val] of worldmap._map.entries()) {
            if (this.hasHash(hash)) return false
        }
        return true
    }
    place(worldmap) {
        // does not check if placement is possible
		worldmap._map.forEach((val, hash) => this.setHash(hash, val))
        return this
    }
    getMovingPieces(valArray, translation) {
        // valArray needs to be a dense array
        // extend the valArray to the pieces we drag along
        // translation is supposed to be only 1 step away, but you could use different values
        let mpl = valArray.map(v => v) // copy the array, result is dense starting at 0
        let oldlen=0
        while (oldlen != mpl.length) {
            oldlen = mpl.length

            this._map.forEach((val,idx) => {
                if ( mpl.includes(val)  ) {
                    // check if this idx has conflicts
                    let idxOffset = MapWorldMap.worldSteps[0]*translation[0] + MapWorldMap.worldSteps[1]*translation[1] + MapWorldMap.worldSteps[2]*translation[2]
                    let targetIdx = idx*1 + idxOffset
                    let targetVal = this._map.get(targetIdx)
					let pos = MapWorldMap.hashToPoint(idx) // KG
					let targetPos = MapWorldMap.hashToPoint(targetIdx) // KG
                    if (!(targetVal === undefined || mpl.includes(targetVal))) {
                        // conflict
                        mpl.push(targetVal) // fastest operation on earth
                    }
                }
            })
        }
        return mpl // valArray is not modified
    }
    remap(newval) {
        this._map.forEach((val, idx) => {this._map.set(idx,newval)})
        this._varimap.forEach((val, idx) => {this._varimap.set(idx,newval)})
        return this
    }
	filter(valArray) {
        let res=new Map()
		this._map.forEach((val, idx) => {if (valArray.includes(val)) res.set(idx,val)})
        return res
	}
	get pieceList() {
        let pl = []
		this._map.forEach((val, idx) => {if (!pl.includes(val)) pl.push(val) })
		return pl
//		return pl.sort((a,b)=>a-b)
	}
    clone() {
        return new MapWorldMap(this)
    }
	getDLXmap(smallWorldmap) {
		// This is specific for the Dancing Link algorithm (algoritm X) of Donald A. Knuth 
		// See https://www.npmjs.com/package/dancing-links
		// This transforms smallWorldmap into a constraint row in the matrix.
		// return undefined if there is at least one voxel that covers a hole (should not happen)
		// "This" worldmap is the reference (header row) to which the row should map.
		// Since worldmap has been revamped into an "absolute" world of indices, there is no longer a need to
		// use the intermediate remapping array. Just use the indices of worldmap for use in the constraints
		let constraint = {data:{} , primaryRow : [], secondaryRow : []}
		// setup a lookup array that maps the pixel hashes to their position in the dense array
		let filledHashSequence=[]
		this._map.forEach((val, hash) => { filledHashSequence.push(hash)})
		let variHashSequence=[]
		this._varimap.forEach((val, hash) => { variHashSequence.push(hash)})
		// hack to make sure the sparse arrays have the correct "length"
		constraint.primaryRow[filledHashSequence.length - 1] = 0
		constraint.secondaryRow[variHashSequence.length - 1] = 0
		// Loop over the indices of smallworldmap, and check if it is present in this._map or this._varimap
		// return undefined if it is present in neither
		for (let [hash, val] of smallWorldmap._map) {
			let fullidx = filledHashSequence.indexOf(hash)
			let variidx = variHashSequence.indexOf(hash)
			if ((fullidx == -1) && (variidx == -1 )) return undefined
			if ( fullidx != -1) constraint.primaryRow[fullidx] = 1
			else constraint.secondaryRow[variidx] = 1
		}
		return constraint
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
		let worldMap=new MapWorldMap()
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
			let shapeMap = shape.worldmap.clone().remap(pieceID)
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
