/**
 * Testi di aiuto dell'editor del wizard. Descrivono il comportamento reale del codice
 * (src/lib/wizard/*, src/server/wizard-admin.ts): se cambia la logica, aggiornare anche qui.
 */

/* ─── Pagina elenco versioni ─── */

export function VersionsHelp() {
  return (
    <>
      <p>
        Il wizard è <strong>versionato</strong>: gli utenti compilano sempre la versione <em>pubblicata</em>; tu lavori su una{" "}
        <em>bozza</em> che non vedono finché non la pubblichi.
      </p>
      <table>
        <tbody>
          <tr>
            <th>Bozza</th>
            <td>Modificabile. Ne può esistere una sola alla volta.</td>
          </tr>
          <tr>
            <th>Pubblicata</th>
            <td>Quella che vedono gli utenti. Sola lettura.</td>
          </tr>
          <tr>
            <th>Archiviata</th>
            <td>Una versione pubblicata in passato. Sola lettura, resta per i progetti che la usano.</td>
          </tr>
        </tbody>
      </table>
      <h3>Il ciclo di lavoro</h3>
      <ol>
        <li>
          <strong>Crea bozza dalla versione pubblicata</strong>: copia tutto (step, opzioni, condizioni, aree, regole,
          raccomandazioni) in una nuova versione.
        </li>
        <li>Apri la bozza e fai le modifiche.</li>
        <li>
          <strong>Prova la bozza</strong> (pulsante nella pagina della versione): apre il wizard sul sito, in una nuova scheda,
          esattamente come lo vedrà l&apos;utente. Puoi lasciare la scheda aperta, modificare la bozza e ricaricare.
        </li>
        <li>
          <strong>Pubblica</strong>: la bozza diventa la versione attiva e la precedente viene archiviata.
        </li>
      </ol>
      <h3>Cosa succede ai progetti già iniziati</h3>
      <p>
        Ogni progetto resta legato alla versione con cui è stato iniziato: chi ha iniziato con la v1 continua e vede il
        riepilogo della v1 anche dopo la pubblicazione della v2. Solo i nuovi progetti usano la nuova versione.
      </p>
      <p>
        Una bozza si può eliminare solo se nessun progetto reale la usa (in pratica sempre, perché gli utenti partono solo dalla
        versione pubblicata). I progetti di prova vengono eliminati insieme alla bozza.
      </p>
    </>
  );
}

/* ─── Pagina di una versione ─── */

export function VersionHelp() {
  return (
    <>
      <p>Da qui gestisci tutto ciò che compone il wizard e il suo risultato:</p>
      <ul>
        <li>
          <strong>Step</strong>: le domande, nell&apos;ordine in cui le vede l&apos;utente.
        </li>
        <li>
          <strong>Aree di maturità</strong>: le voci del punteggio (es. Dati, Processi, Tecnologia).
        </li>
        <li>
          <strong>Regole di punteggio</strong>: quanti punti dare a ogni area in base alle risposte.
        </li>
        <li>
          <strong>Raccomandazioni</strong>: i prossimi passi mostrati nel riepilogo.
        </li>
      </ul>
      <p>
        Le modifiche si salvano subito nella bozza, ma gli utenti le vedono solo dopo <strong>Pubblica questa versione</strong>.
        Per controllarle prima usa <strong>Prova la bozza (IT / EN)</strong>: avvia un progetto di prova sul sito, intestato a
        te, con un banner &quot;Anteprima&quot;. I progetti di prova non compaiono in Progetti, Lead, Domande né nelle statistiche.
        Le versioni pubblicate o archiviate sono in sola lettura: per cambiarle crea una nuova bozza dall&apos;elenco versioni.
      </p>
      <h3>Come si calcola il risultato</h3>
      <ol>
        <li>Si considerano solo le risposte agli step <em>visibili</em> per quell&apos;utente.</li>
        <li>Per ogni area si sommano i punti delle regole la cui condizione è vera.</li>
        <li>La somma viene limitata tra 0 e i punti massimi dell&apos;area e trasformata in percentuale.</li>
        <li>Il punteggio totale (0–100) è la media delle percentuali delle aree, pesata con il peso di ciascuna.</li>
        <li>Le raccomandazioni la cui condizione è vera vengono mostrate, dalla priorità più alta.</li>
      </ol>
      <p className="warn">
        Le regole di punteggio della versione iniziale sono <strong>esempi da validare</strong>.
      </p>
    </>
  );
}

