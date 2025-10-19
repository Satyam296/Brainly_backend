/**
 * Gemini API Test - TypeScript Version
 * Tests basic Gemini API functionality
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function testGeminiAPI(): Promise<void> {
    console.log("🧪 Gemini API Connection Test\n");
    console.log("=".repeat(70) + "\n");

    // Check API key
    if (!GEMINI_API_KEY) {
        console.log("❌ ERROR: GEMINI_API_KEY not found in environment variables");
        console.log("   Please set GEMINI_API_KEY in your .env file\n");
        return;
    }

    console.log(`✅ API Key loaded: ${GEMINI_API_KEY.substring(0, 10)}...`);
    console.log("-".repeat(70) + "\n");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Test with different models
    const modelsToTest = [
        "gemini-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    for (const modelName of modelsToTest) {
        console.log(`\n📡 Testing model: ${modelName}`);
        console.log("-".repeat(70));

        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const prompt = "Write a short 2-sentence summary about artificial intelligence.";
            console.log(`   Sending test prompt...`);
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log(`   ✅ SUCCESS!`);
            console.log(`   📝 Response length: ${text.length} characters`);
            console.log(`   📄 Response: "${text}"\n`);
            
            // If one works, we can stop
            console.log(`\n✅ Model "${modelName}" is working!`);
            break;

        } catch (error: any) {
            console.log(`   ❌ Failed: ${error.message}`);
            
            if (error.status) {
                console.log(`   📊 Status: ${error.status} ${error.statusText}`);
            }
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n💡 Recommendation:");
    console.log("   - Use the model that worked successfully");
    console.log("   - Update gemini.ts to use the working model name");
    console.log("   - gemini-pro is the most stable for free tier\n");
}

// Run the test
testGeminiAPI().catch(console.error);
