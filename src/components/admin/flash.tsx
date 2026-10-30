export function ErrorFlash({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div role="alert" className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {error}
    </div>
  );
}
