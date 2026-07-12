import { useState, useEffect, useRef } from 'react'
import { Card } from '../ui/Card'
import { EditableCell } from './EditableCell'
import { ConflictWarning } from './ConflictWarning'
import { RowActionsMenu } from './RowActionsMenu'
import { useEditLock } from '../../hooks/useEditLock'
import { useProductMutations, type Product } from '../../hooks/useProductMutations'

// Mock catalog data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Tölgy furnér 18mm',
    sku: 'OAK-18-NAT',
    price: 8500,
    stock: 125,
    supplier: 'Kronospan',
  },
  {
    id: 'prod-002',
    name: 'Dió furnér 18mm',
    sku: 'WAL-18-DRK',
    price: 9200,
    stock: 87,
    supplier: 'Egger',
  },
  {
    id: 'prod-003',
    name: 'Fehér melamin 18mm',
    sku: 'WHT-18-MAT',
    price: 4800,
    stock: 245,
    supplier: 'Kronospan',
  },
  {
    id: 'prod-004',
    name: 'PVC élzáró tölgy',
    sku: 'EDGE-OAK-22',
    price: 850,
    stock: 1200,
    supplier: 'Rehau',
  },
  {
    id: 'prod-005',
    name: 'ABS élzáró dió',
    sku: 'EDGE-WAL-22',
    price: 920,
    stock: 980,
    supplier: 'Rehau',
  },
]

/**
 * CatalogPanel
 *
 * Demonstrates:
 * - Inline editing with multi-tab conflict detection
 * - Product duplication with smart variant suggestion
 * - Keyboard shortcuts (Cmd+D, Enter, Esc)
 * - Row actions menu
 * - localStorage persistence
 */
