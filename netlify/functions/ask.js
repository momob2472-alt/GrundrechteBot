const https = require('https');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No API Key found");
    return { statusCode: 500, body: JSON.stringify({ error: 'No API Key configured' }) };
  }

  try {
    const { question } = JSON.parse(event.body);
    
    // Verwenden Sie das aktuelle Modell und v1 statt v1beta
    const postData = JSON.stringify({
      contents: [{
        parts: [{
          text: `Du bist ein Assistent für das deutsche Grundgesetz. Beantworte diese Frage: ${question}`
        }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const botAnswer = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('Status:', res.statusCode);
          console.log('Response:', data);
          
          if (res.statusCode !== 200) {
            reject(new Error(`API Error ${res.statusCode}: ${data}`));
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.candidates && parsed.candidates[0]) {
              resolve(parsed.candidates[0].content.parts[0].text);
            } else {
              reject(new Error('Unexpected response format'));
            }
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
      body: JSON.stringify({ 
        error: 'Server error', 
        details: error.message 
      })
    };
  }
};
