const fs = require('fs');
const process = require('process');
let filename = process.argv[2];

function keepOnlyASCIICharacters(input) {
    // Regular expression to match non-ASCII characters
    const nonASCIIRegex = /[^\x00-\x7F]/g;

    // Replace non-ASCII characters with an empty string
    return input.replace(nonASCIIRegex, '');
}

function keepOnlyExtendedAscii(inputString) {
    let result = '';
    for (let i = 0; i < inputString.length; i++) {
        let charCode = inputString.charCodeAt(i);
        // Check if the character code is within the extended ASCII range
        if (charCode >= 0 && charCode <= 255) {
            result += inputString[i];
        }
    }
    return result;
}

function keepPrintableAscii(input) {
    let result = '';
    // Loop through each character in the input string
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);

        // Check if the character is printable ASCII (32-126)
        if (charCode >= 32 && charCode <= 126) {
            result += input[i]; // Append the character to the result
        }
    }

    return result; // Return the filtered string
}

function keepPrintableExtendedAscii(input) {
    let result = '';

    // Loop through each character in the input string
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);

        // Check if the character is printable ASCII (32-126), printable extended ASCII (160-255))
        if ((charCode >= 32 && charCode <= 126) || (charCode >= 160 && charCode <= 255)) {
            result += input[i]; // Append the character to the result
        }
    }

    return result; // Return the filtered string
}

function keepPrintableAsciiWithNewLine(input) {
    let result = '';

    // Loop through each character in the input string
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);

        // Check if the character is printable ASCII (32-126) or a newline (10)
        if ((charCode >= 32 && charCode <= 126) || charCode === 10) {
            result += input[i]; // Append the character to the result
        }
    }

    return result; // Return the filtered string
}

function keepPrintableExtendedAsciiWithNewLine(input) {
    let result = '';

    // Loop through each character in the input string
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);

        // Check if the character is printable ASCII (32-126), printable extended ASCII (160-255), or a newline (10)
        if ((charCode >= 32 && charCode <= 126) || (charCode >= 160 && charCode <= 255) || charCode === 10) {
            result += input[i]; // Append the character to the result
        }
    }

    return result; // Return the filtered string
}

function _shouldConvertToNumber(value) {
    // Check if the value is only whitespace
    if (value.trim() === '') {
        return false; // Return false for whitespace
    }
    // Check if the value can be converted to a number
    return !isNaN(Number(value)); // Return true if it's a number, false otherwise
}

function convertColumnsToNumbers(input, usingHeaders = true) {
    // Check if the input is valid
    if (!Array.isArray(input) || input.length === 0) {
        return input; // Return as is if not valid
    }

    let startRow;
    let header;
    let numColumns;
    let result;

    // Determine the starting row and header based on usingHeaders
    if (usingHeaders) {
        startRow = 1;
        header = input[0];
        numColumns = header.length;
        result = [header]; // Start with the header row
    } else {
        startRow = 0;
        numColumns = input[0].length;
        result = []; // No header row
    }

    // Iterate through each column
    for (let col = 0; col < numColumns; col++) {
        let allNumeric = true; // Flag to check if all values are numeric

        // First loop: Check if all values in the column are numeric
        for (let row = startRow; row < input.length; row++) {
            const value = input[row][col];
            if (!_shouldConvertToNumber(value)) {
                allNumeric = false; // Set flag to false if any value is not numeric
                break; // Exit the loop early if a non-numeric value is found
            }
        }

        // Second loop: Replace values based on the allNumeric flag
        for (let row = startRow; row < input.length; row++) {
            result[row] = result[row] || []; // Ensure the row exists
            const value = input[row][col];
            if (allNumeric) {
                result[row][col] = Number(value); // Convert to number
            } else {
                result[row][col] = value; // Keep original string
            }
        }
    }

    return result;
}

function replaceWhitespaceWithNull(data, usingHeaders) {
    // Create a new array to hold the modified data
    let newData = [];

    // Check if usingHeaders is true and add the first row to newData
    if (usingHeaders && data.length > 0) {
        newData.push(data[0]); // Add the headers without processing
    }

    // Iterate through the outer array (rows), starting from the second row if usingHeaders is true
    for (let i = usingHeaders ? 1 : 0; i < data.length; i++) {
        // Create a new row for the modified data
        let newRow = [];

        // Iterate through the inner array (cells)
        for (let j = 0; j < data[i].length; j++) {
            // Check if the cell contains only whitespace
            if (data[i][j].trim() === "") {
                // Replace with the string "null"
                newRow.push("null");
            } else {
                // Otherwise, keep the original value
                newRow.push(data[i][j]);
            }
        }

        // Add the modified row to the new data array
        newData.push(newRow);
    }

    // Return the new array
    return newData;
}

