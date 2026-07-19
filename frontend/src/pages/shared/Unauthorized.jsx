import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Unauthorized = () => {
  const navigate = useNavigate()
  const { homeRoute } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-red-500">403</h1>
      <p className="mt-4 text-xl text-gray-600">You don't have access to this page.</p>
      <button
        onClick={() => navigate(homeRoute)}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Go to my dashboard
      </button>
    </div>
  )
}

export default Unauthorized