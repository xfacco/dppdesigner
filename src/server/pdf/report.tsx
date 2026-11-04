import "server-only";
import { Document, Font, Image, Link, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { FONT_FILES } from "../download-files";

/**
 * Report PDF del riepilogo di un progetto: copertina con punteggio e prossimi passi, i due schemi
 * (uno per pagina, orientata come lo schema), le risposte con i link alla guida e ai riferimenti
 * normativi, e i contatti. Impaginato con i colori e il font del sito.
 */

Font.register({
  family: "Inter",
  fonts: [
    { src: FONT_FILES.regular, fontWeight: 400 },
    { src: FONT_FILES.medium, fontWeight: 500 },
    { src: FONT_FILES.semibold, fontWeight: 600 },
    { src: FONT_FILES.bold, fontWeight: 700 },
  ],
});
// Niente sillabazione automatica (le regole predefinite sono inglesi)
Font.registerHyphenationCallback((word) => [word]);

const INK = "#171717";
const MUTED = "#686868";
const BORDER = "#E5E5E5";
const PRIMARY = "#257345";
const SOFT = "#F5F5F4";

const MARGIN = 40;
const TOP = 70;
const BOTTOM = 56;
const A4 = { w: 595.28, h: 841.89 };

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, color: INK, paddingTop: TOP, paddingBottom: BOTTOM, paddingHorizontal: MARGIN, lineHeight: 1.45 },
  header: { position: "absolute", top: 26, left: MARGIN, right: MARGIN, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: `0.75pt solid ${BORDER}`, paddingBottom: 10 },
  headerText: { fontSize: 8, color: MUTED },
  footer: { position: "absolute", left: MARGIN, right: MARGIN, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: MUTED },
  label: { fontSize: 8, fontWeight: 600, color: PRIMARY, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },
  h1: { fontSize: 26, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1.15 },
  h2: { fontSize: 16, fontWeight: 600, letterSpacing: -0.3, marginBottom: 6 },
  muted: { color: MUTED },
  small: { fontSize: 8.5 },
  section: { marginTop: 26 },
  card: { border: `0.75pt solid ${BORDER}`, borderRadius: 6, padding: 16 },
  link: { color: PRIMARY, textDecoration: "none" },
});

export type ReportData = {
  locale: string;
  title: string;
  intro: string;
  preparedFor: string | null;
  date: string;
  projectRef: string;
  summaryUrl: string;
  siteUrl: string;
  contactsUrl: string | null;
  score: { total: number; areas: { label: string; percent: number }[] };
  recommendations: { title: string; body: string }[];
  diagrams: { title: string; png: Buffer; width: number; height: number; description?: string[] }[];
  answers: { number: number; title: string; text: string; guideUrl: string | null; references: { name: string; url: string }[] }[];
  logo: Buffer;
  labels: {
    kicker: string;
    preparedFor: string;
    date: string;
    project: string;
    online: string;
    score: string;
    areas: string;
    recommendations: string;
    noRecommendations: string;
    answers: string;
    answersIntro: string;
    guide: string;
    references: string;
    description: string;
    helpTitle: string;
    helpBody: string;
    contacts: string;
    page: string;
    disclaimer: string;
  };
};

