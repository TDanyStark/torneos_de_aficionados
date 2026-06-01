import type { ReactNode } from 'react'
import { AlertCircle, Inbox } from 'lucide-react'

interface StateMessageProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

/** Generic empty / error placeholder. */
export function StateMessage({
  icon,
  title,
  description,
  action,
}: StateMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function EmptyState(props: Omit<StateMessageProps, 'icon'>) {
  return <StateMessage icon={<Inbox className="size-8" />} {...props} />
}

export function ErrorState({
  message,
  action,
}: {
  message?: string
  action?: ReactNode
}) {
  return (
    <StateMessage
      icon={<AlertCircle className="text-destructive size-8" />}
      title="Algo salió mal"
      description={message ?? 'No se pudieron cargar los datos.'}
      action={action}
    />
  )
}
