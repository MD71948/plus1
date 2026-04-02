export interface Activity {
  id: string
  host_id: string
  title: string
  description: string | null
  category: string
  location_name: string
  address: string | null
  lat: number
  lng: number
  date_time: string
  spots_total: number
  spots_taken: number
  status: 'open' | 'full' | 'cancelled'
  vibe: 'Chill' | 'Kompetitiv' | 'Abenteuer' | 'Kultur' | 'Party' | null
  created_at: string
  updated_at: string
}

export interface ActivityRequest {
  id: string
  activity_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  message: string | null
  created_at: string
  updated_at: string
}

export interface ActivityRequestWithProfile extends ActivityRequest {
  profile: UserProfile
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  bio: string | null
  avatar_url: string | null
  interests: string[]
  custom_interests: string[]
  district: string | null
  postal_code: string | null
  city: string | null
  age: number | null
  languages: string[]
  lat: number | null
  lng: number | null
  activities_count: number
  show_up_score: number
  ratings_count: number
  created_at: string
  updated_at: string
}

export interface ActivityRating {
  id: string
  activity_id: string
  rater_id: string
  rated_user_id: string
  is_positive: boolean
  created_at: string
}

export interface ChatMessage {
  id: string
  activity_id: string
  user_id: string
  content: string
  created_at: string
}

export interface ChatMessageWithProfile extends ChatMessage {
  profile: UserProfile | null
}
