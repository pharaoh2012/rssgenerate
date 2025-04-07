//cron: 8 7-23 1-10 * *
//new Env('52pojie吾爱破解-爱奇艺RSS');


const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const tools = require("./tools")
const iconv = require('iconv-lite');

const RSSOUT = "/tmp";

const rootUrl = `https://www.52pojie.cn/forum-66-1.html`;
const HOME_URL = "https://www.52pojie.cn/thread-2020721-1-1.html"  // 2025-4
const title = "吾爱破解-爱奇艺";
const RSS_NAME = "52pojie_aiqiyi";

const skipWords = [];

let cookie;

async function main() {
    tools.createOutDir(RSSOUT)

    cookie = await getCookie();
    let html = await getPage(HOME_URL);

    let items = html.replace(/[ <]/g, "\n").split('\n')
        .filter(c => (c.indexOf('https://vip.iqiyi.com/') >= 0) && (c.indexOf('redNo=') >= 0))
        .map(d => d.replace(/.*?(https:.+)/, "$1")).map(u => {
            const url = new URL(u);
            const redNo = url.searchParams.get('redNo').replace(/["']/g, '');
            return {
                guid: redNo,
                title: "爱奇艺红包:" + redNo,
                link: "https://vip.iqiyi.com/html5VIP/activity/hongbao_h5/index.html?redNo=" + redNo,
                description: `<br /><a href='https://vip.iqiyi.com/html5VIP/activity/hongbao_h5/index.html?redNo=${redNo}'>爱奇艺红包:${redNo}</a><br /><br />`
            }
        })

    console.info(items);


    let xml = tools.getRssXml(title, HOME_URL, items);

    // fs.writeFileSync(`${RSSOUT}/${RSS_NAME}.json`, JSON.stringify(items));
    // fs.writeFileSync(`${RSSOUT}/${RSS_NAME}.xml`, xml);

    //upload
    await tools.uploadJson(title, HOME_URL, items, RSS_NAME)
    await tools.uploadXml(xml, RSS_NAME)

}


async function getCookie() {
    let ck = await fetch("https://r2object.65515107.xyz/cookie/www.52pojie.cn.txt");
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

async function getDetail(item, i) {
    let fn = `/tmp/${item.guid}.txt`;
    if (fs.existsSync(fn)) {
        item.description = fs.readFileSync(fn, "utf8");
        item.cache = 1;
        return;
    }
    console.info(`${i + 1}. get:`, item.title, item.link);
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

if (require.main === module) {
    main();
}





