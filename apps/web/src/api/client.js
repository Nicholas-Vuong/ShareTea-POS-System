import axios from 'axios'
import { useAuthStore } from '../stores/authStore.js'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5001',
  withCredentials: true
})

client.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default client
