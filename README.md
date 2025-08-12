# Globetrotter Travel App

A comprehensive travel planning and management application that helps users plan their trips, manage itineraries, and estimate travel budgets.

## vedio link - https://drive.google.com/drive/folders/1CSWYvQ_gbozhT0ULjdQbx-8F7aNpplEN

## Features

- 🗺️ Trip planning with multiple destinations
- 📅 Interactive calendar view for itinerary management
- 💰 Budget estimation for trips
- 🏨 Accommodation and activity management
- 📱 Responsive design for all devices
- 🔐 User authentication and authorization
- 🧭 Distance calculation between destinations
- 📊 Cost breakdown for trips

## Tech Stack

- **Frontend**: Next.js 13+ with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT
- **Maps**: Integrated with Google Maps API
- **Icons**: Lucide React Icons

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn
- PostgreSQL database
- Google Maps API key (for location services)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/globetrotter-travel-app.git
   cd globetrotter-travel-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following variables:
   ```
   DATABASE_URL=your_postgres_connection_string
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   JWT_SECRET=your_jwt_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. Run database migrations:
   ```bash
   npx drizzle-kit push:pg
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
globetrotter-travel-app/
├── app/                    # App router pages and API routes
├── components/             # Reusable UI components
├── lib/                    # Utility functions and database configuration
├── public/                 # Static files
├── styles/                 # Global styles
└── types/                  # TypeScript type definitions
```

## Available Scripts

- `dev` - Start the development server
- `build` - Build the application for production
- `start` - Start the production server
- `lint` - Run ESLint
- `type-check` - Check TypeScript types

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `JWT_SECRET` - Secret key for JWT tokens
- `NEXTAUTH_URL` - Base URL of the application
- `NEXTAUTH_SECRET` - Secret for NextAuth.js

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI Components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

Happy Travel Planning! ✈️🌍
