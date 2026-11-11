import { redirect } from "next/navigation";

/* L'ancienne maquette d'accueil des établissements (statique, ancienne
   charte, jamais reliée à un compte) est retirée : la demande d'accès se
   fait sur /signup. L'adresse reste servie, par une redirection. */
export default function OnboardingPage() {
  redirect("/signup");
}
