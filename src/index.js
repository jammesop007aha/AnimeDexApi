import {
  getSearch,
  getAnime,
  getRecentAnime,
  getPopularAnime,
  getEpisode,
  GogoDLScrapper,
  getGogoAuthKey,
} from "./gogo";

import {
  getAnilistTrending,
  getAnilistSearch,
  getAnilistAnime,
  getAnilistUpcoming,
} from "./anilist";
import { SaveError } from "./errorHandler";
import { increaseViews } from "./statsHandler";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function handleOptions(request) {
  if (
    request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      headers: corsHeaders,
    });
  } else {
    return new Response(null, {
      headers: {
        Allow: "GET, HEAD, POST, OPTIONS",
      },
    });
  }
}

const cache = {};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    try {
      const url = new URL(request.url);
      const { pathname } = url;

      if (pathname === "/search/:query") {
        const headers = request.headers;
        await increaseViews(headers);

        const query = url.searchParams.get("query");
        const page = url.searchParams.get("page") || 1;

        const cacheKey = `search:${query}:${page}`;
        if (cache[cacheKey]) {
          const json = JSON.stringify({ results: cache[cacheKey] });
          return new Response(json, {
            headers: { "Access-Control-Allow-Origin": "*", Vary: "Origin" },
          });
        }

        const data = await getSearch(query, page);

        if (data.length === 0) {
          throw new Error("Not found");
        }

        cache[cacheKey] = data;
        const json = JSON.stringify({ results: data });

        return new Response(json, {
          headers: { "Access-Control-Allow-Origin": "*", Vary: "Origin" },
        });
      }

      // Add other routes here in the same format as the /search route

      throw new Error("Invalid route");
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*", Vary: "Origin" },
      });
    }
  },
};


if (pathname === "/search/:query") {
  const headers = request.headers;
  await increaseViews(headers);

  const { query, page } = url.searchParams;

  const cacheKey = `search:${query}:${page}`;
  if (cache[cacheKey]) {
    const json = JSON.stringify({ results: cache[cacheKey] });
    return new Response(json, {
      headers: { "Access-Control-Allow-Origin": "*", Vary: "Origin" },
    });
  }

  const data = await getSearch(query, page);

  if (data.length === 0) {
    throw new Error("Not found");
  }

  cache[cacheKey] = data;
  const json = JSON.stringify({ results: data });

  return new Response(json, {
    headers: { "Access-Control-Allow-Origin": "*", Vary: "Origin" },
  });
}
