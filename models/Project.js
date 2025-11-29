const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'member', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
    default: 'active'
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  icon: {
    type: String,
    default: '📋'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowGuestView: {
      type: Boolean,
      default: false
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  statistics: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    inProgressTasks: {
      type: Number,
      default: 0
    },
    todoTasks: {
      type: Number,
      default: 0
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });

// Add member to project
projectSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  
  if (!existingMember) {
    this.members.push({
      user: userId,
      role: role
    });
    return this.save();
  }
  
  return this;
};

// Remove member from project
projectSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  return this.save();
};

// Check if user is member
projectSchema.methods.isMember = function(userId) {
  return this.owner.toString() === userId.toString() ||
         this.members.some(m => m.user.toString() === userId.toString());
};

// Get user role in project
projectSchema.methods.getUserRole = function(userId) {
  if (this.owner.toString() === userId.toString()) {
    return 'owner';
  }
  
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Update statistics
projectSchema.methods.updateStatistics = async function() {
  const Task = require('./Task');
  
  const tasks = await Task.find({ project: this._id, isArchived: false });
  
  this.statistics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
    todoTasks: tasks.filter(t => t.status === 'todo').length
  };
  
  this.lastActivity = new Date();
  return this.save();
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
