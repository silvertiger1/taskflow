import React from 'react';

function TaskCard({ task, onUpdate }) {
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
}

export default TaskCard;
