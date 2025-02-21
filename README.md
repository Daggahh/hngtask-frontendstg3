# AIFlow - Text Processing Application

AIFlow is a Next.js application that provides powerful text processing capabilities including translation, summarization, and language detection using Chrome's experimental AI features.

## Features

- **Text Translation**: Translate text between multiple languages
- **Text Summarization**: Generate concise summaries of long texts
- **Language Detection**: Automatically detect the source language
- **Chat History**: Save and manage chat sessions
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+
- Chrome browser with experimental features enabled
- Windows/macOS/Linux

## Setting Up Chrome

1. Open Chrome and navigate to `chrome://flags/`
2. Enable the following flags:
   - Experimental Web Platform features
   -Summary API
   - Language Detection API
   - Translation API
3. Restart Chrome

## Installation

```bash
# Clone the repository
git clone https://github.com/Daggahh/hngtask-frontendstg3.git

# Install dependencies
npm install

# Create a .env file and add required environment variables
cp .env.example .env
```

## Running the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to use the application.

## Usage

1. Login with your USERname
2. Type or paste text in the input area
3. Use the toolbar to:
   - Translate text
   - Generate summaries
4. View chat history in the sidebar
5. Toggle between light/dark modes

## Project Structure

```
src/
├── app/          # Next.js pages and layouts
├── components/   # React components
├── hooks/        # Custom React hooks
├── lib/          # Utility functions
├── services/     # API services
└── types/        # TypeScript types
```

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Radix UI
- Chrome AI APIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request