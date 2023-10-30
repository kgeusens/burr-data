// init array
function runTest() {
    for (let c=0;c<100;c++) {
        let arr=[]
        let set = new Set()
        for (let i=0;i<20;i++) { 
            set.add(i)
        }
    }
}


console.profile()
    runTest()
console.profileEnd()
