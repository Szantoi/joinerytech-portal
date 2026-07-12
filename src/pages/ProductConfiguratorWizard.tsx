import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useConfiguratorStore } from '../stores/configuratorStore'
import { ConfigStateSchema } from '../types/configurator.types'
import type { ConfigureResponse } from '../types/configurator.types'
import { mockTemplates, mockMaterialOptions, mockFittingOptions } from '../mocks/configuratorMocks'

export function ProductConfiguratorWizard() {
  const navigate = useNavigate()
  const { currentStep, setStep, config, updateConfig } = useConfiguratorStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutate: submitConfig, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/products/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to submit configuration')
      return response.json() as Promise<ConfigureResponse>
    },
    onSuccess: (data) => {
      navigate(`/configurator/preview/${data.configId}`)
    },
    onError: (error) => {
      setErrors({ submit: error.message })
    }
  })

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1 && !config.productType) {
      newErrors.productType = 'Please select a product type'
    }

    if (step === 2) {
      try {
        ConfigStateSchema.shape.dimensions.parse(config.dimensions)
      } catch (error: any) {
        error.errors?.forEach((err: any) => {
          newErrors[err.path[0]] = err.message
        })
      }
    }

    if (step === 3) {
      if (!config.materials.core) newErrors.core = 'Core material is required'
      if (!config.materials.veneer) newErrors.veneer = 'Veneer is required'
      if (!config.materials.edge) newErrors.edge = 'Edge material is required'
    }

    if (step === 4) {
      if (!config.fittings.hinge) newErrors.hinge = 'Hinge type is required'
      if (!config.fittings.handle) newErrors.handle = 'Handle type is required'
      if (!config.fittings.lock) newErrors.lock = 'Lock type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setStep(currentStep + 1)
      } else {
        // Final submit
        submitConfig({
          productType: config.productType,
          dimensions: config.dimensions,
          materials: config.materials,
          fittings: config.fittings
        })
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1)
      setErrors({})
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}
                  `}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">Product Type</span>
            <span className="text-sm text-gray-600">Dimensions</span>
            <span className="text-sm text-gray-600">Materials</span>
            <span className="text-sm text-gray-600">Fittings</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Select Product Type</h2>
              <div className="grid grid-cols-1 gap-4">
                {mockTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => updateConfig({ productType: template.id })}
                    className={`
                      p-4 border-2 rounded-lg text-left transition-all
                      ${config.productType === template.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}
                    `}
                  >
                    <div className="font-semibold">{template.name}</div>
                  </button>
                ))}
              </div>
              {errors.productType && <p className="text-red-600 text-sm mt-2">{errors.productType}</p>}
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Enter Dimensions</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="width" className="block text-sm font-medium mb-1">Width (mm)</label>
                  <input
                    id="width"
                    type="number"
                    value={config.dimensions.width}
                    onChange={(e) =>
                      updateConfig({ dimensions: { ...config.dimensions, width: Number(e.target.value) } })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min={700}
                    max={1100}
                  />
                  {errors.width && <p className="text-red-600 text-sm mt-1">{errors.width}</p>}
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium mb-1">Height (mm)</label>
                  <input
                    id="height"
                    type="number"
                    value={config.dimensions.height}
                    onChange={(e) =>
                      updateConfig({ dimensions: { ...config.dimensions, height: Number(e.target.value) } })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min={1900}
                    max={2200}
                  />
                  {errors.height && <p className="text-red-600 text-sm mt-1">{errors.height}</p>}
                </div>
                <div>
                  <label htmlFor="thickness" className="block text-sm font-medium mb-1">Thickness (mm)</label>
                  <input
                    id="thickness"
                    type="number"
                    value={config.dimensions.thickness}
                    onChange={(e) =>
                      updateConfig({ dimensions: { ...config.dimensions, thickness: Number(e.target.value) } })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min={30}
                    max={60}
                  />
                  {errors.thickness && <p className="text-red-600 text-sm mt-1">{errors.thickness}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Select Materials</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="coreMaterial" className="block text-sm font-medium mb-1">Core Material</label>
                  <select
                    id="coreMaterial"
                    value={config.materials.core}
                    onChange={(e) => updateConfig({ materials: { ...config.materials, core: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select core material...</option>
                    {mockMaterialOptions.core.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} - {opt.unitPrice} Ft
                      </option>
                    ))}
                  </select>
                  {errors.core && <p className="text-red-600 text-sm mt-1">{errors.core}</p>}
                </div>
                <div>
                  <label htmlFor="veneer" className="block text-sm font-medium mb-1">Veneer</label>
                  <select
                    id="veneer"
                    value={config.materials.veneer}
                    onChange={(e) => updateConfig({ materials: { ...config.materials, veneer: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select veneer...</option>
                    {mockMaterialOptions.veneer.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} - {opt.unitPrice} Ft/m²
                      </option>
                    ))}
                  </select>
                  {errors.veneer && <p className="text-red-600 text-sm mt-1">{errors.veneer}</p>}
                </div>
                <div>
                  <label htmlFor="edgeMaterial" className="block text-sm font-medium mb-1">Edge Material</label>
                  <select
                    id="edgeMaterial"
                    value={config.materials.edge}
                    onChange={(e) => updateConfig({ materials: { ...config.materials, edge: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select edge material...</option>
                    {mockMaterialOptions.edge.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} - {opt.unitPrice} Ft
                      </option>
                    ))}
                  </select>
                  {errors.edge && <p className="text-red-600 text-sm mt-1">{errors.edge}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Select Fittings</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="hingeType" className="block text-sm font-medium mb-1">Hinge Type</label>
                  <select
                    id="hingeType"
                    value={config.fittings.hinge}
                    onChange={(e) => updateConfig({ fittings: { ...config.fittings, hinge: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select hinge...</option>
                    {mockFittingOptions.hinge.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} - {opt.unitPrice} Ft
                      </option>
                    ))}
                  </select>
                  {errors.hinge && <p className="text-red-600 text-sm mt-1">{errors.hinge}</p>}
                </div>
                <div>
                  <label htmlFor="handleType" className="block text-sm font-medium mb-1">Handle Type</label>
                  <select
                    id="handleType"
                    value={config.fittings.handle}
                    onChange={(e) => updateConfig({ fittings: { ...config.fittings, handle: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select handle...</option>
                    {mockFittingOptions.handle.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} - {opt.unitPrice} Ft
                      </option>
                    ))}
                  </select>
                  {errors.handle && <p className="text-red-600 text-sm mt-1">{errors.handle}</p>}
                </div>
                <div>
                  <label htmlFor="lockType" className="block text-sm font-medium mb-1">Lock Type</label>
                  <select
                    id="lockType"
                    value={config.fittings.lock}
                    onChange={(e) => updateConfig({ fittings: { ...config.fittings, lock: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select lock...</option>
                    {mockFittingOptions.lock.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} - {opt.unitPrice} Ft
                      </option>
                    ))}
                  </select>
                  {errors.lock && <p className="text-red-600 text-sm mt-1">{errors.lock}</p>}
                </div>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Submitting...' : currentStep === 4 ? 'Submit Configuration' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
