import cheerio from "cheerio";
import fetch from "node-fetch";

const BaseURL = "https://gogoanime3.co";
const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36";

async function getSearch(name, page = 1) {
    try {
        const response = await fetch(
            BaseURL + "/search.html?keyword=" + name + "&page=" + page,
            { headers: { "User-Agent": USER_AGENT } }
        );
        if (!response.ok) throw new Error("Error in search request");
        const html = await response.text();
        const $ = cheerio.load(html);
        const searchResults = [];

        $("ul.items li").each(function (i, elem) {
            const anime = getSerieDetails($);
            searchResults.push(anime);
        });

        return searchResults;
    } catch (err) {
        console.error(err);
        return [];
    }
}

function getSerieDetails($) {
    const anime = {
        title: $("p.name a").text() || null,
        img: $("div.img a img").attr("src") || null,
        link: $("div.img a").attr("href") || null,
        id: $("div.img a").attr("href")?.split("/category/")[1] || null,
        releaseDate: $("p.released").text().trim() || null,
    };

    if (anime.link) anime.link = BaseURL + anime.link;

    return anime;
}

async function getAnime(id) {
    try {
        const response = await fetch(BaseURL + "/category/" + id, {
            headers: { "User-Agent": USER_AGENT },
        });
        if (!response.ok) throw new Error("Error in anime request");
        const html = await response.text();
        const $ = cheerio.load(html);
        const animeData = {
            name: $("div.anime_info_body_bg h1").text(),
            image: $("div.anime_info_body_bg img").attr("src"),
            id: id,
        };

        $("div.anime_info_body_bg p.type").each(function (i, elem) {
            const $x = cheerio.load($(elem).html());
            const keyName = $x("span")
                .text()
                .toLowerCase()
                .replace(":", "")
                .trim()
                .replace(/ /g, "_");
            if (/released/g.test(keyName))
                animeData[keyName] = $(elem)
                    .html()
                    .replace(`<span>${$x("span").text()}</span>`, "");
            else animeData[keyName] = $x("a").text().trim() || null;
        });

        animeData.plot_summary = $("div.description").text().trim();

        const animeid = $("input#movie_id").attr("value");
        response = await fetch(
            "https://ajax.gogocdn.net/ajax/load-list-episode?ep_start=0&ep_end=1000000&id=" +
                animeid,
            { headers: { "User-Agent": USER_AGENT } }
        );
        if (!response.ok) throw new Error("Error in episode request");
        html = await response.text();
        $ = cheerio.load(html);

        const episodes = getEpisodeList($);

        animeData.episodes = episodes;

        return animeData;
    } catch (err) {
        console.error(err);
        return null;
    }
}

function getEpisodeList($) {
    const episodes = [];
    $("ul#episode_related a").each(function (i, elem) {
        const name = $(elem)
            .find("div")
            .text()
            .trim()
            .split(" ")[1]
            .slice(0, -3);
        const link = $(elem).attr("href").trim().slice(1);
        episodes.push({ name, link });
    });
    episodes.reverse();
    return episodes;
}

async function getEpisode(id) {
    try {
        const link = `${BaseURL}/${id}`;

        const response = await fetch(link, { headers: { "User-Agent": USER_AGENT } });
        if (!response.ok) throw new Error("Error in episode request");
        const html = await response.text();
        const $ = cheerio.load(html);
        const episodeCount = $("ul#episode_page li a.active").attr("ep_end");
        const iframe = $("div.play-video iframe").attr("src");
        const serverList = $("div.anime_muti_link ul li");
        const servers = {};
        serverList.each(function (i, elem) {
            elem = $(elem);
            if (elem.attr("class") != "anime") {
                servers[elem.attr("class")] = elem.find("a").attr("data-video");
            }
        });

        let m3u8;
        try { m3u8 = await getM3U8Source(iframe); }
        catch (e) { console.log(e); m3u8 = null; }

        const ScrapedAnime = {
            name:
                $("div.anime_video_body h1")
                    .text()
                    .replace("at gogoanime", "")
                    .trim() || null,
            episodes: episodeCount,
            stream: m3u8,
            servers,
        };

        return ScrapedAnime;
    } catch (err) {
        console.error(err);
        return null;
    }
}

function getM3U8Source(iframe_url) {
    return new Promise(async (resolve, reject) => {
        try {
            let sources = [];
            let sources_bk = [];
            const serverUrl = new URL(iframe_url);
            const goGoServerPage = await fetch(serverUrl.href, {
                headers: { "User-Agent": USER_AGENT },
            });
            const $$ = cheerio.load(await goGoServerPage.text());

            const params = await generateEncryptAjaxParameters($$, serverUrl.searchParams.get("id"));

            const fetchRes = await fetch(
                `${serverUrl.protocol}//${serverUrl.hostname}/encrypt-ajax.php?${params}`,
                {
                    headers: {
                        "User-Agent": USER_AGENT,
                        "X-Requested-With": "XMLHttpRequest",
                    },
                }
            );

            const res = decryptEncryptAjaxResponse(await fetchRes.json());
            res.source.forEach((source) => sources.push(source));
            res.source_bk.forEach((source) => sources_bk.push(source));

            resolve({
                Referer: serverUrl.href,
                sources: sources,
                sources_bk: sources_bk,
            });
        } catch (err) {
            reject(err);
        }
    });
}

// ... rest of the code

export {
    getSearch,
    getAnime,
    getRecentAnime,
    getPopularAnime,
    getEpisode,
    GogoDLScrapper,
    getGogoAuthKey,
};


npm install node-fetch cheerio
