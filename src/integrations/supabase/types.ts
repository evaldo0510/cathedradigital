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
      app_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
        }
        Relationships: []
      }
      bible_chapters_read: {
        Row: {
          book_abbr: string
          chapter: number
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          book_abbr: string
          chapter: number
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          book_abbr?: string
          chapter?: number
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      catechism_cache: {
        Row: {
          content: string
          created_at: string
          id: string
          paragraph: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          paragraph: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          paragraph?: number
        }
        Relationships: []
      }
      catechism_paragraphs_read: {
        Row: {
          id: string
          paragraph: number
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          paragraph: number
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          paragraph?: number
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      colloquium_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      colloquium_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "colloquium_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "colloquium_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_id: string | null
          status: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          updated_at?: string
        }
        Relationships: []
      }
      glossary: {
        Row: {
          category: string | null
          created_at: string
          definition: string
          id: string
          journey_id: string | null
          language: string
          term: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          definition: string
          id?: string
          journey_id?: string | null
          language?: string
          term: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          definition?: string
          id?: string
          journey_id?: string | null
          language?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligent_notification_logs: {
        Row: {
          channel: string
          content: string
          id: string
          metadata: Json | null
          sent_at: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          channel: string
          content: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      journey_progress: {
        Row: {
          completed_at: string
          id: string
          journey_id: string
          reflection: string | null
          step_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          journey_id: string
          reflection?: string | null
          step_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          journey_id?: string
          reflection?: string | null
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_progress_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          content: Json
          created_at: string
          duration_minutes: number
          id: string
          is_free: boolean
          journey_id: string
          step_order: number
          step_type: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          duration_minutes?: number
          id?: string
          is_free?: boolean
          journey_id: string
          step_order?: number
          step_type?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          duration_minutes?: number
          id?: string
          is_free?: boolean
          journey_id?: string
          step_order?: number
          step_type?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          category: string
          cover_url: string | null
          created_at: string
          description: string
          difficulty: string
          estimated_days: number
          icon: string
          id: string
          is_active: boolean
          is_premium: boolean
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string
          difficulty?: string
          estimated_days?: number
          icon?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string
          difficulty?: string
          estimated_days?: number
          icon?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          source_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          source_user_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          source_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: string[] | null
          bio: string | null
          completed_books: string[] | null
          created_at: string
          diocese: string | null
          estado: string | null
          id: string
          is_premium: boolean
          last_action_at: string | null
          last_notified_at: string | null
          last_visit: string | null
          level: number | null
          movimento_pastoral: string | null
          name: string
          paroquia: string | null
          push_enabled: boolean | null
          role: string | null
          streak: number | null
          total_minutes_read: number | null
          updated_at: string
          whatsapp_enabled: boolean | null
          whatsapp_number: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          completed_books?: string[] | null
          created_at?: string
          diocese?: string | null
          estado?: string | null
          id: string
          is_premium?: boolean
          last_action_at?: string | null
          last_notified_at?: string | null
          last_visit?: string | null
          level?: number | null
          movimento_pastoral?: string | null
          name?: string
          paroquia?: string | null
          push_enabled?: boolean | null
          role?: string | null
          streak?: number | null
          total_minutes_read?: number | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          completed_books?: string[] | null
          created_at?: string
          diocese?: string | null
          estado?: string | null
          id?: string
          is_premium?: boolean
          last_action_at?: string | null
          last_notified_at?: string | null
          last_visit?: string | null
          level?: number | null
          movimento_pastoral?: string | null
          name?: string
          paroquia?: string | null
          push_enabled?: boolean | null
          role?: string | null
          streak?: number | null
          total_minutes_read?: number | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spiritual_journal: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          journey_id: string | null
          mood: string | null
          step_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          journey_id?: string | null
          mood?: string | null
          step_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          journey_id?: string | null
          mood?: string | null
          step_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spiritual_journal_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spiritual_journal_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_contents: {
        Row: {
          content_type: string
          created_at: string
          id: string
          reference: string
          text_content: string | null
          theme_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          reference: string
          text_content?: string | null
          theme_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          reference?: string
          text_content?: string | null
          theme_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_contents_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      trail_progress: {
        Row: {
          completed_at: string
          id: string
          step_index: number
          trail_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          step_index: number
          trail_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          step_index?: number
          trail_id?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_management_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_emotions: {
        Row: {
          context_text: string | null
          created_at: string
          emotion_type: string
          id: string
          score: number
          source_feature: string | null
          user_id: string
        }
        Insert: {
          context_text?: string | null
          created_at?: string
          emotion_type: string
          id?: string
          score?: number
          source_feature?: string | null
          user_id: string
        }
        Update: {
          context_text?: string | null
          created_at?: string
          emotion_type?: string
          id?: string
          score?: number
          source_feature?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_history: {
        Row: {
          id: string
          image_url: string | null
          route: string
          title: string
          user_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          image_url?: string | null
          route: string
          title: string
          user_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          image_url?: string | null
          route?: string
          title?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          highlight_color: string | null
          id: string
          note_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          highlight_color?: string | null
          id?: string
          note_text?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          highlight_color?: string | null
          id?: string
          note_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_psychological_profiles: {
        Row: {
          created_at: string
          dominant_emotion: string | null
          id: string
          last_updated: string
          mood_history: Json | null
          traits: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dominant_emotion?: string | null
          id?: string
          last_updated?: string
          mood_history?: Json | null
          traits?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          dominant_emotion?: string | null
          id?: string
          last_updated?: string
          mood_history?: Json | null
          traits?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sensitive_data: {
        Row: {
          created_at: string
          diagnosis_result: Json | null
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosis_result?: Json | null
          email?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosis_result?: Json | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          is_premium: boolean | null
          name: string | null
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          is_premium?: boolean | null
          name?: string | null
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          is_premium?: boolean | null
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      user_management_stats: {
        Row: {
          classification: string | null
          created_at: string | null
          current_journey: string | null
          email: string | null
          id: string | null
          last_activity: string | null
          name: string | null
          plan: string | null
          reflections_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_update_own_profile: {
        Args: {
          _email: string
          _is_premium: boolean
          _profile_id: string
          _role: string
        }
        Returns: boolean
      }
      get_latest_journey_title: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
