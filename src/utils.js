import { lstat, readdir, Stats } from "fs";
import { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";



/**
 * 
 * @param {string} path
 * @returns {Promise<Stats>} 
 */
export const loadDir = (path) => {
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
export const getChildren = (path) => {
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
export const loadFolder = async (path) => {
    const stats = await loadDir(path);

    /** @type {fileNode} */
    const node = {
        path: path,
        isDirectory: stats.isDirectory(),
        run: () => { },
        children: new Map()
    }

    if (node.isDirectory) {
        (await getChildren(path)).forEach(async subpath => {
            node.children.set(subpath, await loadFolder(path + "/" + subpath));
        })
    } else if (stats.isFile()) {
        const module = await import(pathToFileURL(path));
        node.run = typeof module === "function" ? module : module.default;
    }

    return node;
}