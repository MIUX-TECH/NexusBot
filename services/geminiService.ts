import { GoogleGenAI } from "@google/genai";
import { StrategyConfig, Trade } from "../types";

const resolveApiKey = (explicitKey?: string): string => {
  if (explicitKey) return explicitKey;
  if (typeof localStorage !== 'undefined') {
    try {
      const rawConfig = localStorage.getItem('nexus_api_config');
      if (rawConfig) {
        const parsed = JSON.parse(rawConfig);
        if (parsed?.geminiApiKey) return parsed.geminiApiKey;
      }
    } catch {
      // Ignore malformed localStorage data
    }
  }
  return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
};

export const analyzeMarket = async (
  marketData: any,
  strategy: StrategyConfig,
  currentPrice: number,
  apiKey?: string
): Promise<{ decision: string; reasoning: string; confidence: number }> => {
  const resolvedKey = resolveApiKey(apiKey);
  if (!resolvedKey) {
    return {
      decision: "TAHAN",
      reasoning: "Kunci API hilang. Berjalan dalam mode pasif.",
      confidence: 0
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: resolvedKey });
    const prompt = `
      Bertindaklah sebagai AI trading kripto frekuensi tinggi yang ahli.
      Analisis snapshot pasar berikut dan parameter strategi:
      
      Harga Saat Ini: ${currentPrice}
      RSI (Simulasi): ${Math.floor(Math.random() * 40) + 30}
      MACD Histogram: ${Math.random() > 0.5 ? 'Positif' : 'Negatif'}
      
      Konfigurasi Strategi:
      - RSI Overbought: ${strategy.rsiOverbought}
      - RSI Oversold: ${strategy.rsiOversold}
      - Risiko Per Trade: ${strategy.riskPerTrade}%
      
      Berikan respons JSON terstruktur dengan:
      1. Decision (BELI, JUAL, TAHAN) -> Gunakan Bahasa Indonesia (BELI/JUAL/TAHAN)
      2. Reasoning (Maksimal 15 kata dalam Bahasa Indonesia)
      3. Confidence (0-100 integer)
      
      Format respons: HANYA JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);
    
    // Normalize decisions to internal English logic types if needed, or keep for display
    // For this app, we will map Indonesian output to internal types if strictly needed, 
    // but the UI displays what the AI says. 
    // However, App.tsx logic expects specific keys. Let's normalize decision for logic but keep reasoning in ID.
    
    let normalizedDecision = "HOLD";
    const decisionRaw = (result.Decision || result.decision || "TAHAN").toUpperCase();
    if (decisionRaw.includes("BELI") || decisionRaw.includes("BUY")) normalizedDecision = "BUY";
    if (decisionRaw.includes("JUAL") || decisionRaw.includes("SELL")) normalizedDecision = "SELL";

    return {
        decision: normalizedDecision, // Keep internal logic as BUY/SELL
        reasoning: result.Reasoning || result.reasoning || "Pasar ambigu.",
        confidence: result.Confidence || result.confidence || 50
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      decision: "ERROR",
      reasoning: "Analisis AI gagal karena konektivitas.",
      confidence: 0
    };
  }
};

export const reviewTrade = async (trade: Trade): Promise<string> => {
   const resolvedKey = resolveApiKey();
   if (!resolvedKey) return "Mode Simulasi: Tinjauan trade tidak tersedia.";

   try {
     const ai = new GoogleGenAI({ apiKey: resolvedKey });
     const prompt = `
       Tinjau trade yang sudah ditutup ini untuk optimasi pembelajaran mandiri:
       Tipe: ${trade.type}
       Masuk: ${trade.entryPrice}
       Keluar: ${trade.currentPrice}
       PnL: ${trade.pnlPercent}%
       
       Berikan 1 kalimat pelajaran penyesuaian strategis untuk bot dalam Bahasa Indonesia.
     `;
     
     const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
     });
     
     return response.text || "Analisis selesai.";
   } catch (e) {
     return "Modul pembelajaran mandiri offline.";
   }
}
