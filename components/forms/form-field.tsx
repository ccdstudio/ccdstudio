import type { ComponentProps, ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { cn } from "@/lib/utils"

type FieldProps = {
  id: string
  label: string
  required?: boolean
  hint?: string
  errors?: string[]
  className?: string
  children: ReactNode
}

/** Label + controle + dica + erro de validação, com acessibilidade ligada por id. */
export function Field({ id, label, required, hint, errors, className, children }: FieldProps) {
  const error = errors?.[0]
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] font-semibold text-foreground">
        {label}
        {required ? (
          <span aria-hidden className="text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-erro`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-dica`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  name: string
  label: string
  hint?: string
  errors?: string[]
  /** Classe do bloco do campo (ex.: `sm:col-span-2` numa grade). */
  fieldClassName?: string
  id?: string
}

/** Campo de texto padrão. `type="password"` ganha o botão de mostrar/ocultar. */
export function TextField({ name, label, hint, errors, required, fieldClassName, type, id, ...props }: TextFieldProps) {
  const fieldId = id ?? `campo-${name}`
  const inputProps = {
    id: fieldId,
    name,
    required,
    "aria-invalid": errors?.length ? true : undefined,
    "aria-describedby": errors?.length ? `${fieldId}-erro` : hint ? `${fieldId}-dica` : undefined,
    ...props,
  }
  return (
    <Field id={fieldId} label={label} required={required} hint={hint} errors={errors} className={fieldClassName}>
      {type === "password" ? <PasswordInput {...inputProps} /> : <Input type={type} {...inputProps} />}
    </Field>
  )
}

/** Mensagem geral do formulário (erro do servidor ou confirmação). */
export function FormMessage({ message, ok, className }: { message?: string; ok?: boolean; className?: string }) {
  if (!message) return null
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        ok ? "border-border bg-muted text-foreground" : "border-destructive/30 bg-destructive/10 text-destructive",
        className
      )}
    >
      {message}
    </p>
  )
}
