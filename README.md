# Summaryr - AI-Powered Document Study Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/programmerperson2021-gmailcoms-projects/v0-text-extraction-saa-s)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

## 📚 Overview

Summaryr is an intelligent document study platform that transforms your PDFs and web documents into interactive learning materials. Upload documents, extract text with AWS Textract, and generate AI-powered flashcards, questions, summaries, and explanations to enhance your learning experience.

## ✨ Features

### 📄 Document Management
- **PDF Upload & Processing** - Upload PDFs with automatic text extraction using AWS Textract
- **Web Document Support** - Import and study web content with full markdown rendering
- **Document Viewer** - Enhanced PDF and web document viewer with text selection
- **Print Functionality** - Print documents with optimized layouts

### 🧠 AI-Powered Study Tools
- **Flashcards** - Generate AI flashcards from document content with spaced repetition
- **Questions** - Create multiple question types:
  - Multiple Choice (MCQ)
  - True/False
  - Fill in the Blank (with inline inputs)
  - Short Answer
  - Essay
- **Summaries** - Auto-generate document summaries
- **Explanations** - Get AI explanations for selected text
- **Notes** - Take and organize notes on documents

### 🎯 Practice & Learning
- **Practice Mode** - Quiz yourself with spaced repetition algorithm
- **Quiz Mode** - Timed practice sessions with progress tracking
- **Collaborative Sessions** - Study together with real-time collaborative practice
  - Host practice sessions
  - Join with session codes
  - Real-time participant tracking
  - Leaderboard and scoring

### 💬 Interactive Features
- **Document Chat** - Chat with AI about your documents
- **Text Selection Toolbar** - Quick actions on selected text (explain, summarize, create flashcards/questions)
- **Resizable Sidebar** - Organize all study materials in a convenient sidebar

### 📊 Progress Tracking
- **Study Statistics** - Track your learning progress
- **Spaced Repetition** - Intelligent review scheduling based on performance
- **Performance Analytics** - View correct/incorrect answers and improvement trends

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: AWS S3 + CloudFront
- **Text Extraction**: AWS Textract
- **AI**: OpenAI GPT-4
- **Styling**: Tailwind CSS + shadcn/ui
- **PDF Rendering**: react-pdf
- **Markdown**: react-markdown with syntax highlighting

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ahmadnk31/summaryr.git
   cd summaryr
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # AWS
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_S3_BUCKET_NAME=your_bucket_name
   AWS_CLOUDFRONT_DOMAIN=your_cloudfront_domain

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Resend (for emails)
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Run database migrations**
   Follow the setup guides in:
   - `DATABASE_SETUP.md`
   - `AWS_TEXTRACT_SETUP.md`
   - `AWS_S3_CLOUDFRONT_SETUP.md`

5. **Start development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

- [Database Setup Guide](DATABASE_SETUP.md)
- [AWS Textract Setup](AWS_TEXTRACT_SETUP.md)
- [S3 & CloudFront Setup](AWS_S3_CLOUDFRONT_SETUP.md)
- [Collaborative Practice Guide](COLLABORATIVE_PRACTICE_QUICKSTART.md)
- [Spaced Repetition Guide](SPACED_REPETITION_QUICKSTART.md)

## 🎨 Key Components

- **Document Viewer** - `components/document-viewer-client.tsx`
- **Web Document Viewer** - `components/web-document-viewer-client.tsx`
- **Question List** - `components/question-list.tsx`
- **Flashcard Practice** - `components/practice-flashcards.tsx`
- **Collaborative Session** - `components/collaborative-practice-session.tsx`
- **Document Chat** - `components/document-chat.tsx`

## 🛠️ Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Supabase, and AWS