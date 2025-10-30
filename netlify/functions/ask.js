const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No API Key configured' }) };
  }

  try {
    const { question } = JSON.parse(event.body);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: "Du bist ein hilfreicher Assistent für das deutsche Grundgesetz. Antworte präzise und verständlich auf Deutsch.",
        },
        {
          role: "model",
          parts: "Verstanden. Ich bin bereit, Fragen zum deutschen Grundgesetz zu beantworten.",
        },
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(question);
    const response = await result.response;
    const botAnswer = response.text();

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ answer: botAnswer })
    };

  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
};
