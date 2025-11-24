const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

// Create task (Protected)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, tags } = req.body;
    
    const newTask = new Task({
      title,
      description,
      priority,
      category,
      dueDate,
      tags,
      user: req.userId
    });
    
    await newTask.save();
    res.status(201).json(newTask);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all tasks for logged-in user (Protected)
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, category, search, sortBy } = req.query;
    
    let query = { user: req.userId };
    
    // Filter by completion status
    if (status === 'completed') {
      query.completed = true;
    } else if (status === 'active') {
      query.completed = false;
    }
    
    // Filter by priority
    if (priority) {
      query.priority = priority;
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sort options
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'dueDate') {
      sortOptions = { dueDate: 1 };
    } else if (sortBy === 'priority') {
      sortOptions = { priority: 1 };
    }
    
    const tasks = await Task.find(query).sort(sortOptions);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single task (Protected)
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.userId 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task (Protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, completed, priority, category, dueDate, tags } = req.body;
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, description, completed, priority, category, dueDate, tags },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete task (Protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.userId 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get task statistics (Protected)
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ user: req.userId });
    const completedTasks = await Task.countDocuments({ user: req.userId, completed: true });
    const activeTasks = await Task.countDocuments({ user: req.userId, completed: false });
    
    const tasksByPriority = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalTasks,
      completedTasks,
      activeTasks,
      tasksByPriority
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add these routes to your existing tasks.js

// Share task with another user
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { shareWithEmail } = req.body;
    
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const shareWithUser = await User.findOne({ email: shareWithEmail });
    
    if (!shareWithUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a copy of the task for the other user
    const sharedTask = new Task({
      title: `[Shared] ${task.title}`,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      tags: task.tags,
      user: shareWithUser._id,
      sharedFrom: req.userId
    });

    await sharedTask.save();
    
    res.status(200).json({ message: 'Task shared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Duplicate task
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const duplicatedTask = new Task({
      title: `${task.title} (Copy)`,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      tags: task.tags,
      user: req.userId
    });

    await duplicatedTask.save();
    res.status(201).json(duplicatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tasks by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      user: req.userId, 
      category: req.params.category 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming tasks (by due date)
router.get('/upcoming/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Task.find({
      user: req.userId,
      dueDate: { $gte: today, $lt: tomorrow },
      completed: false
    }).sort({ dueDate: 1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get overdue tasks
router.get('/overdue/list', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      user: req.userId,
      dueDate: { $lt: today },
      completed: false
    }).sort({ dueDate: 1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to routes/tasks.js

// Export tasks as JSON
router.get('/export/json', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks-export.json');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Import tasks from JSON
router.post('/import/json', auth, async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    const importedTasks = tasks.map(task => ({
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      category: task.category || 'general',
      dueDate: task.dueDate || null,
      tags: task.tags || [],
      user: req.userId
    }));

    const result = await Task.insertMany(importedTasks);
    
    res.status(201).json({ 
      message: `Successfully imported ${result.length} tasks`,
      count: result.length 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;