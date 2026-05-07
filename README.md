# Aurelius Finance

A sophisticated AI-powered expense tracker with beautiful data visualizations, glassmorphic design, and smart financial insights.

## Features

- **Intuitive Expense Tracking**: Add, edit, and delete transactions with ease.
- **AI-Powered Insights**: Get personalized financial advice and spending analysis powered by Google Gemini.
- **Beautiful Visualizations**: Interactive charts for spending categories and cash flow trends.
- **Multi-Currency Support**: Support for USD, Saudi Rial (SAR), and Bangladesh Taka (BDT).
- **Glassmorphic Design**: A modern, high-end user interface with responsive layouts.
- **Data Export**: Export your transactions to Excel for further analysis.

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **AI**: Google Gemini API via @google/genai
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd react-example
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Note: You can get an API key from [Google AI Studio](https://aistudio.google.com/).*

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs type-checking.

## License

This project is licensed under the Apache 2.0 License.
