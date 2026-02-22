import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { useQuestionnaireStore } from '../store/questionnaireStore'
import { breadcrumbNav } from '../lib/breadcrumbs'
import { useAuthStore } from '../store/authStore'

import LandingPage from '../views/LandingPage.vue'
import ResultPage from '../views/ResultPage.vue'
import AboutPage from '../views/AboutPage.vue'
import ErrorPage from '../views/ErrorPage.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage
  },
  {
    path: '/questionnaire/:id',
    name: 'Questionnaire',
    component: () => import('../views/QuestionnairePage.vue').then((m) => m.default),
    props: true,
    beforeEnter: async (
      to: import('vue-router').RouteLocationNormalized,
      _from: import('vue-router').RouteLocationNormalized,
      next: import('vue-router').NavigationGuardNext
    ) => {
      const store = useQuestionnaireStore()

      if (store.dataReady) {
        next()
        return
      }

      if (store.loadingPromise) {
        try {
          await store.loadingPromise
          await nextTick()
          next()
        } catch {
          next({ name: 'Error', query: { message: 'Kon gegevens niet laden' } })
        }
        return
      }

      if (!store.isLoading && !store.dataReady) {
        try {
          await store.loadInitialData()
          await nextTick()
          if (store.dataReady) {
            next()
          } else {
            next({ name: 'Error', query: { message: 'Laden mislukt' } })
          }
        } catch {
          next({ name: 'Error' })
        }
        return
      }

      next()
    }
  },
  {
    path: '/info/:resultKey',
    name: 'Result',
    component: ResultPage,
    props: true
  },
  { path: '/over', name: 'About', component: AboutPage },
  { path: '/error', name: 'Error', component: ErrorPage },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/AdminLogin.vue')
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: () => import('../views/admin/LogDashboard.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      next({ name: 'AdminLogin' })
      return
    }
  }
  next()
})

router.afterEach((to, from) => {
  breadcrumbNav(from.path, to.path)
})

export default router
