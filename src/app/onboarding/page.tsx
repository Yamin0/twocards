"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Crown,
  Users,
  Minus,
  Plus,
  Lightbulb,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const steps = [
  { number: 1, label: "Profil" },
  { number: 2, label: "Tables" },
  { number: 3, label: "Equipe" },
  { number: 4, label: "Lancement" },
];

export default function OnboardingPage() {
  const currentStep = 2;
  const [activeTab, setActiveTab] = useState<"rapide" | "personnalise">(
    "rapide"
  );

  const [vipCount, setVipCount] = useState(4);
  const [vipMinSpend, setVipMinSpend] = useState(500);
  const [standardCount, setStandardCount] = useState(8);
  const [standardMinSpend, setStandardMinSpend] = useState(200);

  const totalTables = vipCount + standardCount;
  const totalCapacity = vipCount * 6 + standardCount * 4;
  const potentialRevenue = vipCount * vipMinSpend + standardCount * standardMinSpend;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top bar */}
      <header className="bg-surface-card editorial-shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <span className="text-xl font-extrabold text-primary-dark font-[family-name:var(--font-nunito)] tracking-tight">
            twocards<span className="text-primary">.</span>
          </span>

          {/* Progress steps */}
          <nav className="hidden sm:flex items-center gap-2">
            {steps.map((step, i) => {
              const isCompleted = step.number < currentStep;
              const isActive = step.number === currentStep;
              return (
                <div key={step.number} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={`w-8 h-px ${
                        isCompleted ? "bg-primary" : "bg-surface-dim"
                      }`}
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold font-[family-name:var(--font-inter)] ${
                        isCompleted
                          ? "bg-primary text-white"
                          : isActive
                          ? "bg-primary text-white"
                          : "bg-surface-mid text-on-surface-variant"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={12} strokeWidth={2.5} />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`text-xs font-[family-name:var(--font-inter)] ${
                        isActive
                          ? "text-on-background font-medium"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Mobile step indicator */}
          <span className="sm:hidden text-xs font-medium text-on-surface-variant font-[family-name:var(--font-inter)]">
            Etape {currentStep} / {steps.length}
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex gap-6">
        {/* Main card */}
        <div className="flex-1">
          <div className="bg-surface-card rounded-md editorial-shadow p-6 sm:p-8">
            {/* Step label */}
            <span className="inline-block px-2.5 py-1 rounded-full bg-primary/5 text-primary text-xs font-medium font-[family-name:var(--font-inter)] mb-4">
              Etape 2 sur 4
            </span>

            <h1 className="text-xl font-bold text-primary-dark font-[family-name:var(--font-manrope)] mb-1">
              Configurez vos tables
            </h1>
            <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)] mb-6">
              Definissez le nombre de tables et les minimums de depense pour
              votre etablissement.
            </p>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-low rounded-sm p-1 mb-8 w-fit">
              <button
                onClick={() => setActiveTab("rapide")}
                className={`px-4 py-2 rounded-sm text-xs font-medium font-[family-name:var(--font-inter)] transition-colors cursor-pointer ${
                  activeTab === "rapide"
                    ? "bg-surface-card text-on-background editorial-shadow"
                    : "text-on-surface-variant hover:text-on-background"
                }`}
              >
                Configuration Rapide
              </button>
              <button
                onClick={() => setActiveTab("personnalise")}
                className={`px-4 py-2 rounded-sm text-xs font-medium font-[family-name:var(--font-inter)] transition-colors cursor-pointer ${
                  activeTab === "personnalise"
                    ? "bg-surface-card text-on-background editorial-shadow"
                    : "text-on-surface-variant hover:text-on-background"
                }`}
              >
                Plan Personnalise
              </button>
            </div>

            {activeTab === "rapide" && (
              <div className="space-y-6">
                {/* Two column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* VIP Tables */}
                  <div className="bg-surface-low rounded-sm p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center">
                        <Crown
                          size={16}
                          strokeWidth={1.5}
                          className="text-primary"
                        />
                      </div>
                      <h3 className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                        Tables VIP
                      </h3>
                    </div>

                    {/* Count */}
                    <div className="space-y-1.5">
                      <label className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                        Nombre de tables
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setVipCount(Math.max(0, vipCount - 1))
                          }
                          className="w-8 h-8 rounded-sm bg-surface-card flex items-center justify-center text-on-surface-variant hover:text-on-background transition-colors cursor-pointer"
                        >
                          <Minus size={14} strokeWidth={1.5} />
                        </button>
                        <span className="text-lg font-bold text-on-background font-[family-name:var(--font-manrope)] w-8 text-center">
                          {vipCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVipCount(vipCount + 1)}
                          className="w-8 h-8 rounded-sm bg-surface-card flex items-center justify-center text-on-surface-variant hover:text-on-background transition-colors cursor-pointer"
                        >
                          <Plus size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    {/* Min spend */}
                    <div className="space-y-1.5">
                      <label className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                        Minimum de depense
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-sm">
                          MAD
                        </span>
                        <input
                          type="number"
                          value={vipMinSpend}
                          onChange={(e) =>
                            setVipMinSpend(Number(e.target.value))
                          }
                          className="w-full pl-8 pr-4 py-2.5 bg-surface-card border-none rounded-sm text-sm text-on-background font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Standard Tables */}
                  <div className="bg-surface-low rounded-sm p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-sm bg-secondary-container/50 flex items-center justify-center">
                        <Users
                          size={16}
                          strokeWidth={1.5}
                          className="text-secondary"
                        />
                      </div>
                      <h3 className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                        Tables Standard
                      </h3>
                    </div>

                    {/* Count */}
                    <div className="space-y-1.5">
                      <label className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                        Nombre de tables
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setStandardCount(Math.max(0, standardCount - 1))
                          }
                          className="w-8 h-8 rounded-sm bg-surface-card flex items-center justify-center text-on-surface-variant hover:text-on-background transition-colors cursor-pointer"
                        >
                          <Minus size={14} strokeWidth={1.5} />
                        </button>
                        <span className="text-lg font-bold text-on-background font-[family-name:var(--font-manrope)] w-8 text-center">
                          {standardCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setStandardCount(standardCount + 1)}
                          className="w-8 h-8 rounded-sm bg-surface-card flex items-center justify-center text-on-surface-variant hover:text-on-background transition-colors cursor-pointer"
                        >
                          <Plus size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    {/* Min spend */}
                    <div className="space-y-1.5">
                      <label className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                        Minimum de depense
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-sm">
                          MAD
                        </span>
                        <input
                          type="number"
                          value={standardMinSpend}
                          onChange={(e) =>
                            setStandardMinSpend(Number(e.target.value))
                          }
                          className="w-full pl-8 pr-4 py-2.5 bg-surface-card border-none rounded-sm text-sm text-on-background font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary preview */}
                <div className="bg-surface-low rounded-sm p-5">
                  <h3 className="text-xs font-[family-name:var(--font-inter)] uppercase tracking-wider text-on-surface-variant mb-3">
                    Apercu de la configuration
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary-dark font-[family-name:var(--font-manrope)]">
                        {totalTables}
                      </p>
                      <p className="text-xs text-on-surface-variant font-[family-name:var(--font-inter)]">
                        Tables au total
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-dark font-[family-name:var(--font-manrope)]">
                        ~{totalCapacity}
                      </p>
                      <p className="text-xs text-on-surface-variant font-[family-name:var(--font-inter)]">
                        Capacite estimee
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-dark font-[family-name:var(--font-manrope)]">
                        {potentialRevenue.toLocaleString("fr-FR")} MAD
                      </p>
                      <p className="text-xs text-on-surface-variant font-[family-name:var(--font-inter)]">
                        Revenu potentiel / soir
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "personnalise" && (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)]">
                  L&apos;editeur de plan personnalise sera disponible
                  prochainement.
                </p>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between mt-8 pt-6">
              <Link
                href="#"
                className="flex items-center gap-1.5 text-sm text-on-surface-variant font-[family-name:var(--font-inter)] hover:text-on-background transition-colors"
              >
                <ArrowLeft size={14} strokeWidth={1.5} />
                Retour
              </Link>
              <Link
                href="#"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-sm text-sm font-semibold font-[family-name:var(--font-inter)] hover:bg-primary-dark transition-colors"
              >
                Continuer
                <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>

        {/* Floating aside — expert tip */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-surface-card rounded-md editorial-shadow p-5 sticky top-24">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb
                  size={16}
                  strokeWidth={1.5}
                  className="text-primary"
                />
              </div>
              <h3 className="text-sm font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
                Conseil d&apos;expert
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant font-[family-name:var(--font-inter)] leading-relaxed mb-3">
              Les etablissements qui configurent un ratio de 1 table VIP pour 2
              tables standard constatent un revenu par soiree 30% plus eleve.
            </p>
            <p className="text-xs text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
              Vous pourrez toujours modifier cette configuration plus tard
              depuis les parametres.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
