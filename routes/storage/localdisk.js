const fs = require('fs');
const {STORAGE_PATH} = require('../constants');

class LocalDisk {
    static writeFileSync(namespace, file_name, content ) {
        const filePath = `${STORAGE_PATH}${namespace}/`;   
        const fileName = `${STORAGE_PATH}${namespace}/${file_name}`;   

        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });    
        }
        fs.writeFileSync(fileName, content);
    }

    static readFileSync(namespace, file_name) {
        const filePath = `${STORAGE_PATH}${namespace}/`;
        const fileName = `${STORAGE_PATH}${namespace}/${file_name}`;
        if (!fs.existsSync(filePath)) {
            return null;
        }
        return fs.readFileSync(fileName);
    }
}

module.exports = { LocalDisk };
