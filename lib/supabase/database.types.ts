// Tipos do schema public. Regenerar com `npm run db:types` após novas migrations.
export type AppRole = "superadmin" | "admin" | "user"

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
          created_by?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: AppRole }
    }
    Enums: { app_role: AppRole }
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
