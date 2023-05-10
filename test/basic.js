function Board(x,y,z,hex) {
    const longCount=y-2; 
    const longLength=x-2;
    const longRE=RegExp(".{" + longLength + "}","g")
    const shortCount=2;
    const shortLength=x-4;
    const shortRE=RegExp(".{" + shortLength + "}","g")
    const prefixLength=x*y*z - longCount*longLength - shortCount*shortLength
    const i1=prefixLength; 
    const i2=i1+shortLength*shortCount;
    const i3=i2+longCount*longLength

    const binString=BigInt(hex).toString(2).padStart(x*y*z,"0")
    console.log(binString)

    const prefixString=binString.substring(0,i1);
    const shortString=binString.substring(i1,i2);
    const longString=binString.substring(i2,i3)

    const lpa=prefixString.substring(0,2*y*z).match(/.{2}/g)
    const spa=prefixString.substring(2*y*z).match(/.{2}/g)
    const ssa=shortString.match(shortRE)
    const lsa=longString.match(longRE)

    var almostRows=[]
    for (let i in ssa) { 
        almostRows.push(spa[i][0]+ssa[i]+spa[i][1]) 
    }
    almostRows.push(...lsa)
    var rows=[]
    for (let j=0;j<z;j++) {
        for (let i=y-1;i>=0;i--) {
            rows.push(lpa[j*y+i][0]+almostRows[j*y+i]+lpa[j*y+i][1])
        }
    }
    return rows.slice(-2,-1).concat(rows.slice(0,-2),rows.slice(-1)).join('').replaceAll('0','#').replaceAll('1','_')
}

Board(5,4,1,"0319")