import { loadFolder } from "./utils.js";

/**
 * @typedef {object} fileNode
 * @property {string} path
 * @property {Map<string, fileNode>} children
 * @property {boolean} isDirectory
 * @property {Function} run
 */

export class CommandsHandler {
    // private path: string;
    // private commandsNode: fileNode | null;
    // private commands: Map<string, fileNode>;

    /** @param {string} path */
    constructor(path) {
        this.path = path;

        /** @type {Map<string, fileNode>} */
        this.commands = new Map();

        /** @type {fileNode} */
        this.commandsNode = null;

        this.reload();
    }

    async reload() {
        // Empty the current commands
        this.commands.clear();

        //Load everything back in
        this.commandsNode = (await loadFolder(this.path));
        this.commands = this.commandsNode.children;
    }

    /**
     * 
     * @param {string[]} commands 
     * @param  {...any} args 
     */
    resolveCommand(commands, ...args) {
        return this.resolveCommandInternal(commands, this.commandsNode, args);
    }

    /**
     * 
     * @param {string[]} commands 
     * @param {fileNode} node 
     * @param {...any} args
     * @private
     */
    resolveCommandInternal(commands, node, args) {

        function tryRun(commandName) {
            if (node.children.has(commandName)) {
                if (node.children.get(commandName).isDirectory) return;
                node.children.get(commandName).run(...args);
                return true;
            } else return false;
        }

        if (commands.length === 1) {
            if (tryRun(commands[0] + ".js")) return true;
            if (tryRun(commands[0] + ".mjs")) return true;
            if (tryRun("default.js")) return true;
            if (tryRun("default.mjs")) return true;
            return false;
        }

        if (node.children.has(commands[0])) {
            const folder = node.children.get(commands[0]);
            if (!folder.isDirectory) return;
            return this.resolveCommandInternal(commands.slice(1), folder, args);
        }

        if (tryRun(commands[0] + ".js")) return true;

        if (node.children.has("default")) {
            const folder = node.children.get("default");
            if (!folder.isDirectory) return;
            return this.resolveCommandInternal(commands.slice(1), folder, args);
        }

        if (tryRun("default.js")) return true;

        return true;
    }
}