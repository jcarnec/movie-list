// index.js
const express = require('express');
const cors = require('cors');
const app = express();

// const connectDB = require('./config/database');
const movieRoutes = require('./routes/movies');
const creditsRoutes = require('./routes/credits');

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use('/movies', movieRoutes);
app.use('/credits/', creditsRoutes);

// Server Initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port \${PORT}`);
});
