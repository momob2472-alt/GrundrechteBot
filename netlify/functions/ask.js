const https = require('https');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;
  
  try {
    const { question } = JSON.parse(event.body);
    
    const postData = JSON.stringify({
      model: "mixtral-8x7b-32768",
      messages: [{
        role: "user",
        content: question
      }],
      temperature: 0.7,
      max_tokens: 500
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data: data });
        });
      });
      
      req.on('error', (e) => reject(e));
      req.write(postData);
      req.end();
    });

    console.log('Groq Response Status:', result.status);
    
    if (result.status === 200) {
      const parsed = JSON.parse(result.data);
      const answer = parsed.choices?.[0]?.message?.content || "Keine Antwort erhalten";
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ answer: answer })
      };
    } else {
      throw new Error(`Groq API Error: ${result.status} - ${result.data}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
};
