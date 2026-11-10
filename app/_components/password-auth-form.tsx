"use client"

import { FormEvent, useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { registerPasswordAccount } from "@/app/_actions/password-auth"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Label } from "@/app/_components/ui/label"

type AccountType = "CUSTOMER" | "BARBERSHOP"
type AuthAccountType = AccountType | "INVITATION"

export function PasswordAuthForm({
  accountType,
  callbackUrl,
}: {
  accountType: AuthAccountType
  callbackUrl?: string
}) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [invitationAccountType, setInvitationAccountType] =
    useState<AccountType>("CUSTOMER")
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setMessage("")
    setError("")
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "")
    const returnTo = callbackUrl ?? window.location.href

    try {
      if (mode === "register") {
        const result = await registerPasswordAccount(formData)
        if (!result.ok) {
          setError(result.error)
          return
        }

        const sent = await signIn("email", {
          email,
          callbackUrl: returnTo,
          redirect: false,
        })
        setMessage(
          sent?.ok
            ? "Se o endereço puder ser cadastrado, enviaremos um link para confirmar o e-mail e entrar."
            : "Não foi possível enviar o link de confirmação. Tente novamente mais tarde.",
        )
      } else {
        const result = await signIn("credentials", {
          email,
          password: formData.get("password"),
          accountType:
            accountType === "INVITATION" ? invitationAccountType : accountType,
          callbackUrl: returnTo,
          redirect: false,
        })
        if (!result?.ok) {
          setError("E-mail/senha inválidos ou e-mail ainda não confirmado.")
          return
        }
        window.location.assign(result.url ?? returnTo)
      }
    } catch {
      setError("Não foi possível concluir a solicitação. Tente novamente.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="w-full space-y-3">
      <form className="space-y-3" onSubmit={submit}>
        {mode === "register" && (
          <input
            type="hidden"
            name="accountType"
            value={accountType === "INVITATION" ? "CUSTOMER" : accountType}
          />
        )}
        {accountType === "INVITATION" && mode === "login" && (
          <div className="space-y-2">
            <Label htmlFor="invitation-account-type">Tipo da conta</Label>
            <select
              id="invitation-account-type"
              value={invitationAccountType}
              onChange={(event) =>
                setInvitationAccountType(event.target.value as AccountType)
              }
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="CUSTOMER">Cliente / profissional</option>
              <option value="BARBERSHOP">Conta de barbearia</option>
            </select>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor={`auth-email-${accountType}`}>E-mail</Label>
          <Input
            id={`auth-email-${accountType}`}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`auth-password-${accountType}`}>Senha</Label>
          <Input
            id={`auth-password-${accountType}`}
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            required
          />
          {mode === "register" && (
            <p className="text-muted-foreground text-xs">
              Use pelo menos 12 caracteres.
            </p>
          )}
        </div>
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
        <Button className="w-full" type="submit" disabled={pending}>
          {pending
            ? "Aguarde…"
            : mode === "register"
              ? "Criar conta e confirmar e-mail"
              : "Entrar com e-mail e senha"}
        </Button>
      </form>

      {mode === "login" && (
        <Link className="text-sm underline" href="/recuperar-senha">
          Esqueci minha senha
        </Link>
      )}
      <p className="text-muted-foreground text-center text-sm">
        {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
        <button
          className="text-foreground underline"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login")
            setError("")
            setMessage("")
          }}
        >
          {mode === "login" ? "Cadastre-se" : "Entrar"}
        </button>
      </p>
    </div>
  )
}
