const CACHE = {};
const CACHE_EXPIRATION_TIME = 60 * 60 * 1000; // Cache expires after 1 hour

async function increaseViews(headers) {
  try {
    const referer = getReferer(headers);
    const website = getWebsite(referer);
    console.log(`Updating cache for website: ${website}`);

    if (CACHE[website]) {
      CACHE[website].views += 1;
      CACHE[website].lastUpdated = Date.now();
      console.log(`Updated cache for website: ${website}`);
    } else {
      CACHE[website] = { views: 1, lastUpdated: Date.now() };
    }

    if (CACHE[website].views < 10) {
      return;
    }

    if (isCacheExpired(CACHE[website])) {
      console.log(`Cache for website: ${website} has expired. Fetching new data.`);
      const url = 'https://statsapi-production-871f.up.railway.app/increaseViews';
      const fetchResponse = await fetch(url, { headers: { 'Referer': website } });

      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch data from ${url}. Status code: ${fetchResponse.status}`);
      }

      CACHE[website].lastUpdated = Date.now();
      console.log(`Fetched new data for website: ${website}`);
    }

    CACHE[website].views = 0;
  } catch (e) {
    console.log(e);
  }
}

function getReferer(headers) {
  let referer = headers.get("Referer") || headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch (e) {
      console.log(e);
    }
  }
  return "direct";
}

function getWebsite(referer) {
  return referer;
}

function isCacheExpired(cacheEntry) {
  return Date.now() - cacheEntry.lastUpdated > CACHE_EXPIRATION_TIME;
}

export { increaseViews };
