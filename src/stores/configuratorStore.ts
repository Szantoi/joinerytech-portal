import { create } from 'zustand'

export interface ConfigState {
  step: 1 | 2 | 3 | 4
  productType: string | null
  dimensions: {
    width: number
    height: number
    thickness: number
  }
  materials: {
    core: string
    veneer: string
    edge: string
  }
  fittings: {
    hinge: string
    handle: string
    lock: string
  }
}

const initialConfigState: ConfigState = {
  step: 1,
  productType: null,
  dimensions: {
    width: 900,
    height: 2000,
    thickness: 40
  },
  materials: {
    core: '',
    veneer: '',
    edge: ''
  },
  fittings: {
    hinge: '',
    handle: '',
    lock: ''
  }
}

interface ConfiguratorStore {
  currentStep: number
  setStep: (step: number) => void
  config: ConfigState
  updateConfig: (partial: Partial<ConfigState>) => void
  resetConfig: () => void
}

export const useConfiguratorStore = create<ConfiguratorStore>((set) => ({
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),
  config: initialConfigState,
  updateConfig: (partial) =>
    set((state) => ({
      config: { ...state.config, ...partial }
    })),
  resetConfig: () => set({ config: initialConfigState, currentStep: 1 })
}))
