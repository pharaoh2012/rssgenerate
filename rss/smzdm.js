
//cron: 11/20 7-23 * * *
//new Env('什么值得买RSS');

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const tools = require("./tools")




const rootUrl = `https://search.smzdm.com`;
const HOME_URL = 'https://search.smzdm.com/?c=home&s=%E9%93%B6%E8%A1%8C%E5%8D%A1%E4%BC%98%E6%83%A0&source=sug&v=b&mx_v=b'

const title = "银行卡优惠-什么值得买";
const RSS_NAME = "smzdm";

const skipWords = [];


async function main() {
    tools.createOutDir(tools.RSSOUT);

    let html = await getPage(HOME_URL);
    //console.info(html);

    let items = getLinks(html);
    //console.info(items);

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
    const $ = cheerio.load(html);
    let feeds = $('h5.feed-block-title a.feed-nowrap,h5.feed-shaiwu-title a').map((i, it) => {
        let item = $(it);

        let id = item.attr('href');
        console.info(id);
        if (id.startsWith("//")) id = "https:" + id;

        return {
            guid: tools.md5(id),
            link: id,//`${rootUrl}/${id}`,
            // author: item.find('.photos-feed-data-name').eq(0).text(),
            title: item.text().trim() || 'Untitled'
        };
    }).get();

    // let f1 = $('h5.feed-shaiwu-title a').map((i, it) => {
    //     let item = $(it);

    //     let id = item.attr('href');

    //     return {
    //         guid: tools.md5(id),
    //         link: "https:" + id,//`${rootUrl}/${id}`,
    //         // author: item.find('.photos-feed-data-name').eq(0).text(),
    //         title: item.text() || 'Untitled'
    //     };
    // }).get();

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
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Microsoft Edge\";v=\"120\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
                "upgrade-insecure-requests": "1",
                "cookie": "device_id=190925415815909940052759914a13c6eac1dd2a2e645e84fc570514ab; smzdm_user_source=4FAB55310BACBE3DA501B8B02A49DF2A; shequ_pc_sug=b; r_sort_type=score; __ckguid=ETB69L9rX814VI4QqAuItn; homepage_sug=c"
            },
            "referrerPolicy": "strict-origin-when-cross-origin",
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