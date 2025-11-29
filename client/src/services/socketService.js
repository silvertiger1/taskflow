import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to TaskFlow real-time server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from TaskFlow server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Set up default listeners
    this.setupDefaultListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setupDefaultListeners() {
    if (!this.socket) return;

    // Task events
    this.socket.on('task-created', (data) => {
      this.emit('taskCreated', data);
    });

    this.socket.on('task-updated', (data) => {
      this.emit('taskUpdated', data);
    });

    this.socket.on('task-deleted', (data) => {
      this.emit('taskDeleted', data);
    });

    // Project events
    this.socket.on('project-updated', (data) => {
      this.emit('projectUpdated', data);
    });

    this.socket.on('member-added', (data) => {
      this.emit('memberAdded', data);
    });
  }

  // Join a project room
  joinProject(projectId) {
    if (this.socket) {
      this.socket.emit('join-project', projectId);
    }
  }

  // Leave a project room
  leaveProject(projectId) {
    if (this.socket) {
      this.socket.emit('leave-project', projectId);
    }
  }

  // Emit events
  createTask(taskData) {
    if (this.socket) {
      this.socket.emit('task-create', taskData);
    }
  }

  updateTask(taskData) {
    if (this.socket) {
      this.socket.emit('task-update', taskData);
    }
  }

  deleteTask(taskData) {
    if (this.socket) {
      this.socket.emit('task-delete', taskData);
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export const socketService = new SocketService();
