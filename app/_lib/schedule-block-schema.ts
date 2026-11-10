import { z } from "zod"

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.")

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
  .refine((date) => {
    const parsed = new Date(`${date}T00:00:00.000Z`)
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    )
  }, "Data inválida.")

export const scheduleBlockSchema = z
  .object({
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    reason: z.string().trim().max(120).optional(),
    professionalId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "O fim do bloqueio precisa ser depois do início.",
    path: ["endTime"],
  })
