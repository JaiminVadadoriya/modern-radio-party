import type { Theme } from '../types'

export const themes: Theme[] = [
  {
    id: 'dark',
    name: 'Dark Mode',
    bgColor: 'from-gray-900 to-black',
    textColor: 'text-white',
    accentColor: 'blue',
    secondaryColor: 'gray'
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    bgColor: 'from-purple-900 via-pink-800 to-indigo-900',
    textColor: 'text-pink-100',
    accentColor: 'pink',
    secondaryColor: 'purple'
  },
  {
    id: 'forest',
    name: 'Forest',
    bgColor: 'from-green-900 via-emerald-800 to-teal-900',
    textColor: 'text-emerald-100',
    accentColor: 'emerald',
    secondaryColor: 'green'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bgColor: 'from-blue-900 via-cyan-800 to-indigo-900',
    textColor: 'text-cyan-100',
    accentColor: 'cyan',
    secondaryColor: 'blue'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    bgColor: 'from-orange-900 via-red-800 to-pink-900',
    textColor: 'text-orange-100',
    accentColor: 'orange',
    secondaryColor: 'red'
  }
]

export const getThemeClasses = (theme: Theme) => ({
  bg: `bg-gradient-to-br ${theme.bgColor}`,
  text: theme.textColor,
  accent: `text-${theme.accentColor}-400`,
  accentBg: `bg-${theme.accentColor}-600 hover:bg-${theme.accentColor}-700`,
  secondary: `bg-${theme.secondaryColor}-800`,
  secondaryHover: `hover:bg-${theme.secondaryColor}-700`,
  border: `border-${theme.secondaryColor}-600`,
  input: `bg-${theme.secondaryColor}-700 border-${theme.secondaryColor}-600 focus:border-${theme.accentColor}-500 focus:ring-${theme.accentColor}-500`
}) 