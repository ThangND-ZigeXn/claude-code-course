import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import SearchBar from '/src/components/generic/SearchBar.jsx'

describe('SearchBar', () => {
    it('renders an input with the provided value', () => {
        render(<SearchBar value="rails" onChange={() => {}} onClear={() => {}} />)
        expect(screen.getByRole('textbox')).toHaveValue('rails')
    })

    it('does not show the clear button when value is empty', () => {
        render(<SearchBar value="" onChange={() => {}} onClear={() => {}} />)
        expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
    })

    it('shows the clear button when value is non-empty and calls onClear on click', async () => {
        const user = userEvent.setup()
        const onClear = vi.fn()
        render(<SearchBar value="rails" onChange={() => {}} onClear={onClear} />)

        const clearBtn = screen.getByRole('button', { name: /clear search/i })
        expect(clearBtn).toBeInTheDocument()

        await user.click(clearBtn)
        expect(onClear).toHaveBeenCalledOnce()
    })
})
