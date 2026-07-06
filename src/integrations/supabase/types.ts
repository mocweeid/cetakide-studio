export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_key_events: {
        Row: {
          created_at: string
          detail: string | null
          event: string
          id: string
          provider_id: string | null
          status_code: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          event: string
          id?: string
          provider_id?: string | null
          status_code?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          event?: string
          id?: string
          provider_id?: string | null
          status_code?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_key_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          api_key_masked: string | null
          created_at: string
          details: Json | null
          id: string
          label: string | null
          model: string | null
          provider: string | null
          provider_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          api_key_masked?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          label?: string | null
          model?: string | null
          provider?: string | null
          provider_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          api_key_masked?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          label?: string | null
          model?: string | null
          provider?: string | null
          provider_id?: string | null
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          api_key: string
          created_at: string
          disabled_until: string | null
          failure_count: number
          id: string
          is_active: boolean
          label: string | null
          last_status: string | null
          last_used_at: string | null
          model: string
          priority: number
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          disabled_until?: string | null
          failure_count?: number
          id?: string
          is_active?: boolean
          label?: string | null
          last_status?: string | null
          last_used_at?: string | null
          model: string
          priority?: number
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          disabled_until?: string | null
          failure_count?: number
          id?: string
          is_active?: boolean
          label?: string | null
          last_status?: string | null
          last_used_at?: string | null
          model?: string
          priority?: number
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          content: string | null
          cover_url: string | null
          created_at: string
          id: string
          published: boolean
          slug: string
          title: string
        }
        Insert: {
          content?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          published?: boolean
          slug: string
          title: string
        }
        Update: {
          content?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          published?: boolean
          slug?: string
          title?: string
        }
        Relationships: []
      }
      brand_kits: {
        Row: {
          accent_color: string | null
          background_color: string | null
          brand_voice: string | null
          created_at: string
          id: string
          is_default: boolean
          logo_url: string | null
          name: string
          primary_color: string | null
          primary_font: string | null
          secondary_color: string | null
          secondary_font: string | null
          text_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          brand_voice?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string | null
          primary_font?: string | null
          secondary_color?: string | null
          secondary_font?: string | null
          text_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          brand_voice?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          primary_font?: string | null
          secondary_color?: string | null
          secondary_font?: string | null
          text_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          saldo: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          saldo?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          saldo?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          aspect_ratio: string
          body_content: string | null
          created_at: string
          id: string
          image_url: string | null
          kebutuhan: string
          platform: string
          prompt: string | null
          reference_url: string | null
          social_url: string | null
          status: string
          subtitle: string | null
          title: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          aspect_ratio?: string
          body_content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kebutuhan: string
          platform?: string
          prompt?: string | null
          reference_url?: string | null
          social_url?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          aspect_ratio?: string
          body_content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kebutuhan?: string
          platform?: string
          prompt?: string | null
          reference_url?: string | null
          social_url?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      references_lib: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          status: string
          transaction_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          status?: string
          transaction_code?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          status?: string
          transaction_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      potong_saldo_generate: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "user_starter" | "developer" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user_starter", "developer", "admin"],
    },
  },
} as const
