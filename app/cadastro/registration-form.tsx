"use client"

import { useActionState } from "react"
import { signIn } from "next-auth/react"
import { registerBarbershop } from "@/app/_actions/register-barbershop"
import { Button } from "@/app/_components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Label } from "@/app/_components/ui/label"

const fields: {
  name: "name" | "slug" | "address" | "phone"
  label: string
  type: string
  autoComplete: string
  placeholder?: string
  hint?: string
}[] = [
  {
    name: "name",
    label: "Nome da barbearia",
    type: "text",
    autoComplete: "organization",
  },
  {
    name: "slug",
    label: "Endereço da barbearia",
    type: "text",
    autoComplete: "off",
    placeholder: "minha-barbearia",
    hint: "Use letras minúsculas, números e hífens.",
  },
  {
    name: "address",
    label: "Endereço",
    type: "text",
    autoComplete: "street-address",
  },
  {
    name: "phone",
    label: "Telefone com DDD",
    type: "tel",
    autoComplete: "tel",
    placeholder: "(11) 99999-9999",
  },
] as const

export default function RegistrationForm({
  authenticated,
}: {
  authenticated: boolean
}) {
  const [state, action, pending] = useActionState(registerBarbershop, {})

  if (!authenticated) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Entre para criar sua barbearia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Use sua conta Google para continuar com o cadastro.
          </p>
          <Button
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/cadastro" })}
          >
            Continuar com Google
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Criar sua barbearia</CardTitle>
        <p className="text-muted-foreground text-sm">
          Configure os dados básicos para entrar no painel.
        </p>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          {fields.map(({ name, label, hint, ...props }) => {
            const error = state.fieldErrors?.[name]
            return (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  name={name}
                  required
                  aria-invalid={!!error}
                  aria-describedby={
                    error ? `${name}-error` : hint ? `${name}-hint` : undefined
                  }
                  {...props}
                />
                {hint && (
                  <p
                    id={`${name}-hint`}
                    className="text-muted-foreground text-xs"
                  >
                    {hint}
                  </p>
                )}
                {error && (
                  <p
                    id={`${name}-error`}
                    className="text-destructive text-sm"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>
            )
          })}
          {state.error && (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          )}
          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? "Criando barbearia…" : "Criar barbearia"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
