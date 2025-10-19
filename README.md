# Brainly Backend

Express + TypeScript API for user auth, content management, and Gemini AI summarization/QA.

## Requirements
- Node.js 18+
- MongoDB (Atlas or local)
- Google Gemini API key

## Environment variables (.env)
Set these in a `.env` file in this folder:

- PORT=3000
- JWT_SECRET=change_me
- MONGO_URI=mongodb+srv://<user>:<pass>@cluster/.../Brainly
- GEMINI_API_KEY=your_gemini_key
- FRONTEND_URL=http://localhost:5173

## Install and run
- npm install
- npm run build
- npm run start

For development with watch:
- npm run dev:watch

## API
- POST /api/v1/signup
- POST /api/v1/signin
- POST /api/v1/content (auth)
- GET  /api/v1/content (auth)
- DELETE /api/v1/content (auth)
- POST /api/v1/brain/share (auth)
- GET  /api/v1/brain/:shareLink
- POST /api/v1/ai/summarize (auth)
- POST /api/v1/ai/ask (auth)
- GET  /api/v1/ai/insights (auth)

## Notes
- Ensure transcripts exist for best YouTube analysis.
- Do not commit your `.env` or `node_modules`. A `.gitignore` is included.
