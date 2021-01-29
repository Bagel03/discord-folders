const { lstat, readdir, Stats } = require("fs");
const { pathToFileURL } = require("url");
require("colors");



module.exports.logSuccess = (tag, reason = "", data = "", post = "") => {
    const prefix = tag ? `[${tag}]: ` : "";
    console.log(`${(prefix + "✔ : " + reason).green.bold} ${data.cyan.italic} ${post.green.bold}`);
}

module.exports.logError = (tag, reason = "", data = "", post = "") => {
    const prefix = tag ? `[${tag}]: ` : "";
    console.log(`${(prefix + "⚠ : " + reason).red.bold} ${data.cyan.italic} ${post.red.bold}`);
}


module.exports.options = {
    tag: "",
    verbose: true,
    autoLoad: true,
    exclude: /^!/
}


/**
 * 
 * @param {string} path
 * @returns {Promise<Stats>} 
 */
const loadDir = (path) => {
    return new Promise((res, rej) => {
        lstat(path, (err, stats) => {
            if (err) rej(err);
            res(stats)
        })
    })

}


/**
 * 
 * @param {string} path 
 * @returns {Promise<string[]>}
 */
module.exports.getChildren = (path) => {
    return new Promise((res, rej) => {
        readdir(path, (err, files) => {
            if (err) rej(err);
            res(files);
        })
    })
}

/**
 * @typedef {object} fileNode
 * @property {string} path
 * @property {Map<string, fileNode>} children
 * @property {boolean} isDirectory
 * @property {Function} run
 */

/**
 * 
 * @param {string} path 
 */
module.exports.loadFolder = async (path) => {
    const stats = await loadDir(path);

    /** @type {fileNode} */
    const node = {
        path: path,
        isDirectory: stats.isDirectory(),
        run: () => { },
        children: new Map()
    }

    if (node.isDirectory) {
        const children = await module.exports.getChildren(path);
        for (const subpath of children) {
            node.children.set(subpath, await module.exports.loadFolder(path + "/" + subpath));
        }

    } else if (stats.isFile()) {
        const module = await import(pathToFileURL(path));
        node.run = typeof module === "function" ? module : module.default;
    }

    return node;
}