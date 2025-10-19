import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import * as cheerio from "cheerio";
import { YoutubeTranscript } from "youtube-transcript";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Validate API key on module load
if (!GEMINI_API_KEY) {
    console.error("⚠️  WARNING: GEMINI_API_KEY is not set in environment variables!");
} else {
    console.log("✅ Gemini API Key loaded:", GEMINI_API_KEY.substring(0, 10) + "...");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Function to fetch YouTube video transcript
async function fetchYouTubeTranscript(videoUrl: string): Promise<string> {
    try {
        const videoId = extractYouTubeVideoId(videoUrl);
        if (!videoId) {
            console.log("Could not extract video ID from URL");
            return "";
        }

        console.log(`Fetching transcript for video ID: ${videoId}`);
        const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcriptArray || transcriptArray.length === 0) {
            console.log("No transcript available for this video");
            return "";
        }

        // Combine all transcript segments into one text
        const fullTranscript = transcriptArray
            .map((segment: any) => segment.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        console.log(`✅ Transcript fetched: ${fullTranscript.length} characters`);
        
        // Limit to 15000 characters to avoid token limits
        return fullTranscript.substring(0, 15000);
    } catch (error) {
        console.error("Error fetching YouTube transcript:", error);
        return "";
    }
}

// Function to extract content from a URL
async function fetchContentFromUrl(url: string): Promise<string> {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        // Remove script and style elements
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();
        
        // Get the main text content
        let text = $('article').text() || $('main').text() || $('body').text();
        
        // Clean up the text
        text = text.replace(/\s+/g, ' ').trim();
        
        // Limit to first 5000 characters to avoid token limits
        return text.substring(0, 5000);
    } catch (error) {
        console.error("Error fetching content:", error);
        return "";
    }
}

// Function to get content based on type
async function getContentText(link: string, type: string): Promise<string> {
    try {
        // For YouTube, fetch actual transcript
        if (type === "youtube") {
            console.log(`📹 Attempting to fetch YouTube transcript...`);
            const transcript = await fetchYouTubeTranscript(link);
            
            if (transcript && transcript.length > 100) {
                console.log(`✅ Using video transcript (${transcript.length} chars)`);
                return `YouTube Video Transcript:\n\n${transcript}`;
            } else {
                console.log(`⚠️  No transcript available. Gemini cannot analyze video content without transcripts.`);
                const videoId = extractYouTubeVideoId(link);
                return `This is a YouTube video.
Title Context: Please note that this video does not have captions/transcripts available.
Video URL: ${link}
Video ID: ${videoId}

Since I cannot access the video content directly, I can only provide general information based on the video title and context you've provided. For a detailed analysis, please:
1. Enable captions on your YouTube video, or
2. Provide a brief description of the video content, or
3. Use videos that have auto-generated or manual captions available.

Note: Gemini AI (free tier) cannot extract audio, scenes, or visual content from videos. It can only analyze text-based transcripts when available.`;
            }
        } 
        
        // For Twitter
        else if (type === "twitter" || type === "instagram" || type === "linkedin" || type === "tiktok") {
            return `This is a ${type} post. URL: ${link}\nPlease provide general insights about ${type} content based on the URL and typical content patterns on this platform.`;
        } 
        
        else if (type === "link" || type === "document") {
            console.log(`Attempting to fetch content from: ${link}`);
            const content = await fetchContentFromUrl(link);
            if (content && content.length > 50) {
                console.log(`Successfully fetched ${content.length} characters`);
                // Limit content to first 10000 characters to avoid token limits
                return content.substring(0, 10000);
            }
            return `Content from: ${link}\nUnable to fetch full content, but please provide insights based on the URL.`;
        }
        
        // For notes
        else if (type === "notes") {
            return link; // For notes, the 'link' field contains the actual note text
        }
        
        return `Content type: ${type}\nURL: ${link}`;
    } catch (error) {
        console.error(`Error in getContentText for ${type}:`, error);
        return `URL: ${link}\nContent type: ${type}`;
    }
}

// Function to summarize content
export async function summarizeContent(link: string, type: string, title: string): Promise<string> {
    try {
        console.log(`=== SUMMARIZE REQUEST ===`);
        console.log(`Title: ${title}`);
        console.log(`Type: ${type}`);
        console.log(`Link: ${link}`);
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const contentText = await getContentText(link, type);
        console.log(`Content text length: ${contentText.length} characters`);
        
        const prompt = `Please provide a concise and informative summary of the following content titled "${title}":

${contentText}

Provide a helpful and structured summary. If the content indicates that video transcripts or full content are not available, acknowledge this limitation and provide whatever insights are possible based on the title, URL, and context provided.

Summary:`;

        console.log('Sending request to Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();   
        
        console.log('Summary generated successfully');
        return summary;
    } catch (error: any) {
        console.error("Error generating summary:", error);
        console.error("Error details:", error.message);
        
        // Return helpful error message
        if (error.message && error.message.includes('404')) {
            throw new Error(`Gemini model not available. Please check your API key and try again.`);
        }
        throw new Error(`Failed to generate summary: ${error.message}`);
    }
}

// Function to answer questions about content
export async function askQuestionAboutContent(
    link: string, 
    type: string, 
    title: string, 
    question: string
): Promise<string> {
    try {
        console.log(`=== ASK QUESTION REQUEST ===`);
        console.log(`Title: ${title}`);
        console.log(`Type: ${type}`);
        console.log(`Link: ${link}`);
        console.log(`Question: ${question}`);
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const contentText = await getContentText(link, type);
        console.log(`Content text length: ${contentText.length} characters`);
        
        const prompt = `Based on the following content titled "${title}":

${contentText}

Please answer this question: ${question}

Even if you cannot access the full content, provide a helpful answer based on the title, URL, and available information.

Answer:`;

        console.log('Sending question to Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();
        
        console.log('Answer generated successfully');
        return answer;
    } catch (error: any) {
        console.error("Error answering question:", error);
        console.error("Error details:", error.message);
        throw new Error(`Failed to answer question: ${error.message}`);
    }
}

// Function to generate insights from multiple contents
export async function generateInsights(contents: Array<{title: string, link: string, type: string}>): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const contentList = contents.map((c, index) => 
            `${index + 1}. ${c.title} (${c.type}): ${c.link}`
        ).join('\n');
        
        const prompt = `Based on this collection of saved content:

${contentList}

Please provide:
1. Key themes and topics
2. Interesting connections between the items
3. Suggestions for related content to explore

Insights:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const insights = response.text();
        
        return insights;
    } catch (error) {
        console.error("Error generating insights:", error);
        throw new Error("Failed to generate insights");
    }
}
