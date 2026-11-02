import { describe, expect, it } from "vitest";
import { CONSENT_COOKIE, CONSENT_VERSION, parseConsent, serializeConsent } from "./cookie-consent";

describe("consenso cookie", () => {
  it("scrive e rilegge la scelta", () => {
    const header = serializeConsent({ analytics: true, marketing: false }, true);
    expect(header).toContain("Max-Age=15552000");
    expect(header).toContain("Secure");
    const c = parseConsent(`altro=1; ${header.split(";")[0]}`);
    expect(c).toMatchObject({ v: CONSENT_VERSION, analytics: true, marketing: false });
  });

  it("ignora scelte assenti, rotte o di versioni precedenti", () => {
    expect(parseConsent("")).toBeNull();
    expect(parseConsent(`${CONSENT_COOKIE}=non-json`)).toBeNull();
    const old = encodeURIComponent(JSON.stringify({ v: CONSENT_VERSION - 1, analytics: true, marketing: true }));
    expect(parseConsent(`${CONSENT_COOKIE}=${old}`)).toBeNull();
  });
});
