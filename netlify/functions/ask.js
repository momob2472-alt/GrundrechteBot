const https = require('https');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY; // Neuer Key Name!
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API Key not found.' }) };
  }

  try {
    const { question } = JSON.parse(event.body);
    
    const postData = JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{
        role: "system",
        content: "Du bist ein hilfreicher Assistent für das deutsche Grundgesetz. Antworte präzise und verständlich auf Deutsch."
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
};
