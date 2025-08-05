//cron: 3/20 7-23 * * *
//new Env('60s 看世界');


const fetch = require('node-fetch');
const tools = require("./tools")

// https://github.com/vikiboss/60s

const HOME_URL = "https://60s.viki.moe/v2/60s?encoding=text"
const title = "60s 看世界";
const RSS_NAME = "60s";

async function main() {
    let today = getToday();
    let items = await getItems(today)
    if(!items) return

    console.info(items);
    let xml = tools.getRssXml(title,HOME_URL,items);

    //upload
    await tools.uploadJson(title, HOME_URL, items, RSS_NAME)
    await tools.uploadXml(xml,RSS_NAME)
    
}

async function getItems(day) {
    const url = `https://raw.githubusercontent.com/vikiboss/60s-static-host/refs/heads/main/static/60s/${day}.json`

    let r = await fetch(url);
    if(!r.ok) {
        return null;
    }
    let json = await r.json();
    let items = [];
    items.push({
        title: `60s看世界(${day})`,
        description: "<ol>"+json.news.map(item=>`<li>${item}</li>`).join("\n")+"</ol>",
        link: `https://60s.viki.moe/v2/60s?encoding=text&date=${day}`,
        guid: `60s_${day}`
    })
    return items;
}

function getToday() {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    return `${addzero(year)}-${addzero(month)}-${addzero(day)}`;
}

function addzero(num) {
    return num < 10 ? "0" + num : num;
}


module.exports = {
    main: main
}

if(require.main === module) {
    main();
}





