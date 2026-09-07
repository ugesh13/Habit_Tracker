import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/SettingsForm';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null };

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="font-display text-2xl">Settings</h1>
      <SettingsForm profile={profile} email={user?.email ?? ''} userId={user?.id ?? ''} />
    </div>
  );
}
