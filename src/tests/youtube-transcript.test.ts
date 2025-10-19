/**
 * YouTube Transcript Test - TypeScript Version
 * Tests YouTube transcript extraction functionality
 */

import { YoutubeTranscript } from "youtube-transcript";

interface VideoTest {
    name: string;
    id: string;
    url: string;
}

const testVideos: VideoTest[] = [
    {
        name: "Sample Tech Video 1",
        id: "ywPDnh4T2TA",
        url: "https://youtu.be/ywPDnh4T2TA"
    },
    {
        name: "Sample Tech Video 2",
        id: "cNfINi5CNbY",
        url: "https://www.youtube.com/watch?v=cNfINi5CNbY"
    },
    {
        name: "Popular Video",
        id: "jNQXAC9IVRw",
        url: "https://www.youtube.com/watch?v=jNQXAC9IVRw"
    }
];

async function testYouTubeTranscripts(): Promise<void> {
    console.log("🧪 YouTube Transcript Extraction Test\n");
    console.log("=".repeat(70) + "\n");

    let successCount = 0;
    let failCount = 0;

    for (const video of testVideos) {
        console.log(`📹 Testing: ${video.name}`);
        console.log(`   ID: ${video.id}`);
        console.log(`   URL: ${video.url}`);
        console.log("-".repeat(70));

        try {
            const transcript = await YoutubeTranscript.fetchTranscript(video.id, {
                lang: 'en'
            });

            if (transcript && transcript.length > 0) {
                const fullText = transcript.map((t: any) => t.text).join(' ');
                console.log(`   ✅ SUCCESS! Found ${transcript.length} caption segments`);
                console.log(`   📊 Total length: ${fullText.length} characters`);
                console.log(`   📝 Preview: "${fullText.substring(0, 150)}..."\n`);
                successCount++;
            } else {
                console.log(`   ⚠️  No captions available\n`);
                failCount++;
            }
        } catch (error: any) {
            console.log(`   ❌ Error: ${error.message}\n`);
            failCount++;
        }
    }

    console.log("=".repeat(70));
    console.log(`\n📊 Results: ${successCount} successful, ${failCount} failed`);
    console.log("\n💡 Note:");
    console.log("   - Only videos with available captions can be analyzed");
    console.log("   - Gemini free tier cannot extract audio or visual content");
    console.log("   - Enable captions on your YouTube videos for AI analysis\n");
}

// Run the test
testYouTubeTranscripts().catch(console.error);
