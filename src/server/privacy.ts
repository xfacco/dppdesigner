import "server-only";
import { db } from "@/lib/db";

/** Cancella account e dati personali; i progetti restano nel DB scollegati (anonimi). */
export async function deleteUserData(userId: string) {
  // journeys.userId → SET NULL; sessioni, account e consensi → CASCADE
  await db.user.delete({ where: { id: userId } });
}

export async function exportUserData(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      company: true,
      jobTitle: true,
      phone: true,
      locale: true,
      createdAt: true,
      lastSeenAt: true,
      consents: { select: { type: true, granted: true, policyVersion: true, createdAt: true } },
      journeys: {
        select: {
          id: true,
          status: true,
          score: true,
          areaScores: true,
          createdAt: true,
          completedAt: true,
          // Anche i progetti eliminati dall'account restano conservati: vanno inclusi nell'export
          hiddenByUserAt: true,
          answers: { select: { stepKey: true, value: true, updatedAt: true } },
          questions: {
            select: { stepKey: true, channel: true, question: true, answer: true, createdAt: true, answeredAt: true },
          },
        },
      },
    },
  });
}
