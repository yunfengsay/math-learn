import { useSyncExternalStore } from 'react'

export interface ThemeColors {
  plotlyText: string
  plotlyTitle: string
  plotlyGrid: string
  accent: string
  accentDim: string
  editorTheme: 'vs-dark' | 'light'
  canvasBg: string
  errorColor: string
}

function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark'
}

const darkColors: ThemeColors = {
  plotlyText: '#a1a1aa',
  plotlyTitle: '#fafafa',
  plotlyGrid: '#2e2e33',
  accent: '#10b981',
  accentDim: '#2e2e33',
  editorTheme: 'vs-dark',
  canvasBg: '#09090b',
  errorColor: '#ef4444',
}

const lightColors: ThemeColors = {
  plotlyText: '#71717a',
  plotlyTitle: '#18181b',
  plotlyGrid: '#e4e4e7',
  accent: '#059669',
  accentDim: '#e4e4e7',
  editorTheme: 'light',
  canvasBg: '#e4e4e7',
  errorColor: '#dc2626',
}

let listeners: (() => void)[] = []

const observer = new MutationObserver(() => {
  listeners.forEach(fn => fn())
})
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

function subscribe(fn: () => void) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

export function useThemeColors(): ThemeColors {
  const theme = useSyncExternalStore(subscribe, getTheme)
  return theme === 'light' ? lightColors : darkColors
}