// Function to determine the maximum column count
function getMaxColumnCount(rows) {
    let maxCount = 0;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length > maxCount) {
            maxCount = row.length;
        }
    }
    return maxCount;
}

function validateCSV(text) {
    const existingTokens = [];

    // Step 1: Determine the correct line terminator
    const lineTerminator = determineLineTerminator(text);

    // Step 2: Generate a token for the delimiter
    const delimiterToken = tokenMaker(text, existingTokens, 16);

    // Step 3: Generate a token for line terminators
    const lineTerminatorToken = tokenMaker(text, existingTokens, 16);

    // Step 4: Replace line terminators not in quotes with the lineTerminator token
    text = replaceUnquotedLineTerminators(text, lineTerminatorToken);

    // Step 5: Split the modified text by the line terminator token to get the lines
    const lines = text.split(lineTerminatorToken);

    // Step 6: Replace commas not in quotes with the delimiter token
    for (let i = 0; i < lines.length; i++) {
        lines[i] = replaceUnquotedCommas(lines[i], delimiterToken); // Modify the line directly
    }

    // Step 7: Check if there are more than one column
    const hasMoreThanOneColumn = moreThanOneColumn(lines, delimiterToken);

    // Step 8: Filter out blank lines if there are multiple columns
    for (let i = lines.length - 1; i >= 0; i--) {
        // If there are multiple columns, skip blank lines without commas
        if (hasMoreThanOneColumn && lines[i].trim() === "") {
            lines.splice(i, 1); // Remove the blank line
        }
    }

    // Step 9: Split the modified lines by the delimiter token
    const rows = []; // Renamed from parsedRows to rows
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const row = line.split(delimiterToken); // Use split on the modified line
        rows.push(row);
    }

    // Step 10: Get the maximum column count
    const maxColumnCount = getMaxColumnCount(rows);
    const errors = [];

    // Step 11: Check for rows with incorrect column counts
    for (let i = 0; i < rows.length; i++) {
        const currentColumnCount = rows[i].length;
        if (currentColumnCount !== maxColumnCount) {
            errors.push(`Row ${i + 1} has ${currentColumnCount} columns, expected ${maxColumnCount}.`);
        }
    }

    // Step 12: Check for unbalanced quotes in individual cells
    for (let i = 0; i < rows.length; i++) {
        const currentRow = rows[i];
        for (let j = 0; j < currentRow.length; j++) {
            const cell = currentRow[j];
            const cellQuoteCount = (cell.match(/"/g) || []).length;
            if (cellQuoteCount % 2 !== 0) {
                errors.push(`Row ${i + 1}, Cell ${j + 1} has an unbalanced number of quotes.`);
            }
        }
    }

    // Step 12.5: Check for consistent use of quotes
    // Check for consistent use of quotes (first pass)
    // Check for consistent use of quotes (first pass)
    for (let i = 0; i < rows.length; i++) {
        const currentRow = rows[i];
        for (let j = 0; j < currentRow.length; j++) {
            const cell = currentRow[j];
            const startsWithQuote = cell.startsWith('"');
            const endsWithQuote = cell.endsWith('"');

            // Check for consistent use of quotes (first pass)
            if (startsWithQuote && !endsWithQuote) {
                errors.push(`Row ${i + 1}, Cell ${j + 1} starts with a quote but does not end with one. First character: '${cell.charAt(0)}' (char code: ${cell.charCodeAt(0)}), Last character: '${cell.charAt(cell.length - 1)}' (char code: ${cell.charCodeAt(cell.length - 1)})`);
            }
            if (!startsWithQuote && endsWithQuote) {
                errors.push(`Row ${i + 1}, Cell ${j + 1} ends with a quote but does not start with one. First character: '${cell.charAt(0)}' (char code: ${cell.charCodeAt(0)}), Last character: '${cell.charAt(cell.length - 1)}' (char code: ${cell.charCodeAt(cell.length - 1)})`);
            }
        }
    }
    // Second pass: Check for unescaped quotes
    for (let i = 0; i < rows.length; i++) {
        const currentRow = rows[i];
        for (let j = 0; j < currentRow.length; j++) {
            const cell = currentRow[j];
            let trimmedCell = cell;

            // Remove leading and trailing quotes if they exist
            if (trimmedCell.startsWith('"')) {
                trimmedCell = trimmedCell.slice(1); // Remove leading quote
            }
            if (trimmedCell.endsWith('"')) {
                trimmedCell = trimmedCell.slice(0, -1); // Remove trailing quote
            }

            // Check for unescaped quotes in the trimmed cell (manual check)
            let unescapedQuoteFound = false;
            let previousCharWasQuote = false;

            for (let char of trimmedCell) {
                if (char === '"') {
                    if (!previousCharWasQuote) {
                        unescapedQuoteFound = true; // Found an unescaped quote
                        break;
                    }
                    previousCharWasQuote = true; // Current quote is escaped
                } else {
                    previousCharWasQuote = false; // Reset if current char is not a quote
                }
            }

            if (unescapedQuoteFound) {
                errors.push(`Row ${i + 1}, Cell ${j + 1} contains unescaped quotes.`);
            }
        }
    }

    // Step 13: Return validation results
    if (errors.length > 0) {
        return {
            valid: false,
            errors: errors
        };
    } else {
        return {
            valid: true,
            errors: []
        };
    }
}

function arrayToCSV(data, lineTerminator = '\n') {
    const csvRows = [];

    for (let i = 0; i < data.length; i++) {
        const csvRow = [];

        for (let j = 0; j < data[i].length; j++) {
            const cell = data[i][j];
            let formattedCell;

            if (cell === null) {
                formattedCell = '';
            } else {
                formattedCell = String(cell); // Convert to string
            }

            // Check if the cell needs to be quoted
            if (
                formattedCell.includes(',') ||
                formattedCell.includes('"') ||
                formattedCell.includes('\n') ||
                formattedCell.includes('\r')
            ) {
                // Escape double quotes by replacing " with ""
                formattedCell = formattedCell.replace(/"/g, '""');
                formattedCell = `"${formattedCell}"`; // Enclose in double quotes
            }

            csvRow.push(formattedCell);
        }

        csvRows.push(csvRow.join(',')); // Join cells with commas
    }

    return csvRows.join(lineTerminator); // Join rows with the specified line terminator
}

function tokenMaker(contents, existingTokens, intSize) {
    let specialString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let token = "";
    for (let i = 0; i < intSize; i++) {
        token += specialString[Math.floor(Math.random() * specialString.length)];
    }

    while ((existingTokens.includes(token)) || (contents.includes(token))) {
        token = "";
        for (let i = 0; i < intSize; i++) {
            token += specialString[Math.floor(Math.random() * specialString.length)];
        }
    }

    return token;
}

function isColumnNumeric(data, columnIndex) {
    // Check if the data is valid and the column index is within bounds
    if (!Array.isArray(data) || data.length === 0 || columnIndex < 0) {
        return false;
    }

    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        // Check if the row has enough columns
        if (row.length <= columnIndex) {
            return false; // Column index is out of bounds for this row
        }

        const cellValue = row[columnIndex];

        // Check if the cell value is numeric
        if (cellValue !== '' && isNaN(cellValue)) {
            return false; // Found a non-numeric value
        }
    }

    return true; // All values in the column are numeric
}

function determineLineTerminator(text) {
    const lineTerminators = {
        '\r\n': 0,
        '\n': 0,
        '\r': 0
    };
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // Toggle inQuotes state when encountering a double quote
        if (char === '"') {
            inQuotes = !inQuotes;
        }

        // Check for line terminators only when not in quotes
        if (!inQuotes) {
            if (text.substr(i, 2) === '\r\n') {
                lineTerminators['\r\n']++;
                i++; // Skip the next character since it's part of CRLF
            } else if (char === '\n') {
                lineTerminators['\n']++;
            } else if (char === '\r') {
                lineTerminators['\r']++;
            }
        }
    }

    // Determine which line terminator has the highest count
    let maxCount = 0;
    let detectedTerminator = '\n'; // Default to LF

    for (const [terminator, count] of Object.entries(lineTerminators)) {
        if (count > maxCount) {
            maxCount = count;
            detectedTerminator = terminator;
        }
    }

    return detectedTerminator;
}

