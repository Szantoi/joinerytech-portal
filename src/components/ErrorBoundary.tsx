import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Card, Icon } from './ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="px-7 py-6 max-w-[1400px] mx-auto">
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 grid place-items-center">
                <Icon name="alert" size={32} className="text-rose-600" />
              </div>

              <div>
                <div className="text-[16px] font-semibold text-stone-900 mb-1">
                  Hiba történt az oldal betöltése közben
                </div>
                <div className="text-[13px] text-stone-600">
                  Kérem próbálja meg újra, vagy lépjen kapcsolatba a támogatással
                </div>
              </div>

              {this.state.error && (
                <div className="w-full max-w-2xl">
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-left">
                    <div className="text-[11px] uppercase tracking-wide text-rose-700 font-medium mb-2">
                      Hiba részletei
                    </div>
                    <div className="text-[12px] text-rose-900 font-mono mb-2">
                      {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <details className="text-[11px] text-rose-800">
                        <summary className="cursor-pointer hover:text-rose-900 mb-2">
                          Stack trace
                        </summary>
                        <pre className="whitespace-pre-wrap overflow-auto max-h-64 bg-rose-100 rounded p-2 text-[10px]">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-[13px] font-medium rounded-lg hover:bg-teal-700 transition"
                >
                  <Icon name="refresh" size={14} />
                  Oldal újratöltése
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-300 text-stone-700 text-[13px] font-medium rounded-lg hover:bg-stone-50 transition"
                >
                  <Icon name="chevron" size={14} className="rotate-180" />
                  Vissza
                </button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
