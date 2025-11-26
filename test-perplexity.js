// Quick test script for Perplexity API
// Run with: node test-perplexity.js

const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const perplexity = new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: 'https://api.perplexity.ai',
});

async function testPerplexity() {
    try {
        console.log('Testing Perplexity API...');
        console.log('API Key:', process.env.PERPLEXITY_API_KEY ? 'Found (length: ' + process.env.PERPLEXITY_API_KEY.length + ')' : 'NOT FOUND');

        const response = await perplexity.chat.completions.create({
            model: 'sonar-pro',
            messages: [
                { role: 'user', content: 'Say hello' }
            ],
        });

        console.log('✅ SUCCESS!');
        console.log('Response:', response.choices[0].message.content);
    } catch (error) {
        console.log('❌ ERROR:');
        console.log('Status:', error.status);
        console.log('Message:', error.message);
        console.log('\nFull error:', error);
    }
}

testPerplexity();
