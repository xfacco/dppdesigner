import Link from "next/link";
import { notFound } from "next/navigation";
import { ConditionEditor } from "@/components/admin/condition-editor";
import { ErrorFlash } from "@/components/admin/flash";
import { HelpPanel, SectionHelp } from "@/components/admin/help";
import {
  AreasHelp,
  ConditionHelp,
  DiagramConfigHelp,
  NotesHelp,
  RecommendationsHelp,
  RulesHelp,
  StepsHelp,
  VersionHelp,
} from "@/components/admin/wizard-help";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, Td, Th } from "@/components/ui/table";
import { db } from "@/lib/db";
import { describeCondition } from "@/lib/wizard/describe";
import { parseCondition } from "@/lib/wizard/rules";
import { toStepRefs } from "@/server/step-refs";
import { pickTranslation } from "@/server/wizard";
import {
  addStep,
  deleteArea,
  deleteRecommendation,
  deleteRule,
  deleteStep,
  moveStep,
  previewVersion,
  publishDraft,
  resetDiagramConfig,
  saveArea,
  saveDiagramConfig,
  saveRecommendation,
  saveRule,
  updateVersionNotes,
} from "../actions";
import { DEFAULT_DIAGRAM_CONFIG, resolveDiagramConfig, STEP_ROLE_LABELS } from "@/lib/diagrams/config";

const TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "Scelta singola",
  MULTI_CHOICE: "Scelta multipla",
  NUMBER: "Numero",
  TEXT: "Testo",
  FIELDS: "Gruppo di campi",
  MATRIX: "Griglia per categorie",
};

