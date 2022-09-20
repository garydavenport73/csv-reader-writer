const fs = require("fs");
/////////////////////////////////////////////////////////////////////////////////////
//
// FUNCTION NAME                                       INPUT                                           OUTPUT                         
// csvToArrays(csvString)                              csv                                             array of arrays                                 
// arraysToCSV(arrayOfArrays)                          array of arrays                                 csv                                             
// arraysToJSON(arrays, usingHeaders)                  array of arrays                                 JSON {["headers"]=[],["data"]=[{},{},{}...]}  
// JSONToArrays(jsonObject, includeHeaders)            JSON {["headers"]=[],["data"]=[{},{},{}...]}    array of arrays
// unorderdJSONToArrays(jsonObject,includeHeaders)     JSON [{"key":"value"},{k:v},...]                array of arrays

// Composite Functions:
// csvToJSON(csvString, usingHeaders)                  csv                                             JSON {["headers"]=[],["data"]=[{},{},{}...]}                                            
// JSONToCSV(jsonObject, includeHeaders)               JSON {["headers"]=[],["data"]=[{},{},{}...]}    csv
// unorderedJSONToCSV(jsonObject, includeHeaders)      JSON [{"key":"value"},{k:v},...]                csv
//////////////////////////////////////////////////////////////////////////////////////

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

function _replaceRealCommasWithStringInEntireContents(contents, commaReplacement, newlineReplacment) {
    let newContents = "";
    let inside = -1;
    for (let i = 0; i < contents.length; i++) {
        let thisChar = contents.charAt(i);
        if (thisChar === '"') {
            inside = inside * -1;
            newContents += thisChar;
        }
        else if (thisChar === ",") {
            if (inside === -1) {//comma is outside of quotes, replace
                newContents += commaReplacement;
            }
            else {//comma is inside of quotes, don't replace
                newContents += thisChar;
            }
        }
        else if (thisChar === "\n") {
            if (inside === -1) {//\n is outside of quotes, replace
                newContents += newlineReplacment;
            }
            else {//comma is inside of quotes, don't replace
                newContents += thisChar;
            }
        }
        else
        {
            newContents += thisChar;
        }
    }
    return (newContents);
}


function tokenMaker(intSize) {
    let token = "";
    let specialString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < intSize; i++) {
        token += specialString[Math.floor(Math.random() * specialString.length)];
    }
    //console.log(token);
    return token;
}

function csvToArraysFirstVersion(CSVString) {
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
        for (let j = 0; j < rowArray.length; j++) {

            //remove outer quotes if present
            if (rowArray[j][rowArray[j].length - 1] === '"') {
                rowArray[j] = rowArray[j].slice(0, rowArray[j].length - 1);
            }
            if (rowArray[j][0] === '"') {
                rowArray[j] = rowArray[j].slice(1, rowArray[j].length);
            }
            //replace double inner quotes with singles
            rowArray[j] = rowArray[j].split('""').join('"');
        }
        myArray.push(rowArray);
    }
    return myArray;
}

function csvToArrays(CSVString) {
    let myArray = []; //initialization
    CSVString = CSVString.trim();
    
    //lines = CSVString.split("\n"); //split lines
    let commaToken = tokenMaker(16);
    //find a string that is not present in CSV for using as temporary tag
    while (CSVString.indexOf(commaToken) !== -1) {
        commaToken = tokenMaker(16);
    }

    let newlineToken = tokenMaker(16);
    //find a string that is not present in CSV for using as temporary tag
    while (CSVString.indexOf(newlineToken) !== -1) {
        newlineToken = tokenMaker(16);
    }

    CSVString=_replaceRealCommasWithStringInEntireContents(CSVString,commaToken,newlineToken);

    let lines =CSVString.split(newlineToken);

    for (let i = 0; i < lines.length; i++) {
        //an array of cells from row in csv line
        //it contains the quotes and is formatted with double quotes
        let rowArray = lines[i].split(commaToken);
        for (let j = 0; j < rowArray.length; j++) {

            //remove outer quotes if present
            if (rowArray[j][rowArray[j].length - 1] === '"') {
                rowArray[j] = rowArray[j].slice(0, rowArray[j].length - 1);
            }
            if (rowArray[j][0] === '"') {
                rowArray[j] = rowArray[j].slice(1, rowArray[j].length);
            }
            //replace double inner quotes with singles
            rowArray[j] = rowArray[j].split('""').join('"');
        }
        myArray.push(rowArray);
    }
    return myArray;
}

function arraysToCSV(arrayOfArrays) {
    let CSVString = "";
    //go through each 'line'
    for (let i = 0; i < arrayOfArrays.length; i++) {
        //go through each csv cell and build line
        for (let j = 0; j < arrayOfArrays[i].length; j++) {
            CSVString += '"';
            CSVString += arrayOfArrays[i][j].split('"').join('""');
            CSVString += '",'
        }
        CSVString = CSVString.slice(0, -1) + '\n'; //takes off last comma and adds new line
    }
    CSVString = CSVString.slice(0, -1); //takes off last \n character
    return CSVString;
}

