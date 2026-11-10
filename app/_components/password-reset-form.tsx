"use client"

import { FormEvent, useState } from "react"
import { resetPassword } from "@/app/_actions/password-auth"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Label } from "@/app/_components/ui/label"

export function PasswordResetForm({
  email,
  token,
}: {
  email: string
  token: string
}) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setMessage("")
    setError("")
    try {
      const formData = new FormData(event.currentTarget)
      const result = await resetPassword(formData)
      if (result.ok) setMessage("Senha atualizada. Agora você já pode entrar.")
      else setError(result.error)
    } catch {
      setError("Não foi possível redefinir a senha. Solicite um novo link.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          minLength={12}
          maxLength={128}
          required
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirme a nova senha</Label>
        <Input
          id="confirm-password"
          name="passwordConfirmation"
          type="password"
          minLength={12}
          maxLength={128}
          required
          autoComplete="new-password"
        />
      </div>
      <Button className="w-full" disabled={pending}>
        {pending ? "Salvando…" : "Redefinir senha"}
      </Button>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-muted-foreground text-sm" role="status">
          {message}
        </p>
      )}
    </form>
  )
}
