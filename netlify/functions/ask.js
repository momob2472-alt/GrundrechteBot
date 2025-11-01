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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const { question, area, context } = JSON.parse(event.body);

    const areaDescriptions = {
      'oeffentlich': 'Öffentliches Recht (Staatsrecht, Verwaltungsrecht, Verfassungsrecht)',
      'zivil': 'Zivilrecht (BGB, Schuldrecht, Sachenrecht)',
      'straf': 'Strafrecht (Allgemeiner und Besonderer Teil)'
    };

    const systemPrompt = `Du bist ein spezialisierter Rechtsassistent für Jurastudenten im Bereich ${areaDescriptions[area] || 'Recht'}.

Deine Aufgaben:
- Unterstütze beim Erlernen des Gutachtenstils (Obersatz, Definition, Subsumtion, Ergebnis).
- Gib präzise, faktenbasierte Antworten.
- Verwende eine akademisch angemessene, aber verständliche Sprache.
- Strukturiere deine Antworten klar nach der Gutachtenmethodik.
- Antworte immer auf Deutsch.

Wichtiger Hinweis zur Beantwortung:
${context}`;

    const fullPrompt = `${systemPrompt}\n\nFrage: ${question}`;

    const result = await model.generateContent(fullPrompt);
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