export function NotesHelp() {
  return <p>Promemoria interno sulla versione (cosa è cambiato, perché). Lo vedi nell&apos;elenco versioni, gli utenti no.</p>;
}

export function StepsHelp() {
  return (
    <>
      <p>
        Gli step compaiono all&apos;utente in quest&apos;ordine, uno per pagina. Uno step con una condizione in{" "}
        <em>Visibile se</em> viene saltato quando la condizione è falsa, e l&apos;utente vede &quot;Step X di Y&quot; contando solo
        gli step visibili.
      </p>
      <h3>Azioni</h3>
      <ul>
        <li>Clicca sul titolo per modificare testi, tipo, configurazione, condizione e opzioni.</li>
        <li>
          <strong>↑ ↓</strong> cambiano l&apos;ordine. Una condizione può riferirsi solo agli step <em>precedenti</em>: se sposti
          uno step prima di quello da cui dipende, ricontrolla la sua condizione.
        </li>
        <li>
          <strong>✕</strong> elimina subito lo step e le sue opzioni, <strong>senza chiedere conferma</strong>. Le condizioni e
          le regole che lo citano non vengono cancellate: da quel momento trattano lo step come &quot;senza risposta&quot;, quindi
          vanno sistemate a mano.
        </li>
      </ul>
      <h3>Aggiungere uno step</h3>
      <ul>
        <li>
          <strong>Chiave</strong>: identificativo tecnico, unico nella versione. Solo minuscole, numeri e <code>_</code>, inizia
          con una lettera, max 50 caratteri. <code>summary</code> è riservata.
        </li>
        <li>
          <strong>Titolo (IT)</strong>: la domanda. La traduzione inglese si aggiunge nella pagina dello step.
        </li>
        <li>
          <strong>Tipo</strong>: vedi la tabella sotto. Puoi cambiarlo anche dopo.
        </li>
      </ul>
      <StepTypesTable />
      <h3>Badge IT / EN</h3>
      <p>
        Verde: traduzione presente. Giallo: manca. Se manca l&apos;inglese, l&apos;utente inglese vede il testo italiano.
      </p>
      <SpecialKeys />
    </>
  );
}

export function StepTypesTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>L&apos;utente…</th>
          <th>Risposta salvata</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Scelta singola</td>
          <td>sceglie una opzione</td>
          <td>
            la chiave dell&apos;opzione, es. <code>&quot;battery&quot;</code>
          </td>
        </tr>
        <tr>
          <td>Scelta multipla</td>
          <td>sceglie una o più opzioni</td>
          <td>
            elenco di chiavi, es. <code>[&quot;erp&quot;, &quot;mes&quot;]</code>
          </td>
        </tr>
        <tr>
          <td>Numero</td>
          <td>scrive un numero</td>
          <td>
            un numero, es. <code>250</code>
          </td>
        </tr>
        <tr>
          <td>Testo</td>
          <td>scrive un testo libero</td>
          <td>il testo</td>
        </tr>
        <tr>
          <td>Gruppo di campi</td>
          <td>compila più campi (es. nome, categoria)</td>
          <td>
            un oggetto, es. <code>{`{ "name": "Bici X" }`}</code>
          </td>
        </tr>
        <tr>
          <td>Griglia per categorie</td>
          <td>
            per ogni opzione scelta in uno step precedente (le righe) spunta una o più colonne (le opzioni di questo step)
          </td>
          <td>
            un oggetto, es. <code>{`{ "battery_ev": ["item"], "textile_apparel": ["model", "item"] }`}</code>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function SpecialKeys() {
  return (
    <>
      <h3>Chiavi usate dall&apos;applicazione</h3>
      <p>Alcune chiavi hanno un ruolo fisso: se le rinomini o le elimini, la funzione corrispondente resta vuota.</p>
      <ul>
        <li>
          <code>industry</code>: colonna &quot;Industry&quot; nell&apos;elenco lead.
        </li>
        <li>
          Schemi del riepilogo: gli step che li alimentano sono indicati nella sezione <strong>&quot;Schemi del riepilogo&quot;</strong> in
          fondo alla pagina della versione. Se rinomini una chiave, aggiorna anche quella configurazione.
        </li>
      </ul>
    </>
  );
}

