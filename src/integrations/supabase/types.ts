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
      ai_insights: {
        Row: {
          created_at: string
          id: string
          insight_type: Database["public"]["Enums"]["insight_type"]
          model: string | null
          prompt: string | null
          response: string
          stock_id: string
          tokens_used: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          insight_type: Database["public"]["Enums"]["insight_type"]
          model?: string | null
          prompt?: string | null
          response: string
          stock_id: string
          tokens_used?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          insight_type?: Database["public"]["Enums"]["insight_type"]
          model?: string | null
          prompt?: string | null
          response?: string
          stock_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          condition_text: string | null
          condition_value: number | null
          created_at: string
          id: string
          is_active: boolean
          is_read: boolean
          is_triggered: boolean
          message: string | null
          stock_id: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          condition_text?: string | null
          condition_value?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_read?: boolean
          is_triggered?: boolean
          message?: string | null
          stock_id: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          condition_text?: string | null
          condition_value?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_read?: boolean
          is_triggered?: boolean
          message?: string | null
          stock_id?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          fetched_at: string
          headline: string
          id: string
          published_at: string | null
          sentiment: string | null
          sentiment_score: number | null
          source: string
          stock_id: string
          summary: string | null
          url: string | null
        }
        Insert: {
          fetched_at?: string
          headline: string
          id?: string
          published_at?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          source: string
          stock_id: string
          summary?: string | null
          url?: string | null
        }
        Update: {
          fetched_at?: string
          headline?: string
          id?: string
          published_at?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          source?: string
          stock_id?: string
          summary?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          stock_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          stock_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          stock_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_prices: {
        Row: {
          change_amount: number | null
          change_percent: number | null
          fetched_at: string
          high_52w: number | null
          id: string
          low_52w: number | null
          market_cap: number | null
          price: number
          source: string
          stock_id: string
          volume: number | null
        }
        Insert: {
          change_amount?: number | null
          change_percent?: number | null
          fetched_at?: string
          high_52w?: number | null
          id?: string
          low_52w?: number | null
          market_cap?: number | null
          price: number
          source?: string
          stock_id: string
          volume?: number | null
        }
        Update: {
          change_amount?: number | null
          change_percent?: number | null
          fetched_at?: string
          high_52w?: number | null
          id?: string
          low_52w?: number | null
          market_cap?: number | null
          price?: number
          source?: string
          stock_id?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_prices_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          added_at: string
          id: string
          name: string | null
          sector: string | null
          ticker: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          name?: string | null
          sector?: string | null
          ticker: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          name?: string | null
          sector?: string | null
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_stock: {
        Args: { _stock_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_type:
        | "price_drop"
        | "price_spike"
        | "near_low"
        | "near_high"
        | "unusual_volume"
        | "news_spike"
      insight_type:
        | "news_summary"
        | "movement_explanation"
        | "sentiment_analysis"
        | "qa_response"
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
      alert_type: [
        "price_drop",
        "price_spike",
        "near_low",
        "near_high",
        "unusual_volume",
        "news_spike",
      ],
      insight_type: [
        "news_summary",
        "movement_explanation",
        "sentiment_analysis",
        "qa_response",
      ],
    },
  },
} as const
