"use client"

import { Badge } from "@/app/_components/ui/badge"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog"
import { Input } from "@/app/_components/ui/input"
import { Switch } from "@/app/_components/ui/switch"
import { Textarea } from "@/app/_components/ui/textarea"
import { MAX_PROFESSIONAL_SCHEDULE_INTERVALS } from "@/app/_lib/professional-schedule-limit"
import {
  CalendarClockIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  setProfessionalActive,
  upsertProfessional,
} from "../_actions/professionals"
import { saveProfessionalSchedule } from "../_actions/professional-schedules"
import { useAdminSlug } from "./use-admin-slug"

interface TeamService {
  id: string
  name: string
  isActive: boolean
}

export interface TeamProfessional {
  id: string
  name: string
  displayName: string | null
  email: string | null
  phone: string | null
  bio: string | null
  isActive: boolean
  services: { id: string; name: string }[]
  schedules: { weekday: number; startsAtLocal: string; endsAtLocal: string }[]
}

type ScheduleInterval = TeamProfessional["schedules"][number]
const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
]

const TeamManager = ({
  professionals,
  services,
}: {
  professionals: TeamProfessional[]
  services: TeamService[]
}) => {
  const slug = useAdminSlug()
  const [editing, setEditing] = useState<TeamProfessional | null | undefined>()
  const [scheduling, setScheduling] = useState<TeamProfessional | null>(null)
  const [intervals, setIntervals] = useState<ScheduleInterval[]>([])
  const [isPending, startTransition] = useTransition()

  const save = (formData: FormData) => {
    const input = {
      id: editing?.id,
      name: formData.get("name"),
      displayName: formData.get("displayName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      bio: formData.get("bio"),
      serviceIds: formData.getAll("serviceIds"),
    }
    startTransition(async () => {
      const result = await upsertProfessional(input, slug)
      if (result.ok) {
        toast.success(
          editing ? "Profissional atualizado." : "Profissional criado.",
        )
        setEditing(undefined)
      } else {
        toast.error(result.error)
      }
    })
  }

  const toggle = (professional: TeamProfessional, isActive: boolean) => {
    startTransition(async () => {
      const result = await setProfessionalActive(
        professional.id,
        isActive,
        slug,
      )
      if (result.ok) {
        toast.success(
          isActive ? "Profissional ativado." : "Profissional desativado.",
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  const saveSchedule = () => {
    if (!scheduling) return
    startTransition(async () => {
      const result = await saveProfessionalSchedule(
        scheduling.id,
        intervals,
        slug,
      )
      if (result.ok) {
        toast.success("Jornada semanal salva.")
        setScheduling(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          {professionals.length}{" "}
          {professionals.length === 1 ? "profissional" : "profissionais"}
        </h2>
        <Button onClick={() => setEditing(null)}>
          <PlusIcon /> Novo profissional
        </Button>
      </div>

      {professionals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <UsersRoundIcon className="text-muted-foreground h-8 w-8" />
            <div>
              <h3 className="font-semibold">Sua equipe começa aqui</h3>
              <p className="text-muted-foreground text-sm">
                Cadastre profissionais e associe os serviços que oferecem.
              </p>
            </div>
            <Button onClick={() => setEditing(null)}>
              <PlusIcon /> Cadastrar profissional
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {professionals.map((professional) => (
            <Card
              key={professional.id}
              className={!professional.isActive ? "opacity-60" : undefined}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">
                      {professional.displayName || professional.name}
                    </h3>
                    {professional.displayName && (
                      <p className="text-muted-foreground text-xs">
                        {professional.name}
                      </p>
                    )}
                    <Badge
                      variant={professional.isActive ? "default" : "secondary"}
                      className="mt-1 font-normal"
                    >
                      {professional.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <Switch
                    checked={professional.isActive}
                    onCheckedChange={(checked) => toggle(professional, checked)}
                    disabled={isPending}
                    aria-label={
                      professional.isActive
                        ? `Desativar ${professional.name}`
                        : `Ativar ${professional.name}`
                    }
                  />
                </div>
                <div className="space-y-1 text-sm">
                  {professional.email && (
                    <p className="truncate">{professional.email}</p>
                  )}
                  {professional.phone && <p>{professional.phone}</p>}
                  {professional.bio && (
                    <p className="text-muted-foreground line-clamp-2">
                      {professional.bio}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {professional.services.length ? (
                    professional.services.map((service) => (
                      <Badge
                        key={service.id}
                        variant="secondary"
                        className="font-normal"
                      >
                        {service.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Nenhum serviço associado
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(professional)}
                >
                  <PencilIcon /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIntervals(professional.schedules)
                    setScheduling(professional)
                  }}
                >
                  <CalendarClockIcon /> Jornada
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
      >
        <DialogContent className="max-h-[90vh] w-[92%] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar profissional" : "Novo profissional"}
            </DialogTitle>
            <DialogDescription>
              Cadastre os dados e escolha os serviços oferecidos.
            </DialogDescription>
          </DialogHeader>
          <form key={editing?.id ?? "new"} action={save} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium">
              Nome *
              <Input
                name="name"
                required
                minLength={2}
                maxLength={100}
                defaultValue={editing?.name ?? ""}
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Nome de exibição
              <Input
                name="displayName"
                maxLength={60}
                defaultValue={editing?.displayName ?? ""}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium">
                E-mail
                <Input
                  name="email"
                  type="email"
                  maxLength={254}
                  defaultValue={editing?.email ?? ""}
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Telefone
                <Input
                  name="phone"
                  type="tel"
                  maxLength={30}
                  defaultValue={editing?.phone ?? ""}
                />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium">
              Bio
              <Textarea
                name="bio"
                maxLength={500}
                rows={3}
                defaultValue={editing?.bio ?? ""}
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Serviços</legend>
              {services.length ? (
                services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="serviceIds"
                      value={service.id}
                      defaultChecked={editing?.services.some(
                        (item) => item.id === service.id,
                      )}
                    />
                    <span>
                      {service.name}
                      {!service.isActive && " (inativo)"}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Cadastre serviços antes de associá-los.
                </p>
              )}
            </fieldset>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setEditing(undefined)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full" disabled={isPending}>
                {editing ? "Salvar" : "Criar profissional"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scheduling !== null}
        onOpenChange={(open) => !open && setScheduling(null)}
      >
        <DialogContent className="max-h-[90vh] w-[92%] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Jornada semanal</DialogTitle>
            <DialogDescription>
              {scheduling?.displayName || scheduling?.name}. Configure um ou
              mais intervalos por dia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {weekdays.map((weekday, day) => {
              const dayIntervals = intervals
                .map((interval, index) => ({ interval, index }))
                .filter(({ interval }) => interval.weekday === day)
              return (
                <fieldset key={day} className="space-y-2 rounded-md border p-3">
                  <legend className="px-1 text-sm font-semibold">
                    {weekday}
                  </legend>
                  {dayIntervals.map(({ interval, index }) => (
                    <div
                      key={`${day}-${index}`}
                      className="flex items-center gap-2"
                    >
                      <Input
                        type="time"
                        aria-label={`${weekday}, início`}
                        value={interval.startsAtLocal}
                        onChange={(event) =>
                          setIntervals((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, startsAtLocal: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="time"
                        aria-label={`${weekday}, fim`}
                        value={interval.endsAtLocal}
                        onChange={(event) =>
                          setIntervals((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, endsAtLocal: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover intervalo de ${weekday}`}
                        onClick={() =>
                          setIntervals((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      intervals.length >= MAX_PROFESSIONAL_SCHEDULE_INTERVALS
                    }
                    onClick={() =>
                      setIntervals((current) =>
                        current.length >= MAX_PROFESSIONAL_SCHEDULE_INTERVALS
                          ? current
                          : [
                              ...current,
                              {
                                weekday: day,
                                startsAtLocal: "09:00",
                                endsAtLocal: "18:00",
                              },
                            ],
                      )
                    }
                  >
                    <PlusIcon /> Adicionar intervalo
                  </Button>
                </fieldset>
              )
            })}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setScheduling(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="w-full"
                disabled={isPending}
                onClick={saveSchedule}
              >
                Salvar jornada
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TeamManager