/** Intestazione e piè di pagina ripetuti in ogni pagina. */
function Chrome({ d, headerTitle, pageHeight = A4.h }: { d: ReportData; headerTitle: string; pageHeight?: number }) {
  return (
    <>
      <View style={s.header} fixed>
        <Image src={{ data: d.logo, format: "png" }} style={{ width: 104, height: 16 }} />
        <Text style={s.headerText}>{headerTitle}</Text>
      </View>
      <View style={[s.footer, { top: pageHeight - 36 }]} fixed>
        <Link src={d.siteUrl} style={{ color: MUTED, textDecoration: "none" }}>
          {d.siteUrl.replace(/^https?:\/\//, "")}
        </Link>
        <Text render={({ pageNumber, totalPages }) => d.labels.page.replace("{n}", String(pageNumber)).replace("{total}", String(totalPages))} />
      </View>
    </>
  );
}

/** Dimensioni dell'immagine di uno schema dentro lo spazio disponibile, senza deformarla. */
function fit(width: number, height: number, boxW: number, boxH: number) {
  const k = Math.min(boxW / width, boxH / height);
  return { width: width * k, height: height * k };
}

function Report({ d }: { d: ReportData }) {
  const L = d.labels;
  return (
    <Document title={`${d.title} — ${d.projectRef}`} author="DPP Designer" creator="DPP Designer" producer="DPP Designer" language={d.locale}>
      {/* ─── Copertina: punteggio e prossimi passi ─── */}
      <Page size="A4" style={s.page}>
        <Chrome d={d} headerTitle={d.title} />
        <Text style={s.label}>{L.kicker}</Text>
        <Text style={s.h1}>{d.title}</Text>
        <Text style={[s.muted, { marginTop: 8, maxWidth: 440 }]}>{d.intro}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 18 }}>
          {d.preparedFor && <Meta label={L.preparedFor} value={d.preparedFor} />}
          <Meta label={L.date} value={d.date} />
          <Meta label={L.project} value={d.projectRef} />
        </View>
        <Text style={[s.small, { marginTop: 8 }]}>
          <Text style={s.muted}>{L.online} </Text>
          <Link src={d.summaryUrl} style={s.link}>
            {d.summaryUrl}
          </Link>
        </Text>

        <View style={[s.card, s.section]} wrap={false}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
            <View>
              <Text style={s.h2}>{L.score}</Text>
              <Text style={[s.small, s.muted]}>{L.areas}</Text>
            </View>
            <Text style={{ fontSize: 34, fontWeight: 600, color: PRIMARY, lineHeight: 1 }}>
              {d.score.total}
              <Text style={{ fontSize: 14, color: MUTED }}>/100</Text>
            </Text>
          </View>
          {d.score.areas.map((a) => (
            <View key={a.label} style={{ marginTop: 7 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", fontSize: 9 }}>
                <Text>{a.label}</Text>
                <Text style={s.muted}>{a.percent}%</Text>
              </View>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: SOFT, marginTop: 3 }}>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: PRIMARY, width: `${Math.max(0, Math.min(100, a.percent))}%` }} />
              </View>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>{L.recommendations}</Text>
          {d.recommendations.length === 0 && <Text style={s.muted}>{L.noRecommendations}</Text>}
          {d.recommendations.map((r, i) => (
            <View key={i} style={{ flexDirection: "row", marginTop: 8 }} wrap={false}>
              <Text style={{ width: 18, fontWeight: 600, color: PRIMARY }}>{i + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 600 }}>{r.title}</Text>
                <Text style={s.muted}>{r.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>

      {/* ─── Schemi: una pagina ciascuno, orizzontale se lo schema è largo ─── */}
      {d.diagrams.map((g) => {
        const landscape = g.width / g.height > 1.15;
        const pw = landscape ? A4.h : A4.w;
        const ph = landscape ? A4.w : A4.h;
        // Qualche punto di margine per il bordo: un'immagine anche di poco più alta finirebbe in una pagina nuova
        const size = fit(g.width, g.height, pw - 2 * MARGIN - 4, ph - TOP - BOTTOM - 8);
        return [
          <Page key={g.title} size="A4" orientation={landscape ? "landscape" : "portrait"} style={s.page}>
            {/* Titolo e sottotitolo sono già nel disegno: qui solo l'intestazione */}
            <Chrome d={d} headerTitle={g.title} pageHeight={ph} />
            <Image src={{ data: g.png, format: "png" }} style={{ ...size, alignSelf: "center", border: `0.75pt solid ${BORDER}` }} />
          </Page>,
          // Descrizione testuale dello schema in una pagina a parte
          g.description && g.description.length > 0 && (
            <Page key={`${g.title}-description`} size="A4" style={s.page}>
              <Chrome d={d} headerTitle={g.title} />
              <Text style={s.h2}>{L.description}</Text>
              <Text style={[s.small, s.muted, { marginBottom: 6 }]}>{g.title}</Text>
              {g.description.map((line, i) => (
                <Text key={i} style={{ marginTop: 3 }}>
                  • {line}
                </Text>
              ))}
            </Page>
          ),
        ];
      })}

      {/* ─── Le risposte, con guida e riferimenti normativi ─── */}
      <Page size="A4" style={s.page}>
        <Chrome d={d} headerTitle={d.title} />
        <Text style={s.h2}>{L.answers}</Text>
        <Text style={[s.small, s.muted, { marginBottom: 6 }]}>{L.answersIntro}</Text>
        {d.answers.map((a) => (
          <View key={a.number} style={{ borderTop: `0.75pt solid ${BORDER}`, paddingTop: 9, marginTop: 9 }} wrap={false}>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ width: 24, color: MUTED, fontSize: 9 }}>{String(a.number).padStart(2, "0")}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 600 }}>{a.title}</Text>
                <Text style={{ marginTop: 2 }}>{a.text}</Text>
                {a.guideUrl && (
                  <Text style={[s.small, { marginTop: 4 }]}>
                    <Text style={s.muted}>{L.guide}: </Text>
                    <Link src={a.guideUrl} style={s.link}>
                      {a.guideUrl.replace(/^https?:\/\//, "")}
                    </Link>
                  </Text>
                )}
                {a.references.length > 0 && (
                  <Text style={[s.small, { marginTop: 2 }]}>
                    <Text style={s.muted}>{L.references}: </Text>
                    {a.references.map((r, i) => (
                      <Text key={r.url}>
                        {i > 0 ? " · " : ""}
                        <Link src={r.url} style={s.link}>
                          {r.name}
                        </Link>
                      </Text>
                    ))}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* ─── Contatti ─── */}
        <View style={[s.card, s.section, { backgroundColor: SOFT, borderColor: SOFT }]} wrap={false}>
          <Text style={s.h2}>{L.helpTitle}</Text>
          <Text>{L.helpBody}</Text>
          <Text style={{ marginTop: 8 }}>
            {d.contactsUrl && (
              <Link src={d.contactsUrl} style={[s.link, { fontWeight: 600 }]}>
                {L.contacts} →
              </Link>
            )}
            {d.contactsUrl ? "   " : ""}
            <Link src={d.siteUrl} style={s.link}>
              {d.siteUrl.replace(/^https?:\/\//, "")}
            </Link>
          </Text>
        </View>
        <Text style={[s.small, s.muted, { marginTop: 14 }]}>{L.disclaimer}</Text>
      </Page>
    </Document>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={[s.small, s.muted]}>{label}</Text>
      <Text style={{ fontWeight: 500 }}>{value}</Text>
    </View>
  );
}

export function renderReport(d: ReportData) {
  return renderToBuffer(<Report d={d} />);
}
