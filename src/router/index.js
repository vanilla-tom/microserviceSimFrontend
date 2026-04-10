import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import ReplayView from '@/views/ReplayView.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
  },
  {
    path: '/task/:taskId',
    name: 'TaskMonitor',
    component: ReplayView,
    props: true,
  },
  {
    path: '/task/:taskId/result',
    name: 'TaskResult',
    redirect: (to) => `/task/${to.params.taskId}`,
  },
  {
    path: '/task/:taskId/replay',
    name: 'TaskReplay',
    component: ReplayView,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
