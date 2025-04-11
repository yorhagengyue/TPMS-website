# TPMS - Temasek Polytechnic Mindsport Club Website

This is the official website for the Temasek Polytechnic CCA (Co-Curricular Activity) TPMS (TP Mindsport) club. The platform serves as a central hub for club activities, member management, and event coordination.

## Features

- **Modern Responsive Interface**: Fully responsive design optimized for all device sizes
- **Digital Attendance System**: Track and manage student attendance at club activities
- **Events Calendar**: Display upcoming tournaments, workshops, and regular club meetings
- **News Section**: Highlight club achievements and announcements
- **Member Management**: Import/export member data using Excel spreadsheets

## Technical Implementation

- **Frontend Framework**: React.js
- **Styling**: Tailwind CSS with custom color theming
- **Animations**: Framer Motion for smooth transitions and effects
- **Data Handling**: 
  - Excel integration using XLSX library
  - Local storage for persistent data without backend dependency
- **Icons**: React Icons (FI set)
- **Package Management**: npm

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Project Structure

```
/
├── src/
│   ├── components/           # React components
│   │   ├── ui/               # UI components
│   │   │   ├── button/       # Button components
│   │   │   ├── card/         # Card components
│   │   │   └── layout/       # Layout components
│   │   └── pages/            # Page components
│   ├── lib/                  # Utility functions
│   ├── styles/               # Global styles
│   └── App.jsx               # Main application component
├── public/                   # Static assets
└── config/                   # Configuration files
```

## Requirements

### Environment Requirements
- Node.js 16.0 or higher
- npm 7.0 or higher

### Installation Steps

1. Clone the project
```bash
git clone [repository URL]
cd tpms
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm start
```

4. Build for production
```bash
npm run build
```

### Configuration Details

1. Location Service Configuration
Set campus coordinates in `src/App.jsx`:
```javascript
const tpLocation = { 
  lat: 1.3456,   // latitude
  lng: 103.9321  // longitude
};
```

2. Check-in Range Settings
Adjust in `src/components/pages/CheckinPage.jsx`:
```javascript
const CHECKIN_RADIUS = 0.5; // unit: kilometers
```

## Development Guidelines

### Code Standards
- Use ESLint for code linting
- Follow React best practices
- Use Prettier for code formatting

### Commit Standards
```bash
feat: new feature
fix: bug fix
docs: documentation updates
style: code formatting
refactor: code refactoring
test: testing related changes
chore: build process or auxiliary tool changes
```

## Deployment Instructions

### Production Environment Deployment
1. Build the project
```bash
npm run build
```

2. Deploy files from the `build` directory to your server

### Environment Variables Configuration
Create a `.env` file:
```env
REACT_APP_API_URL=your_API_address
REACT_APP_GOOGLE_MAPS_KEY=your_Google_Maps_API_key
```

## Maintainers

- Development Team - TP Mindsport Club Development Team

## License

This project is licensed under the MIT License

## Using ngrok for Quick Preview

If you need to temporarily share your local development environment with others for preview, you can use ngrok:

1. Install ngrok

## TODO List - Future Development

### Database Integration
- Connect the application to MySQL database for persistent data storage
- Implement automatic synchronization between attendance records and Excel spreadsheets

### Department Ranking Systems
- Develop ranking systems for:
  - Go (Weiqi) department
  - International Chess department
  - Chinese Chess department
- Track players' progress, match history, and achievements

### Enhanced Attendance System
- Implement user authentication and login functionality
- Restrict check-in to official CCA time periods
- Validate check-in locations to ensure students are physically present at CCA venues
- Add admin dashboard for attendance management and reporting

### Additional Features
- Push notifications for upcoming events
- Member performance analytics
- Tournament management system
