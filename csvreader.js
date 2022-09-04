const fs = require("fs");
let contents = fs.readFileSync("test.csv", "utf8");

function _replaceRealCommasWithString(line, replacementString) {
    let newLine = "";
    let inside = -1;
    for (let i = 0; i < line.length; i++) {
        let thisChar = line.charAt(i);
        if (thisChar === '"') {
            inside = inside * -1;
            newLine += thisChar;
        }
        else if (thisChar === ",") {
            if (inside === -1) {//comma is outside of quotes, replace
                newLine += replacementString;
            }
            else {//comma is inside of quotes, don't replace
                newLine += thisChar;
            }
        }
        else {
            newLine += thisChar;
        }
    }
    return (newLine);
}

function _addQuotationsToEntriesIfNeeded(newLine, separatorString) {
    splitNL = newLine.split(separatorString);
    for (let i = 0; i < splitNL.length; i++) {
        let firstLetter = splitNL[i].slice(0, 1);
        let lastLetter = splitNL[i].slice(splitNL[i].length - 1);
        if (firstLetter !== '"') {
            splitNL[i] = "\"" + splitNL[i];
        }
        if (lastLetter !== '"') {
            splitNL[i] = splitNL[i] + "\"";
        }
    }
    return splitNL.join(separatorString);
}

function tokenMaker(intSize) {
    let token = "";
    let specialString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < intSize; i++) {
        token += specialString[Math.floor(Math.random() * specialString.length)];
    }
    console.log(token);
    return token;
}

function _processLine(line) {
    let replacer = tokenMaker(8);
    while (line.indexOf(replacer) !== -1) {
        replacer = tokenMaker(8);
    }
    line = _replaceRealCommasWithString(line, replacer);
    //console.log(line);
    line = _addQuotationsToEntriesIfNeeded(line, replacer);
    line = line.split(replacer).join(",");
    return line;
}

function quoteAllCSVCells(str) {
    str = str.trim();
    lines = str.split("\n");
    for (let i = 0; i < lines.length; i++) {
        lines[i] = _processLine(lines[i]);
    }
    str = lines.join("\n");
    return str;
}

function CSVToArrayOfArrays(CSVString) {
    let myArray = [];
    CSVString = CSVString.trim();
    lines = CSVString.split("\n");
    let token = tokenMaker(16);
    while (CSVString.indexOf(token) !== -1) {
        token = tokenMaker(16);
    }
    for (let i = 0; i < lines.length; i++) {
        let row = _replaceRealCommasWithString(lines[i], token).split(token);
        myArray.push(row);
    }
    return myArray;
}

function arrayOfArraysToCSVString(myArray) {
    let str = "";
    for (let i = 0; i < myArray.length; i++) {
        for (let j = 0; j < myArray[i].length; j++) {
            str = str += myArray[i][j] + ",";
        }
        str = str.slice(0, -1);
        str = str + "\n";
    }
    str = str.slice(0, -1);
    return str;
}

function arrayOfArraysToJSON(arrayOfArrays, usingHeaders = true) {
    let headers = [];
    let data = [];
    let table={};
    if (usingHeaders === true) {                                //read in headers
        for (let i = 0; i < arrayOfArrays[0].length; i++) {
            let header = arrayOfArrays[0][i];
            let index = 0;
            while (headers.includes(header)) {                  //prevents duplicates
                index += 1;
                header = header + index.toString();
            }
            headers.push(header);
        }
    } else {
        for (let i = 0; i < arrayOfArrays[0].length; i++) {     //make headers
            headers.push("header" + i.toString());
        }
    }
    if (usingHeaders === true) {
        startRow = 1;
    }
    else {
        startRow = 0;
    }
    for (let i = startRow; i < arrayOfArrays.length; i++) {//go throught every line
        let tempRow={};
        for (let j=0;j<headers.length;j++){
            tempRow[headers[j]]=arrayOfArrays[i][j];
        }
        // console.log(tempRow);
        data.push(tempRow);
    }
    table["headers"]=headers;
    table["data"]=data;
    // console.log(JSON.stringify(table))
    return(table);
}


let newText = quoteAllCSVCells(contents);
console.log(contents);
console.log(newText);
let thisArray = CSVToArrayOfArrays(newText);
console.log(thisArray);


let newCSV = arrayOfArraysToCSVString(thisArray);
console.log(newCSV);

fs.writeFileSync("testresult.csv", newText, "utf8");

fs.writeFileSync("testresult2.csv", newCSV, "utf8");

console.log("whole thing");
console.log("---------------------");
console.log(arrayOfArraysToJSON(thisArray,false));
console.log("just data");
console.log("---------------------");
console.log(arrayOfArraysToJSON(thisArray,false)["data"]);
