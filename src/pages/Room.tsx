import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Socket, io } from 'socket.io-client'
import toast from 'react-hot-toast'
import YouTube from 'react-youtube'
import { FaUsers, FaHeadphones, FaCrown, FaMusic, FaPalette, FaMagic, FaTrash, FaPaperPlane, FaVolumeUp, FaUserCircle, FaLink, FaCopy, FaBars, FaTimes } from 'react-icons/fa'
import { BiTime, BiPlus } from 'react-icons/bi'
import { HiSparkles, HiLightningBolt } from 'react-icons/hi'
import { themes, getThemeClasses } from '../config/themes'
import { extractColorsFromImage } from '../utils/colorUtils'
import type { Message, Song, User, Theme, RoomState } from '../types'

// Default Socket.IO server URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

// Enhanced dynamic theme creation with better color processing
const createDynamicTheme = (colors: { primary: string; secondary: string; text: string; accent: string }): Theme => {
  // Ensure colors are valid hex codes
  const ensureHex = (color: string) => color.startsWith('#') ? color : `#${color}`

  return {
    id: 'dynamic',
    name: 'Dynamic',
    bgColor: `from-[${ensureHex(colors.primary)}] via-[${ensureHex(colors.secondary)}] to-black`,
    textColor: `text-[${ensureHex(colors.text)}]`,
    accentColor: colors.accent.replace('#', ''),
    secondaryColor: colors.secondary.replace('#', '')
  }
}

