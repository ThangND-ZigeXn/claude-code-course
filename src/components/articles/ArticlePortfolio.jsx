import './ArticlePortfolio.scss'
import React, { useEffect, useState } from 'react'
import Article from '/src/components/articles/base/Article.jsx'
import Transitionable from '/src/components/capabilities/Transitionable.jsx'
import { useViewport } from '/src/providers/ViewportProvider.jsx'
import { useConstants } from '/src/hooks/constants.js'
import AvatarView from '/src/components/generic/AvatarView.jsx'
import { Tag, Tags } from '/src/components/generic/Tags.jsx'
import ArticleItemPreviewMenu from '/src/components/articles/partials/ArticleItemPreviewMenu.jsx'
import { useLanguage } from '/src/providers/LanguageProvider.jsx'
import SearchBar from '/src/components/generic/SearchBar.jsx'
import { useDebounce } from '/src/hooks/useDebounce.js'

/**
 * @param {ArticleDataWrapper} dataWrapper
 * @param {Number} id
 * @return {JSX.Element}
 */
function ArticlePortfolio({ dataWrapper, id }) {
    const [selectedItemCategoryId, setSelectedItemCategoryId] = useState(null)
    const [searchQuery, setSearchQuery] = useState(() => _loadSearchState(dataWrapper.uniqueId))
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    useEffect(() => {
        _saveSearchState(dataWrapper.uniqueId, searchQuery)
    }, [searchQuery, dataWrapper.uniqueId])

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

/**
 * @param {ArticleDataWrapper} dataWrapper
 * @param {string} selectedItemCategoryId
 * @param {string} searchQuery
 * @param {function} onClearSearch
 * @return {JSX.Element}
 */
function ArticlePortfolioItems({
    dataWrapper,
    selectedItemCategoryId,
    searchQuery,
    onClearSearch,
}) {
    const constants = useConstants()
    const language = useLanguage()
    const viewport = useViewport()

    const filteredItems = dataWrapper.getOrderedItemsFilteredBySearch(
        selectedItemCategoryId,
        searchQuery
    )
    const customBreakpoint = viewport.getCustomBreakpoint(
        constants.SWIPER_BREAKPOINTS_FOR_THREE_SLIDES
    )
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
                    No projects match <strong>&quot;{searchQuery}&quot;</strong>
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

/**
 * @param {ArticleItemDataWrapper} itemWrapper
 * @return {JSX.Element}
 */
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
                dangerouslySetInnerHTML={{
                    __html: itemWrapper.locales.title || itemWrapper.placeholder,
                }}
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
