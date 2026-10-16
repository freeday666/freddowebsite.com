require("dotenv").config();

const express = require("express");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY ontbreekt. Voeg deze toe aan .env.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
  const message = req.body?.message;

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Vul eerst een bericht in." });
  }

  try {
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: message.trim(),
    });

    res.json({ reply: result.text || "Geen antwoord ontvangen." });
  } catch (error) {
    console.error("Gemini API-fout:", error);
    res.status(500).json({ error: "Gemini kon geen antwoord geven. Probeer het opnieuw." });
  }
});

app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});