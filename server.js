require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
  origin: "https://task-manager-frontend-ruddy-beta.vercel.app",
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Task Manager API is running!',
    endpoints: {
      getAllTasks: 'GET /api/tasks',
      createTask: 'POST /api/tasks',
      getTask: 'GET /api/tasks/:id',
      updateTask: 'PUT /api/tasks/:id',
      deleteTask: 'DELETE /api/tasks/:id'
    }
  });
});

const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);

setInterval(() => {
  fetch("https://task-manager-backend-d3hb.onrender.com/api/tasks")
    .then(() => console.log("Render Keep-Alive Ping Sent"))
    .catch((err) => console.error("Ping Error:", err));
}, 600000); // every 10 minutes

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB', err);
  });
