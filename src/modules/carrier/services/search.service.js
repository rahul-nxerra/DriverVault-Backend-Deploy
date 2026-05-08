const CarrierSearch = require("../models/carrierSearch.model");

const SEARCH_DEDUPE_MS = 30 * 1000;

const normalizeSearchQuery = (query) => String(query || "").trim();

const logCarrierSearch = async ({ carrierProfileId, query, source }) => {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!carrierProfileId || !normalizedQuery) {
    return null;
  }

  const recentDuplicate = await CarrierSearch.findOne({
    carrierProfile: carrierProfileId,
    query: normalizedQuery,
    source,
    createdAt: { $gte: new Date(Date.now() - SEARCH_DEDUPE_MS) },
  }).select("_id");

  if (recentDuplicate) {
    return recentDuplicate;
  }

  return CarrierSearch.create({
    carrierProfile: carrierProfileId,
    query: normalizedQuery,
    source,
  });
};

const countCarrierSearchesToday = async (carrierProfileId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  return CarrierSearch.countDocuments({
    carrierProfile: carrierProfileId,
    createdAt: {
      $gte: startOfToday,
      $lt: startOfTomorrow,
    },
  });
};

module.exports = {
  countCarrierSearchesToday,
  logCarrierSearch,
};
