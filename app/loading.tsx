export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-lime" />
        <p className="mt-4 text-sm text-muted">Cartly is gathering your picks…</p>
      </div>
    </div>
  );
}
