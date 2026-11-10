import { z } from "zod"
import { MAX_PROFESSIONAL_SCHEDULE_INTERVALS } from "./professional-schedule-limit"

const timeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido (HH:mm).")

export const professionalScheduleSchema = z
  .array(
    z
      .object({
        weekday: z.number().int().min(0).max(6),
        startsAtLocal: timeSchema,
        endsAtLocal: timeSchema,
      })
      .refine((interval) => interval.startsAtLocal < interval.endsAtLocal, {
        message: "O fim do intervalo precisa ser depois do início.",
        path: ["endsAtLocal"],
      }),
  )
  .max(
    MAX_PROFESSIONAL_SCHEDULE_INTERVALS,
    `O limite é de ${MAX_PROFESSIONAL_SCHEDULE_INTERVALS} intervalos semanais.`,
  )
  .superRefine((intervals, context) => {
    if (intervals.length > MAX_PROFESSIONAL_SCHEDULE_INTERVALS) return

    intervals.forEach((interval, index) => {
      const overlaps = intervals.some(
        (other, otherIndex) =>
          index !== otherIndex &&
          interval.weekday === other.weekday &&
          interval.startsAtLocal < other.endsAtLocal &&
          other.startsAtLocal < interval.endsAtLocal,
      )
      if (overlaps) {
        context.addIssue({
          code: "custom",
          message: "Os intervalos do mesmo dia não podem se sobrepor.",
          path: [index],
        })
      }
    })
  })

export type ProfessionalScheduleInput = z.infer<
  typeof professionalScheduleSchema
>
