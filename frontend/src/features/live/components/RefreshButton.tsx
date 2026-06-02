import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RefreshButtonProps {
  onRefresh: () => void
  /** Whether a refetch is currently in flight (shows a spinner). */
  isFetching?: boolean
  /** Cooldown window in seconds after each manual press (default 18s). */
  cooldownSeconds?: number
}

/**
 * Manual "Actualizar" button with a CLIENT-side cooldown — after each press it
 * disables and counts down, preventing polling abuse against the shared host
 * (complements the 60s auto-poll in useLiveMatch).
 */
export function RefreshButton({
  onRefresh,
  isFetching = false,
  cooldownSeconds = 18,
}: RefreshButtonProps) {
  const [remaining, setRemaining] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startCooldown = () => {
    setRemaining(cooldownSeconds)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleClick = () => {
    if (remaining > 0) return
    onRefresh()
    startCooldown()
  }

  const disabled = remaining > 0 || isFetching

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
    >
      <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
      {remaining > 0 ? `Actualizar (${remaining}s)` : 'Actualizar'}
    </Button>
  )
}
