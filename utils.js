let fs = require('fs')

let Utils = {}

Utils.doesFileExist = function (file) {
    try {
        return fs.statSync(file).isFile();
    }
    catch (e) {
        if (e.code != 'ENOENT')
            throw e;

        return false;
    }
}

module.exports = Utils
