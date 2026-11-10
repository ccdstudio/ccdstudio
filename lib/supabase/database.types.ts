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
          plan_id: string
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
          videos_fetched_at: string | null
          banner_url: string | null
          keywords: string[]
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
          videos_fetched_at?: string | null
          banner_url?: string | null
          keywords?: string[]
        }
        Update: Partial<Database["public"]["Tables"]["youtube_channels"]["Insert"]>
        Relationships: []
      }
      plans: {
        Row: { id: string; name: string; monthly_free_credits: number; is_active: boolean; created_at: string }
        Insert: { id: string; name: string; monthly_free_credits: number; is_active?: boolean }
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>
        Relationships: []
      }
      credit_balances: {
        Row: { user_id: string; free: number; purchased: number; updated_at: string }
        Insert: { user_id: string; free?: number; purchased?: number }
        Update: Partial<Database["public"]["Tables"]["credit_balances"]["Insert"]>
        Relationships: []
      }
      credit_ledger: {
        Row: {
          id: number
          user_id: string
          bucket: "free" | "purchased"
          amount: number
          reason: "monthly_reset" | "usage" | "adjustment" | "purchase" | "refund" | "migration"
          ref_id: string | null
          period: string | null
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      ai_generations: {
        Row: {
          id: string
          user_id: string
          feature: string
          prompt_version: string
          model: string
          input: Json
          output: Json
          tokens_in: number | null
          tokens_out: number | null
          credits_charged: number
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      youtube_videos: {
        Row: {
          id: string
          channel_id: string
          title: string
          published_at: string | null
          thumbnail_url: string | null
          duration_seconds: number | null
          is_short: boolean
          view_count: number | null
          like_count: number | null
          comment_count: number | null
          fetched_at: string
        }
        Insert: {
          id: string
          channel_id: string
          title?: string
          published_at?: string | null
          thumbnail_url?: string | null
          duration_seconds?: number | null
          is_short?: boolean
          view_count?: number | null
          like_count?: number | null
          comment_count?: number | null
          fetched_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["youtube_videos"]["Insert"]>
        Relationships: []
      }
      youtube_api_usage: {
        Row: { day: string; units_used: number; requests: number; updated_at: string }
        Insert: { day: string; units_used?: number; requests?: number }
        Update: Partial<Database["public"]["Tables"]["youtube_api_usage"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: AppRole }
      increment_youtube_usage: { Args: { units: number }; Returns: number }
      current_credit_period: { Args: Record<string, never>; Returns: string }
      grant_monthly_free_credits: { Args: { p_user: string; p_period: string }; Returns: undefined }
      reset_monthly_free_credits: { Args: Record<string, never>; Returns: number }
      record_generation: {
        Args: {
          p_user: string
          p_feature: string
          p_prompt_version: string
          p_model: string
          p_input: Json
          p_output: Json
          p_tokens_in: number
          p_tokens_out: number
          p_cost: number
        }
        Returns: string
      }
    }
    Enums: { app_role: AppRole }
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type YoutubeChannel = Database["public"]["Tables"]["youtube_channels"]["Row"]
export type YoutubeVideo = Database["public"]["Tables"]["youtube_videos"]["Row"]
export type AiGeneration = Database["public"]["Tables"]["ai_generations"]["Row"]
