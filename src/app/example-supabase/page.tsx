import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: profiles } = await supabase.from('profiles').select()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Profiles</h1>
      <ul className="space-y-2">
        {profiles?.map((profile: any) => (
          <li key={profile.id} className="p-3 bg-white border border-light-gray rounded-lg">
            {profile.full_name} ({profile.role})
          </li>
        ))}
      </ul>
    </div>
  )
}
