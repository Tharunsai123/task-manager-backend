const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'general'
  },
  dueDate: {
    type: Date,
    default: null
  },
  tags: [{
    type: String
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attachments: [{
    name: String,
    url: String
  }],
  subtasks: [{
    title: String,
    completed: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);