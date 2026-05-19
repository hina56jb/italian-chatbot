import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",

      messages: [
        {
          role: "system",
          content: `
You are a professional shopping assistant chatbot.

Your tasks:
- Help customers find products
- Recommend products
- Answer shopping questions
- Explain product features
- Be friendly and short
          `,
        },

        {
          role: "user",
          content: message,
        },
      ],

      max_tokens: 300,
      temperature: 0.7,
    });

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Server Error",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Shopping Chatbot API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});