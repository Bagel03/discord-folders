import { Client } from "discord.js";
import { existsSync } from "fs";
import { pathToFileURL } from "url";
import { CommandsHandler } from "./commands_handler.js";
import { Listener } from "./listener.js";
import { logError, options } from "./utils.js";


const botOptions = { ...options, ...{ tag: "Bot" }, prefix: "!" };

export class Bot {

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