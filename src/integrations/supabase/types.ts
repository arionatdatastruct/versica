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
      household_members: {
        Row: {
          birth_date: string | null
          canton: string | null
          created_at: string
          first_name: string
          gender: string | null
          household_id: string
          id: string
          is_self: boolean
          last_name: string | null
          notes: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          canton?: string | null
          created_at?: string
          first_name: string
          gender?: string | null
          household_id: string
          id?: string
          is_self?: boolean
          last_name?: string | null
          notes?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          canton?: string | null
          created_at?: string
          first_name?: string
          gender?: string | null
          household_id?: string
          id?: string
          is_self?: boolean
          last_name?: string | null
          notes?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          accident_coverage: boolean | null
          confirmed_at: string | null
          created_at: string
          file_mime: string | null
          file_path: string | null
          franchise: number | null
          id: string
          insurer: string | null
          kvg_accident_coverage: boolean | null
          kvg_franchise: number | null
          kvg_model: string | null
          kvg_monthly_premium: number | null
          member_id: string | null
          model: string | null
          monthly_premium: number | null
          ocr_confidence: Json | null
          ocr_error: string | null
          ocr_status: string
          owner_id: string
          policy_number: string | null
          policy_type: string | null
          raw_data: Json | null
          raw_text: string | null
          supplementary: string[] | null
          total_monthly_premium: number | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          vvg_products: Json | null
          vvg_total_monthly_premium: number | null
        }
        Insert: {
          accident_coverage?: boolean | null
          confirmed_at?: string | null
          created_at?: string
          file_mime?: string | null
          file_path?: string | null
          franchise?: number | null
          id?: string
          insurer?: string | null
          kvg_accident_coverage?: boolean | null
          kvg_franchise?: number | null
          kvg_model?: string | null
          kvg_monthly_premium?: number | null
          member_id?: string | null
          model?: string | null
          monthly_premium?: number | null
          ocr_confidence?: Json | null
          ocr_error?: string | null
          ocr_status?: string
          owner_id: string
          policy_number?: string | null
          policy_type?: string | null
          raw_data?: Json | null
          raw_text?: string | null
          supplementary?: string[] | null
          total_monthly_premium?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vvg_products?: Json | null
          vvg_total_monthly_premium?: number | null
        }
        Update: {
          accident_coverage?: boolean | null
          confirmed_at?: string | null
          created_at?: string
          file_mime?: string | null
          file_path?: string | null
          franchise?: number | null
          id?: string
          insurer?: string | null
          kvg_accident_coverage?: boolean | null
          kvg_franchise?: number | null
          kvg_model?: string | null
          kvg_monthly_premium?: number | null
          member_id?: string | null
          model?: string | null
          monthly_premium?: number | null
          ocr_confidence?: Json | null
          ocr_error?: string | null
          ocr_status?: string
          owner_id?: string
          policy_number?: string | null
          policy_type?: string | null
          raw_data?: Json | null
          raw_text?: string | null
          supplementary?: string[] | null
          total_monthly_premium?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vvg_products?: Json | null
          vvg_total_monthly_premium?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      is_household_owner: { Args: { _household_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
