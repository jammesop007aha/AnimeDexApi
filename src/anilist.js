const API_URL = "https://graphql.anilist.co";

const createOptions = (query) => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({ query }),
});

const anilistSearchQuery = (query, page, perPage = 10, type = "ANIME") => `
query ($page: Int = ${page}, $perPage: Int = ${perPage}, $search: String = "${query}", $type: MediaType = ${type}) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total perPage currentPage lastPage hasNextPage }
    media(search: $search, type: $type) {
      id
      status(version: 2)
      title { userPreferred romaji english native }
      bannerImage
      popularity
      coverImage { extraLarge large medium color }
      episodes
      format
      season
      description
      seasonYear
      averageScore
      genres
    }
  }
}
`;

const anilistTrendingQuery = (page = 1, perPage = 10, type = "ANIME") => `
query ($page: Int = ${page}, $perPage: Int = ${perPage}, $type: MediaType = ${type}) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total perPage currentPage lastPage hasNextPage }
    media(sort: [TRENDING_DESC, POPULARITY_DESC], type: $type) {
      id
      status(version: 2)
      title { userPreferred romaji english native }
      genres
      description
      format
      bannerImage
      coverImage { extraLarge large medium color }
      episodes
      meanScore
      season
      seasonYear
      averageScore
    }
  }
}
`;

const anilistMediaDetailQuery = (id) => `
query ($id: Int = ${id}) {
  Media(id: $id) {
    id
    title { english native romaji userPreferred }
    coverImage { extraLarge large color }
    bannerImage
    season
    seasonYear
    description
    type
    format
    status(version: 2)
    episodes
    genres
    averageScore
    popularity
    meanScore
    recommendations { edges { node { id mediaRecommendation { id meanScore title { romaji english native userPreferred } status episodes coverImage { extraLarge large medium color } bannerImage format } } } }
  }
}
`;

const anilistUpcomingQuery = (page, perPage = 20, notYetAired = true) => `
query {
  Page(page: ${page}, perPage: ${perPage}) {
    pageInfo { total perPage currentPage lastPage hasNextPage }
    airingSchedules(notYetAired: ${notYetAired}) {
      airingAt
      episode
      media {
        id
        description
        idMal
        title { romaji english userPreferred native }
        countryOfOrigin
        description
        popularity
        bannerImage
        coverImage { extraLarge large medium color }
        genres
        averageScore
        seasonYear
        format
      }
    }
  }
}
`;

const getAnilistData = async (query) => {
  const res = await fetch(API_URL, createOptions(query));
  const data = await res.json();
  return data;
};

const getAnilistTrending = async (page = 1, perPage = 10, type = "ANIME") => {
  const query = anilistTrendingQuery(page, perPage, type);
  const data = await getAnilistData(query);
  return { results: data["data"]["Page"]["media"] };
};

const getAnilistUpcoming = async (page, perPage = 20, notYetAired = true) => {
  const query = anilistUpcomingQuery(page, perPage, notYetAired);
  const data = await getAnilistData(query);
  return { results: data["data"]["Page"]["airingSchedules"] };
};

const getAnilistSearch = async (query, page = 1, perPage = 10) => {
  const queryString = anilistSearchQuery(query, page, perPage);
  const data = await getAnilistData(queryString);
  return { results: data["data"]["Page"]["media"] };
};

const getAnilistAnime = async (id) => {
  const query = anilistMediaDetailQuery(id);
  const data = await getAnilistData(query);
  const results = data["data"]["Media"];
  results["recommendations"] = results["recommendations"]["edges"];

  for (let i = 0; i < results["recommendations"].length; i++) {
    const rec = results["recommendations"][i];
    results["recommendations"][i] = rec["node"]["mediaRecommendation"];
  }
  return results;
};

export { getAnilistTrending, getAnilistSearch, getAnilistAnime, getAnilistUpcoming };