function arraysToJSON(arrayOfArrays, usingHeaders = true) {
    let headers = [];
    let data = [];
    let table = {};
    if (usingHeaders === true) {                                //read in headers
        for (let i = 0; i < arrayOfArrays[0].length; i++) {
            let header = arrayOfArrays[0][i];
            let index = 0;
            while (headers.includes(header)) {                  //prevents duplicates
                console.log("WARNING - Duplicate header found: " + header);
                index += 1;
                header = header + index.toString();
                console.log("Attempting rename to: " + header);
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
        let tempRow = {};
        for (let j = 0; j < headers.length; j++) {
            tempRow[headers[j]] = arrayOfArrays[i][j];
        }
        // console.log(tempRow);
        data.push(tempRow);
    }
    table["headers"] = headers;
    table["data"] = data;
    // console.log(JSON.stringify(table))
    return (table);
}

function JSONToArrays(jsonObject, includeHeaders = true) {
    let headers = jsonObject["headers"];
    let data = jsonObject["data"];
    let arrayOfArrays = [];
    if (includeHeaders === true) {
        let row = [];
        for (let i = 0; i < headers.length; i++) {
            row.push(headers[i].toString());
        }
        arrayOfArrays.push(row);
    }
    for (i = 0; i < data.length; i++) {
        let row = [];
        for (let j = 0; j < headers.length; j++) {
            if (data[i][headers[j]] === undefined) {
                row.push("");
            }
            else {
                row.push(data[i][headers[j]].toString());
            }
        }
        arrayOfArrays.push(row);
    }
    return (arrayOfArrays);
}

function unorderedJSONToArrays(jsonObject, includeHeaders = true) {
    //takes an array of objects [{},{},{}] where objects have key/value pairs
    let newObject = {};
    newObject["data"] = jsonObject;
    let headers = [];
    for (rowObject of jsonObject) { //rows of objects
        for (const key in rowObject) {
            if (!headers.includes(key)) {
                headers.push(key.toString());
            };
        }
    }
    newObject["headers"] = headers;
    return JSONToArrays(newObject, includeHeaders);
}

//COMPOSITE FUNCTIONS
function csvToJSON(csvString, usingHeaders = true) {
    let arrays = csvToArrays(csvString);
    let jsonObject = arraysToJSON(arrays, usingHeaders);
    return jsonObject;
}

function JSONToCSV(jsonObject, includeHeaders = true) {
    let arrays = JSONToArrays(jsonObject, includeHeaders);
    let csvString = arraysToCSV(arrays);
    return csvString;
}

function unorderedJSONToCSV(jsonObject, includeHeaders = true) {
    let arrays = unorderedJSONToArrays(jsonObject, includeHeaders);
    let csvString = arraysToCSV(arrays);
    return csvString;
}

let contents = fs.readFileSync("test.csv", "utf8");//csv

let myObject = [{ "age": 17, "name": "Jen", "color": "black" }, { "name": "Jenny", "age": 21 }, { "age": 23, "name": "Jess", "color": "brown" }];

let myArray=[ [ 'Age', 'Sex', 'Name', 'Name' ],
[ '49', 'Male', 'Gary', 'Davenport' ],
[ '50', 'Female', 'Amelia', 'McPeak' ],
[ '19', 'Male', 'Harrison', 'Davenport' ] ];

let myJSON={ "headers": [ "Age", "Sex", "Name", "Name1" ],
  data:
   [ { "Age": "49", "Sex": "Male", "Name": "Gary", "Name1": "Davenport" },
     { "Age": "50", "Sex": "Female", "Name": "Amelia", "Name1": "McPeak" },
     { "Age": "19", "Sex": "Male", "Name": "Harrison", "Name1": "Davenport" } ] }

// csvToArrays(csvString)                              csv                                             array of arrays                                 
// arraysToCSV(arrayOfArrays)                          array of arrays                                 csv                                             
// arraysToJSON(arrays, usingHeaders)                  array of arrays                                 JSON {["headers"]=[],["data"]=[{},{},{}...]}  
// JSONToArrays(jsonObject, includeHeaders)            JSON {["headers"]=[],["data"]=[{},{},{}...]}    array of arrays
// unorderdJSONToArrays(jsonObject,includeHeaders)     JSON [{"key":"value"},{k:v},...]                array of arrays
console.log("csvToArrays");
console.log("--------------");
console.log(csvToArrays(contents));
console.log(" ")
console.log("arraysToCSV");
console.log("--------------");
console.log(arraysToCSV(myArray));
console.log(" ");
console.log("arraysToJSON");
console.log("--------------");
console.log(arraysToJSON(myArray));
console.log(" ");
console.log("JSONToArrays");
console.log("--------------");
console.log(JSONToArrays(myJSON));
console.log(" ");
console.log("unorderedJSONToArrays");
console.log("--------------");
console.log(unorderedJSONToArrays(myObject));
console.log(" ");

// Composite Functions:
// csvToJSON(csvString, usingHeaders)                  csv                                             JSON {["headers"]=[],["data"]=[{},{},{}...]}                                            
// JSONToCSV(jsonObject, includeHeaders)               JSON {["headers"]=[],["data"]=[{},{},{}...]}    csv
// unorderedJSONToCSV(jsonObject, includeHeaders)      JSON [{"key":"value"},{k:v},...]                csv

console.log("csvToJSON using headers true");
console.log("--------------");
console.log(csvToJSON(contents));
console.log(" ");

console.log("csvToJSON using headers false");
console.log("--------------");
console.log(csvToJSON(contents,false));
console.log(" ");

console.log("JSON to CSV include headers true");
console.log("--------------");
console.log(JSONToCSV(myJSON));
console.log(" ");

console.log("JSON to CSV include headers false");
console.log("--------------");
console.log(JSONToCSV(myJSON,false));
console.log(" ");

console.log("unordered JSON to CSV include headers true");
console.log("--------------");
console.log(unorderedJSONToCSV(myObject));
console.log(" ");

console.log("unordered JSON to CSV include headers false");
console.log("--------------");
console.log(unorderedJSONToCSV(myObject,false));
console.log(" ");