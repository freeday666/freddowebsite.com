require("dotenv").config();

const express = require("express");
const { Resend } = require("resend");
const crypto = require("node:crypto");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const codes = new Map();

app.use(express.json());
app.use(express.static("public"));

const normalizeEmail = value =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

app.post("/api/send-code", async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Vul een geldig e-mailadres in." });
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  codes.set(email, {
    codeHash,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0
  });

  try {
    await resend.emails.send({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Je verificatiecode",
      text: `Je verificatiecode is ${code}. Deze code is 10 minuten geldig.`
    });

    res.json({ message: "Verificatiecode verstuurd." });
  } catch (error) {
    codes.delete(email);
    console.error("Mail versturen mislukt:", error);
    res.status(502).json({ error: "De verificatiemail kon niet worden verstuurd." });
  }
});

app.post("/api/verify-code", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
  const record = codes.get(email);

  if (!record || Date.now() > record.expiresAt) {
    codes.delete(email);
    return res.status(400).json({ error: "Code verlopen of niet aangevraagd." });
  }

  record.attempts++;

  if (record.attempts > 5) {
    codes.delete(email);
    return res.status(429).json({ error: "Te veel pogingen. Vraag een nieuwe code aan." });
  }

  const submittedHash = crypto.createHash("sha256").update(code).digest("hex");

  if (!/^\d{6}$/.test(code) ||
      !crypto.timingSafeEqual(
        Buffer.from(submittedHash, "hex"),
        Buffer.from(record.codeHash, "hex")
      )) {
    return res.status(400).json({ error: "Onjuiste verificatiecode." });
  }

  codes.delete(email);
  res.json({ verified: true, message: "E-mailadres geverifieerd." });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server actief op http://localhost:${process.env.PORT || 3000}`);
});
