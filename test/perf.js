
class testArray {
    type="array"
    container
    constructor() {
        this.container = []
    }
    add(idx, val) {
        this.container[idx*3]=val
    }
    has(val) {
//        return this.container.includes(val)
        return (this.container.indexOf(val) != -1)
    }
    hasNot(val) {
        return this.container.includes(val)
    }
    iterate() {
        this.container.forEach(v => {if (v=="impossible") throw("impossible")})   
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
    deleteFirst(idx) {
        delete this.container[idx]
    }
    deleteLast(idx) {
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
        for ( let [idx, val] of this.container.entries()) {if(idx == "impossible") throw("impossible")}
    }
    deleteFirst(idx) {
        return this.container.delete(idx)
    }
    deleteLast(idx) {
        return this.container.delete(idx)
    }
}



let a = new testArray()
let s = new testSet()
let m = new testMap()
let o = new testObject()

let containers = [a, s, m, o]

let runLength=100000

console.profile()
for (let idx=runLength; idx >=0; idx--) {
    for (let c of containers) {
        c.add(idx,idx)
    }
}

for (let c of containers) {
    for (let idx=runLength; idx >=1; idx--) {
//        if (!c.has(idx)) throw(c.type + ".has(" +idx+ ") returned false")
//        if (c.hasNot(-1*idx)) throw(c.type + ".hasNot(" +idx+ ") returned false")
    }
//    c.iterate()
}

for (let idx=runLength; idx >=1; idx--) {
    for (let c of containers) {
//        c.deleteFirst(idx)
        c.deleteLast(runLength - idx + 1)
    }
}


console.profileEnd()
