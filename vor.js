let xlsx = require("xlsx");
const fs = require("fs");
const nativ = [];
let subarray = [];
let index = 0;
let errors = [];
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
//const { text } = require("cheerio/lib/api/manipulation");
const axios = require("axios").default;
//const { getParent } = require("domutils");
//const { text } = require("cheerio/lib/api/manipulation");
//const { eq } = require("cheerio/lib/api/traversing");
//const { getInnerHTML, getChildren } = require("domutils");
function getElementByXpath(path) {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}
const main = async () => {
  let p = xlsx.readFile("228.xlsx");
  let list = p.SheetNames;
  let Listofart = xlsx.utils.sheet_to_json(p.Sheets[list[0]]);
  let massivpop = [];
  Listofart.forEach((article) => {
    let a = article["Артикул поставщика"].length;
    let buff1 = article["Артикул поставщика"]
      .split("")
      .slice(0, a / 2)
      .join("");
    let buff2 = article["Артикул поставщика"]
      .split("")
      .slice(a / 2)
      .join("");
    if (buff1 == buff2) {
      massivpop.push(buff1);
    } else {
      massivpop.push(article["Артикул поставщика"]);
    }
    const size = Math.ceil(massivpop.length / 15);
    for (let i = 0; i < 15; i++) {
      subarray[i] = massivpop.slice(i * size, i * size + size);
    }
  });
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: [`--window-size=1920,1080`],
    defaultViewport: {
      width: 1920,  
      height: 1080,
    },
  });

  const page = await browser.newPage();
  await page.goto("https://indigo.kaspiya.ru");
  //await browser.close();
  await page.evaluate(() => {
    const email = document.querySelector("input[type=email]");
    email.value = "klkvtwix@yandex.ru";
  });
  await page.evaluate(() => {
    const email = document.querySelector("input[type=password]");
    email.value = "Tanya132845";
  });
  await page.click("button[type=submit]");
  const t1 = Date.now();
  await Promise.all(
    subarray.map(async (hui) => {
      const page1 = await browser.newPage();
      let lag;
      for (let kkk of hui) {
        try {
          await page1.goto("https://indigo.kaspiya.ru/product/filter");
          await page1.waitForSelector("#articul");
          await page1.evaluate((kkk) => {
            const jizz = document.querySelector("#articul");
            jizz.value = kkk; //massivpop
          }, kkk);
          await page1.click("#articul");
          await page1.waitForSelector(
            "body > div:nth-child(3) > div > div > div > div:nth-child(2) > div.col-sm-2 > div > div > form > div.row.text-end > div > button",
            { visible: true }
          );
          await page1.click(
            "body > div:nth-child(3) > div > div > div > div:nth-child(2) > div.col-sm-2 > div > div > form > div.row.text-end > div > button"
          );
          await page1.waitForSelector(
            "body > div:nth-child(3) > div > div > div > div:nth-child(2) > div.col-sm-2 > div > div > form > div.row.text-end > div > button",
            { visible: true }
          );
          // await new Promise((resolve) => setTimeout(resolve, 10000));
          const paightdata = await page1.evaluate(() => {
            return { html: document.documentElement.innerHTML };
          });
          fs.writeFile("test.html", paightdata.html, () => {});
          const $ = cheerio.load(paightdata.html);
          lag = $(".font-weight-bold").eq(3).text();
          await page1.goto("https://www.sima-land.ru");
          await page1.waitForSelector("input[type=search]");
          await page1.click("input[type=search]");
          await page1.waitForSelector("input[type=search]");
          await page1.evaluate((lag) => {
            const email = document.querySelector("input[type=search]");
            email.value = lag;
          }, lag);
          await page1.waitForSelector("input[type=search]");
          await page1.click("input[type=search]");
          await page1.waitForSelector("button[type=submit]");
          await page1.click("button[type=submit]");
          let ssilka = page1.url();
          let juk = await axios.get(
            `https://www.sima-land.ru/api/v3/item/?price_wo_offers=1&id=${lag},6655360&fields=cart_item,id,is_weighted_goods,min_qty,max_qty,qty_multiplier,in_set,qty_rules_data,real_min_qty,price_max,linear_meters,custom_qty_rules_data,price,sid&expand=cart_item,dataLayer`
          );
          //https://www.sima-land.ru/api/v3/item/?price_wo_offers=1&id=6404929,6655360&fields=cart_item,id,is_weighted_goods,min_qty,max_qty,qty_multiplier,in_set,qty_rules_data,real_min_qty,price_max,linear_meters,custom_qty_rules_data,price,sid&expand=cart_item,dataLayer
          let ravin = juk.data.items[0].max_qty;
          let proverka;
          if (ravin > 3) {
            proverka = "ЕСТЬ";
          } else {
            proverka = "НЕТУ";
          }

          nativ.push([ssilka, lag, proverka]);
          console.log(++index, ' ', kkk, ' ', ssilka, lag, proverka);
        } catch {
          console.log(++index, ' ERROR', kkk);
          errors.push([kkk]);
        }
      }
    })
  );
  console.log(Date.now() - t1);

  const ws = xlsx.utils.aoa_to_sheet(nativ);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Responses");
  const xs = xlsx.utils.aoa_to_sheet([["Артикул поставщика"], ...errors]);
  const xb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(xb, xs, "Responses");
  xlsx.writeFile(wb, "output.xlsx");
  xlsx.writeFile(xb, "errors.xlsx");
  console.log(errors);
  console.log(errors.length);
};
main();
