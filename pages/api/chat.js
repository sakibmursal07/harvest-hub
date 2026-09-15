import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_INSTRUCTION = `
You are the AI assistant for Harvest Hub (🌾 Harvest Hub), an online agricultural marketplace connecting local farmers directly with consumers.

Your Responsibilities:
1. Help buyers discover fresh produce (vegetables, fruits, organic crops, grains) listed by local farmers.
2. Guide farmers on how to list produce, pricing tips, and seasonal demand.
3. Answer questions about fresh delivery, organic farming practices, and order policies.
4. Keep answers friendly, helpful, and concise with an agricultural tone.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing from .env.local. Please add your key and restart npm run dev.",
    });
  }

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    let replyText = "";
    try {
      const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash",
        input: message,
        system_instruction: SYSTEM_INSTRUCTION,
      });
      replyText = interaction?.output_text || "";
    } catch (interactionErr) {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: message,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
      replyText = response.text || "";
    }

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error("Chatbot API Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate response.",
    });
  }
}