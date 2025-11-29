import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { socketService } from '../services/socketService';
import '../styles/Tasks.css';

function Tasks({ user }) {
  const [tasks, setTasks] = useState({
    todo: [],
    'in-progress': [],
    review: [],
    done: []
  });
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: ''
  });

  useEffect(() => {
    fetchInitialData();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
    }
  }, [selectedProject]);

  const fetchInitialData = async () => {
    try {
      const projectsData = await projectService.getProjects();
      setProjects(projectsData.projects);
      
      if (projectsData.projects.length > 0) {
        setSelectedProject(projectsData.projects[0]._id);
        socketService.joinProject(projectsData.projects[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Projects error:', error);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const tasksData = await taskService.getTasks({ projectId: selectedProject });
      
      // Organize tasks by status
      const organizedTasks = {
        todo: [],
        'in-progress': [],
        review: [],
        done: []
      };

      tasksData.tasks.forEach(task => {
        if (organizedTasks[task.status]) {
          organizedTasks[task.status].push(task);
        }
      });

      // Sort tasks by position
      Object.keys(organizedTasks).forEach(status => {
        organizedTasks[status].sort((a, b) => a.position - b.position);
      });

      setTasks(organizedTasks);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error('Tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('taskCreated', handleTaskCreated);
    socketService.on('taskUpdated', handleTaskUpdated);
    socketService.on('taskDeleted', handleTaskDeleted);
  };

  const cleanupSocketListeners = () => {
    socketService.off('taskCreated', handleTaskCreated);
    socketService.off('taskUpdated', handleTaskUpdated);
    socketService.off('taskDeleted', handleTaskDeleted);
  };

  const handleTaskCreated = (data) => {
    if (data.task && data.task.project === selectedProject) {
      setTasks(prev => ({
        ...prev,
        [data.task.status]: [...prev[data.task.status], data.task]
      }));
      toast.info('New task added!');
    }
  };

  const handleTaskUpdated = (data) => {
    if (data.task) {
      fetchTasks(); // Refetch to ensure consistency
    }
  };

  const handleTaskDeleted = (data) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(status => {
        newTasks[status] = newTasks[status].filter(task => task._id !== data.taskId);
      });
      return newTasks;
    });
    toast.info('Task deleted');
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // If dropped in the same position
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) {
      return;
    }

    // Get the task
    const sourceColumn = [...tasks[source.droppableId]];
    const [movedTask] = sourceColumn.splice(source.index, 1);
    
    // Update the task status if moved to different column
    if (source.droppableId !== destination.droppableId) {
      movedTask.status = destination.droppableId;
    }

    // Update position
    movedTask.position = destination.index;

    // Update local state optimistically
    const destColumn = source.droppableId === destination.droppableId 
      ? sourceColumn 
      : [...tasks[destination.droppableId]];
    
    destColumn.splice(destination.index, 0, movedTask);

    setTasks({
      ...tasks,
      [source.droppableId]: source.droppableId === destination.droppableId 
        ? destColumn 
        : sourceColumn,
      [destination.droppableId]: destColumn
    });

    try {
      // Update on server
      await taskService.updateTask(draggableId, {
        status: destination.droppableId,
        position: destination.index
      });

      // Emit socket event
      socketService.updateTask({
        taskId: draggableId,
        projectId: selectedProject,
        status: destination.droppableId,
        position: destination.index
      });
    } catch (error) {
      toast.error('Failed to update task');
      fetchTasks(); // Refresh to get correct state
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!newTaskData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const response = await taskService.createTask({
        ...newTaskData,
        projectId: selectedProject
      });

      if (response.success) {
        toast.success('Task created successfully!');
        setShowCreateModal(false);
        setNewTaskData({
          title: '',
          description: '',
          priority: 'medium',
          assignee: ''
        });
        
        // Add to local state
        setTasks(prev => ({
          ...prev,
          [response.task.status]: [...prev[response.task.status], response.task]
        }));

        // Emit socket event
        socketService.createTask({
          task: response.task,
          projectId: selectedProject
        });
      }
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Create task error:', error);
    }
  };

  const TaskCard = ({ task }) => {
    const getPriorityClass = (priority) => {
      const classes = {
        low: 'priority-low',
        medium: 'priority-medium', 
        high: 'priority-high',
        urgent: 'priority-urgent'
      };
      return classes[priority] || 'priority-medium';
    };

    return (
      <div className="task-card">
        <div className="task-card-header">
          <h4>{task.title}</h4>
          <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        <div className="task-card-footer">
          {task.assignee && (
            <div className="task-assignee">
              <span className="avatar-small">
                {task.assignee.username.charAt(0).toUpperCase()}
              </span>
              <span>{task.assignee.username}</span>
            </div>
          )}
          {task.dueDate && (
            <span className="task-due-date">
              📅 {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (!selectedProject && projects.length === 0) {
    return (
      <div className="tasks-empty">
        <h2>No Projects Found</h2>
        <p>Create a project first to start managing tasks.</p>
      </div>
    );
  }

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="header-left">
          <h1>Tasks Board</h1>
          <select 
            value={selectedProject || ''} 
            onChange={(e) => {
              if (selectedProject) {
                socketService.leaveProject(selectedProject);
              }
              setSelectedProject(e.target.value);
              socketService.joinProject(e.target.value);
            }}
            className="project-select"
          >
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + New Task
        </button>
      </div>

      {loading ? (
        <div className="tasks-loading">
          <div className="spinner"></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {Object.entries(tasks).map(([columnId, columnTasks]) => (
              <div key={columnId} className="kanban-column">
                <div className="column-header">
                  <h3>{columnId.replace('-', ' ').toUpperCase()}</h3>
                  <span className="task-count">{columnTasks.length}</span>
                </div>
                
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'dragging' : ''}
                            >
                              <TaskCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                  placeholder="Enter task title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                  placeholder="Enter task description"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newTaskData.priority}
                  onChange={(e) => setNewTaskData({...newTaskData, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
