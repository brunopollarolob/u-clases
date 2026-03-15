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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      class_requests: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: number
          status: string
          student_id: number
          student_note: string | null
          tutor_profile_id: number
          tutor_response: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: number
          status?: string
          student_id: number
          student_note?: string | null
          tutor_profile_id: number
          tutor_response?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: number
          status?: string
          student_id?: number
          student_note?: string | null
          tutor_profile_id?: number
          tutor_response?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_requests_tutor_profile_id_fkey"
            columns: ["tutor_profile_id"]
            isOneToOne: false
            referencedRelation: "tutor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      favorite_tutors: {
        Row: {
          created_at: string
          student_id: number
          tutor_profile_id: number
        }
        Insert: {
          created_at?: string
          student_id: number
          tutor_profile_id: number
        }
        Update: {
          created_at?: string
          student_id?: number
          tutor_profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "favorite_tutors_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_tutors_tutor_profile_id_fkey"
            columns: ["tutor_profile_id"]
            isOneToOne: false
            referencedRelation: "tutor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: number
          product_name: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: number
          product_name?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: number
          product_name?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          course_id: string | null
          comment: string | null
          created_at: string
          id: number
          rating: number
          student_id: number
          tutor_id: number
        }
        Insert: {
          course_id?: string | null
          comment?: string | null
          created_at?: string
          id?: number
          rating: number
          student_id: number
          tutor_id: number
        }
        Update: {
          course_id?: string | null
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number
          student_id?: number
          tutor_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_courses: {
        Row: {
          course_id: string
          tutor_profile_id: number
        }
        Insert: {
          course_id: string
          tutor_profile_id: number
        }
        Update: {
          course_id?: string
          tutor_profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tutor_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_courses_tutor_profile_id_fkey"
            columns: ["tutor_profile_id"]
            isOneToOne: false
            referencedRelation: "tutor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_profiles: {
        Row: {
          bio: string | null
          class_duration_minutes: number | null
          class_price: number | null
          contact_info: string | null
          created_at: string
          hourly_rate: number | null
          id: number
          is_active: boolean
          summary_long: string | null
          summary_short: string | null
          updated_at: string
          user_id: number
        }
        Insert: {
          bio?: string | null
          class_duration_minutes?: number | null
          class_price?: number | null
          contact_info?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: number
          is_active?: boolean
          summary_long?: string | null
          summary_short?: string | null
          updated_at?: string
          user_id: number
        }
        Update: {
          bio?: string | null
          class_duration_minutes?: number | null
          class_price?: number | null
          contact_info?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: number
          is_active?: boolean
          summary_long?: string | null
          summary_short?: string | null
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tutor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          academic_year: number | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          has_access: boolean
          id: number
          is_graduated: boolean
          phone: string | null
          request_notifications_seen_at: string | null
          review_notifications_seen_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialization: string | null
          stripe_customer_id: string | null
          supabase_user_id: string
          updated_at: string
        }
        Insert: {
          academic_year?: number | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          has_access?: boolean
          id?: number
          is_graduated?: boolean
          phone?: string | null
          request_notifications_seen_at?: string | null
          review_notifications_seen_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
          stripe_customer_id?: string | null
          supabase_user_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: number | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          has_access?: boolean
          id?: number
          is_graduated?: boolean
          phone?: string | null
          request_notifications_seen_at?: string | null
          review_notifications_seen_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
          stripe_customer_id?: string | null
          supabase_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile: { Args: never; Returns: undefined }
    }
    Enums: {
      user_role: "student" | "tutor"
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
      user_role: ["student", "tutor"],
    },
  },
} as const

// Convenience aliases used across the app.
export type User = Tables<'users'>
export type Purchase = Tables<'purchases'>
