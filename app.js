require("dotenv").config();

const express = require("express");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
  const message = req.body?.message;

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Vul eerst een bericht in." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY ontbreekt in je .env-bestand." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: message.trim(),
    });

    return res.json({ reply: result.text || "Geen antwoord ontvangen." });
  } catch (error) {
    console.error("Gemini API-fout:", error);
    return res.status(500).json({ error: "Gemini-aanvraag mislukt. Controleer je API-sleutel." });
  }
});

// JSON-foutmelding in plaats van een HTML-foutpagina
app.use((req, res) => {
  res.status(404).json({ error: "Route niet gevonden." });
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});