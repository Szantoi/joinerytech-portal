import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductCard, type Product } from '../components/catalog/ProductCard'

/**
 * Feature 3: Image Lazy-load Tests
 *
 * Verifies:
 * - Native HTML loading="lazy" attribute
 * - Shimmer skeleton animation
 * - Error state fallback
 * - Aspect ratio 4:3
 * - Keyboard accessibility
 */

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Oak Panel 18mm',
  description: 'High-quality oak panel for furniture',
  imageUrl: 'https://example.com/oak-panel.jpg',
  price: 12500,
  category: 'Panels',
  stock: 45
}

describe('ProductCard - Feature 3 Image Optimization', () => {
  it('✅ renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)

    expect(screen.getByText('Oak Panel 18mm')).toBeInTheDocument()
    expect(screen.getByText('High-quality oak panel for furniture')).toBeInTheDocument()
    expect(screen.getByText('Panels')).toBeInTheDocument()
    expect(screen.getByText('12 500 Ft')).toBeInTheDocument()
    expect(screen.getByText('45 db')).toBeInTheDocument()
  })

  it('✅ native lazy-load: img has loading="lazy" attribute', () => {
    render(<ProductCard product={mockProduct} />)

    const img = screen.getByAltText('Oak Panel 18mm') as HTMLImageElement
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('✅ shimmer animation: shows skeleton while loading', () => {
    render(<ProductCard product={mockProduct} />)

    // Check for shimmer animation class
    const shimmer = document.querySelector('.animate-shimmer')
    expect(shimmer).toBeInTheDocument()
  })

  it('✅ image load: hides shimmer and shows image', async () => {
    render(<ProductCard product={mockProduct} />)

    const img = screen.getByAltText('Oak Panel 18mm') as HTMLImageElement

    // Initially, image should have opacity-0
    expect(img).toHaveClass('opacity-0')

    // Simulate image load
    fireEvent.load(img)

    await waitFor(() => {
      expect(img).toHaveClass('opacity-100')
    })

    // Shimmer should be gone
    const shimmer = document.querySelector('.animate-shimmer')
    expect(shimmer).not.toBeInTheDocument()
  })

  it('✅ error state: shows fallback on image error', async () => {
    render(<ProductCard product={mockProduct} />)

    const img = screen.getByAltText('Oak Panel 18mm') as HTMLImageElement

    // Simulate image error
    fireEvent.error(img)

    await waitFor(() => {
      expect(screen.getByText('Kép nem elérhető')).toBeInTheDocument()
    })

    // Error icon SVG should be visible
    const errorIcon = document.querySelector('svg')
    expect(errorIcon).toBeInTheDocument()
  })

  it('✅ aspect ratio: container has 4:3 aspect ratio', () => {
    render(<ProductCard product={mockProduct} />)

    const imageContainer = document.querySelector('.aspect-\\[4\\/3\\]')
    expect(imageContainer).toBeInTheDocument()
  })

  it('✅ fallback image: uses /assets/no-image.svg when imageUrl is null', () => {
    const productWithoutImage = { ...mockProduct, imageUrl: undefined }

    render(<ProductCard product={productWithoutImage} />)

    const img = screen.getByAltText('Oak Panel 18mm') as HTMLImageElement
    expect(img.src).toContain('/assets/no-image.svg')
  })

  it('✅ keyboard accessibility: card is keyboard navigable', () => {
    const mockOnClick = vi.fn()

    render(<ProductCard product={mockProduct} onClick={mockOnClick} />)

    const card = screen.getByRole('button')

    // Card should have tabIndex
    expect(card).toHaveAttribute('tabindex', '0')

    // Card should have aria-label
    expect(card).toHaveAttribute('aria-label')
    expect(card.getAttribute('aria-label')).toContain('Oak Panel 18mm')

    // Enter key should trigger onClick
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(mockOnClick).toHaveBeenCalledTimes(1)

    // Space key should trigger onClick
    fireEvent.keyDown(card, { key: ' ' })
    expect(mockOnClick).toHaveBeenCalledTimes(2)
  })

  it('✅ stock status: shows in-stock badge for available products', () => {
    render(<ProductCard product={mockProduct} />)

    const badge = screen.getByText('45 db')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('✅ stock status: shows out-of-stock badge for unavailable products', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 }

    render(<ProductCard product={outOfStockProduct} />)

    const badge = screen.getByText('Nincs készleten')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('✅ price formatting: formats Hungarian currency correctly', () => {
    render(<ProductCard product={mockProduct} />)

    // Hungarian format: space as thousands separator, no decimals
    expect(screen.getByText('12 500 Ft')).toBeInTheDocument()
  })

  it('✅ onClick handler: calls callback when card is clicked', () => {
    const mockOnClick = vi.fn()

    render(<ProductCard product={mockProduct} onClick={mockOnClick} />)

    const card = screen.getByRole('button')
    fireEvent.click(card)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('✅ responsive design: image fills container', () => {
    render(<ProductCard product={mockProduct} />)

    const img = screen.getByAltText('Oak Panel 18mm') as HTMLImageElement

    expect(img).toHaveClass('w-full', 'h-full', 'object-cover')
  })

  it('✅ transition: image fades in smoothly', () => {
    render(<ProductCard product={mockProduct} />)

    const img = screen.getByAltText('Oak Panel 18mm') as HTMLImageElement

    expect(img).toHaveClass('transition-opacity', 'duration-300')
  })

  it('✅ long product name: uses line-clamp for overflow', () => {
    const longNameProduct = {
      ...mockProduct,
      name: 'Very Long Product Name That Should Be Truncated After Two Lines Maximum'
    }

    render(<ProductCard product={longNameProduct} />)

    const title = screen.getByText(longNameProduct.name)
    expect(title).toHaveClass('line-clamp-2')
  })

  it('✅ optional description: renders without description', () => {
    const noDescProduct = { ...mockProduct, description: undefined }

    render(<ProductCard product={noDescProduct} />)

    expect(screen.getByText('Oak Panel 18mm')).toBeInTheDocument()
    expect(screen.queryByText('High-quality oak panel')).not.toBeInTheDocument()
  })

  it('✅ optional category: renders without category', () => {
    const noCategoryProduct = { ...mockProduct, category: undefined }

    render(<ProductCard product={noCategoryProduct} />)

    expect(screen.getByText('Oak Panel 18mm')).toBeInTheDocument()
    expect(screen.queryByText('Panels')).not.toBeInTheDocument()
  })
})
