const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();
const express = require("express");
const router = express.Router();
const { botInstance, baseURL } = require("../bot");
const postModel = require("../Models/post.js");
const { Client } = require("@notionhq/client");
const { By } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const arrangeSentences = require("../Helpers/arrangeSentences");
const checkIfImageOrDoc = require("../Helpers/extract-docs-images");
const client = new Client({ auth: process.env.NOTION_ACCESS_TOKEN });

router.post("/", async (request, response) => {
  const requestBody = request.body;
  const chatId = requestBody.chatID;
  // Extract the author name using selenium
  const hyperLink = requestBody.httplink;
  const authorName = await getAuthorName(hyperLink);
  const content = await getContent(hyperLink);
  console.log(hyperLink, authorName, content);
  const assetsInfo = await checkIfImageOrDoc(hyperLink);

  var saveToNotion = await createNewPage(
    content,
    hyperLink,
    authorName,
    findPlatform(hyperLink),
    assetsInfo
  );

  if (saveToNotion) {
    response.status(201).send("Post saved to Notion successfully");
  }
});

async function getAuthorName(hyperLink) {
  require("chromedriver");
  var webdriver = require("selenium-webdriver");

  var driver = new webdriver.Builder()
    .forBrowser("chrome")
    .setChromeOptions(new chrome.Options().addArguments("--headless"))
    .build();
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
  var driver = new webdriver.Builder()
    .forBrowser("chrome")
    .setChromeOptions(new chrome.Options().addArguments("--headless"))
    .build();
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

async function createNewPage(content, hyperLink, author, type, assets) {
  const contentHeader = content.split(" ").slice(0, 9).join(" ");
  const children = arrangeContentBody(content, author, assets);
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
    children: children,
  });

  return response;
}

function arrangeContentBody(content, author, assetsInfo) {
  const arrangeContent = arrangeSentences(content);
  console.log(arrangeContent + "content here");
  const children = [
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: author } }],
      },
    },
  ];
  console.log(arrangeContent.length + "length here");

  for (const block of arrangeContent) {
    console.log("Hello called");
    children.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: block } }],
      },
    });
  }
  console.log(assetsInfo);

  if (assetsInfo["assets"].length != 0) {
    if (assetsInfo["type"] == "pdf") {
      children.push({
        object: "block",
        type: "pdf",
        pdf: {
          type: "external",
          external: {
            url: assetsInfo["assets"][0],
          },
        },
      });
    }
  }
  console.log(children[2].pdf.external);
  return children;
}

module.exports = router;