export function DiagramConfigHelp() {
  return (
    <>
      <p>
        Il riepilogo mostra due schemi generati dalle risposte: <strong>Flusso dei dati DPP</strong> (fonti → middle layer →
        piattaforma → Registro UE) e <strong>Blueprint del DPP</strong> (tutti gli step raggruppati in aree, con lo stato di ciascuno).
        L&apos;utente può scaricarli in PNG o SVG.
      </p>
      <h3>Come vengono costruiti</h3>
      <ul>
        <li>
          <strong>Fonti dati</strong>: un riquadro per ogni fonte scelta, con l&apos;icona del formato (Excel, PDF, API, sistema interno,
          inserimento manuale).
        </li>
        <li>
          <strong>Middle layer</strong>: compare se ci sono file o API dei fornitori, o se i dati non sono centralizzati. Le voci
          dipendono dalle fonti; &quot;code dati&quot; compare con dati dinamici o con più SKU della soglia <code>largeCatalog</code>.
        </li>
        <li>
          <strong>Caricamento manuale</strong>: la fonte &quot;inserimento manuale&quot; va direttamente alla piattaforma con una freccia
          arancione.
        </li>
        <li>
          <strong>Piattaforma</strong>: titolo dall&apos;hosting (tratteggiata se da decidere); le funzioni dipendono da informazioni
          disponibili, dati dinamici, livello del passaporto, schema URL e data carrier.
        </li>
        <li>
          <strong>Registro UE</strong>: freccia continua se l&apos;integrazione è pianificata, tratteggiata con &quot;Da pianificare&quot;
          altrimenti.
        </li>
      </ul>
      <h3>Configurazione</h3>
      <ul>
        <li>
          <code>steps</code>: per ogni parte dello schema, la chiave dello step che la alimenta (vedi tabella).
        </li>
        <li>
          <code>options</code>: quali chiavi delle opzioni appartengono a ciascun gruppo, es. <code>supplierFiles</code> (file dei
          fornitori), <code>internalSystems</code> (ERP, MES, PLM), <code>registryPlanned</code> (integrazione pianificata),{" "}
          <code>unknown</code> (risposte &quot;non so&quot;). Se aggiungi un&apos;opzione a uno step, aggiungila qui al gruppo giusto.
        </li>
        <li>
          <code>blueprint.sections</code>: le aree del Blueprint, in ordine, con gli step di ciascuna. Gli step non assegnati
          compaiono comunque, nell&apos;area &quot;Altro&quot;. Le griglie per categoria finiscono nella tabella dell&apos;area che le
          contiene.
        </li>
        <li>
          <code>blueprint.shortTitles</code>: titoli brevi delle schede, es.{" "}
          <code>{`{ "my_step": { "it": "Titolo breve", "en": "Short title" } }`}</code>. Senza titolo breve si usa la domanda.
        </li>
        <li>
          <strong>Stato delle schede</strong>: <em>da definire</em> senza risposta, con &quot;non so&quot; o hosting da decidere;{" "}
          <em>attenzione</em> con Registro UE non pianificato, nessun data carrier o un obbligo di legge tolto;{" "}
          <em>non applicabile</em> se lo step è nascosto per le risposte date.
        </li>
        <li>
          Basta indicare le parti da cambiare: il resto usa i valori predefiniti. <strong>Ripristina predefinita</strong> torna alla
          configurazione standard.
        </li>
      </ul>
      <p>
        Al salvataggio vengono controllati il JSON e l&apos;esistenza degli step indicati. Modificabile solo nelle bozze; viene
        copiata nelle nuove bozze.
      </p>
    </>
  );
}

