# Portfolio Live Search Implementation Plan

## Plugin & Phase Guide

| Phase | What to do | Plugins |
|-------|-----------|---------|
| **Explore** | Read the codebase; no edits yet. List files you will change. | Optional: `prompts.chat` prompt for exploration |
| **Plan** | Plan Mode (Shift+Tab); agree on acceptance criteria before coding | Superpowers `/write-plan` (or `/brainstorm` then plan) |
| **Code** | Implement search; write and run unit tests; manual smoke test in browser | **Context7 at least once** for docs; optional `/execute-plan` |
| **Commit** | Subagent review; clear commit message; open PR or push branch | Human-check security, tests, business logic |

---

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a debounced live search bar to the Portfolio page between the category buttons and the project grid, with accessible markup, a clear button, an empty state, state persistence, and a full quality-check pipeline (ESLint + Prettier + tsc + Vitest).

**Architecture:** Search state (`searchQuery`) lives in `ArticlePortfolio.jsx` alongside the existing `selectedItemCategoryId`, persisted to `window.articleSearchStates` independently from category state. `Article.jsx` gains an optional `searchBarSlot` render prop rendered between `CategoryFilter` and `{children}`. Filtering is extracted to a pure utility function `filterItemsBySearch()` so it can be unit-tested without React.

