import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import '../styles/Dashboard.css';

function Dashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsData, tasksData] = await Promise.all([
        projectService.getProjects(),
        taskService.getTasks({ limit: 5 })
      ]);

      setProjects(projectsData.projects);
      setRecentTasks(tasksData.tasks);

      // Calculate stats
      const totalTasks = tasksData.tasks.length;
      const completedTasks = tasksData.tasks.filter(t => t.status === 'done').length;
      const pendingTasks = tasksData.tasks.filter(t => t.status === 'todo').length;

      setStats({
        totalProjects: projectsData.projects.length,
        totalTasks,
        completedTasks,
        pendingTasks
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'todo': 'badge-todo',
      'in-progress': 'badge-progress',
      'review': 'badge-review',
      'done': 'badge-done'
    };
    return `task-badge ${statusClasses[status] || 'badge-default'}`;
  };

  const getPriorityBadgeClass = (priority) => {
    const priorityClasses = {
      'low': 'priority-low',
      'medium': 'priority-medium',
      'high': 'priority-high',
      'urgent': 'priority-urgent'
    };
    return `priority-badge ${priorityClasses[priority] || 'priority-default'}`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user.firstName || user.username}!</h1>
        <p>Here's your TaskFlow overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon projects">📁</div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>Active Projects</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon tasks">📝</div>
          <div className="stat-content">
            <h3>{stats.totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">✅</div>
          <div className="stat-content">
            <h3>{stats.completedTasks}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingTasks}</h3>
            <p>Pending</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Projects Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Projects</h2>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/projects')}
            >
              View All
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects yet. Create your first project!</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/projects')}
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.slice(0, 4).map(project => (
                <div 
                  key={project._id} 
                  className="project-card"
                  onClick={() => navigate(`/projects/${project._id}`)}
                >
                  <div 
                    className="project-header"
                    style={{ backgroundColor: project.color }}
                  >
                    <span className="project-icon">{project.icon || '📋'}</span>
                  </div>
                  <div className="project-content">
                    <h3>{project.name}</h3>
                    <p>{project.description || 'No description'}</p>
                    <div className="project-stats">
                      <span>{project.statistics?.totalTasks || 0} tasks</span>
                      <span className="project-status">{project.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Tasks</h2>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/tasks')}
            >
              View All
            </button>
          </div>

          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks yet. Start by creating a project!</p>
            </div>
          ) : (
            <div className="tasks-list">
              {recentTasks.map(task => (
                <div key={task._id} className="task-item">
                  <div className="task-main">
                    <h4>{task.title}</h4>
                    <div className="task-meta">
                      <span className="task-project">
                        {task.project?.name || 'No project'}
                      </span>
                      {task.assignee && (
                        <span className="task-assignee">
                          Assigned to: {task.assignee.username}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-badges">
                    <span className={getStatusBadgeClass(task.status)}>
                      {task.status}
                    </span>
                    <span className={getPriorityBadgeClass(task.priority)}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
