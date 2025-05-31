# 🎧 Modern Radio Party

A real-time, host-driven music sharing platform where users can create or join themed party rooms. The host streams music from YouTube, while friends join to listen, chat, and react — all in perfect sync.

## 🌟 Features

- Create or join party rooms with a simple room ID
- Host controls music playback for all listeners
- Real-time chat and reactions
- YouTube music integration
- Responsive design for all devices
- No login required

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/modern-radio-party.git
cd modern-radio-party
```

2. Install client dependencies:
```bash
npm install
```

3. Install server dependencies:
```bash
cd server
npm install
cd ..
```

### Environment Setup

1. Create a `.env` file in the root directory:
```bash
VITE_SOCKET_URL=http://localhost:3001
```

For production, set `VITE_SOCKET_URL` to your deployed Socket.IO server URL.

### Running the Development Environment

1. Start the WebSocket server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the client:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

1. Build the client:
```bash
npm run build
```

2. The built files will be in the `dist` directory, ready to be deployed to GitHub Pages or any static hosting service.

### GitHub Pages Deployment

1. Fork this repository
2. Enable GitHub Pages in your repository settings
3. Set the source to the `gh-pages` branch
4. Add your Socket.IO server URL as a repository secret named `VITE_SOCKET_URL`
5. Push to the `main` branch to trigger automatic deployment

The application will be available at `https://yourusername.github.io/modern-radio-party/`

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Real-time Communication**: Socket.IO
- **Music Integration**: YouTube Player API
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
