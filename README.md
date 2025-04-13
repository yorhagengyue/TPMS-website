# TPMS - Temasek Polytechnic Mindsport Club Website

This is the official website for the Temasek Polytechnic CCA (Co-Curricular Activity) TPMS (TP Mindsport) club. The platform serves as a central hub for club activities, member management, and event coordination.

## Features

- **Modern Responsive Interface**: Fully responsive design optimized for all device sizes
- **Digital Attendance System**: Track and manage student attendance at club activities
- **Events Calendar**: Display upcoming tournaments, workshops, and regular club meetings
- **News Section**: Highlight club achievements and announcements
- **Member Management**: Import/export member data using Excel spreadsheets
- **Authentication System**: Secure student login with student ID verification
- **Interactive Animations**: Advanced animations and transitions for enhanced user experience
- **Instagram Integration**: Promotional popup for the TPMS Instagram account

## Technical Implementation

- **Frontend Framework**: React.js
- **Backend**: Node.js with Express
- **Database**: MySQL for data persistence
- **Authentication**: JSON Web Tokens (JWT) for secure authentication
- **Styling**: Tailwind CSS with custom color theming
- **Animations**: Framer Motion for smooth transitions and effects
- **Data Handling**: 
  - Excel integration using XLSX library
  - MySQL database for persistent data storage
- **Icons**: React Icons (FI set)
- **Package Management**: npm

## Getting Started

```bash
# Install dependencies
npm install

# Start both frontend and backend in development mode
npm run dev

# Start only the backend server
npm run server

# Start only the frontend client
npm run client

# Build for production
npm run build
```

## Project Structure

```
/
├── src/                      # Frontend source code
│   ├── components/           # React components
│   │   ├── ui/               # UI components
│   │   │   ├── button/       # Button components
│   │   │   ├── card/         # Card components
│   │   │   ├── layout/       # Layout components
│   │   │   ├── PageTransition.jsx # Page transition animations
│   │   │   ├── PageAnimations.jsx # Animation components
│   │   │   └── LoadingScreen.jsx  # Loading screen component
│   │   └── pages/            # Page components
│   ├── lib/                  # Utility functions and libraries
│   │   ├── auth.js           # Authentication library
│   │   └── authMiddleware.js # Authentication middleware
│   ├── hooks/                # Custom React hooks
│   ├── styles/               # Global styles
│   └── App.jsx               # Main application component
├── public/                   # Static assets
├── server.js                 # Express server and API endpoints
├── config.js                 # Server configuration
├── tools/                    # Maintenance and utility tools
│   ├── test-auth.js          # Authentication testing
│   ├── clear-account.js      # Account management tools
│   ├── migrate-db.js         # Database migration tools
│   ├── reset-passwords.js    # Password reset tool
│   └── README.md             # Tools documentation
├── tests/                    # Test scripts
└── setup-db.sql              # Database schema setup script
```

## Requirements

### Environment Requirements
- Node.js 16.0 or higher
- npm 7.0 or higher
- MySQL 5.7 or higher

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

3. Configure database
```bash
# Set up your MySQL database using the setup-db.sql script
mysql -u username -p < setup-db.sql

# Configure your .env file with database credentials
```

4. Start development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

### Configuration Details

1. Environment Configuration
Create a `.env` file in the root directory:
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=tpms_db
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

2. Location Service Configuration
Set campus coordinates in `src/App.jsx`:
```javascript
const tpLocation = { 
  lat: 1.3456,   // latitude
  lng: 103.9321  // longitude
};
```

3. Check-in Range Settings
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

2. Set up the production database using the setup-db.sql script

3. Configure your production environment variables

4. Start the server
```bash
NODE_ENV=production node server.js
```

## Authentication System

The system uses a two-step authentication process:

1. **Student ID Verification**: Students enter their student ID which is verified against the database
2. **Password Setting**: First-time users are prompted to set a password
3. **Login**: Returning users can log in with their student ID and password

### Authentication Flow

1. Student enters their student ID for verification
2. System checks if the student exists in the database
3. If the student exists but has no password set, they are prompted to set one
4. After setting a password or if they already have one, they can log in

## Maintenance Tools