export function AreasHelp() {
  return (
    <>
      <p>Le aree sono le voci del punteggio mostrate nel riepilogo, ognuna con una barra in percentuale.</p>
      <table>
        <tbody>
          <tr>
            <th>Chiave</th>
            <td>Identificativo tecnico (stesse regole delle chiavi degli step).</td>
          </tr>
          <tr>
            <th>Etichetta IT / EN</th>
            <td>Il nome mostrato all&apos;utente. Se vuota, viene mostrata la chiave.</td>
          </tr>
          <tr>
            <th>Peso</th>
            <td>
              Quanto conta l&apos;area nel punteggio totale. Con pesi 1, 1, 2 la terza area vale il doppio delle altre.
            </td>
          </tr>
          <tr>
            <th>Punti max</th>
            <td>Il punteggio che corrisponde al 100% dell&apos;area. I punti oltre il massimo non contano.</td>
          </tr>
        </tbody>
      </table>
      <h3>Esempio</h3>
      <p>
        Area &quot;Dati&quot; con punti max 10: se le regole soddisfatte danno 4 + 2 = 6 punti, l&apos;area è al 60%. Se danno 12,
        l&apos;area è al 100%. Se il totale è negativo, l&apos;area è allo 0%.
      </p>
      <p className="warn">
        <strong>Elimina</strong> cancella subito l&apos;area <strong>e tutte le sue regole</strong>, senza chiedere conferma.
      </p>
    </>
  );
}

export function RulesHelp() {
  return (
    <>
      <p>
        Ogni regola dice: <em>&quot;se questa condizione è vera, aggiungi N punti a questa area&quot;</em>. Un utente può soddisfare
        più regole; i punti si sommano.
      </p>
      <ul>
        <li>
          <strong>Area</strong>: dove vanno i punti.
        </li>
        <li>
          <strong>Punti</strong>: numero intero, anche negativo (per penalizzare una risposta).
        </li>
        <li>
          <strong>Nota interna</strong>: promemoria per te, non visibile agli utenti.
        </li>
        <li>
          <strong>Condizione</strong>: obbligatoria. Può riferirsi a qualsiasi step.
        </li>
      </ul>
      <h3>Esempi</h3>
      <ul>
        <li>
          +4 a &quot;Dati&quot; se <code>data_organization</code> è uguale a &quot;Centralizzati&quot;
        </li>
        <li>
          +2 a &quot;Dati&quot; se <code>data_sources</code> contiene almeno uno tra ERP, MES, PLM
        </li>
        <li>
          −2 a &quot;Processi&quot; se <code>qr_presence</code> è uguale a &quot;No&quot;
        </li>
      </ul>
      <p>
        Le risposte a step non visibili per quell&apos;utente vengono ignorate. Il punteggio si ricalcola ogni volta che
        l&apos;utente apre il riepilogo; quello salvato nel progetto (usato nella dashboard) si aggiorna quando l&apos;utente salva
        una risposta.
      </p>
      <p>Clicca su una regola per aprirla e modificarla; &quot;+ Nuova regola&quot; ne aggiunge una.</p>
    </>
  );
}

export function RecommendationsHelp() {
  return (
    <>
      <p>
        Le raccomandazioni sono i &quot;prossimi passi consigliati&quot; nel riepilogo. Viene mostrata ogni raccomandazione la cui
        condizione è vera, numerate in ordine di <strong>priorità</strong> (il numero più alto viene prima).
      </p>
      <ul>
        <li>
          <strong>Titolo e testo</strong> in italiano e inglese. Se lasci vuoto il titolo di una lingua, quella traduzione
          viene rimossa e si mostra l&apos;italiano.
        </li>
        <li>
          <strong>Condizione</strong>: obbligatoria. Per una raccomandazione sempre presente usa per esempio{" "}
          <code>industry</code> &quot;ha una risposta&quot;.
        </li>
      </ul>
      <p>Se nessuna condizione è vera, l&apos;utente vede un messaggio che il progetto è ben impostato.</p>
    </>
  );
}

/* ─── Pagina di uno step ─── */

export function StepEditorHelp() {
  return (
    <>
      <p>Qui modifichi una singola domanda del wizard. Il pulsante <strong>Salva step</strong> salva tutta la parte superiore insieme:</p>
      <ul>
        <li>chiave, tipo e obbligatorietà;</li>
        <li>testi in italiano e inglese, compresi i riferimenti normativi;</li>
        <li>configurazione;</li>
        <li>condizione di visibilità.</li>
      </ul>
      <p>
        Le <strong>opzioni</strong> (solo per scelta singola e multipla) hanno ognuna il proprio pulsante di salvataggio.
      </p>
      <p>Se la versione non è una bozza, la pagina è in sola lettura.</p>
    </>
  );
}

