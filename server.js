require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Import Routes
const taskRoutes = require('./routes/tasks');  // ← NEW

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch((err) => {
  console.log('Error connecting to MongoDB', err);
});

// Routes Middleware
app.use('/api/tasks', taskRoutes); 