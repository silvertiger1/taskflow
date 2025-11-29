import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { projectService } from '../services/projectService';
import '../styles/Projects.css';

function Projects({ user }) {
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📋'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data.projects);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Projects error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    try {
      const response = await projectService.createProject(newProject);
      if (response.success) {
        toast.success('Project created successfully!');
        setProjects([...projects, response.project]);
        setShowCreateModal(false);
        setNewProject({
          name: '',
          description: '',
          color: '#3B82F6',
          icon: '📋'
        });
      }
    } catch (error) {
      toast.error('Failed to create project');
      console.error('Create project error:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All tasks will be deleted.')) {
      return;
    }

    try {
      await projectService.deleteProject(projectId);
      setProjects(projects.filter(p => p._id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error('Failed to delete project');
      console.error('Delete project error:', error);
    }
  };

  if (loading) {
    return (
      <div className="projects-loading">
        <div className="spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>Projects</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h2>No projects yet</h2>
          <p>Create your first project to start managing tasks</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project._id} className="project-card">
              <div 
                className="project-header"
                style={{ backgroundColor: project.color }}
              >
                <span className="project-icon">{project.icon}</span>
                {project.owner._id === user.id && (
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteProject(project._id)}
                    title="Delete project"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="project-content">
                <h3>{project.name}</h3>
                <p>{project.description || 'No description'}</p>
                <div className="project-meta">
                  <span className="project-owner">
                    Owner: {project.owner.username}
                  </span>
                  <span className="project-status">{project.status}</span>
                </div>
                <div className="project-stats">
                  <div className="stat">
                    <span className="stat-value">{project.statistics?.totalTasks || 0}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{project.statistics?.completedTasks || 0}</span>
                    <span className="stat-label">Done</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{project.members?.length || 0}</span>
                    <span className="stat-label">Members</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Enter project description"
                  rows="4"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={newProject.color}
                    onChange={(e) => setNewProject({...newProject, color: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Icon</label>
                  <select
                    value={newProject.icon}
                    onChange={(e) => setNewProject({...newProject, icon: e.target.value})}
                  >
                    <option value="📋">📋 Default</option>
                    <option value="💼">💼 Business</option>
                    <option value="🚀">🚀 Startup</option>
                    <option value="🎯">🎯 Goals</option>
                    <option value="💡">💡 Ideas</option>
                    <option value="🎨">🎨 Design</option>
                    <option value="🔧">🔧 Development</option>
                    <option value="📚">📚 Learning</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
