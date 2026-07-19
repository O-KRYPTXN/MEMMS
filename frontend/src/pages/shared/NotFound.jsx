import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NotFound = () => {
  const navigate = useNavigate()
  const { homeRoute } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-gray-400">404</h1>
      <p className="mt-4 text-xl text-gray-600">Page not found.</p>
      <button
        onClick={() => navigate(homeRoute)}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Go home
      </button>
    </div>
  )
}

export default NotFound