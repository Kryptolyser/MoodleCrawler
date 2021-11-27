import TelegramBot from "node-telegram-bot-api";
import DatabaseCtrl from "./database";

class TelegramCtrl {
    db: DatabaseCtrl;
    bot: TelegramBot;
    webserverUrl: string;

    constructor(db: DatabaseCtrl, token: string, webserverUrl: string) {
        this.db = db;
        this.bot = new TelegramBot(token, {polling: true});
        this.webserverUrl = webserverUrl;

        this.bot.onText(/^[^\/].*/, (msg) => this.anyMsg(msg));
        this.bot.onText(/^\/start/, (msg) => this.startCmd(msg));
        this.bot.onText(/^\/help/, (msg) => this.helpCmd(msg));
    }

    private checkChatId(msg: TelegramBot.Message) {
        if (this.db.hasTelegramChatId(msg.chat.id))
            return true;
        else {
            const token = msg.text.replace(/^\/start /, "");
            const success = this.db.updateTelegramCharId(msg.chat.id, token);
            if (success) {
                this.bot.sendMessage(
                    msg.chat.id,
                    `Your notion token was successfully linked with this chat! To get started take a look at the commands with /help.`,
                    {parse_mode: "HTML"}
                );
            }
            else {
                this.bot.sendMessage(
                    msg.chat.id,
                    `Sorry, but I couldn't find that notion token in my database. Have you already registered it at ${this.webserverUrl}?`,
                    {parse_mode: "HTML"}
                );
            }
            return false;
        }
    }

    private anyMsg(msg: TelegramBot.Message) {
        if (this.checkChatId(msg)) {
            this.bot.sendMessage(
                msg.chat.id,
                `Please specify the command you want to use.\nFor a list of commands type /help.`,
                {parse_mode: "HTML"}
            );
        }
    }

    private startCmd(msg: TelegramBot.Message) {
        if (msg.text.match(/^\/start (.+)/))
            this.checkChatId(msg);
        else {
            this.bot.sendMessage(
                msg.chat.id,
                `Hello there ${msg.from.first_name}!\nPlease send me your <b>notion token</b> so I can link this channel.`,
                {parse_mode: "HTML"}
            );
        }
    }

    private helpCmd(msg: TelegramBot.Message) {
        this.bot.getMyCommands().then((commands) => {
            this.bot.sendMessage(
                msg.chat.id,
                `<b>Available commands:</b>\n${commands.map((cmd) => `/${cmd.command} - ${cmd.description}`).join("\n")}`,
                {parse_mode: "HTML"}
            );
        });
    }
}

export default TelegramCtrl;