// Enhanced color extraction utility
const getImageColors = async (imageUrl: string) => {
  try {
    // Create a proxy URL to avoid CORS issues
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`

    return new Promise<{ primary: string; secondary: string; text: string; accent: string }>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve({
            primary: '#6366f1',
            secondary: '#8b5cf6',
            text: '#ffffff',
            accent: '#06b6d4'
          })
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Get dominant colors from the image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        const colorMap: { [key: string]: number } = {}

        // Sample colors from the image
        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]

          if (a > 128) { // Only consider non-transparent pixels
            // Group similar colors
            const groupedR = Math.floor(r / 32) * 32
            const groupedG = Math.floor(g / 32) * 32
            const groupedB = Math.floor(b / 32) * 32

            const colorKey = `${groupedR},${groupedG},${groupedB}`
            colorMap[colorKey] = (colorMap[colorKey] || 0) + 1
          }
        }

        // Get the most frequent colors
        const sortedColors = Object.entries(colorMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([color]) => color.split(',').map(Number))

        // Convert to hex and create theme
        const toHex = (rgb: number[]) =>
          '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('')

        const colors = sortedColors.map(toHex)

        resolve({
          primary: colors[0] || '#6366f1',
          secondary: colors[1] || '#8b5cf6',
          text: '#ffffff',
          accent: colors[2] || '#06b6d4'
        })
      }

      img.onerror = () => {
        resolve({
          primary: '#6366f1',
          secondary: '#8b5cf6',
          text: '#ffffff',
          accent: '#06b6d4'
        })
      }

      img.src = proxyUrl
    })
  } catch (error) {
    console.error('Error extracting colors:', error)
    return {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      text: '#ffffff',
      accent: '#06b6d4'
    }
  }
}

export default function Room() {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { name, isHost } = location.state || {}
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [theme, setTheme] = useState<Theme>(themes[0])
  const [isDynamicTheme, setIsDynamicTheme] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProcessingDynamicTheme, setIsProcessingDynamicTheme] = useState(false)

  const playerRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const syncIntervalRef = useRef<number>()

  useEffect(() => {
    if (!location.state) {
      navigate(`/#/room/${roomId}`)
      return
    }

    if (!name || !roomId) {
      navigate('/')
      return
    }

    const socketInstance = io(SOCKET_URL, {
      query: { roomId, name, isHost },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    })

    // Add connection error handling
    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error)
      toast.error('Failed to connect to server. Retrying...')
    })

    socketInstance.on('connect_timeout', () => {
      console.error('Connection timeout')
      toast.error('Connection timeout. Please check your internet connection.')
    })

    socketInstance.on('connect', () => {
      toast.success('Connected to room!')
      if (!isHost) {
        socketInstance.emit('requestSync')
      }
    })

    socketInstance.on('disconnect', () => {
      toast.error('Disconnected from room')
    })

    socketInstance.on('message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    socketInstance.on('songChange', async (song: Song) => {
      setCurrentSong(song)
      if (isDynamicTheme && song?.thumbnail && isHost) {
        setIsProcessingDynamicTheme(true)
        try {
          // Enhanced thumbnail URL generation
          const thumbnailUrl = song.thumbnail || `https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`
          const colors = await getImageColors(thumbnailUrl)
          const dynamicTheme = createDynamicTheme(colors)
          socketInstance.emit('updateTheme', dynamicTheme)
          toast.success('Dynamic theme updated!', { duration: 2000 })
        } catch (error) {
          console.error('Error creating dynamic theme:', error)
          toast.error('Failed to update dynamic theme')
        } finally {
          setIsProcessingDynamicTheme(false)
        }
      }
    })

    socketInstance.on('playlistUpdate', (updatedPlaylist: Song[]) => {
      setPlaylist(updatedPlaylist)
    })

    socketInstance.on('themeUpdate', ({ theme: newTheme, isDynamicTheme: isDynamic }) => {
      setTheme(newTheme)
      setIsDynamicTheme(isDynamic)
    })

    socketInstance.on('dynamicThemeUpdate', (isDynamic: boolean) => {
      setIsDynamicTheme(isDynamic)
    })

    socketInstance.on('playbackState', (state: { isPlaying: boolean; currentTime: number }) => {
      setIsPlaying(state.isPlaying)
      if (!isHost) {
        setCurrentTime(state.currentTime)
        if (playerRef.current) {
          playerRef.current.seekTo(state.currentTime)
          if (state.isPlaying) {
            playerRef.current.playVideo()
          } else {
            playerRef.current.pauseVideo()
          }
        }
      }
    })

    socketInstance.on('userList', ({ users: roomUsers, count }) => {
      // Remove duplicates based on name
      const uniqueUsers = roomUsers.reduce((acc: User[], user: User) => {
        const existingUser = acc.find((u: User) => u.name === user.name)
        if (!existingUser) {
          acc.push(user)
        }
        return acc
      }, [] as User[])

      setUsers(uniqueUsers)
    })

    socketInstance.on('roomState', (state: RoomState) => {
      setCurrentSong(state.currentSong)
      setPlaylist(state.playlist)
      setIsPlaying(state.isPlaying)
      setCurrentTime(state.currentTime)
      setTheme(state.theme)
      setIsDynamicTheme(state.isDynamicTheme)
    })

    socketInstance.on('roomClosed', () => {
      toast.error('Room was closed by the host')
      navigate('/')
    })

    setSocket(socketInstance)

    if (!isHost) {
      syncIntervalRef.current = window.setInterval(() => {
        socketInstance.emit('requestSync')
      }, 5000)
    }

    return () => {
      if (socketInstance.connected) {
        socketInstance.disconnect()
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [roomId, name, isHost, navigate, location.state, isDynamicTheme])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !socket) return

    socket.emit('message', {
      text: messageInput,
      timestamp: Date.now()
    })
    setMessageInput('')
  }

  const handlePlayerReady = (event: any) => {
    playerRef.current = event.target
  }

  const handlePlayerStateChange = (event: any) => {
    if (!socket || !isHost) return

    const state = event.target.getPlayerState()
    const currentTime = event.target.getCurrentTime()

    socket.emit('playbackState', {
      isPlaying: state === 1,
      currentTime
    })

    // Handle song end
    if (state === 0) {
      socket.emit('songEnded')
    }
  }

  const handleAddSong = (url: string) => {
    if (!socket || !isHost) return

    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]

    if (!videoId) {
      toast.error('Invalid YouTube URL')
      return
    }

    socket.emit('addSong', { id: videoId })
  }

  const handleThemeChange = (newTheme: Theme) => {
    if (!socket || !isHost) return
    socket.emit('updateTheme', newTheme)
  }

  const handleToggleDynamicTheme = async () => {
    if (!socket || !isHost) return

    const newDynamicState = !isDynamicTheme
    socket.emit('toggleDynamicTheme', newDynamicState)

    // If enabling dynamic theme and there's a current song, update theme immediately
    if (newDynamicState && currentSong?.thumbnail) {
      setIsProcessingDynamicTheme(true)
      try {
        const thumbnailUrl = currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.id}/mqdefault.jpg`
        const colors = await getImageColors(thumbnailUrl)
        const dynamicTheme = createDynamicTheme(colors)
        socket.emit('updateTheme', dynamicTheme)
        toast.success('Dynamic theme enabled!', { duration: 2000 })
      } catch (error) {
        console.error('Error creating dynamic theme:', error)
        toast.error('Failed to enable dynamic theme')
      } finally {
        setIsProcessingDynamicTheme(false)
      }
    } else if (!newDynamicState) {
      toast.success('Dynamic theme disabled', { duration: 2000 })
    }
  }

  const handleRemoveFromPlaylist = (songId: string) => {
    if (!socket || !isHost) return
    const updatedPlaylist = playlist.filter(song => song.id !== songId)
    socket.emit('updatePlaylist', updatedPlaylist)
  }

  const handleCopyRoomLink = () => {
    const roomLink = `${window.location.origin}/modern-radio-party/#/room/${roomId}`
    navigator.clipboard.writeText(roomLink)
    toast.success('Room link copied!')
    setShowShareModal(false)
  }

  const classes = getThemeClasses(theme)

  return (
    <div className={`min-h-screen ${classes.bg} transition-all duration-1000 ease-in-out relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000"></div>
        <div className="hidden sm:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 lg:w-96 lg:h-96 bg-gradient-to-br from-white/3 to-transparent rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-8">
        {/* Mobile Header */}
        <div className="lg:hidden backdrop-blur-xl bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl p-3 sm:p-4 mb-3 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <FaMusic className="text-white text-xs sm:text-base" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate">
                  Room {roomId}
                </h1>
                <p className="text-xs sm:text-sm text-gray-300">{users.length} users listening</p>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-300 flex-shrink-0"
            >
              {isMobileMenuOpen ? <FaTimes className="text-white text-sm sm:text-base" /> : <FaBars className="text-white text-sm sm:text-base" />}
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaMusic className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Room {roomId}
                  </h1>
                  <p className="text-sm text-gray-300">Live Music Session</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Stats */}
              <div className="flex items-center space-x-6 bg-black/20 rounded-2xl px-6 py-3 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <FaUsers className="text-blue-400" />
                  <span className="font-semibold">{users.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaHeadphones className="text-green-400" />
                  <span className="font-semibold">{users.filter(u => !u.isHost).length}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                  title="Share Room"
                >
                  <FaLink className="text-white" />
                </button>

                {isHost && (
                  <button
                    onClick={() => setShowThemeSelector(!showThemeSelector)}
                    className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                    title="Change Theme"
                  >
                    <FaPalette className="text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-4 mb-6 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 bg-black/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <FaUsers className="text-blue-400 text-sm" />
                  <span className="font-semibold text-sm">{users.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaHeadphones className="text-green-400 text-sm" />
                  <span className="font-semibold text-sm">{users.filter(u => !u.isHost).length}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowShareModal(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
                  title="Share Room"
                >
                  <FaLink className="text-white text-sm" />
                </button>

                {isHost && (
                  <button
                    onClick={() => {
                      setShowThemeSelector(!showThemeSelector)
                      setIsMobileMenuOpen(false)
                    }}
                    className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
                    title="Change Theme"
                  >
                    <FaPalette className="text-white text-sm" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Theme Selector */}
        {showThemeSelector && isHost && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 animate-slide-down">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <HiSparkles className="text-xl sm:text-2xl text-purple-400" />
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Theme Studio
                </h3>
              </div>
              <button
                onClick={handleToggleDynamicTheme}
                disabled={isProcessingDynamicTheme}
                className={`flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:scale-105 ${isDynamicTheme
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  : 'bg-white/20 hover:bg-white/30'
                  } ${isProcessingDynamicTheme ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessingDynamicTheme ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <FaMagic className={isDynamicTheme ? 'text-white' : 'text-purple-400'} />
                )}
                <span className={`font-semibold text-sm sm:text-base ${isDynamicTheme ? 'text-white' : 'text-gray-300'}`}>
                  Dynamic: {isDynamicTheme ? 'On' : 'Off'}
                </span>
                {isDynamicTheme && !isProcessingDynamicTheme && <HiLightningBolt className="text-yellow-300" />}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t)}
                  className={`group relative p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 ${theme.id === t.id
                    ? 'ring-2 sm:ring-4 ring-white/50 shadow-2xl'
                    : 'hover:ring-2 hover:ring-white/30'
                    } bg-gradient-to-br ${t.bgColor} shadow-lg`}
                >
                  <div className="text-center">
                    <div className={`text-sm sm:text-base lg:text-lg font-bold ${t.textColor} mb-1 sm:mb-2`}>{t.name}</div>
                    <div className="w-full h-1 sm:h-2 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-white/40 to-white/60 rounded-full transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </div>
                  </div>
                  {theme.id === t.id && (
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Now Playing */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl overflow-hidden animate-fade-in-up">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {isPlaying && (
                        <div className="flex space-x-1">
                          <div className="w-1 h-6 sm:h-8 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-pulse"></div>
                          <div className="w-1 h-4 sm:h-6 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-pulse delay-75"></div>
                          <div className="w-1 h-8 sm:h-10 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-pulse delay-150"></div>
                          <div className="w-1 h-5 sm:h-7 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-pulse delay-300"></div>
                        </div>
                      )}
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        Now Playing
                      </h2>
                    </div>
                  </div>
                  {isPlaying && <FaVolumeUp className="text-green-400 text-lg sm:text-xl lg:text-2xl animate-pulse" />}
                </div>
                {currentSong && (
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                    <img
                      src={currentSong.thumbnail}
                      alt={currentSong.title}
                      className="w-12 h-9 sm:w-16 sm:h-12 object-cover rounded-lg sm:rounded-xl shadow-lg flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base sm:text-lg lg:text-xl font-semibold text-white line-clamp-2 sm:line-clamp-1">{currentSong.title}</p>
                      <p className="text-sm sm:text-base text-gray-300">Added by {currentSong.addedBy}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="aspect-video bg-black/50 backdrop-blur-sm">
                {currentSong ? (
                  <YouTube
                    videoId={currentSong.id}
                    opts={{
                      height: '100%',
                      width: '100%',
                      playerVars: {
                        autoplay: 1,
                        controls: isHost ? 1 : 0,
                        modestbranding: 1,
                        rel: 0
                      }
                    }}
                    onReady={handlePlayerReady}
                    onStateChange={handlePlayerStateChange}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <FaMusic className="text-6xl text-gray-400 mx-auto mb-4 opacity-50" />
                      <p className="text-xl text-gray-400">No song playing</p>
                      <p className="text-gray-500 mt-2">Waiting for the host to add music...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Host Controls */}
            {isHost && (
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-6 lg:p-8 animate-fade-in-up delay-100">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <FaCrown className="text-white text-base sm:text-xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      Host Controls
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300">Add music to keep the party going</p>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const input = e.currentTarget.querySelector('input')
                    if (input) {
                      handleAddSong(input.value)
                      input.value = ''
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                >
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Paste YouTube URL here..."
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <BiPlus className="text-lg sm:text-xl" />
                    <span className="text-sm sm:text-base">Add Song</span>
                  </button>
                </form>
              </div>
            )}

            {/* Playlist */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-6 lg:p-8 animate-fade-in-up delay-200">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <FaMusic className="text-white text-base sm:text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Up Next
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300">{playlist.length} songs in queue</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
                {playlist.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="group flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-12 h-9 sm:w-16 sm:h-12 object-cover rounded-lg sm:rounded-xl shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-white font-bold text-xs">#{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate mb-1 text-sm sm:text-base">{song.title}</p>
                        <p className="text-xs sm:text-sm text-gray-400">Added by {song.addedBy}</p>
                      </div>
                    </div>
                    {isHost && (
                      <button
                        onClick={() => handleRemoveFromPlaylist(song.id)}
                        className="p-2 sm:p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg sm:rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        title="Remove from playlist"
                      >
                        <FaTrash className="text-sm sm:text-base" />
                      </button>
                    )}
                  </div>
                ))}
                {playlist.length === 0 && (
                  <div className="text-center py-12">
                    <FaMusic className="text-6xl text-gray-400 mx-auto mb-4 opacity-30" />
                    <p className="text-xl text-gray-400">No songs in queue</p>
                    <p className="text-gray-500 mt-2">
                      {isHost ? 'Add some music to get started!' : 'Waiting for the host to add songs...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Users List */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-6 animate-fade-in-right">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <FaUsers className="text-white text-sm sm:text-base" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Listeners
                </h3>
              </div>
              <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto custom-scrollbar">
                {users.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <FaUserCircle className={`text-lg sm:text-2xl ${user.isHost ? 'text-yellow-400' : 'text-blue-400'}`} />
                        {user.isHost && (
                          <FaCrown className="absolute -top-1 -right-1 text-xs text-yellow-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-white text-sm sm:text-base truncate block">{user.name}</span>
                        {user.isHost && (
                          <span className="block text-xs text-yellow-400">Host</span>
                        )}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Section */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-6 animate-fade-in-right delay-100">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <FaPaperPlane className="text-white text-sm sm:text-base" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Live Chat
                </h3>
              </div>

              <div className="h-64 sm:h-80 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-3 sm:mb-4 custom-scrollbar">
                  {messages.map((message, index) => (
                    <div key={index} className="group animate-slide-in">
                      <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                        <FaUserCircle className="text-blue-400 text-base sm:text-lg mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-blue-300 text-xs sm:text-sm truncate">
                              {message.user}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-gray-200 text-xs sm:text-sm break-words">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No messages yet</p>
                      <p className="text-gray-500 text-sm mt-1">Start the conversation!</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  />
                  <button
                    type="submit"
                    className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 flex-shrink-0"
                  >
                    <FaPaperPlane className="text-sm sm:text-base" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 shadow-lg animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Share Room</h3>
            <p className="text-gray-600 mb-4">Share this link with your friends to join the room:</p>
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/modern-radio-party/#/room/${roomId}`}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                onClick={handleCopyRoomLink}
                className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300"
              >
                <FaCopy />
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}