**Tech Stack:** React 18, Vite 6, SCSS, Vitest + React Testing Library, ESLint 9 flat config, Prettier, TypeScript (type-check only via `tsc --noEmit`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| CREATE | `docs/plans/2026-05-25-portfolio-live-search.md` | Canonical plan committed to repo |
| CREATE | `eslint.config.js` | ESLint flat config (missing from project) |
| CREATE | `.prettierrc` | Prettier formatting rules |
| CREATE | `.prettierignore` | Prettier ignore patterns |
| CREATE | `tsconfig.json` | TypeScript / type-check config for JS project |
| MODIFY | `package.json` | Add scripts: `format`, `format:check`, `type-check`, `test`, `test:watch` |
| MODIFY | `vite.config.js` | Add `test` block for Vitest |
| CREATE | `src/setupTests.js` | Import `@testing-library/jest-dom` matchers |
| CREATE | `src/hooks/useDebounce.js` | 300 ms debounce hook |
| CREATE | `src/hooks/utils/_search-utils.js` | Pure `filterItemsBySearch()` function |
| MODIFY | `src/hooks/models/ArticleDataWrapper.js` | Add `getOrderedItemsFilteredBySearch()` method |
| CREATE | `src/components/generic/SearchBar.jsx` | Input + icon + clear button |
| CREATE | `src/components/generic/SearchBar.scss` | Full-width themed styles |
| MODIFY | `src/components/articles/base/Article.jsx` | Accept optional `searchBarSlot` prop |
| MODIFY | `src/components/articles/ArticlePortfolio.jsx` | Add search state, debounce, persistence, SearchBar slot |
| MODIFY | `src/components/articles/ArticlePortfolio.scss` | Empty-state styles |
| CREATE | `src/__tests__/filterItemsBySearch.test.js` | 4 pure unit tests (search logic) |
| CREATE | `src/__tests__/useDebounce.test.js` | 3 timer-based hook tests |
| CREATE | `src/__tests__/SearchBar.test.jsx` | 3 component tests (render, clear button) |

---

## Task 1 — Commit plan file and set up quality tooling

**Files:**
- Create: `docs/plans/2026-05-25-portfolio-live-search.md`
- Create: `eslint.config.js`
- Create: `.prettierrc`
- Create: `.prettierignore`
- Create: `tsconfig.json`
- Modify: `package.json`

- [ ] **Step 1: Create the docs/plans folder and commit canonical plan**

```bash
mkdir -p docs/plans
```

Copy this exact file content to `docs/plans/2026-05-25-portfolio-live-search.md` (same content as this plan).

- [ ] **Step 2: Create `eslint.config.js`**

```js
import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
    { ignores: ['dist', 'node_modules', 'public'] },
    {
        ...js.configs.recommended,
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
        },
    },
]
```

- [ ] **Step 3: Install Prettier and create config**

```bash
npm install --save-dev prettier
```

Create `.prettierrc`:
```json
{
    "semi": false,
    "singleQuote": true,
    "tabWidth": 4,
    "trailingComma": "es5",
    "printWidth": 100
}
```

Create `.prettierignore`:
```
dist
node_modules
public
*.md
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "jsx": "react-jsx",
        "allowJs": true,
        "checkJs": false,
        "noEmit": true,
        "skipLibCheck": true,
        "strict": false,
        "lib": ["ES2020", "DOM", "DOM.Iterable"]
    },
    "include": ["src"],
    "exclude": ["node_modules", "dist"]
}
```

> `checkJs: false` keeps the existing JS codebase untouched. Enable it later to add incremental type coverage.

- [ ] **Step 5: Add scripts to `package.json`**

Add these entries to the `"scripts"` block (keep existing entries):
```json
"format": "prettier --write .",
"format:check": "prettier --check .",
"type-check": "tsc --noEmit",
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify quality scripts run**

```bash
npm run lint
```
Expected: exits 0 (warnings OK).

```bash
npm run format:check
```
Expected: lists files that need formatting OR exits 0.

```bash
npm run type-check
```
Expected: exits 0 (no errors).

- [ ] **Step 7: Run prettier to fix formatting on existing files**

```bash
npm run format
```
Expected: rewrites files to match `.prettierrc` rules.

- [ ] **Step 8: Commit**

```bash
git add eslint.config.js .prettierrc .prettierignore tsconfig.json package.json package-lock.json docs/plans/
git commit -m "chore: add ESLint flat config, Prettier, tsconfig, and quality scripts"
```

---

## Task 2 — Set up Vitest test runner

**Files:**
- Modify: `vite.config.js`
- Create: `src/setupTests.js`
- Modify: `package.json` (scripts already added in Task 1)

- [ ] **Step 1: Install test dependencies**

```bash
npm install --save-dev vitest jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Add test block to `vite.config.js`**

Add the `test` property inside `defineConfig({...})`, after the existing `css` block:

```js
test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
},
```

Full updated `vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: '/react-portfolio-template/',
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('swiper'))
                            return 'swiper'
                        return
                    }
                }
            }
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ["mixed-decls", "color-functions", "global-builtin", "import"],
            },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/setupTests.js'],
    },
})
```

- [ ] **Step 3: Create `src/setupTests.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Write a sanity-check test and run it**

Create `src/__tests__/sanity.test.js`:
```js
describe('test runner', () => {
    it('works', () => {
        expect(1 + 1).toBe(2)
    })
})
```

Run:
```bash
npm test
```
Expected output:
```
✓ src/__tests__/sanity.test.js (1)
  ✓ test runner > works

Test Files  1 passed (1)
Tests       1 passed (1)
```

- [ ] **Step 5: Delete sanity test and commit**

```bash
rm src/__tests__/sanity.test.js
git add vite.config.js src/setupTests.js package.json package-lock.json
git commit -m "chore: set up Vitest + React Testing Library"
```

---

## Task 3 — Create `useDebounce` hook (TDD)

**Files:**
- Create: `src/hooks/useDebounce.js`
- Create: `src/__tests__/useDebounce.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/useDebounce.test.js`:
```js
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useDebounce } from '/src/hooks/useDebounce.js'

describe('useDebounce', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 300))
        expect(result.current).toBe('hello')
    })

    it('does not update the value before the delay has elapsed', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'initial' } }
        )
        rerender({ value: 'updated' })
        vi.advanceTimersByTime(299)
        expect(result.current).toBe('initial')
    })

    it('updates the value after the delay has elapsed', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'initial' } }
        )
        rerender({ value: 'updated' })
        act(() => { vi.advanceTimersByTime(300) })
        expect(result.current).toBe('updated')
    })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test src/__tests__/useDebounce.test.js
```
Expected: FAIL with `Cannot find module '/src/hooks/useDebounce.js'`.

- [ ] **Step 3: Implement `src/hooks/useDebounce.js`**

```js
import { useState, useEffect } from 'react'

