const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

const API_KEY = "AQ.Ab8RN6LrJeNcufW86uGeLeHSXR5r9JC3yVUBQjAhAXai3NkKRw";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

app.disable("x-powered-by");
app.use(helmet({
  // This app uses inline styles/scripts in its single HTML file.
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "80kb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "অনেক দ্রুত অনুরোধ পাঠানো হয়েছে। এক মিনিট অপেক্ষা করে আবার চেষ্টা করো।" }
});

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(API_KEY),
    model: MODEL
  });
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({
      error: "সার্ভারে Gemini API Key সেট করা নেই। হোস্টিংয়ের Environment Variables-এ GEMINI_API_KEY যোগ করো।"
    });
  }

  const messages = req.body && req.body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "একটি প্রশ্ন লিখে পাঠাও।" });
  }

  // Keep only a short, plain-text conversation history.
  const safeMessages = messages.slice(-20).map((m) => {
    const role = m && m.role === "model" ? "model" : "user";
    const text = typeof (m && m.text) === "string" ? m.text.slice(0, 6000) : "";
    return { role, parts: [{ text }] };
  }).filter((m) => m.parts[0].text.trim().length > 0);

  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
    return res.status(400).json({ error: "শেষ মেসেজটি ব্যবহারকারীর প্রশ্ন হতে হবে।" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are CLFFYT AI, a helpful, clear, respectful assistant. Reply in the language the user uses, and use Bengali when they write in Bengali. Be honest when unsure."
            }]
          },
          contents: safeMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        }),
        signal: controller.signal
      }
    );
    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status;
      if (status === 400) {
        return res.status(400).json({ error: "Gemini অনুরোধটি গ্রহণ করেনি। মডেলের নাম ও প্রশ্ন পরীক্ষা করো।" });
      }
      if (status === 401 || status === 403) {
        return res.status(502).json({ error: "API Key বা API permission-এ সমস্যা আছে। সার্ভারের Environment Variables পরীক্ষা করো।" });
      }
      if (status === 429) {
        return res.status(429).json({ error: "Gemini API-এর ব্যবহারসীমা পূর্ণ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করো।" });
      }
      console.error("Gemini API error:", status, data.error?.message || "Unknown API error");
      return res.status(502).json({ error: "Gemini API থেকে উত্তর পাওয়া যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করো।" });
    }

    const answer = (data.candidates || [])
      .flatMap(c => (c.content && c.content.parts) || [])
      .map(p => p.text || "")
      .join("\n")
      .trim();

    if (!answer) {
      return res.status(502).json({ error: "AI খালি উত্তর দিয়েছে। প্রশ্নটি অন্যভাবে লিখে চেষ্টা করো।" });
    }
    return res.json({ answer, model: MODEL });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "উত্তর পেতে বেশি সময় লাগছে। আবার চেষ্টা করো।" });
    }
    console.error("Chat server error:", err.message);
    return res.status(500).json({ error: "সার্ভারে অপ্রত্যাশিত সমস্যা হয়েছে। পরে আবার চেষ্টা করো।" });
  }
});

app.get("*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CLFFYT AI running on port ${PORT}`);
  console.log(`Gemini key configured: ${Boolean(API_KEY)}`);
});
