// Tipos do schema public. Mantidos à mão em sincronia com supabase/migrations.
export type AppRole = "superadmin" | "admin" | "user"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: AppRole
          is_active: boolean
          must_change_password: boolean
          youtube_channel_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          role?: AppRole
          is_active?: boolean
          must_change_password?: boolean
          youtube_channel_id?: string | null
          created_by?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      youtube_channels: {
        Row: {
          id: string
          handle: string | null
          title: string
          description: string
          thumbnail_url: string | null
          country: string | null
          published_at: string | null
          uploads_playlist_id: string | null
          subscriber_count: number | null
          view_count: number | null
          video_count: number | null
          raw: Json
          fetched_at: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          handle?: string | null
          title?: string
          description?: string
          thumbnail_url?: string | null
          country?: string | null
          published_at?: string | null
          uploads_playlist_id?: string | null
          subscriber_count?: number | null
          view_count?: number | null
          video_count?: number | null
          raw?: Json
          fetched_at?: string
          expires_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["youtube_channels"]["Insert"]>
        Relationships: []
      }
      youtube_api_usage: {
        Row: { day: string; units_used: number }
        Insert: { day: string; units_used?: number }
        Update: Partial<Database["public"]["Tables"]["youtube_api_usage"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: AppRole }
      increment_youtube_usage: { Args: { units: number }; Returns: number }
    }
    Enums: { app_role: AppRole }
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type YoutubeChannel = Database["public"]["Tables"]["youtube_channels"]["Row"]
