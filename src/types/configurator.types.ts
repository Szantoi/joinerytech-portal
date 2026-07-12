import { z } from 'zod'

// Product Templates
export interface ProductTemplate {
  id: string
  name: string
  category: 'doors' | 'cabinets' | 'panels'
  description?: string
}

// Config State Schema with Zod
export const DimensionsSchema = z.object({
  width: z.number().min(700, 'Minimum width: 700mm').max(1100, 'Maximum width: 1100mm'),
  height: z.number().min(1900, 'Minimum height: 1900mm').max(2200, 'Maximum height: 2200mm'),
  thickness: z.number().min(30, 'Minimum thickness: 30mm').max(60, 'Maximum thickness: 60mm')
})

export const MaterialsSchema = z.object({
  core: z.string().min(1, 'Core material is required'),
  veneer: z.string().min(1, 'Veneer is required'),
  edge: z.string().min(1, 'Edge material is required')
})

export const FittingsSchema = z.object({
  hinge: z.string().min(1, 'Hinge type is required'),
  handle: z.string().min(1, 'Handle type is required'),
  lock: z.string().min(1, 'Lock type is required')
})

export const ConfigStateSchema = z.object({
  productType: z.string().min(1, 'Product type is required'),
  dimensions: DimensionsSchema,
  materials: MaterialsSchema,
  fittings: FittingsSchema
})

export type ConfigStateForm = z.infer<typeof ConfigStateSchema>

// BOM Item types
export type BOMItemType = 'material' | 'veneer' | 'fitting'

export interface BOMItem {
  itemType: BOMItemType
  name: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  supplier?: string
  inStock?: boolean
}

export interface BOMPreview {
  configId: string
  bomItems: BOMItem[]
  estimatedPrice: number
  totalMaterialCost?: number
  estimatedLabor?: number
}

// Work Order types
export const WorkOrderFormSchema = z.object({
  configId: z.string(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  customerRef: z.string().min(1, 'Customer reference is required'),
  notes: z.string().optional()
})

export type WorkOrderForm = z.infer<typeof WorkOrderFormSchema>

export interface WorkOrderResponse {
  workOrderId: string
  pdfUrl: string
  bomItems: BOMItem[]
  totalMaterialCost: number
  estimatedLabor: number
  totalCost: number
  scheduledStart: string
  estimatedCompletion: string
}

// API Response types
export interface ConfigureResponse {
  configId: string
  previewUrl: string
  estimatedPrice: number
  bomPreview: BOMItem[]
}

// Material option types
export interface MaterialOption {
  id: string
  name: string
  type: 'core' | 'veneer' | 'edge'
  unitPrice: number
}

export interface FittingOption {
  id: string
  name: string
  type: 'hinge' | 'handle' | 'lock'
  unitPrice: number
}
