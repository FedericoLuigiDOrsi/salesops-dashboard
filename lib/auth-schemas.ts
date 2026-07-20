import { z } from "zod";

// Contratto di validazione Auth (prototipo mock — nessun backend).
// Fonte di design: public/mobile/maat-auth.html (flusso combo social-first).

export const emailSchema = z
  .string()
  .min(1, "L'email è obbligatoria")
  .email("Inserisci un'email valida");

// Regole password mostrate live durante la registrazione (dal combo di Marco).
export const passwordRules = [
  { key: "len", label: "Minimo 8 caratteri", test: (v: string) => v.length >= 8 },
  { key: "special", label: "Minimo un carattere speciale", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  { key: "upper", label: "Una maiuscola", test: (v: string) => /[A-Z]/.test(v) },
] as const;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La password è obbligatoria"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Inserisci il tuo nome e cognome"),
    email: emailSchema,
    password: z
      .string()
      .refine((v) => passwordRules.every((r) => r.test(v)), {
        message: "La password non rispetta i requisiti di sicurezza",
      }),
    confirm: z.string().min(1, "Conferma la password"),
    terms: z.boolean(),
  })
  .refine((d) => d.confirm === d.password, {
    path: ["confirm"],
    message: "Le password non coincidono",
  })
  .refine((d) => d.terms === true, {
    path: ["terms"],
    message: "Devi accettare i termini per continuare",
  });
export type RegisterValues = z.infer<typeof registerSchema>;