export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const id = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(id)
    }, [value, delay])

    return debouncedValue
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/__tests__/useDebounce.test.js
```
Expected:
```
✓ src/__tests__/useDebounce.test.js (3)
Tests  3 passed (3)
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDebounce.js src/__tests__/useDebounce.test.js
git commit -m "feat: add useDebounce hook with tests"
```

---

## Task 4 — Add search utility and `ArticleDataWrapper` method (TDD)

**Files:**
- Create: `src/hooks/utils/_search-utils.js`
- Create: `src/__tests__/filterItemsBySearch.test.js`
- Modify: `src/hooks/models/ArticleDataWrapper.js`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/filterItemsBySearch.test.js`:
```js
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test src/__tests__/filterItemsBySearch.test.js
```
Expected: FAIL with `Cannot find module '/src/hooks/utils/_search-utils.js'`.

- [ ] **Step 3: Create `src/hooks/utils/_search-utils.js`**

```js
export function filterItemsBySearch(items, categoryId, searchQuery) {
    let filtered = items
    if (categoryId && categoryId !== 'category_all') {
        filtered = items.filter(item => item.categoryId === categoryId)
    }

    const q = (searchQuery || '').trim().toLowerCase()
    if (!q) return filtered

    return filtered.filter(item => {
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/__tests__/filterItemsBySearch.test.js
```
Expected:
```
✓ src/__tests__/filterItemsBySearch.test.js (4)
Tests  4 passed (4)
```

- [ ] **Step 5: Add `getOrderedItemsFilteredBySearch` to `ArticleDataWrapper.js`**

Open `src/hooks/models/ArticleDataWrapper.js`. Add the import at the top:
```js
import { filterItemsBySearch } from '/src/hooks/utils/_search-utils.js'
```

Add the method after `getOrderedItemsFilteredBy` (around line 160):
```js
getOrderedItemsFilteredBySearch(categoryId, searchQuery) {
    return filterItemsBySearch(this.orderedItems, categoryId, searchQuery)
}
```

- [ ] **Step 6: Run all tests to confirm no regressions**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/utils/_search-utils.js src/__tests__/filterItemsBySearch.test.js src/hooks/models/ArticleDataWrapper.js
git commit -m "feat: add filterItemsBySearch utility and ArticleDataWrapper.getOrderedItemsFilteredBySearch"
```

---

## Task 5 — Create `SearchBar` component (TDD)

**Files:**
- Create: `src/components/generic/SearchBar.jsx`
- Create: `src/components/generic/SearchBar.scss`
- Create: `src/__tests__/SearchBar.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/SearchBar.test.jsx`:
```jsx
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test src/__tests__/SearchBar.test.jsx
```
Expected: FAIL with `Cannot find module '/src/components/generic/SearchBar.jsx'`.

- [ ] **Step 3: Create `src/components/generic/SearchBar.jsx`**

```jsx
import './SearchBar.scss'
import React, { useRef } from 'react'

function SearchBar({ value, onChange, onClear, placeholder, ariaLabel }) {
    const inputRef = useRef(null)

    const handleClear = () => {
        onClear()
        inputRef.current?.focus()
    }

    return (
        <div className="search-bar" role="search">
            <i className="fa-solid fa-magnifying-glass search-bar-icon" aria-hidden="true" />
            <input
                ref={inputRef}
                type="text"
                className="search-bar-input"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || 'Search by title, tag, or description...'}
                aria-label={ariaLabel || 'Search projects'}
            />
            {value && (
                <button
                    className="search-bar-clear"
                    onClick={handleClear}
                    aria-label="Clear search"
                    type="button"
                >
                    ×
                </button>
            )}
        </div>
    )
}

export default SearchBar
```

- [ ] **Step 4: Create `src/components/generic/SearchBar.scss`**

```scss
@import "/src/styles/extend.scss";

