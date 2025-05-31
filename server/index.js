const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const axios = require('axios')

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Store room data in memory
const rooms = new Map()

// Helper function to get video details from YouTube
async function getVideoDetails(videoId) {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${process.env.YOUTUBE_API_KEY}`)
    const video = response.data.items[0]
    return {
      id: videoId,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.medium.url,
      duration: video.contentDetails.duration
    }
  } catch (error) {
    console.error('Error fetching video details:', error)
    return {
      id: videoId,
      title: 'Unknown Title',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      duration: 'Unknown'
    }
  }
}

io.on('connection', (socket) => {
  const { roomId, name, isHost } = socket.handshake.query

  // Join room
  socket.join(roomId)

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      host: isHost === 'true' ? socket.id : null,
      playlist: [],
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      users: new Map(),
      lastUpdateTime: Date.now(),
      theme: {
        id: 'dark',
        name: 'Dark Mode',
        bgColor: 'from-gray-900 to-black',
        textColor: 'text-white',
        accentColor: 'blue',
        secondaryColor: 'gray'
      },
      isDynamicTheme: false
    })
  }

  // Add user to room
  const room = rooms.get(roomId)
  room.users.set(socket.id, { name, isHost: isHost === 'true' })

  // If host joins, update host ID
  if (isHost === 'true') {
    room.host = socket.id
  }

  // Emit updated user list to all clients in the room
  io.to(roomId).emit('userList', {
    users: Array.from(room.users.values()),
    count: room.users.size
  })

  // Send current room state to new user
  socket.emit('roomState', {
    currentSong: room.currentSong,
    isPlaying: room.isPlaying,
    currentTime: room.currentTime,
    playlist: room.playlist,
    theme: room.theme,
    isDynamicTheme: room.isDynamicTheme
  })

  // Handle messages
  socket.on('message', (message) => {
    io.to(roomId).emit('message', {
      user: name,
      text: message.text,
      timestamp: message.timestamp
    })
  })

  // Handle song changes
  socket.on('addSong', async (song) => {
    if (socket.id === room.host) {
      const songDetails = await getVideoDetails(song.id)
      songDetails.addedBy = name
      room.playlist.push(songDetails)
      
      if (!room.currentSong) {
        room.currentSong = songDetails
        io.to(roomId).emit('songChange', songDetails)
      }
      
      io.to(roomId).emit('playlistUpdate', room.playlist)
    }
  })

  // Handle playlist updates
  socket.on('updatePlaylist', (playlist) => {
    if (socket.id === room.host) {
      room.playlist = playlist
      io.to(roomId).emit('playlistUpdate', playlist)
    }
  })

  // Handle theme changes
  socket.on('updateTheme', (theme) => {
    if (socket.id === room.host) {
      // Ensure theme has all required properties
      if (theme && theme.id && theme.name && theme.bgColor && theme.textColor && theme.accentColor && theme.secondaryColor) {
        room.theme = theme
        room.isDynamicTheme = theme.id === 'dynamic'
        io.to(roomId).emit('themeUpdate', { theme, isDynamicTheme: room.isDynamicTheme })
      }
    }
  })

  // Handle dynamic theme toggle
  socket.on('toggleDynamicTheme', (isDynamic) => {
    if (socket.id === room.host) {
      room.isDynamicTheme = isDynamic
      io.to(roomId).emit('dynamicThemeUpdate', isDynamic)
    }
  })

  // Handle playback state changes
  socket.on('playbackState', (state) => {
    if (socket.id === room.host) {
      room.isPlaying = state.isPlaying
      room.currentTime = state.currentTime
      room.lastUpdateTime = Date.now()
      io.to(roomId).emit('playbackState', state)
    }
  })

  // Handle song end
  socket.on('songEnded', () => {
    if (socket.id === room.host && room.playlist.length > 0) {
      // Remove the current song from playlist
      const currentIndex = room.playlist.findIndex(song => song.id === room.currentSong.id)
      if (currentIndex !== -1) {
        room.playlist.splice(currentIndex, 1)
      }
      
      // Play next song if available
      if (room.playlist.length > 0) {
        room.currentSong = room.playlist[0]
        io.to(roomId).emit('songChange', room.currentSong)
      } else {
        room.currentSong = null
        io.to(roomId).emit('songChange', null)
      }
      
      io.to(roomId).emit('playlistUpdate', room.playlist)
    }
  })

  // Handle sync requests from guests
  socket.on('requestSync', () => {
    if (socket.id !== room.host) {
      io.to(room.host).emit('syncRequest', { userId: socket.id })
    }
  })

  // Handle sync response from host
  socket.on('syncResponse', (data) => {
    if (socket.id === room.host) {
      io.to(data.userId).emit('sync', {
        currentTime: data.currentTime,
        isPlaying: data.isPlaying
      })
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    if (room) {
      room.users.delete(socket.id)
      
      // Emit updated user list
      io.to(roomId).emit('userList', {
        users: Array.from(room.users.values()),
        count: room.users.size
      })

      if (socket.id === room.host) {
        // If host disconnects, close the room
        rooms.delete(roomId)
        io.to(roomId).emit('roomClosed')
      }
    }
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 