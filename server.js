require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

// Dynamic CORS based on environment
const allowedOrigins = [
  process.env.PRODUCTION_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173"
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Task Manager API is running!',
    environment: process.env.NODE_ENV,
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      getProfile: 'GET /api/auth/me',
      getAllTasks: 'GET /api/tasks',
      createTask: 'POST /api/tasks',
      getTask: 'GET /api/tasks/:id',
      updateTask: 'PUT /api/tasks/:id',
      deleteTask: 'DELETE /api/tasks/:id',
      getStats: 'GET /api/tasks/stats/summary'
    }
  });
});

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

setInterval(() => {
  fetch("https://task-manager-backend-d3hb.onrender.com")
    .then(() => console.log("Render Keep-Alive Ping Sent"))
    .catch((err) => console.error("Ping Error:", err));
}, 600000); 

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Allowed origins:`, allowedOrigins);
    });
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB', err);
  });