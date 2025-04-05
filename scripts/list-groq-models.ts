const { Groq } = require('groq-sdk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    // Try to get available models
    const models = await groq.models.list();
    console.log('Available Groq models:');
    console.log(JSON.stringify(models, null, 2));
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

main(); 