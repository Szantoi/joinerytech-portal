import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useEditLock } from '../useEditLock'

describe('useEditLock', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with no conflict and not locked', () => {
    const { result } = renderHook(() => useEditLock('row-1'))

    expect(result.current.hasConflict).toBe(false)
    expect(result.current.isLocked).toBe(false)
    expect(result.current.tabId).toBeDefined()
  })

  it('should acquire lock successfully when no existing lock', () => {
    const { result } = renderHook(() => useEditLock('row-1'))

    act(() => {
      const acquired = result.current.acquireLock()
      expect(acquired).toBe(true)
    })

    expect(result.current.isLocked).toBe(true)
    expect(result.current.hasConflict).toBe(false)

    // Verify lock in localStorage
    const locks = JSON.parse(localStorage.getItem('spaceos_edit_locks') || '{}')
    expect(locks['row-1']).toBeDefined()
    expect(locks['row-1'].tabId).toBe(result.current.tabId)
  })

  it('should release lock successfully', () => {
    const { result } = renderHook(() => useEditLock('row-1'))

    act(() => {
      result.current.acquireLock()
    })

    expect(result.current.isLocked).toBe(true)

    act(() => {
      result.current.releaseLock()
    })

    expect(result.current.isLocked).toBe(false)

    // Verify lock removed from localStorage
    const locks = JSON.parse(localStorage.getItem('spaceos_edit_locks') || '{}')
    expect(locks['row-1']).toBeUndefined()
  })

  it('should detect conflict when another tab has the lock', () => {
    // Simulate another tab's lock
    const otherTabId = 'other-tab-123'
    const locks = {
      'row-1': {
        timestamp: Date.now(),
        tabId: otherTabId,
      },
    }
    localStorage.setItem('spaceos_edit_locks', JSON.stringify(locks))

    const { result } = renderHook(() => useEditLock('row-1'))

    act(() => {
      const acquired = result.current.acquireLock()
      expect(acquired).toBe(false)
    })

    expect(result.current.hasConflict).toBe(true)
    expect(result.current.isLocked).toBe(false)
  })

  it('should acquire lock if existing lock is expired', () => {
    // Simulate expired lock (31 seconds old)
    const expiredTimestamp = Date.now() - 31_000
    const locks = {
      'row-1': {
        timestamp: expiredTimestamp,
        tabId: 'old-tab',
      },
    }
    localStorage.setItem('spaceos_edit_locks', JSON.stringify(locks))

    const { result } = renderHook(() => useEditLock('row-1'))

    act(() => {
      const acquired = result.current.acquireLock()
      expect(acquired).toBe(true)
    })

    expect(result.current.isLocked).toBe(true)
    expect(result.current.hasConflict).toBe(false)

    // Verify new lock has current tabId
    const newLocks = JSON.parse(localStorage.getItem('spaceos_edit_locks') || '{}')
    expect(newLocks['row-1'].tabId).toBe(result.current.tabId)
  })

  it('should clean up expired locks on read', () => {
    // Create mix of fresh and expired locks
    const now = Date.now()
    const locks = {
      'row-1': { timestamp: now, tabId: 'fresh-tab' },
      'row-2': { timestamp: now - 31_000, tabId: 'expired-tab' },
      'row-3': { timestamp: now - 60_000, tabId: 'very-expired-tab' },
    }
    localStorage.setItem('spaceos_edit_locks', JSON.stringify(locks))

    renderHook(() => useEditLock('row-4'))

    // Attempt to acquire lock (triggers cleanup)
    const { result } = renderHook(() => useEditLock('row-4'))
    act(() => {
      result.current.acquireLock()
    })

    // Verify only fresh lock remains
    const cleanedLocks = JSON.parse(localStorage.getItem('spaceos_edit_locks') || '{}')
    expect(cleanedLocks['row-1']).toBeDefined()
    expect(cleanedLocks['row-2']).toBeUndefined()
    expect(cleanedLocks['row-3']).toBeUndefined()
    expect(cleanedLocks['row-4']).toBeDefined()
  })

  it('should release lock on unmount', () => {
    const { result, unmount } = renderHook(() => useEditLock('row-1'))

    act(() => {
      result.current.acquireLock()
    })

    expect(result.current.isLocked).toBe(true)

    unmount()

    // Verify lock released
    const locks = JSON.parse(localStorage.getItem('spaceos_edit_locks') || '{}')
    expect(locks['row-1']).toBeUndefined()
  })

  it('should handle null rowId gracefully', () => {
    const { result } = renderHook(() => useEditLock(null))

    expect(result.current.hasConflict).toBe(false)
    expect(result.current.isLocked).toBe(false)

    act(() => {
      const acquired = result.current.acquireLock()
      expect(acquired).toBe(false)
    })

    expect(result.current.isLocked).toBe(false)
  })

  it('should only release lock if owned by current tab', () => {
    // Another tab's lock
    const otherLocks = {
      'row-1': {
        timestamp: Date.now(),
        tabId: 'other-tab',
      },
    }
    localStorage.setItem('spaceos_edit_locks', JSON.stringify(otherLocks))

    const { result } = renderHook(() => useEditLock('row-1'))

    // Try to release (should not remove other tab's lock)
    act(() => {
      result.current.releaseLock()
    })

    const locks = JSON.parse(localStorage.getItem('spaceos_edit_locks') || '{}')
    expect(locks['row-1']).toBeDefined()
    expect(locks['row-1'].tabId).toBe('other-tab')
  })

  it('should generate unique tab IDs', () => {
    const { result: result1 } = renderHook(() => useEditLock('row-1'))
    const { result: result2 } = renderHook(() => useEditLock('row-2'))

    expect(result1.current.tabId).not.toBe(result2.current.tabId)
  })

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.setItem to throw error
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    setItemSpy.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError')
    })

    const { result } = renderHook(() => useEditLock('row-1'))

    // Should not throw, just return false
    act(() => {
      const acquired = result.current.acquireLock()
      expect(acquired).toBe(false)
    })

    setItemSpy.mockRestore()
  })
})
