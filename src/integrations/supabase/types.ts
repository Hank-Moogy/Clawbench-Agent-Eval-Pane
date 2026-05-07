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
      app_settings: {
        Row: {
          agent_runner_api_url: string | null
          api_mode: string
          created_at: string
          id: string
          model_display_names: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_runner_api_url?: string | null
          api_mode?: string
          created_at?: string
          id?: string
          model_display_names?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_runner_api_url?: string | null
          api_mode?: string
          created_at?: string
          id?: string
          model_display_names?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      dataset_exports: {
        Row: {
          avg_quality_score: number | null
          created_at: string
          example_count: number | null
          format: string
          id: string
          jsonl_preview: string | null
          name: string | null
          selected_run_ids: Json
          user_id: string | null
        }
        Insert: {
          avg_quality_score?: number | null
          created_at?: string
          example_count?: number | null
          format: string
          id?: string
          jsonl_preview?: string | null
          name?: string | null
          selected_run_ids?: Json
          user_id?: string | null
        }
        Update: {
          avg_quality_score?: number | null
          created_at?: string
          example_count?: number | null
          format?: string
          id?: string
          jsonl_preview?: string | null
          name?: string | null
          selected_run_ids?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      eval_runs: {
        Row: {
          actionability: number | null
          agent_utility: number | null
          completeness: number | null
          correctness: number | null
          cost_per_quality_point: number | null
          created_at: string
          efficiency_score: number | null
          estimated_cost: number | null
          format_reliability: number | null
          id: string
          input_tokens: number | null
          is_winner: boolean
          json_valid: boolean | null
          judge_explanation: string | null
          latency_ms: number | null
          model_display_name: string | null
          model_id: string
          output: string | null
          output_tokens: number | null
          quality_score: number | null
          recommendation_reason: string | null
          reliability_status: string | null
          status: string
          task_id: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          actionability?: number | null
          agent_utility?: number | null
          completeness?: number | null
          correctness?: number | null
          cost_per_quality_point?: number | null
          created_at?: string
          efficiency_score?: number | null
          estimated_cost?: number | null
          format_reliability?: number | null
          id?: string
          input_tokens?: number | null
          is_winner?: boolean
          json_valid?: boolean | null
          judge_explanation?: string | null
          latency_ms?: number | null
          model_display_name?: string | null
          model_id: string
          output?: string | null
          output_tokens?: number | null
          quality_score?: number | null
          recommendation_reason?: string | null
          reliability_status?: string | null
          status?: string
          task_id: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          actionability?: number | null
          agent_utility?: number | null
          completeness?: number | null
          correctness?: number | null
          cost_per_quality_point?: number | null
          created_at?: string
          efficiency_score?: number | null
          estimated_cost?: number | null
          format_reliability?: number | null
          id?: string
          input_tokens?: number | null
          is_winner?: boolean
          json_valid?: boolean | null
          judge_explanation?: string | null
          latency_ms?: number | null
          model_display_name?: string | null
          model_id?: string
          output?: string | null
          output_tokens?: number | null
          quality_score?: number | null
          recommendation_reason?: string | null
          reliability_status?: string | null
          status?: string
          task_id?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "eval_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_tasks: {
        Row: {
          created_at: string
          id: string
          max_tokens: number | null
          mode: string
          prompt: string
          require_json: boolean
          selected_models: Json
          strategy: string
          task_type: string
          timeout_seconds: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          max_tokens?: number | null
          mode?: string
          prompt: string
          require_json?: boolean
          selected_models?: Json
          strategy: string
          task_type: string
          timeout_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          max_tokens?: number | null
          mode?: string
          prompt?: string
          require_json?: boolean
          selected_models?: Json
          strategy?: string
          task_type?: string
          timeout_seconds?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      routing_rules: {
        Row: {
          confidence_threshold: number | null
          created_at: string
          escalation_condition: string | null
          fallback_model: string | null
          id: string
          primary_model: string
          strategy: string | null
          supporting_eval_count: number
          task_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          confidence_threshold?: number | null
          created_at?: string
          escalation_condition?: string | null
          fallback_model?: string | null
          id?: string
          primary_model: string
          strategy?: string | null
          supporting_eval_count?: number
          task_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confidence_threshold?: number | null
          created_at?: string
          escalation_condition?: string | null
          fallback_model?: string | null
          id?: string
          primary_model?: string
          strategy?: string | null
          supporting_eval_count?: number
          task_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
