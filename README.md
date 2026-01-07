# HealthCall React Application

This is a React-based healthcare diagnostic services application migrated from vanilla HTML/CSS/JavaScript.

## Features

- **Home Page**: Image slider with responsive design for desktop and mobile
- **Diagnostic Services**: Comprehensive list of diagnostic tests with pricing
- **Navigation**: React Router-based navigation between pages
- **Responsive Design**: Mobile-first approach with CSS media queries
- **Contact Integration**: Direct links to phone, WhatsApp, and email

## Project Structure

```
src/
├── components/
│   ├── Navbar.js          # Navigation component
│   ├── HomePage.js        # Home page with image slider
│   ├── DiagnosticPage.js  # Diagnostic tests listing
│   └── Footer.js          # Footer with contact links
├── data/
│   └── testData.js        # Diagnostic test data
├── App.js                 # Main app component with routing
├── index.js               # React entry point
└── index.css              # Global styles
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Migration Notes

This project was migrated from vanilla HTML/CSS/JavaScript to React with the following changes:

- Converted HTML structure to React components
- Implemented React Router for navigation
- Moved test data to ES6 modules
- Maintained original styling and functionality
- Added proper React patterns and best practices

## Technologies Used

- React 18.2.0
- React Router DOM 6.8.0
- Create React App
- CSS3 with responsive design
# nationalslab
