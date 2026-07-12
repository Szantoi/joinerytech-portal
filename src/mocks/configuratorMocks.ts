import type {
  ProductTemplate,
  MaterialOption,
  FittingOption,
  ConfigureResponse,
  WorkOrderResponse,
  BOMItem
} from '../types/configurator.types'

// Mock Product Templates
export const mockTemplates: ProductTemplate[] = [
  { id: 'standard_door', name: 'Standard beltéri ajtó', category: 'doors' },
  { id: 'premium_door', name: 'Prémium furnér ajtó', category: 'doors' },
  { id: 'fireproof_door', name: 'Tűzálló ajtó', category: 'doors' },
  { id: 'acoustic_door', name: 'Hangszigetelt ajtó', category: 'doors' },
  { id: 'security_door', name: 'Biztonsági ajtó', category: 'doors' }
]

// Mock Material Options
export const mockMaterialOptions: {
  core: MaterialOption[]
  veneer: MaterialOption[]
  edge: MaterialOption[]
} = {
  core: [
    { id: 'chipboard_18mm', name: 'Forgácslap 18mm', type: 'core', unitPrice: 8500 },
    { id: 'mdf_18mm', name: 'MDF 18mm', type: 'core', unitPrice: 9200 },
    { id: 'plywood_18mm', name: 'Rétegelt lemez 18mm', type: 'core', unitPrice: 11500 }
  ],
  veneer: [
    { id: 'oak_natural', name: 'Tölgy furnér natúr', type: 'veneer', unitPrice: 5200 },
    { id: 'walnut_dark', name: 'Dió furnér sötét', type: 'veneer', unitPrice: 6800 },
    { id: 'ash_white', name: 'Kőris furnér fehér', type: 'veneer', unitPrice: 5500 }
  ],
  edge: [
    { id: 'pvc_oak', name: 'PVC élzáró tölgy', type: 'edge', unitPrice: 850 },
    { id: 'abs_walnut', name: 'ABS élzáró dió', type: 'edge', unitPrice: 920 },
    { id: 'veneer_edge', name: 'Furnér élzáró', type: 'edge', unitPrice: 1200 }
  ]
}

// Mock Fitting Options
export const mockFittingOptions: {
  hinge: FittingOption[]
  handle: FittingOption[]
  lock: FittingOption[]
} = {
  hinge: [
    { id: 'concealed_3d', name: 'Rejtett 3D zsanér', type: 'hinge', unitPrice: 1200 },
    { id: 'standard_hinge', name: 'Standard pánt', type: 'hinge', unitPrice: 800 },
    { id: 'heavy_duty', name: 'Erősített zsanér', type: 'hinge', unitPrice: 1500 }
  ],
  handle: [
    { id: 'lever_chrome', name: 'Króm kilincs', type: 'handle', unitPrice: 3500 },
    { id: 'lever_brass', name: 'Réz kilincs', type: 'handle', unitPrice: 4200 },
    { id: 'knob_modern', name: 'Modern gomb', type: 'handle', unitPrice: 2800 }
  ],
  lock: [
    { id: 'cylinder_lock', name: 'Cilinderzár', type: 'lock', unitPrice: 5500 },
    { id: 'privacy_lock', name: 'Fürdőszoba zár', type: 'lock', unitPrice: 3200 },
    { id: 'security_lock', name: 'Biztonsági zár', type: 'lock', unitPrice: 8900 }
  ]
}

// Mock BOM Items
export const mockBOMItems: BOMItem[] = [
  {
    itemType: 'material',
    name: 'Forgácslap 18mm',
    quantity: 1,
    unit: 'db',
    unitPrice: 8500,
    totalPrice: 8500,
    supplier: 'Kronospan Hungary',
    inStock: true
  },
  {
    itemType: 'veneer',
    name: 'Tölgy furnér natúr',
    quantity: 2,
    unit: 'm²',
    unitPrice: 5200,
    totalPrice: 10400,
    supplier: 'Veneer Plus Kft',
    inStock: true
  },
  {
    itemType: 'fitting',
    name: 'Rejtett 3D zsanér',
    quantity: 3,
    unit: 'db',
    unitPrice: 1200,
    totalPrice: 3600,
    supplier: 'Blum Hungary',
    inStock: false
  },
  {
    itemType: 'fitting',
    name: 'Króm kilincs',
    quantity: 1,
    unit: 'szett',
    unitPrice: 3500,
    totalPrice: 3500,
    supplier: 'Hoppe Kft',
    inStock: true
  },
  {
    itemType: 'fitting',
    name: 'Cilinderzár',
    quantity: 1,
    unit: 'db',
    unitPrice: 5500,
    totalPrice: 5500,
    supplier: 'Mul-T-Lock Hungary',
    inStock: true
  }
]

// Mock Configure Response
export const mockConfigureResponse: ConfigureResponse = {
  configId: 'cfg_2026_042',
  previewUrl: '/configurator/preview/cfg_2026_042',
  estimatedPrice: 45000,
  bomPreview: mockBOMItems
}

// Mock Work Order Response
export const mockWorkOrderResponse: WorkOrderResponse = {
  workOrderId: 'wo_2026_042',
  pdfUrl: '/mock/work-order-sheet.pdf',
  bomItems: mockBOMItems,
  totalMaterialCost: 31500,
  estimatedLabor: 18000,
  totalCost: 49500,
  scheduledStart: '2026-07-08',
  estimatedCompletion: '2026-07-14'
}
