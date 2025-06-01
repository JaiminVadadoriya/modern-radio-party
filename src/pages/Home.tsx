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

  const handleSubmit = async (e: any) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      {/* Animated background elements - responsive positioning */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Floating music notes - responsive sizing and positioning */}
        <div className="absolute top-8 sm:top-20 left-8 sm:left-20 text-purple-400/30 text-2xl sm:text-4xl animate-bounce" style={{ animationDelay: '0s' }}>♪</div>
        <div className="absolute top-16 sm:top-40 right-12 sm:right-32 text-pink-400/30 text-xl sm:text-3xl animate-bounce" style={{ animationDelay: '2s' }}>♫</div>
        <div className="absolute bottom-16 sm:bottom-32 left-1/4 text-blue-400/30 text-3xl sm:text-5xl animate-bounce" style={{ animationDelay: '4s' }}>♬</div>
        <div className="absolute bottom-8 sm:bottom-20 right-8 sm:right-20 text-cyan-400/30 text-2xl sm:text-4xl animate-bounce" style={{ animationDelay: '6s' }}>♪</div>
      </div>

      <div className="relative z-10 w-full max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl">
        {/* Main card with glassmorphism effect - responsive padding and scaling */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8 transform transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105">
          {/* Header with animated gradient text - responsive sizing */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg">
              <span className="text-2xl sm:text-3xl">🎧</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2 animate-pulse leading-tight">
              Modern Radio Party
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">Host or join music sessions with friends</p>
          </div>

          {/* Room status indicator - responsive padding */}
          {roomId && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl sm:rounded-2xl border border-green-400/30 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-green-300 font-medium text-sm sm:text-base text-center break-all">
                  Ready to join: <span className="font-bold text-green-200">{roomId}</span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Name input with floating label effect - responsive sizing */}
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl sm:rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 text-white placeholder-slate-400 peer text-sm sm:text-base"
                placeholder=" "
                autoFocus
                maxLength={30}
              />
              <label
                htmlFor="name"
                className="absolute left-4 sm:left-6 top-3 sm:top-4 text-slate-400 transition-all duration-300 pointer-events-none peer-placeholder-shown:top-3 sm:peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-purple-400 peer-focus:bg-slate-800/80 peer-focus:px-2 peer-focus:rounded peer-valid:-top-2 peer-valid:text-xs sm:peer-valid:text-sm peer-valid:text-purple-400 peer-valid:bg-slate-800/80 peer-valid:px-2 peer-valid:rounded"
              >
                Your Name
              </label>
            </div>

            {/* Create room button - responsive sizing */}
            {!roomId && (
              <button
                type="button"
                onClick={handleCreateRoom}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 rounded-xl sm:rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 active:scale-95 hover:shadow-lg flex items-center justify-center space-x-2 group text-sm sm:text-base"
              >
                <span className="text-lg sm:text-xl group-hover:animate-spin">🎪</span>
                <span>Create New Room</span>
              </button>
            )}

            {/* Main action button - responsive sizing */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 active:from-blue-800 active:to-cyan-800 disabled:from-slate-600 disabled:to-slate-700 rounded-xl sm:rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 active:scale-95 hover:shadow-lg disabled:scale-100 disabled:shadow-none flex items-center justify-center space-x-2 group relative overflow-hidden text-sm sm:text-base"
            >
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 animate-pulse"></div>
              )}
              <span className="relative z-10 flex items-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg sm:text-xl group-hover:animate-bounce">
                      {isHost ? '🚀' : '🎵'}
                    </span>
                    <span>{isHost ? 'Start Room' : 'Join Room'}</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Host info card - responsive padding and text */}
          {isHost && (
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl sm:rounded-2xl border border-yellow-400/20 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <span className="text-base sm:text-lg">👑</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-yellow-200 mb-2">Host Powers</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Create your room first, then share the link with friends. You'll control the music and vibe! 🎭
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feature highlights - responsive grid and sizing */}
          <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <span className="text-purple-400 text-sm sm:text-base">🎵</span>
              </div>
              <p className="text-xs text-slate-400">Real-time Sync</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <span className="text-pink-400 text-sm sm:text-base">💬</span>
              </div>
              <p className="text-xs text-slate-400">Live Chat</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-cyan-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <span className="text-cyan-400 text-sm sm:text-base">🎨</span>
              </div>
              <p className="text-xs text-slate-400">Custom Themes</p>
            </div>
          </div>
        </div>

        {/* Footer - responsive text */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-slate-500 text-xs sm:text-sm">
            Powered by <span className="text-purple-400">♪</span> music & friendship
          </p>
        </div>
      </div>
    </div>
  )
}