function replaceUnquotedLineTerminators(text, lineTerminatorToken) {
    let inQuotes = false;
    let modifiedText = '';
    const lineTerminatorRegex = /\r\n|\n|\r/g; // Regex to match different line terminators

    let lastIndex = 0;
    let match;

    // Iterate through the text to find line terminators
    while ((match = lineTerminatorRegex.exec(text)) !== null) {
        const lineTerminator = match[0];
        const startIndex = match.index;

        // Append the text before the line terminator
        modifiedText += text.slice(lastIndex, startIndex);

        // Check if the line terminator is outside of quotes
        if (!inQuotes) {
            // Replace the line terminator with the token
            modifiedText += lineTerminatorToken;
        } else {
            // Keep the line terminator as is
            modifiedText += lineTerminator;
        }

        // Update the last index
        lastIndex = startIndex + lineTerminator.length;

        // Toggle inQuotes state when encountering double quotes
        for (let i = startIndex; i < lastIndex; i++) {
            if (text[i] === '"') {
                inQuotes = !inQuotes;
            }
        }
    }

    // Append any remaining text after the last line terminator
    modifiedText += text.slice(lastIndex);

    return modifiedText;
}


function replaceUnquotedCommas(line, delimiterToken) {
    let inQuotes = false;
    let modifiedLine = '';

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes; // Toggle inQuotes state
        }

        if (char === ',' && !inQuotes) {
            modifiedLine += delimiterToken; // Replace comma with delimiter token
        } else {
            modifiedLine += char; // Add character to modified line
        }
    }

    return modifiedLine;
}

