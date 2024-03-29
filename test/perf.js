class testSparseArray {
    type="sparse"
    container
    constructor() {
        this.container = []
    }
    add(idx, val) {
        this.container[idx + indexOffset]=val
    }
    has(index) {
        return (this.container[index + indexOffset] >=0)
    }
    hasNot(index) {
        return (this.container[index + indexOffset] >=0)
    }
    iterate() {
        for (let i in this.container) {
            if (i<indexOffset) throw("impossible iterate()")
        }
    }
    delete(idx) {
        delete this.container[idx + indexOffset]
    }
}

class testArray {
    type="array"
    container
    constructor() {
        this.container = []
    }
    add(idx, val) {
        this.container[idx]=val
    }
    has(val) {
//        return this.container.includes(val)
        return (this.container.indexOf(val) != -1)
    }
    hasNot(val) {
        return this.container.includes(val)
    }
    iterate() {
        this.container.forEach((v,i) => {if (i<0) throw("impossible")})   
    }
    iterate2() {
        for (let i in this.container) {
            if (i<0) throw("impossible iterate()")
        }
    }
    deleteFirst(idx) {
        return this.container.pop()
    }
    deleteLast(idx) {
        return this.container.splice(1,1)
    }
}

class testObject {
    type="object"
    container
    constructor() {
        this.container = {}
    }
    add(idx,val) {
        this.container[idx]=val
    }
    has(val) {
        return this.container[val]
    }
    hasNot(idx) {
        return this.container[idx]
    }
    iterate() {
        for ( let [idx, val] of Object.entries(this.container) ) {if(idx == "impossible") throw("impossible")}
    }
    delete(idx) {
        delete this.container[idx]
    }
}

class testSet {
    type="set"
    container
    constructor() {
        this.container = new Set()
    }
    add(idx, val) {
        this.container.add(val)
    }
    has(val) {
        return this.container.has(val)
    }
    hasNot(idx) {
        return this.container.has(idx)
    }
    iterate() {
        this.container.forEach(v => {if (v=="impossible") throw("impossible")})   
    }
    deleteFirst(idx) {
        return this.container.delete(idx)
    }
    deleteLast(idx) {
        return this.container.delete(idx)
    }
    get(idx) { return true }
}

class testMap {
    type="map"
    container
    constructor() {
        this.container = new Map()
    }
    add(idx,val) {
        this.container.set(idx,val)
    }
    has(val) {
        return this.container.has(val)
    }
    hasNot(idx) {
        return this.container.has(idx)
    }
    iterate() {
        for ( let [hash, val] of this.container.entries()) {if(val == "impossible") throw("impossible")}
    }
    iterate2() {
        this.container.forEach((val, hash) => {if(val == "impossible") throw("impossible")})
    }
    delete(idx) {
        return this.container.delete(idx)
    }
    get(idx) { return this.container.get(idx) }
}



let a = new testArray()
let s = new testSet()
let m = new testMap()
let o = new testObject()
let sa = new testSparseArray()

let containers = [m, s]
//let containers = [sa, a, s, m, o]

const mapLength=100
const indexOffset=4000000
const runLength=100000

console.profile()
for (let idx=mapLength; idx >=0; idx--) {
    for (let c of containers) {
        c.add(idx,idx)
    }
}

for (let c of containers) {
    for (let run=0;run<runLength;run++) {
        for (let idx=mapLength; idx >=1; idx--) {
            if (!c.has(idx)) throw(c.type + ".has(" +idx+ ") returned false")
            if (c.hasNot(-1*idx)) throw(c.type + ".hasNot(" +idx+ ") returned true")
            c.get(-1*idx)
        }
//        c.iterate()
    }
}

for (let idx=mapLength; idx >=1; idx--) {
    for (let c of containers) {
//        c.delete(idx)
    }
}

console.profileEnd()
