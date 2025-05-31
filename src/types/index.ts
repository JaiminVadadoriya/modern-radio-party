export interface Message {
  user: string
  text: string
  timestamp: number
}

export interface Song {
  id: string
  title: string
  thumbnail: string
  duration?: string
  addedBy?: string
}

export interface User {
  name: string
  isHost: boolean
}

export interface Theme {
  id: string
  name: string
  bgColor: string
  textColor: string
  accentColor: string
  secondaryColor: string
}

export interface RoomState {
  currentSong: Song | null
  playlist: Song[]
  isPlaying: boolean
  currentTime: number
  theme: Theme
  isDynamicTheme: boolean
} 