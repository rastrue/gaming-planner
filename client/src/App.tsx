import { useLocalStorageSync } from './hooks/useLocalStorageSync';

export default function App() {
  useLocalStorageSync();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section
        aria-labelledby="bootstrap-heading"
        className="w-full max-w-md space-y-4 rounded-xl border border-primary-200 bg-white p-8 text-center shadow-lg"
      >
        <h1 id="bootstrap-heading" className="text-3xl font-bold text-primary-600">
          QuestSync
        </h1>
        <p className="text-slate-600">Frontend and backend workspace bootstrap is ready.</p>
        <p className="text-sm text-primary-500">Tailwind CSS is active.</p>
      </section>
    </main>
  );
}
