import { useState } from 'react'

export interface Product {
  id: string
  name: string
  description?: string
  imageUrl?: string
  price: number
  category?: string
  stock: number
}

interface ProductCardProps {
  product: Product
  onClick?: () => void
  className?: string
}

/**
 * ProductCard Component - Phase 1 Image Optimization
 *
 * Features:
 * - Native HTML lazy-load (loading="lazy")
 * - Shimmer skeleton animation
 * - Error state fallback
 * - Aspect ratio 4:3 fix
 * - Keyboard accessible
 *
 * Future Phase 2 (NOT in this sprint):
 * - WebP support with <picture> element
 * - Backend image_variants JSON field
 */
export function ProductCard({ product, onClick, className = '' }: ProductCardProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading')

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div
      className={`product-card bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-label={`${product.name} - ${formatPrice(product.price)}`}
    >
      {/* Image Container with 4:3 aspect ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* Shimmer skeleton loader */}
        {imageState === 'loading' && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer" />
        )}

        {/* Main image */}
        {imageState !== 'error' && (
          <img
            loading="lazy"  // Native lazy-load ✅
            src={product.imageUrl || '/assets/no-image.svg'}
            alt={product.name}
            onLoad={() => setImageState('loaded')}
            onError={() => setImageState('error')}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Error state */}
        {imageState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto"
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
              <span className="text-gray-500 text-sm mt-2 block">Kép nem elérhető</span>
            </div>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h4>

        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
        )}

        {product.category && (
          <span className="text-xs text-gray-500 mb-2 inline-block">{product.category}</span>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">
            {formatPrice(product.price)}
          </span>

          <span
            className={`text-xs px-2 py-1 rounded-full ${
              product.stock > 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {product.stock > 0 ? `${product.stock} db` : 'Nincs készleten'}
          </span>
        </div>
      </div>
    </div>
  )
}
