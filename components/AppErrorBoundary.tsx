'use client'

import React from 'react'

interface AppErrorBoundaryProps {
  children: React.ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[AppErrorBoundary] render failure:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mt-6 brutal-card p-8 text-center">
          <p className="text-xl font-black text-[#232737]">We hit a rendering issue.</p>
          <p className="mt-2 text-sm font-medium text-[#5f6477]">
            Your simulation data is safe. Reload to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 btn-chunky bg-[#111] px-5 py-2.5 text-sm text-white"
          >
            Reload simulation
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
