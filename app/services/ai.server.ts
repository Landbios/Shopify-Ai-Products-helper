import { GoogleGenAI } from "@google/genai";

export async function generateUpsellRules(products: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert e-commerce merchandiser. I will provide a list of products from my store. 
Generate up to 5 high-converting cross-sell/upsell rules based on the product catalog.
Each rule must have a trigger product and a mutually exclusive recommended product.

Return ONLY a valid JSON array matching this schema:
[
  {
    "triggerProductId": "...",
    "triggerProductTitle": "...",
    "recommendedProductId": "...",
    "recommendedProductTitle": "...",
    "recommendedProductImage": "...",
    "reason": "..."
  }
]

IMPORTANT: Use the exact 'id' strings provided for triggerProductId and recommendedProductId. Use the exact image URL if provided.

Products Catalog:
${JSON.stringify(
  products.map((p) => ({
    id: p.id,
    title: p.title,
    image: p.featuredImage?.url || "",
  })),
  null,
  2
)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
        throw new Error("No response from AI");
    }

    return JSON.parse(response.text);
  } catch (err: any) {
    console.error("Gemini AI Error:", err);
    throw new Error("Failed to generate AI recommendations: " + err.message);
  }
}
