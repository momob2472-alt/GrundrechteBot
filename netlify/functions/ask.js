const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { question } = JSON.parse(event.body);
    const apiKey = process.env.GOOGLE_API_KEY; 
   const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const systemInstruction = "Du bist ein hilfreicher Assistent namens GrundrechteBot. Deine Aufgabe ist es, Fragen zum deutschen Grundgesetz klar, präzise und für Laien verständlich zu beantworten. Beziehe dich immer auf die relevanten Artikel. Antworte ausschließlich auf Deutsch.";

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemInstruction }, { text: `Frage: ${question}` }] }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const botAnswer = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ answer: botAnswer }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Es gab ein internes Problem.' }),
    };
  }
};