.search-bar {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 900px;
    margin: 12px auto 16px;
    padding: 8px 14px;
    gap: 10px;
    border-radius: $standard-border-radius;
    border: 2px solid var(--theme-card-background);
    background-color: var(--theme-boards-background);
    box-sizing: border-box;

    @include media-breakpoint-down(md) {
        border-width: 1px;
    }

    .search-bar-icon {
        color: var(--theme-texts-light-2);
        flex-shrink: 0;
        font-size: 0.85rem;
    }

    .search-bar-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        color: var(--theme-texts-light-1);
        font-size: 0.9rem;
        min-width: 0;

        &::placeholder {
            color: var(--theme-texts-light-2);
        }
    }

    .search-bar-clear {
        border: none;
        background: transparent;
        color: var(--theme-texts-light-2);
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 1;
        padding: 0 2px;
        flex-shrink: 0;

        &:hover {
            color: var(--theme-texts-light-1);
        }
    }
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test src/__tests__/SearchBar.test.jsx
```
Expected:
```
✓ src/__tests__/SearchBar.test.jsx (3)
Tests  3 passed (3)
```

- [ ] **Step 6: Run all tests to confirm no regressions**

```bash
npm test
```
Expected: all tests pass (8 total across 3 files).

- [ ] **Step 7: Commit**

```bash
git add src/components/generic/SearchBar.jsx src/components/generic/SearchBar.scss src/__tests__/SearchBar.test.jsx
git commit -m "feat: add SearchBar component with tests"
```

---

## Task 6 — Wire search into Portfolio (UI integration)

**Files:**
- Modify: `src/components/articles/base/Article.jsx`
- Modify: `src/components/articles/ArticlePortfolio.jsx`
- Modify: `src/components/articles/ArticlePortfolio.scss`

- [ ] **Step 1: Add `searchBarSlot` prop to `Article.jsx`**

In `src/components/articles/base/Article.jsx`, change the function signature:

**Before:**
```jsx
function Article({ children, id, type, dataWrapper, className = "", selectedItemCategoryId, setSelectedItemCategoryId, forceHideTitle = false }) {
```

**After:**
```jsx
function Article({ children, id, type, dataWrapper, className = "", selectedItemCategoryId, setSelectedItemCategoryId, forceHideTitle = false, searchBarSlot = null }) {
```

In the JSX inside `<ArticleContent>`, add `{searchBarSlot}` between CategoryFilter and `{children}`:

**Before:**
```jsx
<ArticleContent>
    {dataWrapper.categories.length > 0 && (
        <CategoryFilter categories={dataWrapper.categories}
                        selectedCategoryId={selectedItemCategoryId}
                        setSelectedCategoryId={setSelectedItemCategoryId}
                        className={`article-category-filter`}/>
    )}

    {children}
</ArticleContent>
```

**After:**
```jsx
<ArticleContent>
    {dataWrapper.categories.length > 0 && (
        <CategoryFilter categories={dataWrapper.categories}
                        selectedCategoryId={selectedItemCategoryId}
                        setSelectedCategoryId={setSelectedItemCategoryId}
                        className={`article-category-filter`}/>
    )}

    {searchBarSlot}

    {children}
</ArticleContent>
```

- [ ] **Step 2: Update `ArticlePortfolio.jsx`**

Replace the entire content of `src/components/articles/ArticlePortfolio.jsx` with:

```jsx
import "./ArticlePortfolio.scss"
import React, { useEffect, useState } from 'react'
import Article from "/src/components/articles/base/Article.jsx"
import Transitionable from "/src/components/capabilities/Transitionable.jsx"
import { useViewport } from "/src/providers/ViewportProvider.jsx"
import { useConstants } from "/src/hooks/constants.js"
import AvatarView from "/src/components/generic/AvatarView.jsx"
import { Tag, Tags } from "/src/components/generic/Tags.jsx"
import ArticleItemPreviewMenu from "/src/components/articles/partials/ArticleItemPreviewMenu.jsx"
import { useLanguage } from "/src/providers/LanguageProvider.jsx"
import SearchBar from "/src/components/generic/SearchBar.jsx"
import { useDebounce } from "/src/hooks/useDebounce.js"

function ArticlePortfolio({ dataWrapper, id }) {
    const [selectedItemCategoryId, setSelectedItemCategoryId] = useState(null)
    const [searchQuery, setSearchQuery] = useState(() => _loadSearchState(dataWrapper.uniqueId))
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    useEffect(() => {
        _saveSearchState(dataWrapper.uniqueId, searchQuery)
    }, [searchQuery])

    const handleClearSearch = () => setSearchQuery('')

    return (
        <Article
            id={dataWrapper.uniqueId}
            type={Article.Types.SPACING_DEFAULT}
            dataWrapper={dataWrapper}
            className="article-portfolio"
            selectedItemCategoryId={selectedItemCategoryId}
            setSelectedItemCategoryId={setSelectedItemCategoryId}
            searchBarSlot={
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onClear={handleClearSearch}
                />
            }
        >
            <ArticlePortfolioItems
                dataWrapper={dataWrapper}
                selectedItemCategoryId={selectedItemCategoryId}
                searchQuery={debouncedSearchQuery}
                onClearSearch={handleClearSearch}
            />
        </Article>
    )
}

function _loadSearchState(uniqueId) {
    window.articleSearchStates = window.articleSearchStates || {}
    return window.articleSearchStates[uniqueId] || ''
}

function _saveSearchState(uniqueId, query) {
    window.articleSearchStates = window.articleSearchStates || {}
    window.articleSearchStates[uniqueId] = query
}

function ArticlePortfolioItems({ dataWrapper, selectedItemCategoryId, searchQuery, onClearSearch }) {
    const constants = useConstants()
    const language = useLanguage()
    const viewport = useViewport()

    const filteredItems = dataWrapper.getOrderedItemsFilteredBySearch(selectedItemCategoryId, searchQuery)
    const customBreakpoint = viewport.getCustomBreakpoint(constants.SWIPER_BREAKPOINTS_FOR_THREE_SLIDES)
    const itemsPerRow = customBreakpoint?.slidesPerView || 1
    const itemsPerRowClass = `article-portfolio-items-${itemsPerRow}-per-row`

    const refreshFlag = dataWrapper.categories?.length
        ? selectedItemCategoryId + '-' + language.getSelectedLanguage()?.id + '-' + searchQuery
        : language.getSelectedLanguage()?.id + '-' + searchQuery

    const liveMessage = searchQuery
        ? `${filteredItems.length} project${filteredItems.length !== 1 ? 's' : ''} found`
        : ''

    if (filteredItems.length === 0 && searchQuery) {
        return (
            <div className="article-portfolio-empty-state" role="status" aria-live="polite">
                <p className="article-portfolio-empty-state-message">
                    No projects match <strong>"{searchQuery}"</strong>
                </p>
                <button
                    className="article-portfolio-empty-state-reset btn"
                    onClick={onClearSearch}
                    type="button"
                >
                    Clear search
                </button>
            </div>
        )
    }

    if (dataWrapper.categories?.length) {
        return (
            <>
                <span className="sr-only" aria-live="polite" aria-atomic="true">
                    {liveMessage}
                </span>
                <Transitionable
                    id={dataWrapper.uniqueId}
                    refreshFlag={refreshFlag}
                    delayBetweenItems={100}
                    animation={Transitionable.Animations.POP}
                    className={`article-portfolio-items ${itemsPerRowClass}`}
                >
                    {filteredItems.map((itemWrapper, key) => (
                        <ArticlePortfolioItem itemWrapper={itemWrapper} key={key} />
                    ))}
                </Transitionable>
            </>
        )
    }

    return (
        <div className={`article-portfolio-items ${itemsPerRowClass} mb-3 mb-lg-2`}>
            {filteredItems.map((itemWrapper, key) => (
                <ArticlePortfolioItem itemWrapper={itemWrapper} key={key} />
            ))}
        </div>
    )
}

function ArticlePortfolioItem({ itemWrapper }) {
    return (
        <div className="article-portfolio-item">
            <AvatarView
                src={itemWrapper.img}
                faIcon={itemWrapper.faIcon}
                style={itemWrapper.faIconStyle}
                alt={itemWrapper.imageAlt}
                className="article-portfolio-item-avatar"
            />
            <ArticlePortfolioItemTitle itemWrapper={itemWrapper} />
            <ArticlePortfolioItemBody itemWrapper={itemWrapper} />
            <ArticlePortfolioItemFooter itemWrapper={itemWrapper} />
        </div>
    )
}

function ArticlePortfolioItemTitle({ itemWrapper }) {
    return (
        <div className="article-portfolio-item-title">
            <h5
                className="article-portfolio-item-title-main"
                dangerouslySetInnerHTML={{ __html: itemWrapper.locales.title || itemWrapper.placeholder }}
            />
            <div
                className="article-portfolio-item-title-category text-2"
                dangerouslySetInnerHTML={{ __html: itemWrapper.category?.label }}
            />
        </div>
    )
}

function ArticlePortfolioItemBody({ itemWrapper }) {
    return (
        <div className="article-portfolio-item-body">
            <Tags className="article-portfolio-item-body-tags">
                {itemWrapper.locales.tags &&
                    Boolean(itemWrapper.locales.tags.length) &&
                    itemWrapper.locales.tags.map((tag, key) => (
                        <Tag
                            key={key}
                            text={tag}
                            variant={Tag.Variants.DARK}
                            className="article-portfolio-item-body-tag text-1"
                        />
                    ))}
            </Tags>
            <div
                className="article-portfolio-item-body-description text-2"
                dangerouslySetInnerHTML={{ __html: itemWrapper.locales.text }}
            />
        </div>
    )
}

function ArticlePortfolioItemFooter({ itemWrapper }) {
    const hasPreview = itemWrapper.preview
    const hasPreviewLinks = itemWrapper.preview?.hasLinks
    const hasScreenshotsOrVideo = itemWrapper.preview?.hasScreenshotsOrYoutubeVideo
    const previewMenuAvailable = hasPreview && (hasPreviewLinks || hasScreenshotsOrVideo)

    if (!previewMenuAvailable) return <></>

    return (
        <div className="article-portfolio-item-footer">
            <ArticleItemPreviewMenu
                itemWrapper={itemWrapper}
                spaceBetween={true}
                className="article-portfolio-item-footer-menu"
            />
        </div>
    )
}

export default ArticlePortfolio
```

- [ ] **Step 3: Add empty-state styles to `ArticlePortfolio.scss`**

Append to the end of `src/components/articles/ArticlePortfolio.scss`:
```scss
.article-portfolio-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    gap: 16px;

    .article-portfolio-empty-state-message {
        color: var(--theme-texts-light-2);
        margin: 0;
        font-size: 0.95rem;

        strong {
            color: var(--theme-texts-light-1);
        }
    }

    .article-portfolio-empty-state-reset {
        background-color: var(--theme-primary);
        color: var(--theme-texts-inv);
        border: none;
        border-radius: $standard-border-radius;
        padding: 8px 20px;
        font-size: 0.9rem;
        cursor: pointer;

        &:hover {
            opacity: 0.85;
        }
    }
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

- [ ] **Step 4: Run all tests to confirm nothing broke**

```bash
npm test
```
Expected: all tests pass (8 total).

- [ ] **Step 5: Commit**

```bash
git add src/components/articles/base/Article.jsx src/components/articles/ArticlePortfolio.jsx src/components/articles/ArticlePortfolio.scss
git commit -m "feat: wire live search into ArticlePortfolio with debounce, persistence, and empty state"
```

---

## Task 7 — Full quality check and smoke test

- [ ] **Step 1: Run full test suite**

```bash
npm test
```
Expected: all 8 tests pass across 3 test files.

- [ ] **Step 2: Run ESLint**

```bash
npm run lint
```
Expected: exits 0 (errors = 0; warnings about unused vars are OK).

- [ ] **Step 3: Run Prettier check**

```bash
npm run format:check
```
If any files are flagged, fix with `npm run format` then re-check.

- [ ] **Step 4: Run type check**

```bash
npm run type-check
```
Expected: exits 0 with no errors.

- [ ] **Step 5: Manual smoke test in browser**

```bash
npm run dev
```

Open `http://localhost:5173/react-portfolio-template/`.

Checklist:
- [ ] Portfolio section shows the search bar between category buttons and project cards
- [ ] Typing "rails" filters to only Rails projects (after ~300 ms pause)
- [ ] Typing "zzzzz" shows the empty-state message with "Clear search" button
- [ ] Clicking "Clear search" restores the full list and focuses the input
- [ ] The `×` button appears only when the search box has text; clicking it clears and refocuses
- [ ] Category filter + search combine correctly (e.g., select "Web" then type "next")
- [ ] Navigate away to another section and back — search query is still present
- [ ] Resize browser to 375 px width — search bar is full-width below the category buttons
- [ ] Tab to the search input using keyboard; type; confirm screen reader live region announces result count

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: all quality checks pass for portfolio live search"
```

---

## Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| Unit tests | `npm test` | 8 tests, all pass |
| Lint | `npm run lint` | 0 errors |
| Format | `npm run format:check` | 0 issues |
| Type check | `npm run type-check` | 0 errors |
| Dev build | `npm run dev` | No compile errors |
