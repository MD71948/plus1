import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './hooks/use-auth'
import { useProfile } from './hooks/use-profile'
import { AuthPage } from './pages/auth-page'
import { ProfileFormPage } from './pages/profile-form-page'
import { ProfilePage } from './pages/profile-page'
import { FeedPage } from './pages/feed-page'
import { CreatePage } from './pages/create-page'
import { EditActivityPage } from './pages/edit-activity-page'
import { ActivityDetailPage } from './pages/activity-detail-page'
import { MyActivitiesPage } from './pages/my-activities-page'
import { NotificationsPage } from './pages/notifications-page'
import { UserProfilePage } from './pages/user-profile-page'
import { ImpressumPage } from './pages/impressum-page'
import { DatenschutzPage } from './pages/datenschutz-page'
import { OnboardingPage } from './pages/onboarding-page'
import { supabase } from './lib/supabase'

function AppRoutes() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, setProfile } = useProfile(user?.id)
  const [pendingCount, setPendingCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [onboardingDone, setOnboardingDone] = useState(
    () => !!localStorage.getItem('onboarding_done')
  )

  useEffect(() => {
    if (!user) return
    fetchPendingCount()
    fetchNotifCount()

    const channel = supabase
      .channel('pending-requests')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'activity_requests' },
        () => { fetchPendingCount(); fetchNotifCount() }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_messages' },
        () => fetchNotifCount()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  async function fetchPendingCount() {
    if (!user) return
    const { data: myActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('host_id', user.id)

    if (!myActivities?.length) { setPendingCount(0); return }

    const { count } = await supabase
      .from('activity_requests')
      .select('id', { count: 'exact', head: true })
      .in('activity_id', myActivities.map(a => a.id))
      .eq('status', 'pending')

    setPendingCount(count ?? 0)
  }

  async function fetchNotifCount() {
    if (!user) return
    const lastSeen = localStorage.getItem('notifs_last_seen') ?? '2000-01-01'

    // Count accepted/rejected requests I sent since last seen
    const { count: reqCount } = await supabase
      .from('activity_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['accepted', 'rejected'])
      .gt('updated_at', lastSeen)

    // Count new messages in activities I'm in since last seen
    const { data: acceptedReqs } = await supabase
      .from('activity_requests')
      .select('activity_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    const { data: hostedActs } = await supabase
      .from('activities')
      .select('id')
      .eq('host_id', user.id)

    const allIds = [...new Set([
      ...(acceptedReqs ?? []).map(r => r.activity_id),
      ...(hostedActs ?? []).map(a => a.id),
    ])]

    let msgCount = 0
    if (allIds.length > 0) {
      const { count } = await supabase
        .from('activity_messages')
        .select('id', { count: 'exact', head: true })
        .in('activity_id', allIds)
        .neq('user_id', user.id)
        .gt('created_at', lastSeen)
      msgCount = count ?? 0
    }

    setNotifCount((reqCount ?? 0) + msgCount)
  }

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
            ⚡
          </div>
          <div className="w-5 h-5 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    )
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // Show onboarding once after first login
  if (!onboardingDone) {
    return <OnboardingPage onDone={() => setOnboardingDone(true)} />
  }

  return (
    <Routes>
      <Route path="/setup"
        element={profile ? <Navigate to="/feed" replace /> : <ProfileFormPage userId={user.id} onSaved={setProfile} />}
      />
      <Route path="/profile/edit"
        element={profile
          ? <ProfileFormPage userId={user.id} existingProfile={profile} onSaved={setProfile} />
          : <Navigate to="/setup" replace />}
      />
      <Route path="/profile"
        element={profile
          ? <ProfilePage profile={profile} onSignOut={handleSignOut} />
          : <Navigate to="/setup" replace />}
      />
      <Route path="/feed" element={<FeedPage userId={user.id} pendingCount={pendingCount} notifCount={notifCount} userInterests={[...(profile?.interests ?? []), ...(profile?.custom_interests ?? [])]} />} />
      <Route path="/create" element={<CreatePage userId={user.id} />} />
      <Route path="/activity/:id" element={<ActivityDetailPage userId={user.id} />} />
      <Route path="/activity/:id/edit" element={<EditActivityPage userId={user.id} />} />
      <Route path="/my"
        element={profile
          ? <MyActivitiesPage userId={user.id} pendingCount={pendingCount} />
          : <Navigate to="/setup" replace />}
      />
      <Route path="/user/:userId" element={<UserProfilePage currentUserId={user.id} />} />
      <Route path="/notifications"
        element={profile
          ? <NotificationsPage userId={user.id} onSeen={() => setNotifCount(0)} />
          : <Navigate to="/setup" replace />}
      />
      <Route path="/impressum" element={<ImpressumPage />} />
      <Route path="/datenschutz" element={<DatenschutzPage />} />
      <Route path="*" element={<Navigate to={profile ? '/feed' : '/setup'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