export function StepBasicsHelp() {
  return (
    <>
      <ul>
        <li>
          <strong>Chiave</strong>: identificativo usato da condizioni, regole e schema di architettura.{" "}
          <span className="warn">
            Se la cambi, le condizioni e le regole che usano la vecchia chiave trattano lo step come &quot;senza risposta&quot;:
            vanno aggiornate a mano.
          </span>
        </li>
        <li>
          <strong>Tipo</strong>: il tipo di risposta (vedi tabella).
        </li>
        <li>
          <strong>Obbligatorio</strong>: se tolto, l&apos;utente può andare avanti senza rispondere. Vale per scelta singola,
          scelta multipla e testo. Per <em>Numero</em> la risposta è sempre richiesta; per <em>Gruppo di campi</em>
          l&apos;obbligatorietà si imposta campo per campo nella configurazione.
        </li>
      </ul>
      <StepTypesTable />
    </>
  );
}

export function StepTextsHelp() {
  return (
    <ul>
      <li>
        <strong>Domanda</strong>: il titolo della pagina. Obbligatoria in italiano. Se lasci vuota quella inglese, la
        traduzione viene rimossa e l&apos;utente inglese vede l&apos;italiano.
      </li>
      <li>
        <strong>Descrizione</strong>: testo sotto la domanda, per dare contesto.
      </li>
      <li>
        <strong>Testo di aiuto</strong>: nota più piccola in fondo, sotto le risposte (es. &quot;Una stima è sufficiente&quot;).
      </li>
    </ul>
  );
}

