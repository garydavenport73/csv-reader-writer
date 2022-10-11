////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                                                                //
// FUNCTION NAME                                       				INPUT                                           OUTPUT                                        //
// csvToArrays(csvString)                              				csv                                             array of arrays                               //
// arraysToCSV(arrayOfArrays,newLineString="\n")       				array of arrays, "\n" or "\r\n"                 csv                                           //
// arraysToJSON(arrays, usingHeaders)                  				array of arrays                                 JSON {["headers"]=[],["data"]=[{},{},{}...]}  //
// JSONToArrays(jsonObject, includeHeaders)            				JSON {["headers"]=[],["data"]=[{},{},{}...]}    array of arrays                               //
// unorderdJSONToArrays(jsonObject,includeHeaders)     				JSON [{"key":"value"},{k:v},...]                array of arrays                               //
//                                                                                                                                                                //
// COMPOSITE FUNCTIONS:                                                                                                                                           //
// csvToJSON(csvString, usingHeaders)                  				csv                                             JSON {["headers"]=[],["data"]=[{},{},{}...]}  //                                        
// JSONToCSV(jsonObject, includeHeaders=true,newLineString="\n")	JSON {["headers"]=[],["data"]=[{},{},{}...]}    csv                                           //
// unorderedJSONToCSV(jsonObject, includeHeaders)      				JSON [{"key":"value"},{k:v},...]                csv                                           //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function _replaceRealCommasAndRealNewlinesInCSV(contents, commaReplacement, newlineReplacement) {
	//temp fix
	contents=contents.split("\r\n").join("\n");
	//temp fix
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
                newContents += newlineReplacement;
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
    //new added this will replace the "\r\n" with "\n", some programs
    //use the \r\n (ms outlook for example) instead of \n
    //newContents=JSON.stringify(newContents);
    //newContents.split("\"\r"+newlineReplacement).join(newlineReplacement);
    //newContents=JSON.parse(newContents);
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

    CSVString=_replaceRealCommasAndRealNewlinesInCSV(CSVString,commaToken,newlineToken);

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

function arraysToCSV(arrayOfArrays, newLineString="\n") {
    let CSVString = "";
    //go through each 'line'
    for (let i = 0; i < arrayOfArrays.length; i++) {
        //go through each csv cell and build line
        for (let j = 0; j < arrayOfArrays[i].length; j++) {
            CSVString += '"';
            CSVString += arrayOfArrays[i][j].split('"').join('""');
            CSVString += '",'
        }
        CSVString = CSVString.slice(0, -1) + newLineString; //takes off last comma and adds new line
    }
    CSVString = CSVString.slice(0, -(newLineString.length)); //takes off last \n character
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

function JSONToCSV(jsonObject, includeHeaders = true, newLineString="\n") {
    let arrays = JSONToArrays(jsonObject, includeHeaders);
    let csvString = arraysToCSV(arrays, newLineString);
    return csvString;
}

function unorderedJSONToCSV(jsonObject, includeHeaders = true) {
    let arrays = unorderedJSONToArrays(jsonObject, includeHeaders);
    let csvString = arraysToCSV(arrays);
    return csvString;
}
