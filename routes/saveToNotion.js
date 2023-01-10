const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();
const express = require("express");
const router = express.Router();
const { botInstance, baseURL } = require("../bot");
const postModel = require("../Models/post.js");
const { Client } = require("@notionhq/client");
const { By } = require("selenium-webdriver");

const client = new Client({ auth: process.env.NOTION_ACCESS_TOKEN });

router.post("/", async (request, response) => {
  const requestBody = request.body;
  const chatId = requestBody.chatID;
  // Extract the author name using selenium
  const hyperLink = requestBody.httplink;
  const authorName = await getAuthorName(hyperLink);
  const content = await getContent(hyperLink);
  console.log(hyperLink, authorName, content);
  const savePost = new postModel({
    content: content,
    hyperLink: hyperLink,
    author: authorName,
    type: findPlatform(hyperLink),
  });
  //post data saved to database
  await savePost.save();

  const saveToNotion = await createNewPage(
    content,
    hyperLink,
    authorName,
    findPlatform(hyperLink)
  );

  if (saveToNotion) {
    response.status(201).send("Post saved to Notion successfully");
  }
});

async function getAuthorName(hyperLink) {
  require("chromedriver");
  var webdriver = require("selenium-webdriver");
  var driver = new webdriver.Builder().forBrowser("chrome").build();
  try {
    await driver.get(hyperLink);
    const author = await driver
      .findElement(
        By.xpath(
          "//a[@data-tracking-control-name='public_post_feed-actor-name']"
        )
      )
      .getText();
    return author;
  } finally {
    await driver.quit();
  }
}

async function getContent(hyperLink) {
  require("chromedriver");
  var webdriver = require("selenium-webdriver");
  var driver = new webdriver.Builder().forBrowser("chrome").build();
  try {
    await driver.get(hyperLink);
    const author = await driver
      .findElement(
        By.xpath("//p[@data-test-id='main-feed-activity-card__commentary']")
      )
      .getText();
    return author;
  } finally {
    await driver.quit();
  }
}

function findPlatform(hyperLink) {
  const socials = {
    linkedin: "Linkedin Post",
    twitter: "Tweet",
  };

  for (const social in socials) {
    if (hyperLink.includes(social)) {
      return socials[social];
    }
  }
  return "Post";
}

async function createNewPage(content, hyperLink, author, type) {
  const contentHeader = content.split(" ").slice(0, 9).join(" ");
  console.log(contentHeader);
  const response = await client.pages.create({
    parent: {
      database_id: process.env.NOTION_DATABASE_ID,
    },
    properties: {
      Tweet: {
        title: [
          {
            type: "text",
            text: {
              content: contentHeader,
            },
          },
        ],
      },
      Author: {
        rich_text: [
          {
            type: "text",
            text: {
              content: author,
            },
          },
        ],
      },
      "Tweet Link": {
        url: hyperLink,
      },
      Type: {
        select: {
          name: type,
        },
      },
      Status: {
        status: {
          name: "Not started",
        },
      },
    },
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: author } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: content } }],
        },
      },
    ],
  });

  return response;
}

module.exports = router;
