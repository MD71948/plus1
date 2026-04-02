import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './hooks/use-auth'
import { useProfile } from './hooks/use-profile'
import { AuthPage } from './pages/auth-page'
import { ProfileFormPage } from './pages/profile-form-page'
import { ProfilePage } from './pages/profile-page'
import { FeedPage } from './pages/feed-page'
import { CreatePage } from './pages/create-page'
import { ActivityDetailPage } from './pages/activity-detail-page'
import { MyActivitiesPage } from './pages/my-activities-page'
import { supabase } from './lib/supabase'

function AppRoutes() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, setProfile } = useProfile(user?.id)
  const [pendingCount, setPendingCount] = useState(0)

  // Fetch pending request count for activities this user hosts
  useEffect(() => {
    if (!user) return
    fetchPendingCount()

    // Realtime: update badge when new requests come in
    const channel = supabase
      .channel('pending-requests')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'activity_requests' },
        () => fetchPendingCount()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  async function fetchPendingCount() {
    if (!user) return
    // Get all activities hosted by this user
    const { data: myActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('host_id', user.id)

    if (!myActivities?.length) { setPendingCount(0); return }

    const activityIds = myActivities.map(a => a.id)
    const { count } = await supabase
      .from('activity_requests')
      .select('id', { count: 'exact', head: true })
      .in('activity_id', activityIds)
      .eq('status', 'pending')

    setPendingCount(count ?? 0)
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

  return (
    <Routes>
      <Route
        path="/setup"
        element={
          profile
            ? <Navigate to="/feed" replace />
            : <ProfileFormPage userId={user.id} onSaved={setProfile} />
        }
      />
      <Route
        path="/profile/edit"
        element={
          profile
            ? <ProfileFormPage userId={user.id} existingProfile={profile} onSaved={setProfile} />
            : <Navigate to="/setup" replace />
        }
      />
      <Route
        path="/profile"
        element={
          profile
            ? <ProfilePage profile={profile} onSignOut={handleSignOut} />
            : <Navigate to="/setup" replace />
        }
      />
      <Route path="/feed" element={<FeedPage pendingCount={pendingCount} />} />
      <Route path="/create" element={<CreatePage userId={user.id} />} />
      <Route path="/activity/:id" element={<ActivityDetailPage userId={user.id} />} />
      <Route
        path="/my"
        element={
          profile
            ? <MyActivitiesPage userId={user.id} pendingCount={pendingCount} />
            : <Navigate to="/setup" replace />
        }
      />
      <Route
        path="*"
        element={<Navigate to={profile ? '/feed' : '/setup'} replace />}
      />
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
