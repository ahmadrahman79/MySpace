import { supabase } from '@/lib/db/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  if (!supabase) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🔎 Debug Supabase Connection</h1>
        <p className="text-amber-600">Supabase belum dikonfigurasi.</p>
      </main>
    );
  }

  const { data, error } = await supabase.from('profiles').select('id, email, full_name').limit(5);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔎 Debug Supabase Connection</h1>
      {error ? (
        <pre className="bg-red-100 text-red-800 p-4 rounded">
          <strong>Error:</strong> {error.message}
        </pre>
      ) : (
        <section>
          <p className="mb-2 text-green-700 font-medium">
            ✅ Koneksi berhasil! Data contoh:
          </p>
          <ul className="list-disc pl-6">
            {data?.map((row: any) => (
              <li key={row.id}>
                {row.id} – {row.full_name || row.email || '(tanpa nama)'}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
