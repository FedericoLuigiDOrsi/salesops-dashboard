"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Mail } from "lucide-react";
import {
  AuthLayout,
  AuthHeader,
  AuthDivider,
  AuthFooter,
  AuthLink,
  AuthBackButton,
  AuthFieldLabel,
} from "@/components/maat/AuthLayout";
import { SocialButtons } from "@/components/maat/SocialButtons";
import { PasswordInput } from "@/components/maat/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { registerSchema, passwordRules, type RegisterValues } from "@/lib/auth-schemas";

export default function RegistrazionePage() {
  const router = useRouter();
  const [view, setView] = useState<"choice" | "email">("choice");

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirm: "", terms: false },
  });

  const passwordValue = form.watch("password") ?? "";

  return (
    <AuthLayout>
      {view === "choice" ? (
        <div className="flex flex-col">
          <AuthHeader eyebrow="Crea account" title="Iniziamo" sub="Registrati per iniziare a gestire il tuo catalogo." />
          <SocialButtons />
          <AuthDivider />
          <Button type="button" variant="ghost" className="gap-2 text-muted-foreground" onClick={() => setView("email")}>
            <Mail className="size-4" /> Crea account con email
          </Button>
          <AuthFooter>
            Hai già un account? <AuthLink href="/login">Accedi</AuthLink>
          </AuthFooter>
        </div>
      ) : (
        <div className="flex flex-col">
          <AuthBackButton onClick={() => setView("choice")} />
          <AuthHeader eyebrow="Crea account · Email" title="Crea il tuo account" sub="Inserisci i tuoi dati per registrarti con l'email." />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => router.push("/onboarding?step=browser"))} className="flex flex-col gap-3" noValidate>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <AuthFieldLabel>Nome e cognome</AuthFieldLabel>
                    <FormControl>
                      <Input placeholder="Mario Rossi" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <AuthFieldLabel>Email</AuthFieldLabel>
                    <FormControl>
                      <Input type="email" placeholder="nome@azienda.it" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <AuthFieldLabel>Password</AuthFieldLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" autoComplete="new-password" {...field} />
                    </FormControl>
                    <ul className="mt-1 grid gap-1.5">
                      {passwordRules.map((rule) => {
                        const ok = rule.test(passwordValue);
                        return (
                          <li
                            key={rule.key}
                            className={cn("flex items-center gap-2 text-xs transition-colors", ok ? "text-success" : "text-muted-foreground")}
                          >
                            <span
                              className={cn(
                                "flex size-3.5 items-center justify-center rounded-full border transition-colors",
                                ok ? "border-success bg-success text-white" : "border-muted-foreground/40"
                              )}
                            >
                              {ok && <Check className="size-2.5" strokeWidth={3.5} />}
                            </span>
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <AuthFieldLabel>Conferma password</AuthFieldLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="mt-1">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(c) => field.onChange(c === true)}
                        className="mt-0.5"
                        aria-label="Accetto i termini e la privacy"
                      />
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        Accetto i{" "}
                        <button type="button" className="font-semibold text-foreground underline-offset-2 hover:underline">
                          Termini
                        </button>{" "}
                        e la{" "}
                        <button type="button" className="font-semibold text-foreground underline-offset-2 hover:underline">
                          Privacy
                        </button>
                        .
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="mt-1 h-11 gap-2 text-[15px]">
                Crea account <ArrowRight className="size-4" />
              </Button>
            </form>
          </Form>
          <AuthFooter>
            Hai già un account? <AuthLink href="/login">Accedi</AuthLink>
          </AuthFooter>
        </div>
      )}
    </AuthLayout>
  );
}
