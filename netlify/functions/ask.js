const https = require('https');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No API Key configured' }) };
  }

  try {
    const { question, area, context } = JSON.parse(event.body);
    
    const areaDescriptions = {
      'oeffentlich': 'Öffentliches Recht (Staatsrecht, Verwaltungsrecht, Verfassungsrecht)',
      'zivil': 'Zivilrecht (BGB, Schuldrecht, Sachenrecht)',
      'straf': 'Strafrecht (Allgemeiner und Besonderer Teil)'
    };
    
    const systemPrompt = `Du bist ein spezialisierter Rechtsassistent für Jurastudenten im Bereich ${areaDescriptions[area] || 'Recht'}.
    
Deine Aufgaben:
- Unterstütze beim Erlernen des Gutachtenstils (Obersatz, Definition, Subsumtion, Ergebnis)
- Arbeite ausschließlich mit den hochgeladenen Dokumenten des Nutzers
- Gib präzise, faktenbasierte Antworten
- Verwende eine akademisch angemessene, aber verständliche Sprache
- Strukturiere deine Antworten klar nach der Gutachtenmethodik

${context || ''}

Antworte auf Deutsch und beziehe dich nur auf die bereitgestellten Dokumente.`;
    
    const postData = JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: question
      }],
      temperature: 0.7,
      max_tokens: 1024
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    };

    const botAnswer = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('Status:', res.statusCode);
          
          if (res.statusCode !== 200) {
            reject(new Error(`API Error ${res.statusCode}: ${data}`));
            return;
          }
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.choices[0].message.content);
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

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
