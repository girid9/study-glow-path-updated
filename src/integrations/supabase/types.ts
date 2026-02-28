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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      battle_answers: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          question_id: string
          room_id: string
          selected_index: number
          time_taken_ms: number | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          room_id: string
          selected_index: number
          time_taken_ms?: number | null
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          room_id?: string
          selected_index?: number
          time_taken_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "battle_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_players: {
        Row: {
          display_name: string
          id: string
          is_host: boolean
          joined_at: string
          room_id: string
          score: number
          user_id: string
        }
        Insert: {
          display_name: string
          id?: string
          is_host?: boolean
          joined_at?: string
          room_id: string
          score?: number
          user_id: string
        }
        Update: {
          display_name?: string
          id?: string
          is_host?: boolean
          joined_at?: string
          room_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "battle_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_rooms: {
        Row: {
          code: string
          created_at: string
          current_index: number
          host_user_id: string
          id: string
          question_count: number
          question_order: Json
          question_started_at: string | null
          random_seed: number
          seconds_per_question: number
          shuffle_options: boolean
          status: string
          topic_id: string
        }
        Insert: {
          code: string
          created_at?: string
          current_index?: number
          host_user_id: string
          id?: string
          question_count?: number
          question_order?: Json
          question_started_at?: string | null
          random_seed?: number
          seconds_per_question?: number
          shuffle_options?: boolean
          status?: string
          topic_id?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_index?: number
          host_user_id?: string
          id?: string
          question_count?: number
          question_order?: Json
          question_started_at?: string | null
          random_seed?: number
          seconds_per_question?: number
          shuffle_options?: boolean
          status?: string
          topic_id?: string
        }
        Relationships: []
      }
      player_answers: {
        Row: {
          answered_at: string
          chosen_answer: string
          id: string
          is_correct: boolean
          player_id: string
          question_index: number
          room_id: string
        }
        Insert: {
          answered_at?: string
          chosen_answer: string
          id?: string
          is_correct?: boolean
          player_id: string
          question_index: number
          room_id: string
        }
        Update: {
          answered_at?: string
          chosen_answer?: string
          id?: string
          is_correct?: boolean
          player_id?: string
          question_index?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_color: string
          current_question: number
          display_name: string
          id: string
          is_bot: boolean
          is_host: boolean
          is_ready: boolean
          joined_at: string
          room_id: string
          score: number
          session_id: string | null
        }
        Insert: {
          avatar_color?: string
          current_question?: number
          display_name: string
          id?: string
          is_bot?: boolean
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string
          room_id: string
          score?: number
          session_id?: string | null
        }
        Update: {
          avatar_color?: string
          current_question?: number
          display_name?: string
          id?: string
          is_bot?: boolean
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string
          room_id?: string
          score?: number
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          display_name: string
          id: string
          last_quiz_date: string | null
          longest_streak: number
          quizzes_completed: number
          total_xp: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string
          id: string
          last_quiz_date?: string | null
          longest_streak?: number
          quizzes_completed?: number
          total_xp?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string
          id?: string
          last_quiz_date?: string | null
          longest_streak?: number
          quizzes_completed?: number
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      review_items: {
        Row: {
          correct_answer: string
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          next_review_at: string
          question_text: string
          review_count: number
          subject_id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          next_review_at?: string
          question_text: string
          review_count?: number
          subject_id: string
          topic_id: string
          user_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          next_review_at?: string
          question_text?: string
          review_count?: number
          subject_id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          finished_at: string | null
          id: string
          max_players: number
          started_at: string | null
          status: string
          subject_id: string
          topic_id: string
        }
        Insert: {
          code: string
          created_at?: string
          finished_at?: string | null
          id?: string
          max_players?: number
          started_at?: string | null
          status?: string
          subject_id: string
          topic_id: string
        }
        Update: {
          code?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          max_players?: number
          started_at?: string | null
          status?: string
          subject_id?: string
          topic_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_battle_room_member: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
