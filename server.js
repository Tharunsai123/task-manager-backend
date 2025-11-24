require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

// ✅ FIX: Add your Vercel URL here
app.use(cors({
  origin: [
    "https://task-manager-frontend-ruddy-beta.vercel.app",  // ✅ Your Vercel URL (without trailing slash)
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Important: Handle preflight requests
app.options('*', cors());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Task Manager API is running!',
    status: 'healthy',
    allowedOrigins: [
      "https://task-manager-frontend-ruddy-beta.vercel.app",
      "http://localhost:5173"
    ]
  });
});

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('CORS enabled for:', [
        "https://task-manager-frontend-ruddy-beta.vercel.app",
        "http://localhost:5173"
      ]);
    });
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB', err);
  });