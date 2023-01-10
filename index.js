require("dotenv").config();
const { response } = require("express");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { PORT = 6000, LOCAL_ADDRESS = "0.0.0.0" } = process.env;

app.use(express.json());
app.use("/saveto/notion", require("./routes/saveToNotion"));

const { botInstance, baseURL, startBot } = require("./bot");

app.get("/", (request, response) => {
  console.log("Works..!");
  response.status(200).send("Hello..! It Works...!");
});

Promise.all([
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB...");
    }),
  app.listen(PORT, LOCAL_ADDRESS),
  startBot(),
])
  .then(() => {
    console.log(
      `Server Started and Bot is up on PORT ${PORT} and Address ${LOCAL_ADDRESS}...`
    );
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
