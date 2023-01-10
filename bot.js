const { Telegraf } = require("telegraf");
// const config = require("./config");
const axios = require("axios");

// Set Base URL according to NODE_ENV environment variable
const baseURL =
  process.env.NODE_ENV === "development" ? "http://0.0.0.0:6000" : "";

const BOT_TOKEN = process.env.TELEGRAM_ACCESS_TOKEN;
// const bot = new Telegraf(config.BOT_TOKEN);
const bot = new Telegraf(BOT_TOKEN);

module.exports = {
  botInstance: bot,
  baseURL: baseURL,
  startBot: async () => {
    bot.start((ctx) => ctx.reply("Welcome"));
    bot.help((ctx) => ctx.reply("Instructions!"));

    // '/join' command
    bot.command("save", (ctx) => {
      // console.log(ctx.message);
      let msgTxt = ctx.message.text.split(" ");

      //Reject request if exactly ONE argument is not present
      if (msgTxt.length != 2) {
        ctx.reply(
          "Please send the link after `/save` that you want me to save to notion"
        );
        return;
      }

      const httplink = msgTxt[1];

      console.log(httplink);
      //Send POST request to `/save/notion` upon successful validation
      axios
        .post(`${baseURL}/saveto/notion/`, {
          telegramID: ctx.message.from.id,
          chatID: ctx.message.chat.id,
          name: ctx.message.from.first_name,
          httplink: httplink,
        })
        .then((res) => {
          if (res) {
            ctx.reply(res.data);
          }
        });
    });

    bot.launch();

    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  },
};
