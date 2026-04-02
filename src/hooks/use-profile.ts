import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { type UserProfile } from '../types'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [userId])

  return { profile, loading, setProfile }
}
