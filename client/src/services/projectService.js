import api from './api';

export const projectService = {
  async getProjects() {
    const response = await api.get('/projects');
    return response.data;
  },

  async getProject(id) {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async createProject(projectData) {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  async updateProject(id, projectData) {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  async deleteProject(id) {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  async addMember(projectId, userId, role = 'member') {
    const response = await api.post(`/projects/${projectId}/members`, { userId, role });
    return response.data;
  },

  async removeMember(projectId, userId) {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  }
};
