// Check available Gemini models
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAvailableModels() {
    console.log("🔍 Fetching available Gemini models...\n");

    // Try different model names
    const modelsToTry = [
        "gemini-pro",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.0-pro"
    ];

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'Hello'");
            const response = await result.response;
            console.log(`✅ ${modelName} - WORKS`);
        } catch (error) {
            console.log(`❌ ${modelName} - FAILED: ${error.message.substring(0, 80)}...`);
        }
    }
}

listAvailableModels();