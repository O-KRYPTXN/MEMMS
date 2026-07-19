import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

export default function AuthInitializer({ children }) {
  const { checkAuth, isCheckingAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400">Loading your session...</p>
        </div>
      </div>
    )
  }

  return children
}
