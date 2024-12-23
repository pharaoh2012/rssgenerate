//cron: 3/20 7-23 * * *
//new Env('52pojie吾爱破解RSS');


const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const tools = require("./tools")
const iconv = require('iconv-lite');

const rootUrl = `https://www.52pojie.cn/`;
const HOME_URL = "https://www.52pojie.cn/forum-66-1.html"
const title = "『福利经验』 - 吾爱破解";
const RSS_NAME = "52pojie";

const skipWords = [];

let cookie;

async function main() {
    tools.createOutDir(tools.RSSOUT)

    cookie = await getCookie();
    let html = await getPage(HOME_URL);
    
    let items = getLinks(html)

    console.log("✔✔✔链接数量:" + items.length)
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        await getDetail(item,i)
    }
    items.sort((a, b) => a.cache - b.cache);

    items = tools.filterSkipWords(items, skipWords);

    let xml = tools.getRssXml(title,HOME_URL,items);

    // fs.writeFileSync(`${tools.RSSOUT}/${RSS_NAME}.json`, JSON.stringify(items));
    // fs.writeFileSync(`${tools.RSSOUT}/${RSS_NAME}.xml`, xml);

    //upload
    await tools.uploadJson(title, HOME_URL, items, RSS_NAME)
    await tools.uploadXml(xml,RSS_NAME)
    
}

function getLinks(html) {
    const $ = cheerio.load(html);
    return $('a.xst').map((i, it) => {
        let item = $(it);

        const id = rootUrl + item.attr('href');
        //console.info(id)
        return {
            guid: tools.md5(id),
            link: id,
            // author: item.find('.photos-feed-data-name').eq(0).text(),
            title: item.text() || 'Untitled'
        };

    }).get();
}

async function getCookie() {
    console.info("process.env.RSS_S3:"+process.env.RSS_S3)
    let ck = await fetch(process.env.RSS_S3 + "cookie/www.52pojie.cn.txt");
    return await ck.text();
}
async function getPage(url) {
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
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": cookie,
            "Referer": HOME_URL,
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    let b = await r.buffer();
    let b1 = iconv.decode(b, 'gbk');
    //console.info(b1);
    console.info(b1.length);
    // error  30598  30k
    // ok 122897     100k
    // fs.writeFileSync("52pojie.html", b1)
    return b1;
    // .then(r => r.arrayBuffer()).then(b => {
    //     let b1 = iconv.decode(b, 'gbk');
    //     fs.writeFileSync("52pojie.html", b1)
    // });
}

async function getDetail(item,i) {
    let fn = `/tmp/${item.guid}.txt`;
    if (fs.existsSync(fn)) {
        item.description = fs.readFileSync(fn, "utf8");
        item.cache = 1;
        return;
    }
    console.info(`${i+1}. get:`, item.title, item.link);
    item.cache = 0;
    let html = await getPage(item.link);
    await tools.sleep(1000);
    if (html) {
        //fs.writeFileSync(`/tmp/${item.guid}.html`, html);
        const $$ = cheerio.load(html);
        $$("script").remove();
        $$("style").remove();
        //$$("div.vw50_kfc_pt").remove() //去除广告
        $$("img").each((i, it) => {
            let img = $$(it);
            let file = img.attr("file");
            //console.info(file)
            if (file) {
                img.attr("src", file);
                return;
            }
        })
        let txt = $$("div.t_fsz").html();
        if (txt) {
            fs.writeFileSync(fn, txt);
            item.description = txt;
        } else {
            console.error("❌❌❌解析错误: " + item.link + "   " + item.guid)
        }

    } else {
        console.error("❌❌❌下载错误: " + item.link + "   " + item.guid)
    }
}

module.exports = {
    main: main
}

if(require.main === module) {
    main();
}





