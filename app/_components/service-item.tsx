"use client"

import { Barbershop, BarbershopService } from "@prisma/client"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Calendar } from "./ui/calendar"
import { ptBR } from "date-fns/locale"
import { useEffect, useMemo, useState, useTransition } from "react"
import { format } from "date-fns"
import { createBooking } from "../_actions/create-booking"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  getServiceProfessionals,
  getUnavailableIntervals,
} from "../_actions/get-bookings"
import { localDateTimeToInstant } from "../_lib/booking-availability"
import { Dialog, DialogContent } from "./ui/dialog"
import SignInDialog from "./sign-in-dialog"
import BookingSummary from "./booking-summary"
import {
  buildCustomerConfirmationMessage,
  buildWhatsAppUrl,
} from "../_lib/whatsapp"

interface ServiceItemProps {
  service: Pick<
    BarbershopService,
    "id" | "name" | "description" | "imageUrl" | "price" | "durationMinutes"
  >
  barbershop: Pick<Barbershop, "name" | "phones" | "timezone">
  bookingEnabled?: boolean
}

const ServiceItem = ({
  service,
  barbershop,
  bookingEnabled = true,
}: ServiceItemProps) => {
  const { data } = useSession()
  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [professionals, setProfessionals] = useState<
    { id: string; name: string }[]
  >([])
  const [professionalId, setProfessionalId] = useState("")
  const [timeList, setTimeList] = useState<string[]>([])
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isCreating, startCreating] = useTransition()

  useEffect(() => {
    if (!bookingEnabled) return
    let current = true
    getServiceProfessionals(service.id).then((result) => {
      if (current) setProfessionals(result)
    })
    return () => {
      current = false
    }
  }, [bookingEnabled, service.id])

  useEffect(() => {
    if (!bookingEnabled || !selectedDay || !professionalId) return

    let current = true
    setTimeList([])
    setIsLoadingSlots(true)

    const load = async () => {
      const slots = await getUnavailableIntervals({
        date: format(selectedDay, "yyyy-MM-dd"),
        serviceId: service.id,
        professionalId,
      })
      if (!current) return
      setTimeList(slots)
      setIsLoadingSlots(false)
    }

    load()
    return () => {
      current = false
    }
  }, [bookingEnabled, selectedDay, service.id, professionalId])

  const selectedDate = useMemo(() => {
    if (!selectedDay || !selectedTime) return
    return (
      localDateTimeToInstant(
        format(selectedDay, "yyyy-MM-dd"),
        selectedTime,
        barbershop.timezone,
      ) ?? undefined
    )
  }, [selectedDay, selectedTime, barbershop.timezone])

  const handleBookingClick = () => {
    if (data?.user) {
      return setBookingSheetIsOpen(true)
    }
    return setSignInDialogIsOpen(true)
  }

  const handleBookingSheetOpenChange = () => {
    setSelectedDay(undefined)
    setSelectedTime(undefined)
    setTimeList([])
    setProfessionalId("")
    setIsLoadingSlots(false)
    setBookingSheetIsOpen(false)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date)
    setSelectedTime(undefined)
    setTimeList([])
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleCreateBooking = () =>
    startCreating(async () => {
      try {
        if (!selectedDate || !selectedDay || !selectedTime) return
        const result = await createBooking({
          serviceId: service.id,
          professionalId,
          date: format(selectedDay, "yyyy-MM-dd"),
          time: selectedTime,
        })

        if (!result.ok) {
          toast.error(result.error)
          return
        }

        handleBookingSheetOpenChange()

        const whatsappUrl = buildWhatsAppUrl({
          phone: barbershop.phones?.[0],
          message: buildCustomerConfirmationMessage({
            serviceName: service.name,
            date: selectedDate,
            timeZone: barbershop.timezone,
            barbershopName: barbershop.name,
            customerName: data?.user?.name,
            price: Number(service.price),
          }),
        })

        toast.success("Reserva criada com sucesso!", {
          description: "Confirme com a barbearia pelo WhatsApp.",
          duration: 10000,
          action: {
            label: "Confirmar",
            onClick: () => window.open(whatsappUrl, "_blank"),
          },
        })
      } catch (error) {
        console.error(error)
        toast.error("Erro ao criar reserva!")
      }
    })

  return (
    <>
      <Card>
        <CardContent className="flex items-center gap-3 p-3">
          {/* IMAGE */}
          <div className="relative max-h-[110px] min-h-[110px] max-w-[110px] min-w-[110px]">
            <Image
              alt={service.name || "Serviço"}
              src={service.imageUrl}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="rounded-lg object-cover"
            />
          </div>
          {/* DIREITA */}
          <div className="flex flex-1 flex-col space-y-2">
            <h3 className="text-sm font-semibold">{service.name}</h3>
            <p className="text-sm text-gray-400">{service.description}</p>
            {/* PREÇO E BOTÃO */}
            <div className="flex items-center justify-between">
              <p className="text-primary text-sm font-bold">
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(service.price))}
              </p>
              <div className="flex-1" />
              {bookingEnabled && (
                <Sheet
                  open={bookingSheetIsOpen}
                  onOpenChange={(open) => {
                    if (!open) handleBookingSheetOpenChange()
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBookingClick}
                    className="ml-auto px-4 py-2 text-xs sm:text-sm md:text-base lg:px-6 lg:py-3"
                  >
                    Reservar
                  </Button>

                  <SheetContent
                    className="w-[92%] gap-0 p-0 sm:max-w-md"
                    aria-describedby={undefined}
                  >
                    <SheetHeader className="items-center border-b border-solid px-5 py-4">
                      <SheetTitle>Fazer Reserva</SheetTitle>
                    </SheetHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      <div className="border-b border-solid px-5 py-5">
                        <label
                          className="mb-3 block text-sm font-medium"
                          htmlFor={`professional-${service.id}`}
                        >
                          Profissional
                        </label>
                        <select
                          id={`professional-${service.id}`}
                          className="border-input bg-background mb-4 h-10 w-full rounded-md border px-3 text-sm"
                          value={professionalId}
                          onChange={(event) => {
                            setProfessionalId(event.target.value)
                            setSelectedDay(undefined)
                            setSelectedTime(undefined)
                            setTimeList([])
                          }}
                        >
                          <option value="">Selecione um profissional</option>
                          {professionals.map((professional) => (
                            <option
                              key={professional.id}
                              value={professional.id}
                            >
                              {professional.name}
                            </option>
                          ))}
                        </select>
                        <Calendar
                          mode="single"
                          locale={ptBR}
                          selected={selectedDay}
                          onSelect={handleDateSelect}
                          disabled={(date: Date) =>
                            !professionalId ||
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          className="w-full"
                          styles={{
                            root: {
                              width: "100%",
                            },
                            table: {
                              width: "100%",
                            },
                            head_cell: {
                              width: "100%",
                              textTransform: "capitalize",
                            },
                            cell: {
                              width: "100%",
                            },
                            button: {
                              width: "100%",
                            },
                            nav_button_previous: {
                              width: "32px",
                              height: "32px",
                            },
                            nav_button_next: {
                              width: "32px",
                              height: "32px",
                            },
                            caption: {
                              textTransform: "capitalize",
                            },
                          }}
                        />
                      </div>

                      {selectedDay && (
                        <div className="border-b border-solid p-5">
                          {isLoadingSlots ? (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="bg-muted/60 h-8 animate-pulse rounded-md"
                                />
                              ))}
                            </div>
                          ) : timeList.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {timeList.map((time) => (
                                <Button
                                  key={time}
                                  size="sm"
                                  variant={
                                    selectedTime === time
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() => handleTimeSelect(time)}
                                >
                                  {time}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              {professionalId
                                ? "Os horários desse dia já foram preenchidos."
                                : "Selecione um profissional para consultar os horários."}
                            </p>
                          )}
                        </div>
                      )}

                      {selectedDate && (
                        <div className="p-5">
                          <BookingSummary
                            barbershop={barbershop}
                            service={service}
                            selectedDate={selectedDate}
                          />
                        </div>
                      )}
                    </div>

                    <SheetFooter className="border-t border-solid px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                      <Button
                        className="w-full"
                        onClick={handleCreateBooking}
                        disabled={
                          !professionalId ||
                          !selectedDay ||
                          !selectedTime ||
                          isCreating
                        }
                      >
                        {isCreating ? "Confirmando..." : "Confirmar"}
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {bookingEnabled && (
        <Dialog
          open={signInDialogIsOpen}
          onOpenChange={(open) => setSignInDialogIsOpen(open)}
        >
          <DialogContent className="w-[90%]">
            <SignInDialog />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default ServiceItem
