import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    cropName = "Tomato",
    category = "Vegetable",
    region = "Maharashtra",
    grade = "Grade A+ (Premium / Organic)",
    unit = "kg",
  } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    // Graceful realistic fallback if key is missing
    return res.status(200).json(getFallbackEstimate(cropName, category, unit));
  }

  try {
    const prompt = `
You are the Chief Agricultural Economist & Quality Inspection Specialist for Harvest Hub — a direct farm-to-table platform in India.
Analyze the following crop and return realistic benchmark agricultural economics and quality grading recommendations in JSON format:

CROP: ${cropName}
CATEGORY: ${category}
REGION/STATE: ${region}
QUALITY GRADE: ${grade}
UNIT: ${unit}

Analyze realistic agricultural market dynamics (Mandi/APMC wholesale auction rates vs Supermarket/Blinkit/Zepto retail rates vs Direct-to-Consumer fair farm rates).

Return ONLY raw JSON with this exact structure (no markdown fences, no code blocks):
{
  "crop": "${cropName}",
  "unit": "${unit}",
  "mandiPrice": <number: wholesale auction rate per unit that exploitative middlemen pay the farmer>,
  "supermarketPrice": <number: markup retail supermarket/hypermarket price charged to consumers>,
  "recommendedDirectPrice": <number: optimal Harvest Hub direct-to-consumer price where farmer earns 35-50% more than Mandi and consumer saves 15-25% compared to supermarket>,
  "farmerEarningsIncrease": "<string: e.g. '+45% above Mandi broker'>",
  "consumerSavings": "<string: e.g. '22% cheaper than retail'>",
  "qualityGrade": "${grade}",
  "shelfLifeDays": "<string: e.g. '5-7 days under room ventilation'>",
  "qualityIndicators": [
    "<string: visual/tactile check 1>",
    "<string: visual/tactile check 2>",
    "<string: visual/tactile check 3>"
  ],
  "storageAndPackagingTips": [
    "<string: packaging/post-harvest advice 1>",
    "<string: packaging/post-harvest advice 2>"
  ],
  "marketInsight": "<string: 2 sentences explaining current seasonal supply/demand trends for this crop>"
}
`;

    let rawResponse = "";
    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash"];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.2, // low temperature for precise numerical consistency
          },
        });
        rawResponse = response.text || "";
        if (rawResponse) break;
      } catch (mErr) {
        console.warn(`Model ${modelName} failed in price advisor:`, mErr.message);
      }
    }

    if (!rawResponse) {
      return res.status(200).json(getFallbackEstimate(cropName, category, unit));
    }

    // Clean JSON string if model returned markdown backticks
    const cleanedJson = rawResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedJson);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("AI Price Advisor API Error:", err);
    return res.status(200).json(getFallbackEstimate(cropName, category, unit));
  }
}

// Fallback generator when offline or API threshold hit
function getFallbackEstimate(cropName, category, unit) {
  const isFruit = category?.toLowerCase().includes("fruit");
  const isGrain = category?.toLowerCase().includes("grain");

  let baseMandi = 28;
  if (isFruit) baseMandi = 60;
  if (isGrain) baseMandi = 45;

  const mandi = baseMandi;
  const direct = Math.round(mandi * 1.45);
  const retail = Math.round(direct * 1.3);

  return {
    crop: cropName,
    unit: unit || "kg",
    mandiPrice: mandi,
    supermarketPrice: retail,
    recommendedDirectPrice: direct,
    farmerEarningsIncrease: "+45% above Mandi brokers",
    consumerSavings: "23% cheaper than supermarkets",
    qualityGrade: "Grade A+ (Farm Fresh)",
    shelfLifeDays: "5–7 days under cool, dry storage",
    qualityIndicators: [
      "Vibrant uniform coloration free from bruising",
      "Firm flesh structure indicating recent morning harvest",
      "Fresh stem hydration with no signs of fungal spotting",
    ],
    storageAndPackagingTips: [
      "Avoid direct sunlight exposure immediately post-harvest",
      "Pack in ventilated eco-crates to prevent moisture condensation",
    ],
    marketInsight:
      "Direct farm-to-consumer demand remains strong. Bypassing middleman transport hubs preserves freshness and eliminates cold-chain handling markups.",
  };
}
