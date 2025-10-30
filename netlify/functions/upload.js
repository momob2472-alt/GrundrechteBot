
const { GoogleGenerativeAI } = require("@google/generative-ai");
const busboy = require("busboy");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No API Key configured" }),
    };
  }

  try {
    const fields = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: event.headers });
      const fields = {};

      bb.on("file", (fieldname, file, filename, encoding, mimetype) => {
        let content = "";
        file.on("data", (data) => {
          content += data.toString();
        });
        file.on("end", () => {
          fields[fieldname] = content;
        });
      });

      bb.on("finish", () => {
        resolve(fields);
      });

      bb.on("error", reject);
      bb.end(Buffer.from(event.body, "base64"));
    });

    const fileContent = fields.file;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    const result = await model.embedContent(fileContent);
    const embedding = result.embedding.values;

    // TODO: In a real application, you would store this embedding in a vector database.
    // For this example, we'll just return a success message and log the embedding.
    console.log("Generated embedding:", embedding);

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "File uploaded and processed successfully.",
      }),
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: error.message }),
    };
  }
};
