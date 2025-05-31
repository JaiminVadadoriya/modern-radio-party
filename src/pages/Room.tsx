import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Socket, io } from 'socket.io-client'
import toast from 'react-hot-toast'
import YouTube from 'react-youtube'
import { FaUsers, FaHeadphones, FaCrown, FaMusic, FaPalette, FaMagic, FaTrash } from 'react-icons/fa'
import { BiTime } from 'react-icons/bi'
import { themes, getThemeClasses } from '../config/themes'
import type { Message, Song, User, Theme, RoomState } from '../types'

// Default Socket.IO server URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

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
      query: { roomId, name, isHost }
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

    socketInstance.on('songChange', (song: Song) => {
      setCurrentSong(song)
      if (isDynamicTheme && song?.thumbnail) {
        // TODO: Extract dominant colors from thumbnail and create dynamic theme
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
      setUsers(roomUsers)
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
      socketInstance.disconnect()
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

  const classes = getThemeClasses(theme)

  return (
    <div className={`min-h-screen ${classes.bg} ${classes.text}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Room: {roomId}</h1>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <FaUsers className={classes.accent} />
              <span>{users.length} users</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaHeadphones className="text-green-400" />
              <span>{users.filter(u => !u.isHost).length} listeners</span>
            </div>
            {isHost && (
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className={`p-2 rounded ${classes.accentBg}`}
                title="Change Theme"
              >
                <FaPalette />
              </button>
            )}
          </div>
        </div>

        {showThemeSelector && isHost && (
          <div className={`mb-8 p-6 rounded-lg ${classes.secondary}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Theme Settings</h3>
              <button
                onClick={handleToggleDynamicTheme}
                className={`flex items-center space-x-2 px-4 py-2 rounded ${
                  isDynamicTheme ? 'bg-purple-600 hover:bg-purple-700' : classes.accentBg
                }`}
              >
                <FaMagic />
                <span>Dynamic Theme: {isDynamicTheme ? 'On' : 'Off'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t)}
                  className={`p-4 rounded-lg ${
                    theme.id === t.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  } bg-gradient-to-br ${t.bgColor}`}
                >
                  <span className={t.textColor}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-lg overflow-hidden ${classes.secondary}`}>
              <div className={`p-4 ${classes.secondary}`}>
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <span>Now Playing</span>
                  {isPlaying && <span className="text-green-400">▶</span>}
                </h2>
                {currentSong && (
                  <p className={`mt-2 ${classes.accent}`}>{currentSong.title}</p>
                )}
              </div>
              <div className="aspect-video">
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
                  <div className={`w-full h-full ${classes.secondary} flex items-center justify-center`}>
                    <p className="text-gray-400">No song playing</p>
                  </div>
                )}
              </div>
            </div>

            {isHost && (
              <div className={`rounded-lg p-6 ${classes.secondary}`}>
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <FaCrown className="text-yellow-400" />
                  <span>Host Controls</span>
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const input = e.currentTarget.querySelector('input')
                    if (input) {
                      handleAddSong(input.value)
                      input.value = ''
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Paste YouTube URL"
                    className={`flex-1 px-4 py-2 rounded ${classes.input}`}
                  />
                  <button
                    type="submit"
                    className={`px-6 py-2 rounded font-medium ${classes.accentBg}`}
                  >
                    Add Song
                  </button>
                </form>
              </div>
            )}

            {/* Playlist */}
            <div className={`rounded-lg p-6 ${classes.secondary}`}>
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <FaMusic className={classes.accent} />
                <span>Playlist</span>
                <span className="text-sm text-gray-400">({playlist.length} songs)</span>
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {playlist.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className={`flex items-center justify-between p-3 rounded ${classes.secondary} ${classes.secondaryHover}`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-16 h-9 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{song.title}</p>
                        <p className="text-sm text-gray-400">Added by: {song.addedBy}</p>
                      </div>
                    </div>
                    {isHost && (
                      <button
                        onClick={() => handleRemoveFromPlaylist(song.id)}
                        className="p-2 text-red-400 hover:text-red-300"
                        title="Remove from playlist"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
                {playlist.length === 0 && (
                  <p className="text-center text-gray-400">No songs in playlist</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Users List */}
            <div className={`rounded-lg p-6 ${classes.secondary}`}>
              <h3 className="text-xl font-bold mb-4">Users</h3>
              <div className="space-y-2">
                {users.map((user, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded ${classes.secondary}`}
                  >
                    <div className="flex items-center space-x-2">
                      {user.isHost ? (
                        <FaCrown className="text-yellow-400" />
                      ) : (
                        <FaHeadphones className="text-green-400" />
                      )}
                      <span>{user.name}</span>
                    </div>
                    {user.isHost && (
                      <span className="text-xs text-yellow-400">Host</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Section */}
            <div className={`rounded-lg p-6 ${classes.secondary}`}>
              <h3 className="text-xl font-bold mb-4">Chat</h3>
              <div className="h-[400px] flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`rounded p-3 ${classes.secondary}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${classes.accent}`}>
                          {message.user}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-200">{message.text}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className={`flex-1 px-4 py-2 rounded ${classes.input}`}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded font-medium ${classes.accentBg}`}
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 