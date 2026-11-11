import { SignupFlow } from "./_components/signup-flow";
import { KIND_VALUES, type Kind } from "./_lib/signup-payload";

/* Demande d'accès. Le métier peut arriver dans l'URL (?role=hotel,
   etablissement, concierge ou influenceur), depuis une page métier : il est
   lu ici, côté serveur, pour que le formulaire soit dans la page dès le
   premier rendu, sans attendre le script. */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { role } = await searchParams;
  const initialKind = KIND_VALUES.find((k) => k === role) ?? null;
  return <SignupFlow initialKind={initialKind satisfies Kind | null} />;
}
