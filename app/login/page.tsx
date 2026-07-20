"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail } from "lucide-react";
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
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { loginSchema, type LoginValues } from "@/lib/auth-schemas";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"choice" | "email">("choice");

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <AuthLayout>
      {view === "choice" ? (
        <div className="flex flex-col">
          <AuthHeader eyebrow="Accesso" title="Bentornato" sub="Accedi al tuo account per continuare." />
          <SocialButtons />
          <AuthDivider />
          <Button type="button" variant="ghost" className="gap-2 text-muted-foreground" onClick={() => setView("email")}>
            <Mail className="size-4" /> Accedi con email
          </Button>
          <AuthFooter>
            Non hai un account? <AuthLink href="/registrazione">Registrati</AuthLink>
          </AuthFooter>
        </div>
      ) : (
        <div className="flex flex-col">
          <AuthBackButton onClick={() => setView("choice")} />
          <AuthHeader eyebrow="Accesso · Email" title="Accedi con email" sub="Inserisci le tue credenziali per continuare." />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => router.push("/"))} className="flex flex-col gap-3" noValidate>
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
                      <PasswordInput placeholder="••••••••" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="-mt-1 flex justify-end">
                <button type="button" className="font-mono text-xs font-semibold text-[#1E488F] hover:underline">
                  Password dimenticata?
                </button>
              </div>
              <Button type="submit" className="mt-1 h-11 gap-2 text-[15px]">
                Accedi <ArrowRight className="size-4" />
              </Button>
            </form>
          </Form>
          <AuthFooter>
            Non hai un account? <AuthLink href="/registrazione">Registrati</AuthLink>
          </AuthFooter>
        </div>
      )}
    </AuthLayout>
  );
}
