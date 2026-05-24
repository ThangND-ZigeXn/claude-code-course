import { describe, it, expect } from 'vitest'
import { filterItemsBySearch } from '/src/hooks/utils/_search-utils.js'

const ITEMS = [
    {
        categoryId: 'category_web',
        locales: {
            title: 'Job Search Portal',
            tags: ['Ruby on Rails', 'Next.js'],
            text: 'Full-stack <b>job listing</b> platform',
        },
    },
    {
        categoryId: 'category_apps',
        locales: {
            title: 'Booking Mobile App',
            tags: ['React Native'],
            text: 'Cross-platform <b>booking</b> application',
        },
    },
    {
        categoryId: 'category_utilities',
        locales: {
            title: 'HR Management System',
            tags: ['.NET', 'SQL Server'],
            text: 'Enterprise <b>HR</b> tool built with ASP.NET Core',
        },
    },
]

describe('filterItemsBySearch', () => {
    it('returns all items when query is empty', () => {
        expect(filterItemsBySearch(ITEMS, 'category_all', '')).toHaveLength(3)
        expect(filterItemsBySearch(ITEMS, 'category_all', '   ')).toHaveLength(3)
    })

    it('matches title, tags, and description (case-insensitive, strips HTML)', () => {
        const byTitle = filterItemsBySearch(ITEMS, 'category_all', 'booking')
        expect(byTitle).toHaveLength(1)
        expect(byTitle[0].locales.title).toBe('Booking Mobile App')

        const byTag = filterItemsBySearch(ITEMS, 'category_all', 'NEXT.JS')
        expect(byTag).toHaveLength(1)
        expect(byTag[0].locales.title).toBe('Job Search Portal')

        const byText = filterItemsBySearch(ITEMS, 'category_all', 'enterprise')
        expect(byText).toHaveLength(1)
        expect(byText[0].locales.title).toBe('HR Management System')
    })

    it('returns empty array when query matches nothing', () => {
        expect(filterItemsBySearch(ITEMS, 'category_all', 'zzzzzzz')).toHaveLength(0)
    })

    it('combines category filter with search query', () => {
        const webRails = filterItemsBySearch(ITEMS, 'category_web', 'rails')
        expect(webRails).toHaveLength(1)

        const appsRails = filterItemsBySearch(ITEMS, 'category_apps', 'rails')
        expect(appsRails).toHaveLength(0)
    })
})
