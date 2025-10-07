'use client'

import { useEffect } from 'react'

export default function ContentProtection() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Disable drag
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    // Disable copy shortcuts (Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+S)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow normal typing and navigation
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') {
        return
      }
      
      // Block copy, cut, select all, save shortcuts
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 'c' || e.key === 'x' || e.key === 'a' || e.key === 's' || e.key === 'v')
      ) {
        e.preventDefault()
        return false
      }
      
      // Block F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault()
        return false
      }
      
      // Block Ctrl+Shift+I (Developer Tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        return false
      }
      
      // Block Ctrl+Shift+C (Element Inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        return false
      }
    }

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('keydown', handleKeyDown)

    // Disable text selection via CSS
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    ;(document.body.style as any).mozUserSelect = 'none'
    ;(document.body.style as any).msUserSelect = 'none'

    // Disable image dragging
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      img.draggable = false
      img.style.pointerEvents = 'none'
    })

    // Note: Watermarks are applied server-side during image generation
    // No need for client-side overlay watermarks

    // Console warning
    console.clear()
    console.log('%c⚠️ Content Protection Active', 'color: red; font-size: 20px; font-weight: bold;')
    console.log('%cThis content is protected by Timeline Alchemy', 'color: orange; font-size: 14px;')

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('keydown', handleKeyDown)
      
      // Restore text selection
      document.body.style.userSelect = 'auto'
      document.body.style.webkitUserSelect = 'auto'
      ;(document.body.style as any).mozUserSelect = 'auto'
      ;(document.body.style as any).msUserSelect = 'auto'
    }
  }, [])

  return null
}
