"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/**
 * <select> che dopo il reset del form torna al valore salvato. Dopo una server action React
 * azzera il form, e il browser rimette ogni <select> sulla prima opzione (React non scrive
 * l'attributo "selected"): così, per esempio, un articolo pubblicato tornava a "Bozza" e al
 * salvataggio successivo diventava davvero una bozza.
 */
export function ResettableSelect(props: ComponentProps<"select">) {
  const ref = useRef<HTMLSelectElement>(null);
  const defaultValue = useRef(props.defaultValue);
  defaultValue.current = props.defaultValue;

  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onReset = () =>
      // L'evento arriva prima del reset vero e proprio: il valore si rimette subito dopo
      setTimeout(() => {
        const el = ref.current;
        const value = defaultValue.current;
        if (!el || value === undefined) return;
        const selected = new Set((Array.isArray(value) ? value : [value]).map(String));
        for (const o of el.options) o.selected = selected.has(o.value);
      });
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  return <select ref={ref} {...props} />;
}
