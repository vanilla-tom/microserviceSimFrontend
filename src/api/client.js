import axios from 'axios'
import { ElMessage } from 'element-plus'

// Get base URL from environment or default
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const client = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Export base URL for WebSocket connections
export const wsBaseURL = baseURL.replace(/^http/, 'ws')

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error

    if (response) {
      const errorMsg = response.data?.error || '未知错误'

      switch (response.status) {
        case 400:
          ElMessage.error(`请求错误: ${errorMsg}`)
          break
        case 404:
          ElMessage.error(`未找到: ${errorMsg}`)
          break
        case 409:
          ElMessage.warning(`状态冲突: ${errorMsg}`)
          break
        case 500:
          ElMessage.error(`服务器错误: ${errorMsg}`)
          break
        default:
          ElMessage.error(`错误: ${errorMsg}`)
      }
    } else if (error.request) {
      ElMessage.error('无法连接到服务器，请检查后端服务是否运行')
    } else {
      ElMessage.error(`请求失败: ${error.message}`)
    }

    return Promise.reject(error)
  }
)

export default client
