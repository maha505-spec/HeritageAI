# HeritageAI – Ancient Text Digitalization System

HeritageAI is a full-stack AI application designed to digitize and analyze ancient manuscripts such as palm leaf texts, inscriptions, and historical documents.

## Features

- **AI-Powered OCR**: Extract text from images of ancient manuscripts using Gemini Vision.
- **NLP Pipeline**: Automatic text cleaning, summarization, and translation into modern English.
- **Historical Insights**: AI-generated explanations of the historical significance of manuscripts.
- **Entity Extraction**: Detects Kings, Dynasties, Temples, Places, and Events.
- **Interactive Knowledge Graph**: Visualizes relationships between historical entities using D3.js.
- **Digital Archive**: Secure personal storage for all processed manuscripts.
- **Semantic Search**: Find manuscripts based on historical context and keywords.
- **User Authentication**: Secure Google Login via Firebase.

## Technology Stack

- **Frontend**: React 19, Tailwind CSS 4, Framer Motion
- **Backend/Database**: Firebase (Auth & Firestore)
- **AI Engine**: Google Gemini (Flash 2.0)
- **Visualization**: D3.js
- **Icons**: Lucide React

## Architecture

1. **Upload**: User uploads manuscript image.
2. **Analysis**: Gemini processes the image (OCR -> NLP -> Insight).
3. **Storage**: Results are stored in Firestore under the user's profile.
4. **Visualization**: Entities are mapped to an interactive force-directed graph.
5. **Retrieval**: Users can search and browse their digital archive.

## Getting Started

1. Sign in with your Google account.
2. Go to the **Upload** section and drop a manuscript image.
3. Wait for the AI to process and extract historical data.
4. Explore the **Knowledge Graph** and **Digital Archive**.

## Future Improvements

- **Blockchain Verification**: Integrate IPFS for tamper-proof manuscript hashing.
- **Multi-language Support**: Expand OCR capabilities for more regional ancient scripts.
- **Collaborative Research**: Allow researchers to share and annotate manuscripts.
