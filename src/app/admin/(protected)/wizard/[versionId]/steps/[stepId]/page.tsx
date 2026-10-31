import Link from "next/link";
import { notFound } from "next/navigation";
import { ConditionEditor } from "@/components/admin/condition-editor";
import { ErrorFlash } from "@/components/admin/flash";
import { HelpPanel, SectionHelp } from "@/components/admin/help";
import {
  ConfigHelp,
  OptionsHelp,
  ReferencesHelp,
  StepBasicsHelp,
  StepEditorHelp,
  StepTextsHelp,
  SuggestionsHelp,
  VisibilityHelp,
} from "@/components/admin/wizard-help";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { db } from "@/lib/db";
import { parseCondition } from "@/lib/wizard/rules";
import { toStepRefs } from "@/server/step-refs";
import { Badge } from "@/components/ui/card";
import { describeCondition } from "@/lib/wizard/describe";
import {
  addOption,
  deleteOption,
  deleteSuggestion,
  moveOption,
  saveSuggestion,
  updateOption,
  updateStep,
} from "../../../actions";

const CONFIG_HELP: Record<string, string> = {
  NUMBER: '{ "min": 1, "max": 100000 }',
  TEXT: '{ "maxLength": 200 }',
  FIELDS:
    '{ "fields": [ { "key": "name", "type": "text", "required": true, "label": { "it": "Nome prodotto", "en": "Product name" } } ] }',
  MATRIX: '{ "rowsFrom": "product_categories" }',
};

