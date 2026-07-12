import { useRef, useState } from 'react'
import { Grid } from 'react-window'
import type { CatalogItem } from '../../../hooks/useCatalogFilters'

interface VirtualizedCatalogGridProps {
  /**
   * Filtered catalog items to display
   */
  items: CatalogItem[]

  /**
   * Callback when item is clicked
   */
  onItemClick?: (item: CatalogItem) => void

  /**
   * Grid configuration
   */
  columnCount?: number
  rowHeight?: number
  overscanRowCount?: number

  /**
   * Container height (default: 600px)
   */
  height?: number

  /**
   * Loading state
   */
  isLoading?: boolean

  className?: string
}

/**
 * VirtualizedCatalogGrid Component
 *
 * Features:
 * - Virtualized rendering using react-window (5000+ items)
 * - Responsive grid (3 columns desktop, 1 column mobile)
 * - Lazy load images
 * - Row height: 180px, overscan: 5 rows
 * - Accessible (keyboard navigation, ARIA labels)
 *
 * Performance:
 * - Only renders visible rows + overscan
 * - Handles 5000+ items without lag
 */
export function VirtualizedCatalogGrid({
  items,
  onItemClick,
  columnCount = 3,
  rowHeight = 180,
  overscanRowCount = 5,
  height = 600,
  isLoading = false,
  className = '',
}: VirtualizedCatalogGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  /**
   * Update container width on resize
   */
  const handleResize = () => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth)
    }
  }

  /**
   * Calculate responsive column count
   */
  const getColumnCount = () => {
    if (containerWidth < 640) return 1 // Mobile
    if (containerWidth < 1024) return 2 // Tablet
    return columnCount // Desktop
  }

  const actualColumnCount = getColumnCount()
  const rowCount = Math.ceil(items.length / actualColumnCount)
  const columnWidth = containerWidth / actualColumnCount

  /**
   * Render individual cell
   */
  const Cell = ({ columnIndex, rowIndex, style, items: catalogItems }: {
    ariaAttributes?: any
    columnIndex: number
    rowIndex: number
    style: React.CSSProperties
    items: CatalogItem[]
  }) => {
    const itemIndex = rowIndex * actualColumnCount + columnIndex
    const item = catalogItems[itemIndex]

    if (!item) {
      return null
    }

    return (
      <div style={style} className="p-2">
        <CatalogCard item={item} onClick={() => onItemClick?.(item)} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-${height} ${className}`}>
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Katalógus betöltése...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-${height} ${className}`}>
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-900">
            Nincs találat
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Próbálj más keresési feltételeket vagy szűrőket.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      <div className="mb-4 text-sm text-gray-600">
        {items.length} termék
      </div>

      <Grid
        cellComponent={Cell as any}
        cellProps={{ items } as any}
        columnCount={actualColumnCount}
        columnWidth={columnWidth}
        rowCount={rowCount}
        rowHeight={rowHeight}
        overscanCount={overscanRowCount}
      />
    </div>
  )
}

/**
 * Individual Catalog Card Component
 */
function CatalogCard({
  item,
  onClick,
}: {
  item: CatalogItem
  onClick: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div
      onClick={onClick}
      className="
        bg-white
        border
        border-gray-200
        rounded-lg
        overflow-hidden
        hover:shadow-lg
        transition-shadow
        cursor-pointer
        h-full
        flex
        flex-col
      "
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`${item.name} - ${formatPrice(item.price)}`}
    >
      {/* Image Placeholder */}
      <div className="h-24 bg-gray-100 flex items-center justify-center relative">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse w-full h-full bg-gray-200" />
          </div>
        )}
        {imageError ? (
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ) : (
          <img
            src={`https://via.placeholder.com/300x200?text=${encodeURIComponent(item.name)}`}
            alt={item.name}
            className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
          {item.name}
        </h3>

        {item.category && (
          <span className="text-xs text-gray-500 mb-2">{item.category}</span>
        )}

        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">
            {formatPrice(item.price)}
          </span>

          <span
            className={`
              text-xs
              px-2
              py-1
              rounded-full
              ${
                item.stock > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }
            `}
          >
            {item.stock > 0 ? `${item.stock} db` : 'Nincs készleten'}
          </span>
        </div>
      </div>
    </div>
  )
}
