
//cron: 18/20 7-23 * * *
//new Env('精华区 - 博客园RSS');

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const tools = require("./tools")

const Config =
    [
        {
            homt: 'https://www.cnblogs.com/pick/',
            rss: 'cnblogs_fav',
            title: "精华区 - 博客园"
        },
        {
            homt: 'https://www.cnblogs.com/',
            rss: 'cnblogs_home',
            title: "主页 - 博客园"
        },
        {
            homt: 'https://www.cnblogs.com/cate/108698/',
            rss: 'cnblogs_net',
            title: "c# - 博客园"
        },
        {
            homt: 'https://www.cnblogs.com/cate/javascript/',
            rss: 'cnblogs_js',
            title: "js - 博客园"
        },
    ]


const skipWords = [];


async function main1(HOME_URL, RSS_NAME, title) {
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

async function main() {
    for (let index = 0; index < Config.length; index++) {
        const cfg = Config[index];
        await main1(cfg.homt, cfg.rss, cfg.title)
    }
}




// 获取链接列表
function getLinks(html) {
    const $ = cheerio.load(html);
    let feeds = $('#post_list article .post-item-text a.post-item-title').map((i, it) => {
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


    return feeds;

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
        $$("#blog_post_info_block").remove();
        // $$("img").each((i, it) => {
        //     let img = $$(it);
        //     let file = img.attr("file");
        //     //console.info(file)
        //     if (file) {
        //         img.attr("src", file);
        //         return;
        //     }
        // });


        let txt = $$('#post_detail .post').html();
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

module.exports = {
    main: main
}

if (require.main === module) {
    main();
}

