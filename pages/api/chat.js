import { GoogleGenAI } from "@google/genai";
import { supabase } from "../../lib/supabaseClient.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing from .env.local.",
    });
  }

  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // 1. Fetch live active inventory from Supabase to provide real-time marketplace context
    let catalogContext = "";
    try {
      const { data: activeProducts } = await supabase
        .from("products")
        .select("id, name, category, price, unit, quantity_available, profiles(farm_name, location)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(25);

      if (activeProducts && activeProducts.length > 0) {
        catalogContext = "CURRENT ACTIVE INVENTORY AVAILABLE ON HARVEST HUB:\n" +
          activeProducts
            .map((p) => {
              const farm = p.profiles?.farm_name || "Local Farm";
              const loc = p.profiles?.location ? ` in ${p.profiles.location}` : "";
              return `- ${p.name} (${p.category}): ₹${p.price}/${p.unit} · ${p.quantity_available} ${p.unit} in stock by ${farm}${loc} · Link: /product/${p.id}`;
            })
            .join("\n");
      } else {
        catalogContext = "Currently, no products are listed as in stock.";
      }
    } catch (dbErr) {
      console.warn("Could not load inventory for AI context:", dbErr.message);
    }

    const dynamicSystemInstruction = `
You are the friendly, knowledgeable AI Assistant for Harvest Hub (🌾 Harvest Hub) — an online agricultural marketplace connecting consumers directly with local farmers.

YOUR KNOWLEDGE OF CURRENT PRODUCE:
${catalogContext}

YOUR RESPONSIBILITIES:
1. Help buyers discover fresh produce (vegetables, fruits, grains, dairy).
2. Recommend specific items from the current active inventory above. When recommending an available item, provide a markdown link like: [Apples (₹100/kg)](/product/<id>) so the buyer can click directly to buy.
3. Guide farmers on how to add produce (/farmer/add-product), pricing tips, and getting verified by admins.
4. Explain ordering: buyers place direct orders with delivery address and phone; farmers deliver locally with Cash on Delivery or UPI.
5. Keep answers friendly, warmly conversational, concise, and helpful. Use relevant farm emojis (🌾, 🥕, 🍎, 🚜).
`;

    // 2. Format multi-turn conversation history for @google/genai
    const formattedContents = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) { // keep last 6 turns for context
        if (item.text && item.role) {
          formattedContents.push({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: String(item.text) }],
          });
        }
      }
    }
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let replyText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: dynamicSystemInstruction,
          temperature: 0.7,
        },
      });
      replyText = response.text || "";
    } catch (primaryErr) {
      console.warn("Primary model gemini-3.5-flash error, falling back to gemini-3.5-flash-lite:", primaryErr.message);
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: formattedContents,
        config: {
          systemInstruction: dynamicSystemInstruction,
        },
      });
      replyText = fallbackResponse.text || "";
    }

    if (!replyText) {
      replyText = "Hello! I am here to help you browse fresh local produce or manage your farm listings on Harvest Hub 🌾";
    }

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error("Chatbot API Error:", error);
    return res.status(200).json({
      reply: "🌾 Harvest Assistant is experiencing a brief connection delay. Please feel free to browse today's fresh produce directly on our home page or ask again in a moment!",
    });
  }
}