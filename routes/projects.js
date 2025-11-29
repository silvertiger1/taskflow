const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/projects
// @desc    Get all user's projects
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { 'members.user': req.userId }
      ]
    })
    .populate('owner', 'username email avatar')
    .populate('members.user', 'username email avatar')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: projects.length,
      projects
    });
    
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching projects' 
    });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }
    
    const project = new Project({
      name,
      description,
      owner: req.userId,
      color,
      icon
    });
    
    await project.save();
    
    // Add project to user's projects
    await User.findByIdAndUpdate(req.userId, {
      $push: { projects: project._id }
    });
    
    await project.populate('owner', 'username email avatar');
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
    
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating project' 
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is owner or admin
    const userRole = project.getUserRole(req.userId);
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owners and admins can update project settings'
      });
    }
    
    // Update fields
    const updateableFields = ['name', 'description', 'color', 'icon', 'status', 'endDate', 'settings'];
    
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });
    
    await project.save();
    await project.populate('owner', 'username email avatar');
    await project.populate('members.user', 'username email avatar');
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
    
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating project' 
    });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Private
router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is owner or admin
    const userRole = project.getUserRole(req.userId);
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owners and admins can add members'
      });
    }
    
    // Add member
    await project.addMember(userId, role || 'member');
    
    // Add project to user's projects
    await User.findByIdAndUpdate(userId, {
      $addToSet: { projects: project._id }
    });
    
    await project.populate('members.user', 'username email avatar');
    
    res.json({
      success: true,
      message: 'Member added successfully',
      members: project.members
    });
    
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error adding member' 
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is owner
    if (project.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete the project'
      });
    }
    
    // Delete all tasks in project
    await Task.deleteMany({ project: project._id });
    
    // Remove project from all users
    await User.updateMany(
      { projects: project._id },
      { $pull: { projects: project._id } }
    );
    
    await project.deleteOne();
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting project' 
    });
  }
});

module.exports = router;
