const fs = require("fs");


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

// function _addQuotationsToEntriesIfNeeded(newLine, separatorString) {
//     splitNL = newLine.split(separatorString);
//     for (let i = 0; i < splitNL.length; i++) {
//         let firstLetter = splitNL[i].slice(0, 1);
//         let lastLetter = splitNL[i].slice(splitNL[i].length - 1);
//         if (firstLetter !== '"') {
//             splitNL[i] = "\"" + splitNL[i];
//         }
//         if (lastLetter !== '"') {
//             splitNL[i] = splitNL[i] + "\"";
//         }
//     }
//     return splitNL.join(separatorString);
// }

function tokenMaker(intSize) {
    let token = "";
    let specialString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < intSize; i++) {
        token += specialString[Math.floor(Math.random() * specialString.length)];
    }
    console.log(token);
    return token;
}

// function _processLine(line) {
//     let replacer = tokenMaker(8);
//     while (line.indexOf(replacer) !== -1) {
//         replacer = tokenMaker(8);
//     }
//     line = _replaceRealCommasWithString(line, replacer);
//     //console.log(line);
//     line = _addQuotationsToEntriesIfNeeded(line, replacer);
//     line = line.split(replacer).join(",");
//     return line;
// }

// function quoteAllCSVCells(str) {
//     str = str.trim();
//     lines = str.split("\n");
//     for (let i = 0; i < lines.length; i++) {
//         lines[i] = _processLine(lines[i]);
//     }
//     str = lines.join("\n");
//     return str;
// }

function CSVToArrayOfArrays(CSVString) {
    let myArray = []; //initialization
    CSVString = CSVString.trim();
    lines = CSVString.split("\n"); //split lines
    let token = tokenMaker(16);
    //find a string that is not present in CSV for using as temporary tag
    while (CSVString.indexOf(token) !== -1) {
        token = tokenMaker(16);
    }
    for (let i = 0; i < lines.length; i++) {
        //an array of cells from row in csv line
        //it contains the quotes and is formatted with double quotes
        let rowArray = _replaceRealCommasWithString(lines[i], token).split(token); 
        for (let j=0;j<rowArray.length;j++){
            
            //remove outer quotes if present
            if (rowArray[j][rowArray[j].length-1]==='"'){
                rowArray[j]=rowArray[j].slice(0,rowArray[j].length-1);
            }
            if (rowArray[j][0]==='"'){
                rowArray[j]=rowArray[j].slice(1,rowArray[j].length);
            }
            //replace double inner quotes with singles
            rowArray[j]=rowArray[j].split('""').join('"');
        }
        myArray.push(rowArray);
    }
    return myArray;
}


function arrayOfArraysToCSV(arrayOfArrays){
    let CSVString="";
    //go through each 'line'
    for (let i=0;i<arrayOfArrays.length;i++){
        //go through each csv cell and build line
        for (let j=0;j<arrayOfArrays[i].length;j++){
            CSVString+='"';
            CSVString+=arrayOfArrays[i][j].split('"').join('""');
            CSVString+='",'
        }
        CSVString=CSVString.slice(0,-1) + '\n'; //takes off last comma and adds new line
    }
    CSVString=CSVString.slice(0,-1); //takes off last \n character
    return CSVString;
}

function jsonToArrayOfArrays(jsonObject, includeHeaders=true){
    let headers=jsonObject["headers"];
    let data=jsonObject["data"];
    let arrayOfArrays=[];
    if (includeHeaders===true){
        let row=[];
        for (let i=0;i<headers.length;i++){
            row.push(headers[i]);
        }
        arrayOfArrays.push(row);
    }
    for (i=0;i<data.length;i++){
        let row=[];
        for (let j=0;j<headers.length;j++){
            row.push(data[i][headers[j]]);
        }
        arrayOfArrays.push(row);
    }
    return(arrayOfArrays);
}



// function arrayOfArraysToCSVString(myArray) {
//     let str = "";
//     for (let i = 0; i < myArray.length; i++) {
//         for (let j = 0; j < myArray[i].length; j++) {
//             if (myArray[i][j][0]!=='"'){
//                 myArray[i][j]='"'+myArray[i][j]+'"';
//             }
//             str = str += myArray[i][j] + ",";
//         }
//         str = str.slice(0, -1);
//         str = str + "\n";
//     }
//     str = str.slice(0, -1);
//     return str;
// }

function arrayOfArraysToJSONFormat(arrayOfArrays, usingHeaders = true) {
    let headers = [];
    let data = [];
    let table={};
    if (usingHeaders === true) {                                //read in headers
        for (let i = 0; i < arrayOfArrays[0].length; i++) {
            let header = arrayOfArrays[0][i];
            let index = 0;
            while (headers.includes(header)) {                  //prevents duplicates
                console.log("WARNING - Duplicate header found: "+header);
                index += 1;
                header = header + index.toString();
                console.log("Attempting rename to: "+header);
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

// function formattedJSONToCSV(jsonObject){
//     let headers=jsonObject["headers"];
//     let data=jsonObject["data"];
//     let str="";
//     for (let i=0;i<headers.length;i++){
//         str+=headers[i]+",";
//     }
//     str=str.slice(0,-1)+"\n";
//     for (let j=0;j<data.length;j++){
//         for (let i=0;i<headers.length;i++){
//             str+=data[j][headers[i]]+",";
//         }   
//         str=str.slice(0,-1)+"\n";
//     }
//     return str;
// }


let contents = fs.readFileSync("test.csv", "utf8");
//console.log(contents);
let arrayOfArrays=CSVToArrayOfArrays(contents);
console.log(arrayOfArrays);

let rebuildCSV= arrayOfArraysToCSV(arrayOfArrays);
// console.log("original\n-------");
// console.log(contents);
// console.log("rebuild\n-------");
// console.log(rebuildCSV);

//console.log(CSVToArrayOfArrays(rebuildCSV));
//console.log(CSVToArrayOfArrays(contents));

let JSONRepresentation=arrayOfArraysToJSONFormat(arrayOfArrays, true);
//console.log(JSONRepresentation["data"]);
//console.log(JSONRepresentation["data"][0][JSONRepresentation["headers"][2]]);


let newArrayOfArrays=jsonToArrayOfArrays(JSONRepresentation, false);
console.log(arrayOfArrays);
console.log(newArrayOfArrays);


