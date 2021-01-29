const { Client } = require("discord.js");
const { existsSync } = require("fs");
const { pathToFileURL } = require("url");
const CommandsHandler = require("./commands_handler.js");
const Listener = require("./listener.js");
const { logError, options } = require("./utils.js");


const botOptions = { ...options, ...{ tag: "Bot" }, prefix: "!" };

module.exports = class Bot {

    /**
     * 
     * @param {string} path 
     * @param {typeof botOptions} options 
     */
    constructor(path, options) {
        this.path = path;

        this.options = { ...botOptions, ...options };

        this.client = new Client();

        /** @private */
        this.commandsHandler = new CommandsHandler(this.path + "\\commands", { ...this.options, ...{ autoLoad: false } });

        /** @private */
        this.Listener = new Listener(this.path + "\\listeners", this.client, { ...this.options, ...{ autoLoad: false } });

        this.init();
    }

    /** @private */
    async init() {
        if (!existsSync(pathToFileURL(this.path))) {
            logError(this.options.tag, "Could not find source directory", this.path, "was not found");
            return;
        }

        if (this.options.autoLoad) {
            await this.reloadCommands();
            await this.reloadListeners();
        }

        this.client.on("message", msg => {
            if (!msg.content.toLowerCase().startsWith(this.options.prefix.toLowerCase())) return;
            this.commandsHandler.resolveCommand(msg.content.toLowerCase().slice(this.options.prefix.length).split(' '));
        })
    }

    async reloadCommands() {
        await this.commandsHandler.reload();
    }

    async reloadListeners() {
        await this.Listener.reload(this.client);
    }

    /**
     * @param {string} token 
     */
    async login(token) {
        this.client.login(token);
    }


}