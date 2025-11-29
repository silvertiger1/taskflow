const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/tasks
// @desc    Get all tasks for user's projects
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { projectId, status, assignee, priority } = req.query;
    
    // Build query
    let query = { isArchived: false };
    
    if (projectId) {
      query.project = projectId;
    } else {
      // Get all projects where user is member
      const projects = await Project.find({
        $or: [
          { owner: req.userId },
          { 'members.user': req.userId }
        ]
      }).select('_id');
      
      query.project = { $in: projects.map(p => p._id) };
    }
    
    if (status) query.status = status;
    if (assignee) query.assignee = assignee;
    if (priority) query.priority = priority;
    
    const tasks = await Task.find(query)
      .populate('assignee', 'username email avatar')
      .populate('creator', 'username email')
      .populate('project', 'name color')
      .sort({ position: 1, createdAt: -1 });
    
    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
    
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching tasks' 
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'username email avatar')
      .populate('creator', 'username email')
      .populate('project', 'name color members owner')
      .populate('comments.user', 'username avatar');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if user has access to this task
    const project = await Project.findById(task.project);
    if (!project.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task'
      });
    }
    
    res.json({
      success: true,
      task
    });
    
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching task' 
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      status,
      priority,
      assignee,
      dueDate,
      tags,
      estimatedHours
    } = req.body;
    
    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    if (!project.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }
    
    // Get the highest position in the project
    const lastTask = await Task.findOne({ project: projectId })
      .sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;
    
    // Create task
    const task = new Task({
      title,
      description,
      project: projectId,
      creator: req.userId,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee,
      dueDate,
      tags,
      estimatedHours,
      position
    });
    
    await task.save();
    
    // Populate fields for response
    await task.populate('assignee', 'username email avatar');
    await task.populate('creator', 'username email');
    await task.populate('project', 'name color');
    
    // Update project statistics
    await project.updateStatistics();
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
    
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating task' 
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if user has access to project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task'
      });
    }
    
    // Update fields
    const updateableFields = [
      'title', 'description', 'status', 'priority', 
      'assignee', 'dueDate', 'startDate', 'tags', 
      'estimatedHours', 'actualHours', 'position'
    ];
    
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });
    
    await task.save();
    
    // Populate fields for response
    await task.populate('assignee', 'username email avatar');
    await task.populate('creator', 'username email');
    await task.populate('project', 'name color');
    
    // Update project statistics
    await project.updateStatistics();
    
    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
    
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating task' 
    });
  }
});

// @route   POST /api/tasks/:id/comment
// @desc    Add comment to task
// @access  Private
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if user has access to project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task'
      });
    }
    
    // Add comment
    await task.addComment(req.userId, text);
    
    // Populate for response
    await task.populate('comments.user', 'username avatar');
    
    res.json({
      success: true,
      message: 'Comment added successfully',
      comments: task.comments
    });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error adding comment' 
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if user is project owner or admin
    const project = await Project.findById(task.project);
    const userRole = project.getUserRole(req.userId);
    
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owners and admins can delete tasks'
      });
    }
    
    await task.deleteOne();
    
    // Update project statistics
    await project.updateStatistics();
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting task' 
    });
  }
});

// @route   PUT /api/tasks/:id/archive
// @desc    Archive/unarchive task
// @access  Private
router.put('/:id/archive', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if user has access to project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task'
      });
    }
    
    task.isArchived = !task.isArchived;
    await task.save();
    
    // Update project statistics
    await project.updateStatistics();
    
    res.json({
      success: true,
      message: `Task ${task.isArchived ? 'archived' : 'unarchived'} successfully`,
      task
    });
    
  } catch (error) {
    console.error('Archive task error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error archiving task' 
    });
  }
});

module.exports = router;
