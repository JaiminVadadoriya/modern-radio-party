import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Home() {
  const [name, setName] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSubmit = async (e:any) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }

    if (!roomId && !isHost) {
      toast.error('Please use a valid room link to join')
      return
    }

    setIsLoading(true)
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800))

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Floating music notes */}
        <div className="absolute top-20 left-20 text-purple-400/30 text-4xl animate-bounce" style={{ animationDelay: '0s' }}>♪</div>
        <div className="absolute top-40 right-32 text-pink-400/30 text-3xl animate-bounce" style={{ animationDelay: '2s' }}>♫</div>
        <div className="absolute bottom-32 left-1/4 text-blue-400/30 text-5xl animate-bounce" style={{ animationDelay: '4s' }}>♬</div>
        <div className="absolute bottom-20 right-20 text-cyan-400/30 text-4xl animate-bounce" style={{ animationDelay: '6s' }}>♪</div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main card with glassmorphism effect */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-500 hover:scale-105">
          {/* Header with animated gradient text */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
              <span className="text-3xl">🎧</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2 animate-pulse">
              Modern Radio Party
            </h1>
            <p className="text-slate-300 text-sm">Host or join music sessions with friends</p>
          </div>
          
          {/* Room status indicator */}
          {roomId && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-green-300 font-medium">
                  Ready to join: <span className="font-bold text-green-200">{roomId}</span>
                </p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name input with floating label effect */}
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 text-white placeholder-slate-400 peer"
                placeholder=" "
                autoFocus
              />
              <label 
                htmlFor="name" 
                className="absolute left-6 top-4 text-slate-400 transition-all duration-300 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-400 peer-focus:bg-slate-800/80 peer-focus:px-2 peer-focus:rounded peer-valid:-top-2 peer-valid:text-sm peer-valid:text-purple-400 peer-valid:bg-slate-800/80 peer-valid:px-2 peer-valid:rounded"
              >
                Your Name
              </label>
            </div>

            {/* Create room button */}
            {!roomId && (
              <button
                type="button"
                onClick={handleCreateRoom}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2 group"
              >
                <span className="text-xl group-hover:animate-spin">🎪</span>
                <span>Create New Room</span>
              </button>
            )}

            {/* Main action button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:scale-100 disabled:shadow-none flex items-center justify-center space-x-2 group relative overflow-hidden"
            >
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 animate-pulse"></div>
              )}
              <span className="relative z-10 flex items-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl group-hover:animate-bounce">
                      {isHost ? '🚀' : '🎵'}
                    </span>
                    <span>{isHost ? 'Start Room' : 'Join Room'}</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Host info card */}
          {isHost && (
            <div className="mt-8 p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl border border-yellow-400/20 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                  <span className="text-lg">👑</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-200 mb-2">Host Powers</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Create your room first, then share the link with friends. You'll control the music and vibe! 🎭
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feature highlights */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-400">🎵</span>
              </div>
              <p className="text-xs text-slate-400">Real-time Sync</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-pink-400">💬</span>
              </div>
              <p className="text-xs text-slate-400">Live Chat</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-cyan-400">🎨</span>
              </div>
              <p className="text-xs text-slate-400">Custom Themes</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Powered by <span className="text-purple-400">♪</span> music & friendship
          </p>
        </div>
      </div>
    </div>
  )
}