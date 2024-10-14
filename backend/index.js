// index.js
const express = require('express');
const cors = require('cors');
const app = express();

const connectDB = require('./config/database');
const movieRoutes = require('./routes/movies');

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/movies', movieRoutes);

// Server Initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port \${PORT}`);
});
