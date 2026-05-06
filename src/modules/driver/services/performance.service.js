const PerformanceRecord = require("../models/performanceRecord.model");

// ================= TIME DECAY =================
const getDecayWeight = (date) => {
  const now = new Date();
  const diffYears = (now - new Date(date)) / (1000 * 60 * 60 * 24 * 365);

  if (diffYears < 1) return 1;
  if (diffYears < 3) return 0.7;
  if (diffYears < 5) return 0.4;
  return 0.2;
};

// ================= NORMALIZE =================
const normalize = (score, base = 80) => {
  return Math.max(0, Math.min(100, base + score));
};

// ================= SCORE CALCULATION =================
const calculateScores = (records = []) => {
  let safety = 0;
  let reliability = 0;
  let training = 0;

  records.forEach((r) => {
    if (!r || typeof r.impact !== "number" || !r.category) return;

    const weight = getDecayWeight(r.date);
    const value = r.impact * weight;

    if (r.category === "safety") safety += value;
    if (r.category === "reliability") reliability += value;
    if (r.category === "training") training += value;
  });

  const safetyScore = Math.round(normalize(safety));
  const reliabilityScore = Math.round(normalize(reliability));
  const trainingScore = Math.round(normalize(training));

  const overall = Math.round(
    (safetyScore + reliabilityScore + trainingScore) / 3,
  );

  return {
    safety: safetyScore,
    reliability: reliabilityScore,
    training: trainingScore,
    overall,
  };
};

// =================  SERVICE =================

const getDriverPerformanceData = async (driverId) => {
  const records = await PerformanceRecord.find({
    driver: driverId,
    status: "verified",
  }).sort({ date: 1 }); // ascending for history

  const scores = calculateScores(records);

  // ================= HISTORY =================
  const monthly = {};

  records.forEach((r) => {
    const key = new Date(r.date).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    if (!monthly[key]) {
      monthly[key] = {
        safety: 0,
        reliability: 0,
        training: 0,
      };
    }

    const weight = getDecayWeight(r.date);
    const value = r.impact * weight;

    monthly[key][r.category] += value;
  });

  const normalize = (score) => Math.max(0, Math.min(100, 80 + score));

  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const key = d.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    const label = d.toLocaleString("default", {
      month: "short",
    });

    months.push({ key, label });
  }

  let last = { safety: 0, reliability: 0, training: 0 };

  const history = months.map(({ key, label }) => {
    if (monthly[key]) last = monthly[key];

    const safety = normalize(last.safety);
    const reliability = normalize(last.reliability);
    const training = normalize(last.training);

    const overall = Math.round((safety + reliability + training) / 3);

    return {
      month: label,
      safety: Math.round(safety),
      reliability: Math.round(reliability),
      overall,
    };
  });

  return {
    records,
    scores,
    history, // ✅ added
  };
};

// ================= EXPORT =================
module.exports = {
  calculateScores,
  getDecayWeight,
  getDriverPerformanceData,
};
