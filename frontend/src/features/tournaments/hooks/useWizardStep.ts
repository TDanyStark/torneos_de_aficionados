import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export const WIZARD_TOTAL_STEPS = 5

/** Wizard step state persisted in the URL via ?step=N (1-based, clamped). */
export function useWizardStep() {
  const [searchParams, setSearchParams] = useSearchParams()

  const raw = Number(searchParams.get('step')) || 1
  const step = Math.min(Math.max(raw, 1), WIZARD_TOTAL_STEPS)

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 1), WIZARD_TOTAL_STEPS)
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          params.set('step', String(clamped))
          return params
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  return {
    step,
    totalSteps: WIZARD_TOTAL_STEPS,
    goTo,
    next: () => goTo(step + 1),
    prev: () => goTo(step - 1),
  }
}
