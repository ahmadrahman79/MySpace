import { createClient as createSupabase } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  const supabase = createSupabase(await cookies());
  const { data, error } = await supabase.from('profiles').select('id, name').limit(5);

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
                {row.id} – {row.name ?? '(tanpa nama)'}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
