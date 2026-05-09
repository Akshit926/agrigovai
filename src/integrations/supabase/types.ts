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
      applications: {
        Row: {
          admin_notes: string | null
          ai_completeness: Json | null
          ai_fraud: Json | null
          area_acres: number
          created_at: string
          crop: string
          document_urls: Json
          farmer_id: string
          id: string
          land_id: string
          priority_score: number
          scheme_id: string
          season: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_documents: string[]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          ai_completeness?: Json | null
          ai_fraud?: Json | null
          area_acres: number
          created_at?: string
          crop: string
          document_urls?: Json
          farmer_id: string
          id?: string
          land_id: string
          priority_score?: number
          scheme_id: string
          season?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_documents?: string[]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          ai_completeness?: Json | null
          ai_fraud?: Json | null
          area_acres?: number
          created_at?: string
          crop?: string
          document_urls?: Json
          farmer_id?: string
          id?: string
          land_id?: string
          priority_score?: number
          scheme_id?: string
          season?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_documents?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      grievances: {
        Row: {
          admin_response: string | null
          ai_category: string | null
          created_at: string
          description: string
          farmer_id: string
          id: string
          priority: Database["public"]["Enums"]["grievance_priority"]
          status: Database["public"]["Enums"]["grievance_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          ai_category?: string | null
          created_at?: string
          description: string
          farmer_id: string
          id?: string
          priority?: Database["public"]["Enums"]["grievance_priority"]
          status?: Database["public"]["Enums"]["grievance_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          ai_category?: string | null
          created_at?: string
          description?: string
          farmer_id?: string
          id?: string
          priority?: Database["public"]["Enums"]["grievance_priority"]
          status?: Database["public"]["Enums"]["grievance_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aadhaar_last4: string | null
          created_at: string
          district: string | null
          full_name: string | null
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          aadhaar_last4?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          aadhaar_last4?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      schemes: {
        Row: {
          active: boolean
          category: string
          code: string
          created_at: string
          description: string
          id: string
          max_amount: number | null
          name: string
          required_documents: string[]
        }
        Insert: {
          active?: boolean
          category: string
          code: string
          created_at?: string
          description: string
          id?: string
          max_amount?: number | null
          name: string
          required_documents?: string[]
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          max_amount?: number | null
          name?: string
          required_documents?: string[]
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
    }
    Enums: {
      app_role: "admin" | "farmer"
      application_status:
        | "submitted"
        | "docs_incomplete"
        | "fraud_flagged"
        | "under_review"
        | "field_verified"
        | "approved"
        | "rejected"
      grievance_priority: "low" | "medium" | "high"
      grievance_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["admin", "farmer"],
      application_status: [
        "submitted",
        "docs_incomplete",
        "fraud_flagged",
        "under_review",
        "field_verified",
        "approved",
        "rejected",
      ],
      grievance_priority: ["low", "medium", "high"],
      grievance_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
