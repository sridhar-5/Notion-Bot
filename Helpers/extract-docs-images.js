const { By } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

// xpath - //*[@class="update-components-image__container"]/button//img
module.exports = async function checkIfImageOrDoc(hyperLink) {
  require("chromedriver");
  var webdriver = require("selenium-webdriver");
  var driver = new webdriver.Builder().forBrowser("chrome").build();
  const assetsInfo = {};
  const assets = [];

  try {
    await driver.get(hyperLink);
    const parentElement = await driver.findElements(
      By.xpath('//ul[@data-test-id="feed-images-content"]')
    );

    const parent = parentElement[0];
    await driver.sleep(3000);
    const imageAssets = await parent.findElements(By.xpath("./li/img"));

    for (const image of imageAssets) {
      assets.push(await image.getAttribute("src"));
      console.log(await image.getAttribute("src"));
    }
    assetsInfo["type"] = "Images";
  } catch (err) {
    console.log(err);
    console.log("attachment is not an image it is a doc");
    assetsInfo["type"] = "pdf";
    const document = await driver.findElement(By.css("iframe"));
    // Switch to the frame
    await driver.switchTo().frame(document);

    const response = await driver
      .findElement(
        By.xpath('//a[@class="ssplayer-virus-scan-container__download-button"]')
      )
      .getAttribute("href");
    assets.push(response);
    console.log(response);
  } finally {
    await driver.quit();
    assetsInfo["assets"] = assets;
    if (assetsInfo["assets"].length === 0) {
      console.log("no assets found");
      return null;
    }
    return assetsInfo;
  }
};
