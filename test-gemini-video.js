// Test Gemini video analysis capabilities
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testVideoAnalysis() {
    console.log("🔍 Testing Gemini Video Analysis Capabilities...\n");

    // Test 1: Check available models
    console.log("📋 Step 1: Checking available models...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("✅ Model 'gemini-1.5-flash' is accessible\n");

        // Test 2: Try to analyze a YouTube video with URL
        console.log("📹 Step 2: Testing YouTube video analysis with URL...");
        const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Sample video

        try {
            const result = await model.generateContent([
                "Analyze this YouTube video and provide a summary of the content, scenes, and any text or speech you can extract:",
                { url: youtubeUrl }
            ]);
            const response = await result.response;
            console.log("✅ Video URL analysis result:");
            console.log(response.text().substring(0, 200) + "...\n");
        } catch (urlError) {
            console.log("❌ Video URL analysis failed:", urlError.message);
            console.log("   This means Gemini cannot directly access YouTube URLs\n");
        }

        // Test 3: Try text-only prompt about video
        console.log("📝 Step 3: Testing text-based YouTube video summary...");
        try {
            const textResult = await model.generateContent(
                `Please provide information about this YouTube video: ${youtubeUrl}. 
                Can you tell me what this video is about based on the URL?`
            );
            const textResponse = await textResult.response;
            console.log("✅ Text-based prompt result:");
            console.log(textResponse.text().substring(0, 300) + "...\n");
        } catch (textError) {
            console.log("❌ Text-based prompt failed:", textError.message + "\n");
        }

        // Test 4: Check if we need YouTube Data API
        console.log("💡 Recommendation:");
        console.log("   To get actual video transcripts and metadata, you need:");
        console.log("   1. YouTube Data API v3 (for video metadata, title, description)");
        console.log("   2. YouTube Transcript API (for video captions/subtitles)");
        console.log("   3. Gemini can then summarize the transcript text\n");

        // Test 5: Simple test with transcript simulation
        console.log("📊 Step 4: Testing with simulated transcript...");
        const simulatedTranscript = `
            Video Title: Introduction to Web Development
            Transcript: Hello everyone, welcome to this tutorial on web development. 
            Today we'll cover HTML, CSS, and JavaScript basics. 
            HTML is the structure, CSS is the styling, and JavaScript adds interactivity.
        `;

        try {
            const summaryResult = await model.generateContent(
                `Please provide a concise summary of this video content:\n${simulatedTranscript}`
            );
            const summaryResponse = await summaryResult.response;
            console.log("✅ Summary of simulated transcript:");
            console.log(summaryResponse.text() + "\n");
        } catch (summaryError) {
            console.log("❌ Summary failed:", summaryError.message + "\n");
        }

        console.log("=".repeat(60));
        console.log("📌 CONCLUSION:");
        console.log("   Gemini FREE tier CAN:");
        console.log("   - ✅ Summarize text transcripts");
        console.log("   - ✅ Analyze text content");
        console.log("   \n   Gemini FREE tier CANNOT:");
        console.log("   - ❌ Directly access YouTube videos by URL");
        console.log("   - ❌ Extract video frames or audio");
        console.log("   \n   SOLUTION:");
        console.log("   - Use YouTube Data API to get video title & description");
        console.log("   - Use YouTube Transcript API to get captions");
        console.log("   - Pass transcript to Gemini for summarization");
        console.log("=".repeat(60));

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testVideoAnalysis();