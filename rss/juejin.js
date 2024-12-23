
//cron: 11/20 7-23 * * *
//new Env('掘金-收藏榜RSS');

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const tools = require("./tools")



const Configs = [
    {
        HOME_URL:"https://juejin.cn/hot/collected-articles/6809637767543259144",
        title:"掘金-收藏榜",
        RSS_NAME:"jiujin-fav"
    }
]

const rootUrl = `https://juejin.cn/`;
let HOME_URL = 'https://api.juejin.cn/content_api/v1/content/article_rank?category_id=6809637767543259144&type=collect&aid=2608&uuid=7327172461643679259&spider=0'

let title = "掘金-收藏榜";
let RSS_NAME = "jiujin-fav";

const skipWords = [];


async function main() {
    tools.createOutDir(tools.RSSOUT);

    let html = await getPage(HOME_URL);
    //console.info(html);

    let items = getLinks(html);
    console.info(items);

    console.info("✔✔✔链接数量:" + items.length);
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        await getDetail(item, i)
    }
    items.sort((a, b) => a.cache - b.cache);

    items = tools.filterSkipWords(items, skipWords);

    let xml = tools.getRssXml(title, HOME_URL, items, 10);

    // fs.writeFileSync(`${tools.RSSOUT}/${RSS_NAME}.json`, JSON.stringify(items));
    // fs.writeFileSync(`${tools.RSSOUT}/${RSS_NAME}.xml`, xml);

    //upload

    await tools.uploadJson(title, HOME_URL, items, RSS_NAME)
    await tools.uploadXml(xml, RSS_NAME)
}


// 获取链接列表
function getLinks(html) {
    let j = JSON.parse(html).data;
    let feeds = j.map(r=>{
        let id = "https://juejin.cn/post/" + r.content.content_id;
        let title = r.content.title;
        return {
            guid: tools.md5(id),
            link: id,//`${rootUrl}/${id}`,
            // author: item.find('.photos-feed-data-name').eq(0).text(),
            title
        };
    })
    return feeds;

}

// 获取每个链接详细内容。
async function getDetail(item, i) {
    let fn = `/tmp/${item.guid}.txt`;
    if (fs.existsSync(fn)) {
        item.description = fs.readFileSync(fn, "utf8");
        item.cache = 1;
        return;
    }
    item.cache = 0;
    console.info(`${i}. get:`, item.title, item.link);
    let html = await getPage(item.link);
    await tools.sleep(1000);
    if (html) {
        //fs.writeFileSync(`/tmp/${item.guid}.html`, html);
        const $$ = cheerio.load(html);
        $$("script").remove();
        $$("style").remove();
        // $$("img").each((i, it) => {
        //     let img = $$(it);
        //     let file = img.attr("file");
        //     //console.info(file)
        //     if (file) {
        //         img.attr("src", file);
        //         return;
        //     }
        // });


        let txt = $$('article').html();
        if (txt) {
            fs.writeFileSync(fn, txt);
            item.description = txt;
        }

    }
}

async function getPage(url) {
    try {
        let r = await fetch(url, {
            "headers": {
              "accept": "*/*",
              "accept-language": "zh-CN,zh;q=0.9",
              "cache-control": "no-cache",
              "content-type": "application/json",
              "pragma": "no-cache",
              "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Microsoft Edge\";v=\"120\"",
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": "\"Windows\"",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-site",
              "Referer": "https://juejin.cn/",
              "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "GET"
          });
        let res = await r.text();
        return res;
    } catch (error) {
        console.error("url", error);
        return null;
    }


}

function getCookie(html) {
    console.info('getCoolie')
    globalThis.document = {}
    globalThis.window = {}
    globalThis.window.document = {}
    let str = `let setTimeout = function (fn, time) {
    //console.info("setTimeout:" + fn);
    eval(fn)
    //console.info(document.cookie)
    return document.cookie;
  }
  ` + html.replace(`<html><body><script language="javascript">`, "").replace(`</script> </body></html>`, '');

    eval(str)
    console.info(globalThis.document.cookie)
    return globalThis.document.cookie;
}

module.exports = {
    main: main
}

if(require.main === module) {
    main();
}