export function CatalogPanel() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [duplicateToast, setDuplicateToast] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  // Track if any row has a conflict
  const { hasConflict: globalConflict } = useEditLock(null)

  // Product mutations hook
  const {
    duplicateProduct,
    updateProduct,
    deleteProduct,
    initializeFromStorage,
  } = useProductMutations(products, setProducts)

  /**
   * Initialize from localStorage on mount
   */
  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd+D or Ctrl+D: Duplicate selected row
      if ((event.metaKey || event.ctrlKey) && event.key === 'd' && selectedRowId) {
        event.preventDefault()
        handleDuplicate(selectedRowId)
      }

      // Esc: Clear selection
      if (event.key === 'Escape') {
        setSelectedRowId(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedRowId])

  /**
   * Duplicate a product
   */
  const handleDuplicate = (productId: string) => {
    const newId = duplicateProduct(productId)

    // Show toast notification
    setDuplicateToast(newId)
    setTimeout(() => setDuplicateToast(null), 3000)

    // Auto-focus on new row name cell
    setTimeout(() => {
      setEditingRowId(`${newId}-name`)
    }, 100)
  }

  /**
   * Delete a product
   */
  const handleDelete = (productId: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a terméket?')) {
      deleteProduct(productId)
    }
  }

  /**
   * Update product field
   */
  const handleUpdateProduct = (productId: string, field: keyof Product, value: string) => {
    updateProduct(productId, field, field === 'price' || field === 'stock' ? parseFloat(value) : value)
  }

  return (
    <div className="space-y-3">
      {/* Conflict warning banner */}
      {globalConflict && editingRowId && (
        <ConflictWarning rowId={editingRowId} onDismiss={() => setEditingRowId(null)} />
      )}

      {/* Duplicate toast */}
      {duplicateToast && (
        <Card className="p-3 bg-green-50 border-green-200">
          <div className="text-[12px] text-green-800">
            ✅ Termék duplikálva! <strong>Kattints duplán a névre</strong> a szerkesztéshez.
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-4 bg-blue-50/40 border-blue-200">
        <div className="text-[12.5px] font-medium text-blue-900 mb-1">
          💡 Katalógus Demo
        </div>
        <div className="text-[11.5px] text-blue-700">
          <strong>Duplikálás:</strong> Kattints a <strong>⋯</strong> gombra → <strong>Duplicate</strong> vagy nyomd meg{' '}
          <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-[10px] font-mono">Cmd+D</kbd>
          <br />
          <strong>Szerkesztés:</strong> Double-click a <strong>Price</strong> vagy <strong>Stock</strong> cellákra.
          Press <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-[10px] font-mono">Enter</kbd> to save,
          <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-[10px] font-mono">Esc</kbd> to cancel.
        </div>
      </Card>

      {/* Catalog Table */}
      <Card className="p-0">
        <div className="px-5 py-3 border-b border-stone-200/80">
          <div className="text-[12.5px] font-semibold text-stone-900">
            Catalog ({products.length} termék)
          </div>
        </div>

        {/* Table Header */}
        <div
          ref={tableRef}
          className="grid grid-cols-[80px_minmax(0,2fr)_120px_100px_100px_minmax(0,1fr)_40px] gap-3 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 border-b border-stone-100 bg-stone-50/40"
        >
          <div>SKU</div>
          <div>Product Name</div>
          <div className="text-right">Price (Ft)</div>
          <div className="text-right">Stock</div>
          <div>Supplier</div>
          <div />
          <div />
        </div>

        {/* Table Rows */}
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => setSelectedRowId(product.id)}
            className={`
              grid grid-cols-[80px_minmax(0,2fr)_120px_100px_100px_minmax(0,1fr)_40px] gap-3 px-5 py-3 border-b border-stone-100 last:border-0 items-center
              hover:bg-stone-50/40 transition cursor-pointer
              ${selectedRowId === product.id ? 'bg-blue-50/40 ring-1 ring-blue-200 ring-inset' : ''}
              ${duplicateToast === product.id ? 'animate-pulse' : ''}
            `}
          >
            {/* SKU */}
            <div className="text-[11px] font-mono text-stone-500 truncate">{product.sku}</div>

            {/* Name - Editable */}
            <div>
              <EditableCell
                rowId={`${product.id}-name`}
                value={product.name}
                onSave={(val) => handleUpdateProduct(product.id, 'name', val)}
                inputType="text"
                className="text-[12.5px] font-medium text-stone-900 w-full"
              />
            </div>

            {/* Price - Editable */}
            <div className="text-right">
              <EditableCell
                rowId={`${product.id}-price`}
                value={product.price.toLocaleString('hu-HU')}
                onSave={(val) => handleUpdateProduct(product.id, 'price', val.replace(/\s/g, ''))}
                inputType="number"
                className="text-[12px] font-medium text-stone-900 tabular-nums w-full text-right"
              />
            </div>

            {/* Stock - Editable */}
            <div className="text-right">
              <EditableCell
                rowId={`${product.id}-stock`}
                value={product.stock}
                onSave={(val) => handleUpdateProduct(product.id, 'stock', val)}
                inputType="number"
                className="text-[12px] tabular-nums w-full text-right"
              />
            </div>

            {/* Supplier */}
            <div className="text-[12px] text-stone-600 truncate">{product.supplier}</div>

            {/* Empty cell for alignment */}
            <div />

            {/* Actions menu */}
            <div className="flex justify-end">
              <RowActionsMenu
                onDuplicate={() => handleDuplicate(product.id)}
                onDelete={() => handleDelete(product.id)}
              />
            </div>
          </div>
        ))}
      </Card>

      {/* localStorage info */}
      <Card className="p-3 bg-stone-50/40">
        <div className="text-[11px] text-stone-500">
          <strong>localStorage keys:</strong>{' '}
          <code className="px-1.5 py-0.5 bg-stone-100 rounded text-[10px] font-mono">
            spaceos_catalog_products
          </code>
          {' '}(product data),{' '}
          <code className="px-1.5 py-0.5 bg-stone-100 rounded text-[10px] font-mono">
            spaceos_edit_locks
          </code>
          {' '}(multi-tab conflict detection)
        </div>
      </Card>
    </div>
  )
}
