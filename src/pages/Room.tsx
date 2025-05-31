import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Socket, io } from 'socket.io-client'
import toast from 'react-hot-toast'
import YouTube from 'react-youtube'
import { FaUsers, FaHeadphones, FaCrown, FaMusic, FaPalette, FaMagic, FaTrash, FaPaperPlane, FaVolumeUp, FaUserCircle, FaLink, FaCopy } from 'react-icons/fa'
import { BiTime, BiPlus } from 'react-icons/bi'
import { HiSparkles, HiLightningBolt } from 'react-icons/hi'
import { themes, getThemeClasses } from '../config/themes'
import { extractColorsFromImage } from '../utils/colorUtils'
import type { Message, Song, User, Theme, RoomState } from '../types'

// Default Socket.IO server URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

// Add this function after the imports and before the Room component
const createDynamicTheme = (colors: { primary: string; secondary: string; text: string; accent: string }): Theme => {
  return {
    id: 'dynamic',
    name: 'Dynamic',
    bgColor: `from-[${colors.primary}] to-[${colors.secondary}]`,
    textColor: `text-[${colors.text}]`,
    accentColor: colors.accent.replace('#', ''),
    secondaryColor: colors.secondary.replace('#', '')
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
      if (isDynamicTheme && song?.thumbnail) {
        try {
          // Get thumbnail URL
          const thumbnailUrl = `https://i.ytimg.com/vi_webp/${song.id}/mqdefault.webp`
          const colors = await extractColorsFromImage(thumbnailUrl)
          const dynamicTheme = createDynamicTheme(colors)
          socketInstance.emit('updateTheme', dynamicTheme)
        } catch (error) {
          console.error('Error creating dynamic theme:', error)
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
  }, [roomId, name, isHost, navigate, location.state])

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

  const handleToggleDynamicTheme = () => {
    if (!socket || !isHost) return
    socket.emit('toggleDynamicTheme', !isDynamicTheme)
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-white/3 to-transparent rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 mb-8 animate-fade-in">
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

        {/* Theme Selector */}
        {showThemeSelector && isHost && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 mb-8 animate-slide-down">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <HiSparkles className="text-2xl text-purple-400" />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Theme Studio
                </h3>
              </div>
              <button
                onClick={handleToggleDynamicTheme}
                className={`flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:scale-105 ${
                  isDynamicTheme 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <FaMagic className={isDynamicTheme ? 'text-white' : 'text-purple-400'} />
                <span className={`font-semibold ${isDynamicTheme ? 'text-white' : 'text-gray-300'}`}>
                  Dynamic: {isDynamicTheme ? 'On' : 'Off'}
                </span>
                {isDynamicTheme && <HiLightningBolt className="text-yellow-300" />}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t)}
                  className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    theme.id === t.id 
                      ? 'ring-4 ring-white/50 shadow-2xl' 
                      : 'hover:ring-2 hover:ring-white/30'
                  } bg-gradient-to-br ${t.bgColor} shadow-lg`}
                >
                  <div className="text-center">
                    <div className={`text-lg font-bold ${t.textColor} mb-2`}>{t.name}</div>
                    <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-white/40 to-white/60 rounded-full transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </div>
                  </div>
                  {theme.id === t.id && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Now Playing */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden animate-fade-in-up">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      {isPlaying && (
                        <div className="flex space-x-1">
                          <div className="w-1 h-8 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-pulse"></div>
                          <div className="w-1 h-6 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-pulse delay-75"></div>
                          <div className="w-1 h-10 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-pulse delay-150"></div>
                          <div className="w-1 h-7 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-pulse delay-300"></div>
                        </div>
                      )}
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        Now Playing
                      </h2>
                    </div>
                  </div>
                  {isPlaying && <FaVolumeUp className="text-green-400 text-2xl animate-pulse" />}
                </div>
                {currentSong && (
                  <div className="flex items-center space-x-4 mb-6">
                    <img
                      src={currentSong.thumbnail}
                      alt={currentSong.title}
                      className="w-16 h-12 object-cover rounded-xl shadow-lg"
                    />
                    <div>
                      <p className="text-xl font-semibold text-white line-clamp-1">{currentSong.title}</p>
                      <p className="text-gray-300">Added by {currentSong.addedBy}</p>
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
              <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in-up delay-100">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FaCrown className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      Host Controls
                    </h3>
                    <p className="text-gray-300">Add music to keep the party going</p>
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
                  className="flex gap-4"
                >
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Paste YouTube URL here..."
                      className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  >
                    <BiPlus className="text-xl" />
                    <span>Add Song</span>
                  </button>
                </form>
              </div>
            )}

            {/* Playlist */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in-up delay-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FaMusic className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Up Next
                    </h3>
                    <p className="text-gray-300">{playlist.length} songs in queue</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {playlist.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative">
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-16 h-12 object-cover rounded-xl shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-white font-bold text-xs">#{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate mb-1">{song.title}</p>
                        <p className="text-sm text-gray-400">Added by {song.addedBy}</p>
                      </div>
                    </div>
                    {isHost && (
                      <button
                        onClick={() => handleRemoveFromPlaylist(song.id)}
                        className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                        title="Remove from playlist"
                      >
                        <FaTrash />
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
          <div className="space-y-8">
            {/* Users List */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 animate-fade-in-right">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FaUsers className="text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Listeners
                </h3>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {users.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <FaUserCircle className={`text-2xl ${user.isHost ? 'text-yellow-400' : 'text-blue-400'}`} />
                        {user.isHost && (
                          <FaCrown className="absolute -top-1 -right-1 text-xs text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-white">{user.name}</span>
                        {user.isHost && (
                          <span className="block text-xs text-yellow-400">Host</span>
                        )}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Section */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 animate-fade-in-right delay-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FaPaperPlane className="text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Live Chat
                </h3>
              </div>
              
              <div className="h-80 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
                  {messages.map((message, index) => (
                    <div key={index} className="group animate-slide-in">
                      <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                        <FaUserCircle className="text-blue-400 text-lg mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-blue-300 text-sm truncate">
                              {message.user}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {new Date(message.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm break-words">{message.text}</p>
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
                
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                  />
                  <button
                    type="submit"
                    className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                  >
                    <FaPaperPlane />
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