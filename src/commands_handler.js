import { loadFolder } from "./utils.js";

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
        const files = [commands[0] + ".js", commands[0] + ".mjs", "default.js", "default.mjs"];
        if (commands.length === 1) {
            for (const file of files) {
                if (node.children.has(file))
                    if (node.children.get(file)?.isDirectory) return false;
                return node.children.get(file)?.run(...args);
            }
            return false;
        }

        if (node.children.has(commands[0])) {
            if (!node.children.get(commands[0])?.isDirectory) return false;
            return this.resolveCommandInternal(commands.slice(1), node.children.get(commands[0]), args)
        }

        if (node.children.has("default")) {
            if (!node.children.get("default")?.isDirectory) return false;
            return this.resolveCommandInternal(commands.slice(1), node.children.get("default"), args)
        }

        files.forEach(file => {
            if (node.children.has(file))
                if (node.children.get(file)?.isDirectory) return false;
            return node.children.get(file)?.run(...args);
        })

        return false;

    }
}