"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setStatus(null);
    setIsError(false);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      setStatus("Acesso confirmado. Redirecionando...");
      router.push("/");
    } catch (error) {
      setIsError(true);
      setStatus(
        error instanceof Error ? error.message : "Nao foi possivel validar o acesso."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-crt text-phos font-mono flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="border-b border-rule pb-4 mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-[22px] leading-none uppercase tracking-tight">
              DM<span className="text-hazard animate-blink">▌</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-faint mt-1.5">
              Dashmarket-Pro · Acesso
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-faint border border-rule px-3 py-1.5 hover:border-muted hover:text-muted transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar
          </Link>
        </div>

        {/* Topbar label */}
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard mb-6">
          [AUTH] Autenticacao de operador
        </div>

        {/* Form */}
        <form className="grid gap-4" onSubmit={handleLogin}>
          <label className="grid gap-1.5 text-[11px] uppercase tracking-[0.1em] text-muted">
            E-mail
            <span className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-faint" />
              <input
                className="h-10 w-full bg-crt-2 border border-rule pl-9 pr-3 text-[12px] text-phos normal-case tracking-normal outline-none focus:border-hazard transition-colors"
                type="email"
                placeholder="usuario@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </span>
          </label>

          <label className="grid gap-1.5 text-[11px] uppercase tracking-[0.1em] text-muted">
            Senha
            <span className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-faint" />
              <input
                className="h-10 w-full bg-crt-2 border border-rule pl-9 pr-3 text-[12px] text-phos normal-case tracking-normal outline-none focus:border-hazard transition-colors"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </span>
          </label>

          <button
            className="mt-1 h-10 flex items-center justify-center gap-2 bg-phos text-crt text-[11px] uppercase tracking-[0.18em] font-semibold hover:bg-phos/90 transition-colors disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {isLoading ? "Validando..." : "Entrar"}
          </button>
        </form>

        {/* Status message */}
        {status && (
          <div
            className={`mt-4 px-4 py-3 border text-[11px] ${
              isError
                ? "border-hazard text-hazard bg-hazard/[0.06]"
                : "border-signal text-signal bg-signal/[0.06]"
            }`}
          >
            {isError ? "[ERR] " : "[OK] "}
            {status}
          </div>
        )}

        {/* Bottom status */}
        <div className="mt-8 border-t border-rule pt-4 text-[10px] uppercase tracking-[0.16em] text-faint flex justify-between">
          <span>DM-PRO · v2026.05</span>
          <span>Supabase Auth</span>
        </div>
      </div>
    </main>
  );
}
