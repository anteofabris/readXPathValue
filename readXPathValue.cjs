const fs = require('fs');
const path = require('path');
const xpath = require('xpath'),
    dom = require('xmldom').DOMParser,
    xmlSerializer = require('xmldom').XMLSerializer

const readXPathValue = async (filePath, xPath) => {
    const result = []
    // inner function to recursively traverse a given directory
    const innerFunction = async (innerFilePath, xPath) => {
        // two variables: a filePaths array and a currentDirFiles array
        const filePaths = [];
        const currentDirFiles = [];
        // read the directory and separate the filepaths from the files
        const dirData = fs.readdirSync(innerFilePath, { withFileTypes: true })
        dirData.forEach((dirent) => {
            if (dirent.isDirectory()) filePaths.push(dirent.name)
            else currentDirFiles.push(dirent.name)
        });

        const pushCurrentDirFile = async (arr) => {
            // base case returns if empty array
            if (!arr.length) return

            const fileName = arr[0]
            // if it is a .xml file
            if (path.extname(fileName).toLowerCase() === '.xml') {
                // read the file
                const fileData = fs.readFileSync(`${innerFilePath}/${fileName}`, { encoding: 'utf8' });
                const doc = new dom().parseFromString(fileData);
                const match = xpath.select(xPath, doc);
                const matchString = (new xmlSerializer()).serializeToString(match[0]);
                // if the xPath called on that file returns a value
                if (match.length) {
                    // push an object with the file name and the xPath result value to the result array
                    result.push({ "path": `${innerFilePath}/${fileName}`, "value": matchString });
                }
            }

            // shift array and pushCurrentDirFile of array
            arr.shift()
            return await pushCurrentDirFile(arr)
        }

        const traverseFilePaths = async (arr) => {
            // base case returns if empty array
            if (!arr.length) return
            const path = arr[0]
            await innerFunction(`${innerFilePath}/${path}`, xPath)
            arr.shift()
            return await traverseFilePaths(arr)
        }
        await traverseFilePaths(filePaths)
        await pushCurrentDirFile(currentDirFiles)

    }
    // call inner function of filePath to recursively collect results in result array
    await innerFunction(filePath, xPath);
    // return result array
    return result;
};

export default readXPathValue;