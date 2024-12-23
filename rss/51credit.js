
//cron: 8/20 7-23 * * *
//new Env('51信用卡优惠信息RSS');

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const tools = require("./tools")
const iconv = require('iconv-lite');

const rootUrl = `https://bbs.51credit.com`;
const HOME_URL = 'https://bbs.51credit.com/forum-235-1.html'
const COOKIE_FILE = "./out/51credit.cookie"
const title = "羊毛优惠 - 我爱卡论坛";
const RSS_NAME = "51credit";

let cookie = '';

const skipWords = ["复制本口令，打开阳光惠生活APP"];


async function main() {
    tools.createOutDir(tools.RSSOUT);

    cookie = await getLocalCookie();
    let html = await getPage(HOME_URL);

    let items = getLinks(html);

    console.info("✔✔✔链接数量:" + items.length);
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        await getDetail(item, i)
    }
    items.sort((a, b) => a.cache - b.cache);

    items = tools.filterSkipWords(items, skipWords);

    let xml = tools.getRssXml(title, HOME_URL, items);

    // fs.writeFileSync(`${tools.RSSOUT}/${RSS_NAME}.json`, JSON.stringify(items));
    // fs.writeFileSync(`${tools.RSSOUT}/${RSS_NAME}.xml`, xml);

    //upload
    await tools.uploadJson(title, HOME_URL, items, RSS_NAME)
    await tools.uploadXml(xml, RSS_NAME)

}

async function getLocalCookie() {
    if (fs.existsSync(COOKIE_FILE)) {
        cookie = fs.readFileSync(COOKIE_FILE, "utf8");
        return cookie;
    }
}

// 获取链接列表
function getLinks(html) {
    const $ = cheerio.load(html);
    return $('th a.threadlist').map((i, it) => {
        let item = $(it);

        const id = item.attr('href');

        return {
            guid: tools.md5(id),
            link: `${rootUrl}/${id}`,
            // author: item.find('.photos-feed-data-name').eq(0).text(),
            title: item.text() || 'Untitled'
        };
    }).get();
}

// 获取每个链接详细内容。
async function getDetail(item, i) {
    let fn = tools.RSSOUT + `${item.guid}.txt`;
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
        $$("img").each((i, it) => {
            let img = $$(it);
            let file = img.attr("file");
            //console.info(file)
            if (file) {
                img.attr("src", file);
                return;
            }
        });


        let txt = $$('.t_fsz').html();
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
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Microsoft Edge\";v=\"120\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "cross-site",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                cookie
            },
            "referrerPolicy": "no-referrer",
            "body": null,
            "method": "GET"
        });
        //console.info(r.status, r.ok);
        if (r.status == 521) {
            let ck = getCookie(await r.text())
            console.info(ck, url)
            cookie = ck;
            fs.writeFileSync(COOKIE_FILE, ck);
            return getPage(url)
        } else {
            const body = await r.buffer();
            return iconv.decode(body, 'gbk');
        }
    } catch (error) {
        console.error("url", error);
        return null;
    }


}

function getCookie(html) {
    console.info('getCookie:'+html);
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

