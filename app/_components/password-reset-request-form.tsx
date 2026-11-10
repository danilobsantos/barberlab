"use client"

import { FormEvent, useState } from "react"
import { requestPasswordReset } from "@/app/_actions/password-auth"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Label } from "@/app/_components/ui/label"

export function PasswordResetRequestForm() {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    try {
      const result = await requestPasswordReset(
        new FormData(event.currentTarget),
      )
      setMessage(result.message)
    } catch {
      setMessage(
        "Se a conta puder ser recuperada, enviaremos as instruções por e-mail.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="reset-email">E-mail</Label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <Button className="w-full" disabled={pending}>
        {pending ? "Enviando…" : "Enviar link de recuperação"}
      </Button>
      {message && (
        <p className="text-muted-foreground text-sm" role="status">
          {message}
        </p>
      )}
    </form>
  )
}
