export default function Loading() {
  return (
    <div className="flex items-center justify-center" style={{ height: "calc(100vh)" }}>
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