export default async function StepEditor({
  params,
  searchParams,
}: {
  params: Promise<{ versionId: string; stepId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ versionId, stepId }, { error }] = await Promise.all([params, searchParams]);
  const step = await db.step.findUnique({
    where: { id: stepId },
    include: {
      version: true,
      translations: true,
      options: { orderBy: { position: "asc" }, include: { translations: true } },
      suggestions: { orderBy: { priority: "desc" }, include: { translations: true } },
    },
  });
  if (!step || step.versionId !== versionId) notFound();

  const editable = step.version.status === "DRAFT";
  // Le condizioni possono riferirsi solo agli step precedenti
  const previous = await db.step.findMany({
    where: { versionId, position: { lt: step.position } },
    orderBy: { position: "asc" },
    include: { translations: true, options: { orderBy: { position: "asc" }, include: { translations: true } } },
  });
  const refs = toStepRefs(previous);
  const tr = (l: string) => step.translations.find((t) => t.locale === l);
  // Nelle griglie le opzioni sono le colonne
  const hasOptions = step.type === "SINGLE_CHOICE" || step.type === "MULTI_CHOICE" || step.type === "MATRIX";

  return (
    <div className="grid gap-8">
      <div>
        <PageHeader
          title={tr("it")?.title ?? step.key}
          description={<span className="font-mono">{step.key}</span>}
          actions={
            <Link href={`/admin/wizard/${versionId}`} className="text-sm text-muted-foreground hover:underline">
              ← Wizard v{step.version.number}
            </Link>
          }
        />
        <ErrorFlash error={error} />
        <HelpPanel>
          <StepEditorHelp />
        </HelpPanel>
      </div>

      <Card>
        <form action={updateStep.bind(null, step.id)} className="grid gap-6">
          <fieldset disabled={!editable} className="grid gap-6">
            <div className="-mb-4">
              <SectionHelp label="Aiuto: chiave, tipo, obbligatorio">
                <StepBasicsHelp />
              </SectionHelp>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <Label htmlFor="key">Chiave</Label>
                <Input id="key" name="key" defaultValue={step.key} required />
              </Field>
              <Field>
                <Label htmlFor="type">Tipo</Label>
                <Select id="type" name="type" defaultValue={step.type}>
                  <option value="SINGLE_CHOICE">Scelta singola</option>
                  <option value="MULTI_CHOICE">Scelta multipla</option>
                  <option value="NUMBER">Numero</option>
                  <option value="TEXT">Testo</option>
                  <option value="FIELDS">Gruppo di campi</option>
                  <option value="MATRIX">Griglia per categorie</option>
                </Select>
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <Checkbox name="required" defaultChecked={step.required} />
                Obbligatorio
              </label>
            </div>

            <div className="-mb-4 border-t pt-6">
              <SectionHelp label="Aiuto: testi della domanda">
                <StepTextsHelp />
              </SectionHelp>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {(["it", "en"] as const).map((l) => (
                <div key={l} className="grid gap-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{l === "it" ? "Italiano" : "English"}</p>
                  <Field>
                    <Label htmlFor={`title_${l}`}>Domanda</Label>
                    <Input id={`title_${l}`} name={`title_${l}`} defaultValue={tr(l)?.title} required={l === "it"} />
                  </Field>
                  <Field>
                    <Label htmlFor={`description_${l}`}>Descrizione</Label>
                    <Textarea id={`description_${l}`} name={`description_${l}`} defaultValue={tr(l)?.description ?? ""} rows={2} />
                  </Field>
                  <Field>
                    <Label htmlFor={`help_${l}`}>Testo di aiuto</Label>
                    <Textarea id={`help_${l}`} name={`help_${l}`} defaultValue={tr(l)?.help ?? ""} rows={2} />
                  </Field>
                </div>
              ))}
            </div>

            <div className="grid gap-3 border-t pt-6">
              <Label>Riferimenti normativi (Markdown, facoltativi)</Label>
              <SectionHelp label="Aiuto: riferimenti normativi">
                <ReferencesHelp />
              </SectionHelp>
              <div className="grid gap-6 lg:grid-cols-2">
                {(["it", "en"] as const).map((l) => (
                  <Field key={l}>
                    <Label htmlFor={`references_${l}`} className="text-xs uppercase text-muted-foreground">
                      {l === "it" ? "Italiano" : "English"}
                    </Label>
                    <Textarea
                      id={`references_${l}`}
                      name={`references_${l}`}
                      defaultValue={tr(l)?.references ?? ""}
                      rows={8}
                      className="font-mono text-xs"
                      placeholder="- [Regolamento (UE) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj): …"
                    />
                  </Field>
                ))}
              </div>
            </div>

            <Field className="border-t pt-6">
              <Label htmlFor="config">Configurazione (JSON, facoltativa)</Label>
              <SectionHelp label="Aiuto: configurazione">
                <ConfigHelp />
              </SectionHelp>
              <Textarea
                id="config"
                name="config"
                className="font-mono text-xs"
                rows={4}
                defaultValue={step.config ? JSON.stringify(step.config, null, 2) : ""}
              />
              <p className="text-xs text-muted-foreground">
                Esempi — Numero: <code>{CONFIG_HELP.NUMBER}</code> · Testo: <code>{CONFIG_HELP.TEXT}</code> · Gruppo di campi:{" "}
                <code>{CONFIG_HELP.FIELDS}</code> · Griglia per categorie: <code>{CONFIG_HELP.MATRIX}</code>
              </p>
            </Field>

            <div className="grid gap-2 border-t pt-6">
              <Label>Visibile se</Label>
              <SectionHelp label="Aiuto: visibilità e condizioni">
                <VisibilityHelp />
              </SectionHelp>
              {refs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Primo step: sempre visibile.</p>
              ) : (
                <ConditionEditor name="visibleIf" initial={parseCondition(step.visibleIf)} steps={refs} />
              )}
            </div>
          </fieldset>
          {editable && (
            <div>
              <Button type="submit">Salva step</Button>
            </div>
          )}
        </form>
      </Card>

      {hasOptions && (
        <Card>
          <CardTitle className="mb-2">Opzioni ({step.options.length})</CardTitle>
          <SectionHelp>
            <OptionsHelp />
          </SectionHelp>
          <div className="grid gap-3">
            {step.options.map((o, i) => {
              const ot = (l: string) => o.translations.find((t) => t.locale === l);
              return (
                <details key={o.id} className="rounded-md border p-3">
                  <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                    <span>
                      <span className="font-medium">{ot("it")?.label ?? o.key}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{o.key}</span>
                      {!ot("en") && <span className="ml-2 text-xs text-warning">manca EN</span>}
                      {o.visibleIf !== null && <span className="ml-2 text-xs text-muted-foreground">condizionale</span>}
                    </span>
                    {editable && (
                      <span className="flex gap-1">
                        <Button formAction={moveOption.bind(null, o.id, "up")} form={`opt-${o.id}`} size="icon" variant="ghost" disabled={i === 0} aria-label="Sposta su">
                          ↑
                        </Button>
                        <Button formAction={moveOption.bind(null, o.id, "down")} form={`opt-${o.id}`} size="icon" variant="ghost" disabled={i === step.options.length - 1} aria-label="Sposta giù">
                          ↓
                        </Button>
                      </span>
                    )}
                  </summary>
                  <form id={`opt-${o.id}`} action={updateOption.bind(null, o.id)} className="mt-3 grid gap-3">
                    <fieldset disabled={!editable} className="grid gap-3">
                      <Field className="max-w-xs">
                        <Label className="text-xs">Chiave</Label>
                        <Input name="key" defaultValue={o.key} required />
                      </Field>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {(["it", "en"] as const).map((l) => (
                          <div key={l} className="grid gap-2">
                            <Label className="text-xs uppercase">{l}</Label>
                            <Input name={`label_${l}`} defaultValue={ot(l)?.label} placeholder="Etichetta" />
                            <Textarea
                              name={`description_${l}`}
                              defaultValue={ot(l)?.description ?? ""}
                              rows={2}
                              placeholder="Descrizione (facoltativa): Markdown, a capo con Invio"
                            />
                          </div>
                        ))}
                      </div>
                      {refs.length > 0 && (
                        <div className="grid gap-2">
                          <Label className="text-xs">Opzione visibile se</Label>
                          <ConditionEditor name="visibleIf" initial={parseCondition(o.visibleIf)} steps={refs} />
                        </div>
                      )}
                    </fieldset>
                    {editable && (
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          Salva opzione
                        </Button>
                        <Button formAction={deleteOption.bind(null, o.id)} size="sm" variant="ghost" className="text-destructive">
                          Elimina
                        </Button>
                      </div>
                    )}
                  </form>
                </details>
              );
            })}
          </div>
          {editable && (
            <form action={addOption.bind(null, step.id)} className="mt-6 grid gap-3 border-t pt-6 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
              <Field>
                <Label htmlFor="opt-key">Chiave</Label>
                <Input id="opt-key" name="key" required pattern="[a-z][a-z0-9_]*" />
              </Field>
              <Field>
                <Label htmlFor="opt-it">Etichetta IT</Label>
                <Input id="opt-it" name="label_it" required />
              </Field>
              <Field>
                <Label htmlFor="opt-en">Etichetta EN</Label>
                <Input id="opt-en" name="label_en" />
              </Field>
              <Button type="submit">Aggiungi opzione</Button>
            </form>
          )}
        </Card>
      )}

      <Card>
        <CardTitle className="mb-2">Suggerimenti ({step.suggestions.length})</CardTitle>
        <SectionHelp>
          <SuggestionsHelp />
        </SectionHelp>
        {refs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Primo step: i suggerimenti dipendono dalle risposte agli step precedenti.</p>
        ) : (
          <div className="grid gap-3">
            {[...step.suggestions, null].map((sg) => {
              if (!sg && !editable) return null;
              const msg = (l: string) => sg?.translations.find((t) => t.locale === l)?.message ?? "";
              const optLabel = (key: string | null) =>
                key ? (step.options.find((o) => o.key === key)?.translations.find((t) => t.locale === "it")?.label ?? key) : null;
              return (
                <details key={sg?.id ?? "new"} className="rounded-md border p-3" open={!sg && step.suggestions.length === 0}>
                  <summary className="cursor-pointer text-sm">
                    {sg ? (
                      <>
                        <Badge className="mr-2">P{sg.priority}</Badge>
                        {sg.optionKey && (
                          <Badge tone={sg.mandatory ? "warning" : "primary"} className="mr-2">
                            {sg.mandatory ? "obbligatorio" : "consiglia"}: {optLabel(sg.optionKey)}
                          </Badge>
                        )}
                        <span className="text-muted-foreground">se {describeCondition(parseCondition(sg.condition))}</span>
                      </>
                    ) : (
                      <span className="font-medium">+ Nuovo suggerimento</span>
                    )}
                  </summary>
                  <form action={saveSuggestion.bind(null, step.id, sg?.id ?? null)} className="mt-3 grid gap-3">
                    <fieldset disabled={!editable} className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                        <Field>
                          <Label className="text-xs">Opzione consigliata (facoltativa)</Label>
                          <Select name="optionKey" defaultValue={sg?.optionKey ?? ""}>
                            <option value="">— nessuna, solo messaggio —</option>
                            {step.options.map((o) => (
                              <option key={o.key} value={o.key}>
                                {optLabel(o.key)}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field>
                          <Label className="text-xs">Priorità</Label>
                          <Input name="priority" type="number" defaultValue={sg?.priority ?? 0} />
                        </Field>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox name="mandatory" defaultChecked={sg?.mandatory ?? false} />
                        Obbligatorio: l&apos;opzione è preselezionata; se l&apos;utente la toglie compare un avviso
                      </label>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {(["it", "en"] as const).map((l) => (
                          <Field key={l}>
                            <Label className="text-xs uppercase">Messaggio {l}</Label>
                            <Textarea name={`message_${l}`} defaultValue={msg(l)} rows={3} required={l === "it"} />
                          </Field>
                        ))}
                      </div>
                      <ConditionEditor
                        name="condition"
                        initial={sg ? parseCondition(sg.condition) : null}
                        steps={refs}
                        emptyLabel="Aggiungi almeno una condizione."
                      />
                    </fieldset>
                    {editable && (
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          Salva suggerimento
                        </Button>
                        {sg && (
                          <Button formAction={deleteSuggestion.bind(null, sg.id)} size="sm" variant="ghost" className="text-destructive">
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
        )}
      </Card>
    </div>
  );
}
