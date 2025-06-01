import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/')
    }, 1500) // 1.5 seconds

    return () => clearTimeout(timer) // cleanup on unmount
  }, [navigate])

  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mt-4">Redirecting to home...</p>
    </div>
  )
}
