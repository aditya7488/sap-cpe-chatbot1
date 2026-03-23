export default async function handler(req, res) {
  try {
    const { message, knowledge, system } =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const finalPrompt = `
${system}

${knowledge}

User: ${message}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyXXXXXXXX`,
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

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
