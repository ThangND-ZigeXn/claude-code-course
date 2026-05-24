import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useDebounce } from '/src/hooks/useDebounce.js'

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 300))
        expect(result.current).toBe('hello')
    })

    it('does not update the value before the delay has elapsed', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
            initialProps: { value: 'initial' },
        })
        rerender({ value: 'updated' })
        vi.advanceTimersByTime(299)
        expect(result.current).toBe('initial')
    })

    it('updates the value after the delay has elapsed', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
            initialProps: { value: 'initial' },
        })
        rerender({ value: 'updated' })
        act(() => {
            vi.advanceTimersByTime(300)
        })
        expect(result.current).toBe('updated')
    })
})
