import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Home() {
  const [name, setName] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [roomId, setRoomId] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Extract roomId from URL pathname if present (for joining via shared link)
  useEffect(() => {
    const pathname = location.pathname
    const hash = location.hash
    
    // Try to get roomId from hash first (for HashRouter)
    const roomMatch = hash.match(/\/room\/([^/]+)/)
    if (roomMatch) {
      const hashRoomId = roomMatch[1]
      setRoomId(hashRoomId)
      setIsHost(false)
      return
    }
    
    // Fallback to pathname (for direct links)
    const pathMatch = pathname.match(/\/room\/([^/]+)/)
    if (pathMatch) {
      const pathRoomId = pathMatch[1]
      setRoomId(pathRoomId)
      setIsHost(false)
    }
  }, [location])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }

    if (!roomId && !isHost) {
      toast.error('Please use a valid room link to join')
      return
    }

    const currentRoomId = isHost ? Math.random().toString(36).substring(2, 8) : roomId
    navigate(`/room/${currentRoomId}`, { 
      state: { 
        name: name.trim(), 
        isHost,
        joinedAt: Date.now() 
      } 
    })
  }

  const handleCreateRoom = () => {
    setIsHost(true)
    setRoomId('')
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-center mb-8">🎧 Modern Radio Party</h1>
        
        {roomId ? (
          <div className="mb-6">
            <p className="text-center text-lg text-green-400">
              Joining Room: {roomId}
            </p>
          </div>
        ) : null}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter your name"
              autoFocus
            />
          </div>

          {!roomId && (
            <button
              type="button"
              onClick={handleCreateRoom}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
            >
              Create New Room
            </button>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors"
          >
            {isHost ? 'Start Room' : 'Join Room'}
          </button>
        </form>

        {isHost && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Share Room</h3>
            <p className="text-sm text-gray-300 mb-2">
              Create the room first, then share the link with friends
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 