export function ReferencesHelp() {
  return (
    <>
      <p>
        Testo mostrato all&apos;utente in un riquadro &quot;Riferimenti normativi&quot; <strong>tra la domanda e le risposte</strong>.
        Serve a spiegare quale norma motiva la domanda. Se lasci vuota una lingua, per quella lingua il riquadro non compare.
      </p>
      <p>Si scrive in Markdown. I link a siti esterni si aprono in una nuova scheda.</p>
      <pre>{`- [Regolamento (UE) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj):
  il registro dei passaporti è previsto dall'art. 13.
- **Batterie**: [Regolamento (UE) 2023/1542](https://eur-lex.europa.eu/eli/reg/2023/1542/oj), art. 77.`}</pre>
      <ul>
        <li>
          <code>[testo](https://…)</code> crea un link; <code>**testo**</code> il grassetto; una riga che inizia con{" "}
          <code>- </code> un elenco puntato.
        </li>
        <li>
          Per i link a EUR-Lex usa l&apos;indirizzo ELI, stabile nel tempo: <code>https://eur-lex.europa.eu/eli/reg/ANNO/NUMERO/oj</code>{" "}
          (aggiungi <code>/ita</code> per la versione italiana).
        </li>
        <li>Sotto il testo il sito aggiunge sempre l&apos;avviso di verificare il testo ufficiale.</li>
      </ul>
      <p className="warn">
        I riferimenti iniziali sono indicativi: numeri di articolo e allegati vanno verificati sul testo ufficiale prima della
        pubblicazione.
      </p>
    </>
  );
}

export function ConfigHelp() {
  return (
    <>
      <p>Impostazioni aggiuntive in formato JSON. Cosa inserire dipende dal tipo di step:</p>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Chiavi</th>
            <th>Esempio</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Numero</td>
            <td>
              <code>min</code>, <code>max</code>
            </td>
            <td>
              <code>{`{ "min": 1, "max": 100000 }`}</code>
            </td>
          </tr>
          <tr>
            <td>Testo</td>
            <td>
              <code>maxLength</code> (predefinito 200)
            </td>
            <td>
              <code>{`{ "maxLength": 300 }`}</code>
            </td>
          </tr>
          <tr>
            <td>Gruppo di campi</td>
            <td>
              <code>fields</code> (obbligatorio), <code>maxLength</code>
            </td>
            <td>vedi sotto</td>
          </tr>
          <tr>
            <td>Griglia per categorie</td>
            <td>
              <code>rowsFrom</code> (obbligatorio): chiave di uno step precedente a scelta singola o multipla;{" "}
              <code>multiple</code>: <code>false</code> per una sola risposta per riga (es. Sì / No), altrimenti più colonne per riga
            </td>
            <td>
              <code>{`{ "rowsFrom": "product_categories" }`}</code>
              <br />
              <code>{`{ "rowsFrom": "product_categories", "multiple": false }`}</code>
            </td>
          </tr>
          <tr>
            <td>Scelta singola / multipla</td>
            <td>nessuna</td>
            <td>lascia vuoto</td>
          </tr>
        </tbody>
      </table>
      <h3>Gruppo di campi</h3>
      <pre>{`{
  "maxLength": 120,
  "fields": [
    { "key": "name", "type": "text", "required": true,
      "label": { "it": "Nome commerciale", "en": "Commercial name" } },
    { "key": "weight_kg", "type": "number",
      "label": { "it": "Peso (kg)", "en": "Weight (kg)" } }
  ]
}`}</pre>
      <ul>
        <li>
          <code>key</code>: identificativo del campo (usabile nelle condizioni scegliendo il campo).
        </li>
        <li>
          <code>type</code>: <code>text</code> oppure <code>number</code>.
        </li>
        <li>
          <code>required</code>: <code>true</code> se obbligatorio (predefinito: facoltativo).
        </li>
        <li>
          <code>label</code>: etichetta per lingua; se manca l&apos;inglese si usa l&apos;italiano.
        </li>
      </ul>
      <p>
        Il JSON viene controllato al salvataggio: se è scritto male o contiene chiavi sconosciute, compare un errore in cima
        alla pagina e nulla viene salvato. I limiti valgono sia nel form dell&apos;utente sia nel controllo lato server.
      </p>
    </>
  );
}

export function VisibilityHelp() {
  return (
    <>
      <p>
        Decide se l&apos;utente vede questo step. Senza condizioni lo step è sempre visibile. Puoi usare solo gli step che
        vengono <em>prima</em> di questo.
      </p>
      <ul>
        <li>Se la condizione è falsa, lo step viene saltato e le sue risposte non contano per punteggio e raccomandazioni.</li>
        <li>
          Se l&apos;utente torna indietro e cambia una risposta da cui questo step dipende, la sua risposta viene segnalata come
          &quot;da rivedere&quot;.
        </li>
      </ul>
      <ConditionHelp />
    </>
  );
}

export function OptionsHelp() {
  return (
    <>
      <p>Le risposte tra cui l&apos;utente sceglie, nell&apos;ordine mostrato qui. Clicca su un&apos;opzione per modificarla.</p>
      <ul>
        <li>
          <strong>Chiave</strong>: il valore salvato nella risposta e usato nelle condizioni (es. <code>battery</code>).{" "}
          <span className="warn">
            Se la cambi, le risposte già date con la vecchia chiave non sono più valide e le condizioni che la usano vanno
            aggiornate.
          </span>
        </li>
        <li>
          <strong>Etichetta</strong> e <strong>descrizione</strong> per lingua: la descrizione compare in piccolo sotto
          l&apos;etichetta. Senza etichetta inglese si mostra l&apos;italiano (avviso &quot;manca EN&quot;).
        </li>
        <li>
          <strong>Opzione visibile se</strong>: mostra l&apos;opzione solo in certi casi (es. &quot;Regolamento Batterie&quot; solo
          se <code>industry</code> è Batterie). Se una risposta già data diventa non disponibile, all&apos;utente viene chiesto di
          rispondere di nuovo.
        </li>
        <li>
          <strong>↑ ↓</strong> cambiano l&apos;ordine; <strong>Elimina</strong> cancella subito l&apos;opzione.
        </li>
      </ul>
    </>
  );
}

export function SuggestionsHelp() {
  return (
    <>
      <p>
        Un suggerimento è un consiglio che compare in questo step, in un riquadro <strong>&quot;Il nostro consiglio&quot;</strong>{" "}
        sopra le risposte, quando la sua condizione è vera. La condizione usa le risposte agli step <em>precedenti</em>.
      </p>
      <ul>
        <li>
          <strong>Opzione consigliata</strong> (facoltativa): l&apos;opzione riceve l&apos;etichetta &quot;Consigliato&quot;. Nelle scelte
          singole, se l&apos;utente non ha ancora risposto, viene anche <strong>preselezionata</strong> quella del suggerimento con
          priorità più alta. L&apos;utente può sempre cambiarla.
        </li>
        <li>
          <strong>Obbligatorio</strong>: l&apos;opzione viene preselezionata con l&apos;etichetta &quot;Obbligatorio per
          legge&quot;. L&apos;utente può toglierla, ma compare un avviso che spiega l&apos;obbligo; la risposta viene salvata comunque.
          Usalo solo per obblighi di legge.
        </li>
        <li>
          <strong>Priorità</strong>: se più suggerimenti sono veri, compaiono tutti, dal numero più alto. Usala per far prevalere il
          consiglio più vincolante (es. un obbligo di legge prima di un&apos;indicazione).
        </li>
        <li>
          <strong>Messaggio</strong> in Markdown, per lingua (obbligatorio in italiano; senza inglese si mostra l&apos;italiano).
        </li>
      </ul>
      <h3>Nelle griglie per categorie</h3>
      <p>
        Ogni suggerimento viene valutato <strong>riga per riga</strong>, come se l&apos;utente avesse scelto solo quella categoria:
        il messaggio compare sotto la riga e l&apos;opzione viene consigliata (o resa obbligatoria) solo lì. I suggerimenti senza
        opzione validi per tutte le righe compaiono una sola volta nel riquadro &quot;Il nostro consiglio&quot;.
      </p>
      <h3>Esempio</h3>
      <p>
        Nello step &quot;A quale livello serve il passaporto?&quot;: se <code>product_categories</code> contiene &quot;Batterie per
        veicoli elettrici&quot; → consiglia &quot;Per singolo prodotto&quot;, priorità 10, messaggio &quot;Il Regolamento Batterie
        richiede un passaporto per ogni singola batteria (art. 77).&quot;
      </p>
    </>
  );
}

/* ─── Editor delle condizioni (condiviso) ─── */

export function ConditionHelp() {
  return (
    <>
      <h3>Come si scrive una condizione</h3>
      <p>
        Aggiungi una o più righe <em>step → operatore → valore</em>, poi scegli se devono essere vere <strong>tutte</strong> (E)
        o <strong>almeno una</strong> (O).
      </p>
      <table>
        <thead>
          <tr>
            <th>Operatore</th>
            <th>Vero quando la risposta…</th>
            <th>Per</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>è uguale a / è diverso da</td>
            <td>è (o non è) esattamente quel valore</td>
            <td>scelta singola, numero, testo</td>
          </tr>
          <tr>
            <td>è uno tra / non è uno tra</td>
            <td>è (o non è) uno dei valori spuntati</td>
            <td>scelta singola</td>
          </tr>
          <tr>
            <td colSpan={3}>
              Su una <em>scelta multipla</em>, &quot;è uguale a&quot; e &quot;è uno tra&quot; sono veri se l&apos;utente ha selezionato{" "}
              <strong>almeno uno</strong> dei valori, come &quot;contiene almeno uno tra&quot;. L&apos;editor propone direttamente gli
              operatori adatti al tipo di step.
            </td>
          </tr>
          <tr>
            <td>contiene almeno uno tra</td>
            <td>include almeno uno dei valori spuntati</td>
            <td>scelta multipla</td>
          </tr>
          <tr>
            <td>non contiene nessuno tra</td>
            <td>non include nessuno dei valori spuntati</td>
            <td>scelta multipla</td>
          </tr>
          <tr>
            <td>maggiore / minore (o uguale)</td>
            <td>confronto numerico</td>
            <td>numero</td>
          </tr>
          <tr>
            <td>ha una risposta / è vuoto</td>
            <td>è stata data (o no)</td>
            <td>tutti</td>
          </tr>
        </tbody>
      </table>
      <p>
        Per uno step <em>Gruppo di campi</em> compare anche la scelta del campo da confrontare. Per una <em>Griglia per
        categorie</em> puoi scegliere una riga (es. &quot;Abbigliamento contiene Singolo prodotto&quot;) oppure &quot;qualsiasi
        riga&quot; (es. &quot;almeno una categoria contiene Singolo prodotto&quot;).
      </p>
      <p>
        <strong>Modifica JSON</strong> serve per i casi che il form non copre, come condizioni annidate o la negazione (
        <code>not</code>):
      </p>
      <pre>{`{ "all": [
    { "step": "industry", "op": "eq", "value": "battery" },
    { "not": { "step": "hosting", "op": "eq", "value": "undecided" } }
] }`}</pre>
      <p>
        Il form si riapre con <strong>Torna al form</strong> solo se la condizione è semplice (un livello di E oppure O).
      </p>
    </>
  );
}