The project includes various maintenance tools located in the `tools/` directory to help with system administration:

### Authentication Tools

1. **Test Authentication System**
   ```bash
   node tools/test-auth.js
   ```
   Tests the student verification and registration process

2. **Clear Student Account**
   ```bash
   node tools/clear-account.js <student_id>
   ```
   Removes user accounts associated with a specific student ID

3. **Reset Passwords**
   ```bash
   # Reset a specific student's password
   node tools/reset-passwords.js <student_id>
   
   # Reset all student passwords
   node tools/reset-passwords.js
   ```
   Resets passwords to trigger the password setup flow on next login

### Database Tools

1. **Database Migration**
   ```bash
   node tools/migrate-db.js
   ```
   Migrates data from Excel spreadsheets to the MySQL database

2. **Check Password Status**
   ```bash
   node tools/check-passwords.js
   ```
   Checks the password status for all user accounts

3. **Fix User Accounts**
   ```bash
   node tools/fix-user-accounts.js
   ```
   Identifies and repairs inconsistent user accounts

## Recent Updates

### UI Enhancements
- Added advanced animations using Framer Motion
- Implemented 3D flip card effects for eco activities
- Added loading screen with animated logo
- Enhanced page transitions and scroll animations

### Authentication Improvements
- Implemented two-step authentication process
- Added password reset functionality
- Improved user guidance for first-time users

### Instagram Integration
- Added promotional popup for TPMS Instagram
- Automatic dismissal after 10 seconds

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

## Database Integration

This project has been updated to use MySQL for data persistence. Below are the steps to set up the database integration:

### Prerequisites

- MySQL Server (version 5.7 or higher)
- Node.js (version 14 or higher)

### Database Setup

1. Create a MySQL database
```sql
CREATE DATABASE tpms_db;
```

2. Configure your database connection in the `.env` file
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=tpms_db
```

3. Run the database migration script to import Excel data
```bash
node migrate-excel.js
```

### Running the Application with Database

1. Start the backend server
```bash
npm run server
```

2. In a separate terminal, start the React frontend
```bash
npm run client
```

3. For development (running both simultaneously)
```bash
npm run dev
```

## Test and Production Environments

This project supports separate test and production database environments to ensure that development and testing activities do not affect production data.

For detailed information about the separation of test and production database environments, available commands, and usage examples, please refer to the [Database Environment Separation Guide](database-environments.md).

### API Endpoints

- `GET /api/students` - Get all students
- `POST /api/import-students` - Import students from Excel file
- `POST /api/attendance` - Record student attendance
- `GET /api/export-attendance` - Export attendance data to Excel

### Database Schema

**students table**
- id: INT (Primary Key, Auto Increment)
- name: VARCHAR(255)
- course: VARCHAR(255)
- index_number: VARCHAR(50) (Unique)
- created_at: TIMESTAMP

**attendance table**
- id: INT (Primary Key, Auto Increment)
- student_id: INT (Foreign Key to students.id)
- check_in_time: TIMESTAMP
- location_lat: DECIMAL(10, 8)
- location_lng: DECIMAL(11, 8)

## Maintenance Tools

The project includes a set of maintenance tools that have been categorized for easier system maintenance and troubleshooting:

### Test and Utility Scripts Directory Structure

The test and utility scripts in the project have been organized by functionality into different subdirectories under the `tests/` directory:

- **tests/auth/** - Scripts related to authentication and user management
- **tests/db/** - Scripts for database maintenance and migration
- **tests/analysis/** - Scripts for data analysis and Excel processing
- **tests/attendance/** - Scripts for the attendance checking system
- **tests/utils/** - General utility tools and configuration files

Each directory contains scripts for specific functionality. For detailed information, please refer to the [Test Scripts Documentation](tests/README.md).

### Common Tools

The project also includes maintenance tools in the `tools/` directory:

1. **Clear Student Account**
   ```bash
   node tools/clear-account.js <student_id>
   ```

2. **Test Authentication System**
   ```bash
   node tools/test-auth.js
   ```

3. **Database Migration**
   ```bash
   node tools/migrate-db.js
   ```

For more detailed information, please refer to the [Tools Documentation](tools/README.md).
