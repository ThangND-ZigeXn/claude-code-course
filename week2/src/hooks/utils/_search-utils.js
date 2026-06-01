export function filterItemsBySearch(items, categoryId, searchQuery) {
    let filtered = items
    if (categoryId && categoryId !== 'category_all') {
        filtered = items.filter((item) => item.categoryId === categoryId)
    }

    const q = (searchQuery || '').trim().toLowerCase()
    if (!q) return filtered

    return filtered.filter((item) => {
        const locales = item.locales || {}
        const title = stripHtml(locales.title || '').toLowerCase()
        const text = stripHtml(locales.text || '').toLowerCase()
        const tags = (locales.tags || []).join(' ').toLowerCase()
        return title.includes(q) || text.includes(q) || tags.includes(q)
    })
}

function stripHtml(str) {
    return String(str)
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&amp;/gi, '&')
}
