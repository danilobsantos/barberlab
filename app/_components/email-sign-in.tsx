"use client"

import { FormEvent, useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export function EmailSignIn({ callbackUrl }: { callbackUrl?: string }) {
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setMessage("")
    const formData = new FormData(event.currentTarget)
    try {
      const result = await signIn("email", {
        email: formData.get("email"),
        callbackUrl: callbackUrl ?? window.location.href,
        redirect: false,
      })
      setMessage(
        result?.ok
          ? "Se o endereço for válido, você receberá um link para entrar."
          : "Não foi possível enviar o link. Tente novamente mais tarde.",
      )
    } catch {
      setMessage("Não foi possível enviar o link. Tente novamente mais tarde.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="w-full space-y-3" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="sign-in-email">Entrar com e-mail</Label>
        <Input
          id="sign-in-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          required
        />
      </div>
      <Button
        className="w-full"
        type="submit"
        variant="outline"
        disabled={pending}
      >
        {pending ? "Enviando link…" : "Enviar link de acesso"}
      </Button>
      {message && (
        <p className="text-muted-foreground text-sm" role="status">
          {message}
        </p>
      )}
    </form>
  )
}
