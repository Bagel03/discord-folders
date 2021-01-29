const { loadFolder, logError, logSuccess, options } = require("./utils.js");
const { Client } = require("discord.js");
const { existsSync } = require("fs");
const { pathToFileURL } = require("url");
const defaultOptions = options;


module.exports = class Listener {

    /**
     * 
     * @param {string} path 
     * @param {Client} client
     * @param {typeof defaultOptions?} options
     */
    constructor(path, client, options) {
        this.path = path;

        /** @type {Map<string, Function[]} */
        this.listeners = new Map();

        this.options = { ...defaultOptions, ...options };

        if (this.options.autoLoad)
            this.reload(client);
    }

    async reload(client) {
        this.removeEventListeners();

        if (!existsSync(pathToFileURL(this.path))) {
            logError(this.options.tag, "Could not retrieve listener folder:", this.path, "was not found")
            return;
        }


        if (this.options.verbose) {
            logSuccess(this.options.tag, "Searching ", this.path, "for listeners...");
        }


        const folder = (await loadFolder(this.path));

        folder.children.forEach((child, name) => {
            this.listeners.set(name, this.getAllChildren(child));
        })

        if (this.options.verbose) {
            logSuccess(this.options.tag, "Found", this.listeners.size + "", "listeners")
        }


        this.initEventListeners(client);
    }

    /** 
     * @param {Client} client
     * @private 
     * */
    initEventListeners(client) {
        if (this.options.verbose) {
            logSuccess(this.options.tag, "Initializing listeners from", this.path, "...")
        }

        this.listeners.forEach((listeners, event) => {
            listeners.forEach(listener => {
                client.on(event, listener);
            })
        })

        if (this.options.verbose) {
            logSuccess(this.options.tag, "All listeners from", this.path, "are initialized and ready")
        }

    }

    /**
     * @param {Client} client
     * @private
     * */
    removeEventListeners(client) {
        this.listeners.forEach((listeners, event) => {
            listeners.forEach(listener => {
                client.off(event, listener);
            })
        })
    }

    /** 
     * @param {import("./utils").fileNode} node 
     * @private
     * */
    getAllChildren(node) {
        let functs = [];

        if (!node.isDirectory) {
            functs.push(node.run);
            return functs;
        } else {
            node.children.forEach((child, name) => {
                if (this.options.exclude.test(name)) return;

                functs = functs.concat(this.getAllChildren(child));
            })
        }

        return functs;
    }
}