import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { message } = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const dataDir = path.join(process.cwd(), "data");
    const files = fs.readdirSync(dataDir);

    let knowledge = "";

    // ✅ Read only .txt files
    files.forEach(file => {
      if (file.endsWith(".txt")) {
        const filePath = path.join(dataDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        knowledge += content + "\n\n";
      }
    });

    console.log("Loaded knowledge length:", knowledge.length);

    if (!knowledge) {
      return res.status(500).json({
        error: "No dataset loaded"
      });
    }

    // 🔥 Simple filtering
    const chunks = knowledge.split("\n\n");

    const relevantChunks = chunks
      .filter(chunk =>
        chunk.toLowerCase().includes(message.toLowerCase())
      )
      .slice(0, 5);

    const finalKnowledge =
      relevantChunks.join("\n\n") || knowledge.slice(0, 1500);

    const finalPrompt = `
You are an SAP CPE expert.

${finalKnowledge}

User: ${message}
`;

    // 🔥 GEMINI CALL (FINAL FIX)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: finalPrompt }]
            }
          ]
        }),
      }
    );

    const data = await response.json();

    console.log("Gemini response:", JSON.stringify(data));

    let reply = "No response from AI";

    if (data?.candidates?.length) {
      reply = data.candidates[0]?.content?.parts?.[0]?.text || reply;
    } else if (data?.error) {
      reply = "API Error: " + data.error.message;
    }

    res.status(200).json({ reply });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
}