function moreThanOneColumn(lines, delimiterToken) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(delimiterToken)) { // Check if the line contains the delimiter
            const columnCount = lines[i].split(delimiterToken).length;
            return columnCount > 1; // Return true if there are more than one column
        }
    }
    return false; // Return false if no valid line with columns is found
}

function parseCSV(text) {
    const existingTokens = [];

    // Step 1: Determine the correct line terminator
    const lineTerminator = determineLineTerminator(text);

    // Step 2: Generate a token for the delimiter
    const delimiterToken = tokenMaker(text, existingTokens, 16);

    // Step 3: Generate a token for line terminators
    const lineTerminatorToken = tokenMaker(text, existingTokens, 16);

    // Step 4: Replace line terminators not in quotes with the lineTerminator token
    //const modifiedText = replaceUnquotedLineTerminators(text, lineTerminatorToken);
    text = replaceUnquotedLineTerminators(text, lineTerminatorToken);

    // Step 5: Split the modified text by the line terminator token to get the lines
    // const lines = modifiedText.split(lineTerminatorToken);
    const lines = text.split(lineTerminatorToken);

    // Step 6: Replace commas not in quotes with the delimiter token
    for (let i = 0; i < lines.length; i++) {
        lines[i] = replaceUnquotedCommas(lines[i], delimiterToken); // Modify the line directly
    }

    // Step 7: Check if there are more than one column
    const hasMoreThanOneColumn = moreThanOneColumn(lines, delimiterToken);

    // Step 8: Filter out blank lines if there are multiple columns
    for (let i = lines.length - 1; i >= 0; i--) {
        // If there are multiple columns, skip blank lines without commas
        if (hasMoreThanOneColumn && lines[i].trim() === "") {
            lines.splice(i, 1); // Remove the blank line
        }
    }

    // Step 9: Split the modified lines by the delimiter token
    const rows = []; // Renamed from parsedRows to rows
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const row = line.split(delimiterToken); // Use split on the modified line
        rows.push(row);
    }

    // Step 9.1: Remove non-printable characters outside of quotes
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            let cell = rows[i][j];

            // Find the first and last non-escaped solitary double quotes
            const firstQuoteIndex = cell.search(/(?<!")"(?!")/);
            const lastQuoteIndex = cell.lastIndexOf('"');

            // Only process if there is at least one solitary quote
            if (firstQuoteIndex !== -1 && lastQuoteIndex > firstQuoteIndex) {
                // Remove non-printable characters before the first quote
                const beforeQuotes = keepPrintableExtendedAscii(cell.slice(0, firstQuoteIndex));
                const insideQuotes = cell.slice(firstQuoteIndex, lastQuoteIndex + 1); // Include the last quote
                const afterQuotes = keepPrintableExtendedAscii(cell.slice(lastQuoteIndex + 1));

                // Reconstruct the cell
                cell = beforeQuotes + insideQuotes + afterQuotes;
            }

            // Remove surrounding quotes if they are solitary
            if (cell.startsWith('"') && cell.endsWith('"')) {
                cell = cell.slice(1, -1); // Remove surrounding quotes directly
            }

            rows[i][j] = cell; // Update the cell in the row
        }
    }

    // Step 10: Replace escaped double quotes with a single double quote in each cell of rows
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            rows[i][j] = rows[i][j].replace(/""/g, '"'); // Replace "" with "
        }
    }

    // Step 11: Remove outer quotes from quoted cells directly in rows
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            const cell = rows[i][j];
            if (cell.startsWith('"') && cell.endsWith('"')) {
                rows[i][j] = cell.slice(1, -1); // Remove surrounding quotes directly
            }
        }
    }

    // Return the rows as the result
    return rows;
}
