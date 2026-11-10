import { z } from "zod"

const dateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}, "Informe uma data válida.")

const timeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido (HH:mm).")

export const professionalScheduleExceptionSchema = z.discriminatedUnion(
  "type",
  [
    z.object({
      date: dateSchema,
      type: z.literal("UNAVAILABLE"),
      reason: z
        .string()
        .trim()
        .max(200, "O motivo deve ter no máximo 200 caracteres.")
        .optional(),
    }),
    z
      .object({
        date: dateSchema,
        type: z.literal("CUSTOM_HOURS"),
        startsAtLocal: timeSchema,
        endsAtLocal: timeSchema,
        reason: z
          .string()
          .trim()
          .max(200, "O motivo deve ter no máximo 200 caracteres.")
          .optional(),
      })
      .refine((exception) => exception.startsAtLocal < exception.endsAtLocal, {
        message: "O fim do horário precisa ser depois do início.",
        path: ["endsAtLocal"],
      }),
  ],
)

export type ProfessionalScheduleExceptionInput = z.infer<
  typeof professionalScheduleExceptionSchema
>
