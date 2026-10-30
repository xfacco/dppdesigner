import { notFound, redirect } from "next/navigation";
import { firstIncompleteStep } from "@/lib/wizard/engine";
import { getAccessibleJourney } from "@/server/journey";
import { loadWizard, toAnswers } from "@/server/wizard";

/** Porta al primo step da completare, o al riepilogo se il progetto è completo. */
export default async function JourneyEntry({ params }: { params: Promise<{ locale: string; journeyId: string }> }) {
  const { locale, journeyId } = await params;
  const journey = await getAccessibleJourney(journeyId);
  if (!journey) notFound();

  const def = await loadWizard(journey.versionId, locale);
  const step = firstIncompleteStep(def, toAnswers(journey.answers));
  redirect(`/${locale}/progetta/${journeyId}/${step ? step.key : "summary"}`);
}
