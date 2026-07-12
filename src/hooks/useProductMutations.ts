import { useState, useCallback } from 'react'

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  supplier: string
}

const STORAGE_KEY = 'spaceos_catalog_products'

/**
 * Generate next variant suggestion
 *
 * Examples:
 * - "Tölgy furnér 18mm" → "Tölgy furnér 22mm"
 * - "60x200" → "80x200"
 * - "OAK-18-NAT" → "OAK-22-NAT"
 */
function suggestNextVariant(original: Product): Partial<Product> {
  const { name, sku } = original

  // Try to find dimension patterns in name
  const dimensionMatch = name.match(/(\d+)x(\d+)/)
  if (dimensionMatch) {
    const [full, width] = dimensionMatch
    const nextWidth = (parseInt(width) + 20).toString()
    return {
      name: name.replace(full, `${nextWidth}x${dimensionMatch[2]}`),
      sku: `${sku}-COPY-${Date.now()}`,
    }
  }

  // Try to find thickness patterns (e.g., "18mm")
  const thicknessMatch = name.match(/(\d+)mm/)
  if (thicknessMatch) {
    const thickness = parseInt(thicknessMatch[1])
    const nextThickness = thickness < 22 ? thickness + 4 : 18 // Cycle through common thicknesses
    return {
      name: name.replace(`${thickness}mm`, `${nextThickness}mm`),
      sku: sku.replace(`-${thickness}-`, `-${nextThickness}-`),
    }
  }

  // Fallback: just add "-COPY" suffix
  return {
    name: `${name} (másolat)`,
    sku: `${sku}-COPY-${Date.now()}`,
  }
}

/**
 * useProductMutations
 *
 * Hook for catalog product CRUD operations with localStorage persistence.
 *
 * Features:
 * - Duplicate product with smart variant suggestion
 * - Update product field
 * - Delete product
 * - localStorage sync
 * - Optimistic updates
 */
export function useProductMutations(
  products: Product[],
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
) {
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Load products from localStorage
   */
  const loadFromStorage = useCallback((): Product[] | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load products from localStorage:', error)
    }
    return null
  }, [])

  /**
   * Save products to localStorage
   */
  const saveToStorage = useCallback((products: Product[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    } catch (error) {
      console.warn('Failed to save products to localStorage:', error)
    }
  }, [])

  /**
   * Duplicate a product with smart variant suggestion
   *
   * @param productId - Original product ID
   * @param overrides - Optional field overrides
   * @returns New product ID
   */
  const duplicateProduct = useCallback(
    (productId: string, overrides?: Partial<Product>): string => {
      const original = products.find((p) => p.id === productId)
      if (!original) {
        throw new Error(`Product not found: ${productId}`)
      }

      // Generate smart variant suggestion
      const suggestion = suggestNextVariant(original)

      // Create new product with TEMP- prefix (optimistic)
      const tempId = `TEMP-${Date.now()}`
      const newProduct: Product = {
        ...original,
        ...suggestion,
        ...overrides,
        id: tempId,
      }

      // Optimistic update
      const updated = [...products, newProduct]
      setProducts(updated)
      saveToStorage(updated)

      // TODO: When backend is ready, replace with API call:
      // api.post(`/api/v1/products/${productId}/duplicate`, { overrides })
      //    .then(real => replaceTemp(tempId, real))

      return tempId
    },
    [products, setProducts, saveToStorage]
  )

  /**
   * Update a product field
   *
   * @param productId - Product ID
   * @param field - Field name
   * @param value - New value
   */
  const updateProduct = useCallback(
    (productId: string, field: keyof Product, value: any) => {
      setIsLoading(true)

      // Optimistic update
      const updated = products.map((p) => {
        if (p.id === productId) {
          return { ...p, [field]: value }
        }
        return p
      })

      setProducts(updated)
      saveToStorage(updated)

      // Simulate API delay (500ms debounce)
      setTimeout(() => {
        setIsLoading(false)

        // TODO: When backend is ready, replace with API call:
        // api.patch(`/api/v1/products/${productId}`, { field, value })
      }, 500)
    },
    [products, setProducts, saveToStorage]
  )

  /**
   * Delete a product
   *
   * @param productId - Product ID
   */
  const deleteProduct = useCallback(
    (productId: string) => {
      // Optimistic update
      const updated = products.filter((p) => p.id !== productId)
      setProducts(updated)
      saveToStorage(updated)

      // TODO: When backend is ready, replace with API call:
      // api.delete(`/api/v1/products/${productId}`)
    },
    [products, setProducts, saveToStorage]
  )

  /**
   * Initialize products from localStorage (if not already loaded)
   */
  const initializeFromStorage = useCallback(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) {
      setProducts(stored)
    }
  }, [loadFromStorage, setProducts])

  return {
    duplicateProduct,
    updateProduct,
    deleteProduct,
    initializeFromStorage,
    isLoading,
  }
}