export default async function VersionPage({
  params,
  searchParams,
}: {
  params: Promise<{ versionId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ versionId }, { error }] = await Promise.all([params, searchParams]);
  const version = await db.wizardVersion.findUnique({
    where: { id: versionId },
    include: {
      steps: {
        orderBy: { position: "asc" },
        include: { translations: true, options: { orderBy: { position: "asc" }, include: { translations: true } } },
      },
      areas: { orderBy: { position: "asc" }, include: { translations: true } },
      scoringRules: { include: { area: true }, orderBy: { areaId: "asc" } },
      recommendations: { orderBy: { priority: "desc" }, include: { translations: true } },
    },
  });
  if (!version) notFound();

  const editable = version.status === "DRAFT";
  const refs = toStepRefs(version.steps);
  const diagramCfg = resolveDiagramConfig(version.diagramConfig);
  const label = (list: { locale: string; label: string }[], fallback: string) => pickTranslation(list, "it")?.label ?? fallback;

  return (
    <div className="grid gap-8">
      <div>
        <PageHeader
          title={`Wizard v${version.number}`}
          description={
            editable
              ? "Bozza: le modifiche non sono visibili agli utenti finché non pubblichi."
              : "Versione in sola lettura. Per modificare il wizard crea una nuova bozza."
          }
          actions={
            <>
              <Link href="/admin/wizard" className="text-sm text-muted-foreground hover:underline self-center">
                ← Versioni
              </Link>
              {(["it", "en"] as const).map((l) => (
                <form key={l} action={previewVersion.bind(null, version.id, l)} target="_blank">
                  <Button type="submit" variant="outline">
                    Prova {editable ? "la bozza" : "la versione"} ({l.toUpperCase()}) ↗
                  </Button>
                </form>
              ))}
              {editable && (
                <form action={publishDraft.bind(null, version.id)}>
                  <Button type="submit">Pubblica questa versione</Button>
                </form>
              )}
            </>
          }
        />
        <ErrorFlash error={error} />
        <HelpPanel>
          <VersionHelp />
        </HelpPanel>
        {editable && (
          <>
            <form action={updateVersionNotes.bind(null, version.id)} className="flex flex-wrap gap-2">
              <Input name="notes" defaultValue={version.notes ?? ""} placeholder="Note sulla versione" className="max-w-md" />
              <Button type="submit" variant="outline">
                Salva note
              </Button>
            </form>
            <div className="mt-2">
              <SectionHelp label="A cosa servono le note">
                <NotesHelp />
              </SectionHelp>
            </div>
          </>
        )}
      </div>

      {/* ─── Step ─── */}
      <Card>
        <CardTitle className="mb-2">Step ({version.steps.length})</CardTitle>
        <SectionHelp>
          <StepsHelp />
        </SectionHelp>
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Step</Th>
              <Th>Tipo</Th>
              <Th>Visibile se</Th>
              <Th>Traduzioni</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {version.steps.map((s, i) => (
              <tr key={s.id}>
                <Td className="tabular-nums text-muted-foreground">{i + 1}</Td>
                <Td>
                  <Link href={`/admin/wizard/${version.id}/steps/${s.id}`} className="font-medium hover:underline">
                    {pickTranslation(s.translations, "it")?.title ?? s.key}
                  </Link>
                  <span className="block font-mono text-xs text-muted-foreground">{s.key}</span>
                </Td>
                <Td className="whitespace-nowrap">
                  {TYPE_LABELS[s.type]}
                  {s.options.length > 0 && <span className="text-muted-foreground"> · {s.options.length} opzioni</span>}
                </Td>
                <Td className="max-w-64 text-xs text-muted-foreground">{describeCondition(parseCondition(s.visibleIf))}</Td>
                <Td>
                  {["it", "en"].map((l) => (
                    <Badge key={l} tone={s.translations.some((t) => t.locale === l) ? "primary" : "warning"} className="mr-1 uppercase">
                      {l}
                    </Badge>
                  ))}
                  {s.translations.some((t) => t.references) && <Badge className="ml-1">norme</Badge>}
                </Td>
                <Td className="whitespace-nowrap text-right">
                  {editable && (
                    <div className="flex justify-end gap-1">
                      <form action={moveStep.bind(null, s.id, "up")}>
                        <Button size="icon" variant="ghost" aria-label="Sposta su" disabled={i === 0}>
                          ↑
                        </Button>
                      </form>
                      <form action={moveStep.bind(null, s.id, "down")}>
                        <Button size="icon" variant="ghost" aria-label="Sposta giù" disabled={i === version.steps.length - 1}>
                          ↓
                        </Button>
                      </form>
                      <form action={deleteStep.bind(null, s.id)}>
                        <Button size="icon" variant="ghost" className="text-destructive" aria-label="Elimina step">
                          ✕
                        </Button>
                      </form>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {editable && (
          <form action={addStep.bind(null, version.id)} className="mt-6 grid gap-3 border-t pt-6 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            <Field>
              <Label htmlFor="new-key">Chiave</Label>
              <Input id="new-key" name="key" placeholder="es. data_sources" required pattern="[a-z][a-z0-9_]*" />
            </Field>
            <Field>
              <Label htmlFor="new-title">Titolo (IT)</Label>
              <Input id="new-title" name="title" />
            </Field>
            <Field>
              <Label htmlFor="new-type">Tipo</Label>
              <Select id="new-type" name="type">
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Aggiungi step</Button>
          </form>
        )}
      </Card>

      {/* ─── Aree di punteggio ─── */}
      <Card>
        <CardTitle className="mb-1">Aree di maturità</CardTitle>
        <p className="mb-2 text-sm text-muted-foreground">
          Punteggio area = somma dei punti delle regole soddisfatte, limitata a [0, punti massimi]. Totale = media delle aree pesata.
        </p>
        <SectionHelp>
          <AreasHelp />
        </SectionHelp>
        <div className="grid gap-3">
          {[...version.areas, null].map((a) =>
            !a && !editable ? null : (
              <form
                key={a?.id ?? "new"}
                action={saveArea.bind(null, version.id, a?.id ?? null)}
                className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1.5fr_1.5fr_6rem_6rem_auto_auto] sm:items-end"
              >
                <Field>
                  <Label className="text-xs">Chiave</Label>
                  <Input name="key" defaultValue={a?.key} required disabled={!editable} />
                </Field>
                <Field>
                  <Label className="text-xs">Etichetta IT</Label>
                  <Input name="label_it" defaultValue={a ? label(a.translations.filter((t) => t.locale === "it"), "") : ""} disabled={!editable} />
                </Field>
                <Field>
                  <Label className="text-xs">Etichetta EN</Label>
                  <Input name="label_en" defaultValue={a ? label(a.translations.filter((t) => t.locale === "en"), "") : ""} disabled={!editable} />
                </Field>
                <Field>
                  <Label className="text-xs">Peso</Label>
                  <Input name="weight" type="number" step="0.1" min="0.1" defaultValue={a?.weight ?? 1} disabled={!editable} />
                </Field>
                <Field>
                  <Label className="text-xs">Punti max</Label>
                  <Input name="maxPoints" type="number" min="1" defaultValue={a?.maxPoints ?? 10} required disabled={!editable} />
                </Field>
                {editable && (
                  <Button type="submit" variant={a ? "outline" : "default"}>
                    {a ? "Salva" : "Aggiungi area"}
                  </Button>
                )}
                {editable && a && (
                  <Button formAction={deleteArea.bind(null, version.id, a.id)} variant="ghost" className="text-destructive">
                    Elimina
                  </Button>
                )}
              </form>
            ),
          )}
        </div>
      </Card>

      {/* ─── Regole di punteggio ─── */}
      <Card>
        <CardTitle className="mb-1">Regole di punteggio</CardTitle>
        <p className="mb-2 text-sm text-muted-foreground">
          Regole di esempio, da validare. Ogni regola assegna punti (anche negativi) a un&apos;area quando la condizione è vera.
        </p>
        <SectionHelp>
          <RulesHelp />
          <ConditionHelp />
        </SectionHelp>
        {version.areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crea prima un&apos;area di maturità.</p>
        ) : (
          <div className="grid gap-3">
            {[...version.scoringRules, null].map((r) =>
              !r && !editable ? null : (
                <details key={r?.id ?? "new"} className="rounded-md border p-3" open={!r && version.scoringRules.length === 0}>
                  <summary className="cursor-pointer text-sm">
                    {r ? (
                      <>
                        <Badge tone="primary" className="mr-2">
                          {r.area.key}
                        </Badge>
                        <span className="font-medium tabular-nums">{r.points > 0 ? `+${r.points}` : r.points}</span>
                        <span className="ml-2 text-muted-foreground">se {describeCondition(parseCondition(r.condition))}</span>
                        {r.note && <span className="ml-2 italic text-muted-foreground">— {r.note}</span>}
                      </>
                    ) : (
                      <span className="font-medium">+ Nuova regola</span>
                    )}
                  </summary>
                  <form action={saveRule.bind(null, version.id, r?.id ?? null)} className="mt-3 grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_8rem_2fr]">
                      <Field>
                        <Label className="text-xs">Area</Label>
                        <Select name="areaId" defaultValue={r?.areaId} disabled={!editable}>
                          {version.areas.map((a) => (
                            <option key={a.id} value={a.id}>
                              {label(a.translations, a.key)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field>
                        <Label className="text-xs">Punti</Label>
                        <Input name="points" type="number" defaultValue={r?.points ?? 1} required disabled={!editable} />
                      </Field>
                      <Field>
                        <Label className="text-xs">Nota interna</Label>
                        <Input name="note" defaultValue={r?.note ?? ""} disabled={!editable} />
                      </Field>
                    </div>
                    <ConditionEditor name="condition" initial={r ? parseCondition(r.condition) : null} steps={refs} emptyLabel="Aggiungi almeno una condizione." />
                    {editable && (
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          Salva regola
                        </Button>
                        {r && (
                          <Button formAction={deleteRule.bind(null, version.id, r.id)} size="sm" variant="ghost" className="text-destructive">
                            Elimina
                          </Button>
                        )}
                      </div>
                    )}
                  </form>
                </details>
              ),
            )}
          </div>
        )}
      </Card>

      {/* ─── Raccomandazioni ─── */}
      <Card>
        <CardTitle className="mb-1">Raccomandazioni</CardTitle>
        <p className="mb-2 text-sm text-muted-foreground">
          Mostrate nella pagina di riepilogo quando la condizione è vera, in ordine di priorità (più alta prima).
        </p>
        <SectionHelp>
          <RecommendationsHelp />
          <ConditionHelp />
        </SectionHelp>
        <div className="grid gap-3">
          {[...version.recommendations, null].map((rec) => {
            if (!rec && !editable) return null;
            const it = rec?.translations.find((t) => t.locale === "it");
            const en = rec?.translations.find((t) => t.locale === "en");
            return (
              <details key={rec?.id ?? "new"} className="rounded-md border p-3">
                <summary className="cursor-pointer text-sm">
                  {rec ? (
                    <>
                      <Badge className="mr-2">P{rec.priority}</Badge>
                      <span className="font-medium">{it?.title ?? en?.title}</span>
                      <span className="ml-2 text-muted-foreground">se {describeCondition(parseCondition(rec.condition))}</span>
                    </>
                  ) : (
                    <span className="font-medium">+ Nuova raccomandazione</span>
                  )}
                </summary>
                <form action={saveRecommendation.bind(null, version.id, rec?.id ?? null)} className="mt-3 grid gap-3">
                  <Field className="max-w-32">
                    <Label className="text-xs">Priorità</Label>
                    <Input name="priority" type="number" defaultValue={rec?.priority ?? 0} disabled={!editable} />
                  </Field>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {(["it", "en"] as const).map((l) => {
                      const t = l === "it" ? it : en;
                      return (
                        <div key={l} className="grid gap-2">
                          <Label className="text-xs uppercase">{l}</Label>
                          <Input name={`title_${l}`} defaultValue={t?.title} placeholder="Titolo" disabled={!editable} />
                          <Textarea name={`body_${l}`} defaultValue={t?.body} placeholder="Testo" rows={3} disabled={!editable} />
                        </div>
                      );
                    })}
                  </div>
                  <ConditionEditor name="condition" initial={rec ? parseCondition(rec.condition) : null} steps={refs} emptyLabel="Aggiungi almeno una condizione." />
                  {editable && (
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Salva raccomandazione
                      </Button>
                      {rec && (
                        <Button formAction={deleteRecommendation.bind(null, version.id, rec.id)} size="sm" variant="ghost" className="text-destructive">
                          Elimina
                        </Button>
                      )}
                    </div>
                  )}
                </form>
              </details>
            );
          })}
        </div>
      </Card>

      {/* ─── Schemi del riepilogo ─── */}
      <Card>
        <CardTitle className="mb-1">Schemi del riepilogo</CardTitle>
        <p className="mb-2 text-sm text-muted-foreground">
          Quali step alimentano gli schemi &quot;Flusso dei dati&quot; e &quot;Blueprint del DPP&quot;.{" "}
          {version.diagramConfig ? "Configurazione personalizzata." : "Configurazione predefinita."}
        </p>
        <SectionHelp>
          <DiagramConfigHelp />
        </SectionHelp>
        <div className="mb-4 overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Parte dello schema</Th>
                <Th>Step</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(STEP_ROLE_LABELS).map(([role, label]) => {
                const key = diagramCfg.steps[role as keyof typeof diagramCfg.steps];
                const found = version.steps.find((s) => s.key === key);
                return (
                  <tr key={role}>
                    <Td>{label}</Td>
                    <Td>
                      <span className="font-mono text-xs">{key}</span>
                      {found ? (
                        <span className="ml-2 text-muted-foreground">{pickTranslation(found.translations, "it")?.title}</span>
                      ) : (
                        <Badge tone="warning" className="ml-2">
                          step mancante: questa parte resta &quot;Da definire&quot;
                        </Badge>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
        <h3 className="mb-2 text-sm font-semibold">Blueprint del DPP: aree</h3>
        <div className="mb-4 overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Area</Th>
                <Th>Step (in ordine)</Th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const titleOf = (key: string) => {
                  const s = version.steps.find((x) => x.key === key);
                  return s ? (pickTranslation(s.translations, "it")?.title ?? key) : null;
                };
                const assigned = new Set(diagramCfg.blueprint.sections.flatMap((s) => s.steps));
                const unassigned = version.steps.map((s) => s.key).filter((k) => !assigned.has(k));
                return [...diagramCfg.blueprint.sections, { key: "other", steps: unassigned }].map((sec) => (
                  <tr key={sec.key}>
                    <Td className="font-mono text-xs">{sec.key}</Td>
                    <Td>
                      {sec.steps.length === 0 && <span className="text-muted-foreground">—</span>}
                      <ul className="grid gap-0.5">
                        {sec.steps.map((k) => (
                          <li key={k}>
                            <span className="font-mono text-xs">{k}</span>{" "}
                            {titleOf(k) ? (
                              <span className="text-muted-foreground">{titleOf(k)}</span>
                            ) : (
                              <Badge tone="warning">step non presente in questa versione</Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </Td>
                  </tr>
                ));
              })()}
            </tbody>
          </Table>
        </div>
        <form action={saveDiagramConfig.bind(null, version.id)} className="grid gap-3">
          <fieldset disabled={!editable} className="grid gap-3">
            <Label htmlFor="diagramConfig">Configurazione (JSON)</Label>
            <Textarea
              id="diagramConfig"
              name="diagramConfig"
              rows={14}
              className="font-mono text-xs"
              defaultValue={JSON.stringify(version.diagramConfig ?? DEFAULT_DIAGRAM_CONFIG, null, 2)}
            />
          </fieldset>
          {editable && (
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Salva configurazione
              </Button>
              {version.diagramConfig !== null && (
                <Button formAction={resetDiagramConfig.bind(null, version.id)} size="sm" variant="ghost">
                  Ripristina predefinita
                </Button>
              )}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
