const crypto = require('crypto');
const fs = require('fs');
function md5(str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    return md5sum.digest('hex');
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function filterSkipWords(items, skipWords) {
    if (!skipWords) return items;
    if (skipWords.length == 0) return items;
    items.forEach(item => {
        for (let i = 0; i < skipWords.length; i++) {
            if (item.title?.indexOf(skipWords[i]) != -1) {
                console.info("SKIP: " + skipWords[i], item.title);
                item.description = null;
                continue;
            }
            if (item.description?.indexOf(skipWords[i]) != -1) {
                console.info("SKIP: " + skipWords[i], item.title);
                item.description = null;
                continue;
            }
        }
    });
    return items.filter(it => it.description);
}

function getRssXml(title, link, items,max = 20) {
let itemsXml = items.slice(0,max).map(it => `<item>
    <title><![CDATA[ ${it.title} ]]></title>
    <link>${it.link}</link>
    <guid>${it.guid}</guid>
    <description>
    <![CDATA[ ${it.description.replace(/<!\[CDATA\[/g,"<! [C DATA [").replace(/\]\]>/g,"] ] >") } ]]>
    </description>
    </item>`)

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
    <channel>
        <title><![CDATA[ ${title} ]]></title>
        <link><![CDATA[ ${link} ]]></link>
        <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
        <description><![CDATA[
        ${title} RSS
    ]]></description>
        <language>zh-cn</language>
        ${itemsXml.join("\n")}
        </channel>
        </rss>`
    return xml;
}

function createOutDir(RSSOUT) {

    if (!fs.existsSync("./out/cache")) {
        fs.mkdirSync("./out");
        fs.mkdirSync("./out/cache");
    }
}

createOutDir();

async function uploadXml(xml, RSS_NAME) {
    let res = await fetch(process.env.RSS_S3 + `rss/${RSS_NAME}.xml`, {
        "body": xml,
        "method": "POST",
    })
    console.info(await res.text())    
}

async function uploadJson(title, link, items, RSS_NAME) {
    let json = {
        rss:{
            channel:{
                title,
                link,
                lastBuildDate:new Date().toISOString(),
                description:title + " RSS",
                language:"zh-cn",
                item:items
            }
        }
    }

    let res = await fetch(process.env.RSS_S3 + `rss/${RSS_NAME}.json`, {
        "body": JSON.stringify(json),
        "method": "POST",
    })
    console.info(await res.text())

}

const RSSOUT = "./out/cache/";

module.exports = {
    md5,
    sleep,
    getRssXml,
    createOutDir,
    uploadXml,
    filterSkipWords,
    uploadJson,
    RSSOUT
}