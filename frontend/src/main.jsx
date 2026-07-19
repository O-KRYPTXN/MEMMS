import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import router from './router/index'
import AuthInitializer from './components/auth/AuthInitializer'
import { SocketProvider } from './context/SocketContext'
import './index.css'
import Toast from './components/ui/Toast'
import './i18n/config'

const savedLang = localStorage.getItem('mems_lang') || 'en'
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'
document.documentElement.lang = savedLang

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <SocketProvider>
          <RouterProvider router={router} />
        </SocketProvider>
      </AuthInitializer>
      <Toast />
    </QueryClientProvider>
  </StrictMode>
)