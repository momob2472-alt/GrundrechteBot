// Ein einfacherer HTTPS-Request ohne 'node-fetch'
const https = require('https');

exports.handler = async function (event, context) {
  // Nur POST-Anfragen erlauben
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: 'API Key not found.' };
  }

  try {
    const { question } = JSON.parse(event.body);
    const systemInstruction = "Du bist ein hilfreicher Assistent namens GrundrechteBot. Deine Aufgabe ist es, Fragen zum deutschen Grundgesetz klar, präzise und für Laien verständlich zu beantworten. Beziehe dich immer auf die relevanten Artikel. Antworte ausschließlich auf Deutsch.";

    const postData = JSON.stringify({
      contents: [{
        parts: [
          { text: systemInstruction },
          { text: `Frage: ${question}` }
        ]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    // Wir führen die Anfrage aus und warten auf die Antwort
    const botAnswer = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Google API responded with status: ${res.statusCode}`));
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData.candidates[0].content.parts[0].text);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(postData);
      req.end();
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ answer: botAnswer })
    };

  } catch (error) {
    console.error('Detailed Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Es gab ein internes Problem.', details: error.message })
    };
  }
};
    };
  }
};
