import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * localStorage schema for edit locks
 */
export interface EditLock {
  timestamp: number
  tabId: string
}

export interface EditLocks {
  [rowId: string]: EditLock
}

const STORAGE_KEY = 'spaceos_edit_locks'
const LOCK_TIMEOUT_MS = 30_000 // 30 seconds

/**
 * Generate unique tab ID
 */
function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * useEditLock
 *
 * Manages localStorage-based edit locks with multi-tab conflict detection.
 * Prevents concurrent editing of the same row across multiple browser tabs.
 */
export function useEditLock(rowId: string | null) {
  const tabIdRef = useRef<string>(generateTabId())
  const [hasConflict, setHasConflict] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  /**
   * Read current locks from localStorage
   */
  const readLocks = useCallback((): EditLocks => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const locks: EditLocks = JSON.parse(stored)

        // Clean up expired locks
        const now = Date.now()
        const cleaned: EditLocks = {}
        for (const [id, lock] of Object.entries(locks)) {
          if (now - lock.timestamp < LOCK_TIMEOUT_MS) {
            cleaned[id] = lock
          }
        }

        // Write back cleaned locks if any were removed
        if (Object.keys(cleaned).length !== Object.keys(locks).length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
        }

        return cleaned
      }
    } catch (error) {
      console.error('Failed to read edit locks:', error)
    }
    return {}
  }, [])

  /**
   * Acquire lock for current row
   */
  const acquireLock = useCallback(() => {
    if (!rowId) return false

    const locks = readLocks()
    const existingLock = locks[rowId]

    // Check if another tab has the lock
    if (existingLock && existingLock.tabId !== tabIdRef.current) {
      const now = Date.now()
      if (now - existingLock.timestamp < LOCK_TIMEOUT_MS) {
        setHasConflict(true)
        return false
      }
    }

    // Acquire lock
    try {
      const newLocks: EditLocks = {
        ...locks,
        [rowId]: {
          timestamp: Date.now(),
          tabId: tabIdRef.current,
        },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocks))
      setIsLocked(true)
      setHasConflict(false)
      return true
    } catch (error) {
      console.error('Failed to acquire edit lock:', error)
      return false
    }
  }, [rowId, readLocks])

  /**
   * Release lock for current row
   */
  const releaseLock = useCallback(() => {
    if (!rowId) return

    try {
      const locks = readLocks()
      const lock = locks[rowId]

      // Only release if we own the lock
      if (lock && lock.tabId === tabIdRef.current) {
        const newLocks = { ...locks }
        delete newLocks[rowId]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocks))
        setIsLocked(false)
      }
    } catch (error) {
      console.error('Failed to release edit lock:', error)
    }
  }, [rowId, readLocks])

  /**
   * Refresh lock timestamp (keep-alive)
   */
  const refreshLock = useCallback(() => {
    if (!rowId || !isLocked) return

    try {
      const locks = readLocks()
      const lock = locks[rowId]

      if (lock && lock.tabId === tabIdRef.current) {
        const newLocks: EditLocks = {
          ...locks,
          [rowId]: {
            ...lock,
            timestamp: Date.now(),
          },
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocks))
      }
    } catch (error) {
      console.error('Failed to refresh edit lock:', error)
    }
  }, [rowId, isLocked, readLocks])

  /**
   * Handle storage events from other tabs
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !rowId) return

      try {
        const newLocks: EditLocks = e.newValue ? JSON.parse(e.newValue) : {}
        const lock = newLocks[rowId]

        // Another tab acquired the lock
        if (lock && lock.tabId !== tabIdRef.current) {
          const now = Date.now()
          if (now - lock.timestamp < LOCK_TIMEOUT_MS) {
            setHasConflict(true)
            setIsLocked(false)
          }
        }

        // Lock was released
        if (!lock && hasConflict) {
          setHasConflict(false)
        }
      } catch (error) {
        console.error('Failed to handle storage change:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [rowId, hasConflict])

  /**
   * Auto-release lock on unmount or rowId change
   */
  useEffect(() => {
    return () => {
      if (isLocked) {
        releaseLock()
      }
    }
  }, [isLocked, releaseLock])

  /**
   * Keep-alive: refresh lock every 10 seconds
   */
  useEffect(() => {
    if (!isLocked) return

    const interval = setInterval(refreshLock, 10_000)
    return () => clearInterval(interval)
  }, [isLocked, refreshLock])

  return {
    hasConflict,
    isLocked,
    acquireLock,
    releaseLock,
    tabId: tabIdRef.current,
  }
}
