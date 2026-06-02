import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Team } from '../types'
import { TeamStatusBadge } from './TeamStatusBadge'

interface TeamCardProps {
  team: Team
  /** Tournament slug used to build the public detail link. */
  tournamentSlug: string
}

export function TeamCard({ team, tournamentSlug }: TeamCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              {team.logo_url ? (
                <AvatarImage src={team.logo_url} alt={team.name} />
              ) : null}
              <AvatarFallback>
                <Shield className="size-4" />
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-base">{team.name}</CardTitle>
          </div>
          <TeamStatusBadge status={team.status} />
        </div>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        {team.short_name ? <p>Abreviatura: {team.short_name}</p> : null}
      </CardContent>
      <CardFooter>
        <Link
          to={`/t/${tournamentSlug}/equipo/${team.id}`}
          className="text-primary text-sm font-medium hover:underline"
        >
          Ver plantilla →
        </Link>
      </CardFooter>
    </Card>
  )
}
