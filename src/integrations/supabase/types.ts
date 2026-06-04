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
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          properties: Json | null
          session_id: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      audit_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          path: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          path?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          path?: string | null
          user_id?: string | null
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
          aplicacao_pratica: string | null
          content: string
          created_at: string
          exercicio: string | null
          explicacao: string | null
          id: string
          interpretacao_profunda: string | null
          last_error: string | null
          paragraph: number
          reflexao_final: string | null
          retry_count: number | null
          status: string | null
          texto_base: string | null
        }
        Insert: {
          aplicacao_pratica?: string | null
          content: string
          created_at?: string
          exercicio?: string | null
          explicacao?: string | null
          id?: string
          interpretacao_profunda?: string | null
          last_error?: string | null
          paragraph: number
          reflexao_final?: string | null
          retry_count?: number | null
          status?: string | null
          texto_base?: string | null
        }
        Update: {
          aplicacao_pratica?: string | null
          content?: string
          created_at?: string
          exercicio?: string | null
          explicacao?: string | null
          id?: string
          interpretacao_profunda?: string | null
          last_error?: string | null
          paragraph?: number
          reflexao_final?: string | null
          retry_count?: number | null
          status?: string | null
          texto_base?: string | null
        }
        Relationships: []
      }
      catechism_execution_logs: {
        Row: {
          admin_id: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          paragraph: number
          start_time: string | null
          status: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          paragraph: number
          start_time?: string | null
          status?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          paragraph?: number
          start_time?: string | null
          status?: string | null
        }
        Relationships: []
      }
      catechism_official: {
        Row: {
          aplicacao_pratica: string | null
          content: string
          created_at: string | null
          exercicio: string | null
          explicacao: string | null
          interpretacao_profunda: string | null
          paragraph: number
          reflexao_final: string | null
          texto_base: string | null
        }
        Insert: {
          aplicacao_pratica?: string | null
          content: string
          created_at?: string | null
          exercicio?: string | null
          explicacao?: string | null
          interpretacao_profunda?: string | null
          paragraph: number
          reflexao_final?: string | null
          texto_base?: string | null
        }
        Update: {
          aplicacao_pratica?: string | null
          content?: string
          created_at?: string | null
          exercicio?: string | null
          explicacao?: string | null
          interpretacao_profunda?: string | null
          paragraph?: number
          reflexao_final?: string | null
          texto_base?: string | null
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
          metadata: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
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
      coming_soon_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          interest_type: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          interest_type?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          interest_type?: string | null
        }
        Relationships: []
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
      construction_data: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          actual_value: number | null
          category: string | null
          created_at: string
          id: string
          item_name: string
          planned_end_date: string | null
          planned_start_date: string | null
          planned_value: number | null
          progress: number | null
          project_id: string
          type: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          actual_value?: number | null
          category?: string | null
          created_at?: string
          id?: string
          item_name: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          planned_value?: number | null
          progress?: number | null
          project_id: string
          type: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          actual_value?: number | null
          category?: string | null
          created_at?: string
          id?: string
          item_name?: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          planned_value?: number | null
          progress?: number | null
          project_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "construction_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_tags: {
        Row: {
          content_id: string
          tag_id: string
        }
        Insert: {
          content_id: string
          tag_id: string
        }
        Update: {
          content_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "spiritual_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
          bible_verses: string[] | null
          catechism_references: string[] | null
          category: string | null
          created_at: string
          deep_interpretation: string | null
          definition: string
          id: string
          journey_id: string | null
          language: string
          magisterium_references: string[] | null
          practical_application: string | null
          reference: string | null
          term: string
          updated_at: string
        }
        Insert: {
          bible_verses?: string[] | null
          catechism_references?: string[] | null
          category?: string | null
          created_at?: string
          deep_interpretation?: string | null
          definition: string
          id?: string
          journey_id?: string | null
          language?: string
          magisterium_references?: string[] | null
          practical_application?: string | null
          reference?: string | null
          term: string
          updated_at?: string
        }
        Update: {
          bible_verses?: string[] | null
          catechism_references?: string[] | null
          category?: string | null
          created_at?: string
          deep_interpretation?: string | null
          definition?: string
          id?: string
          journey_id?: string | null
          language?: string
          magisterium_references?: string[] | null
          practical_application?: string | null
          reference?: string | null
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
          {
            foreignKeyName: "glossary_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "view_journeys_with_stats"
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
      itineraria: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          estimated_days: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          sort_order: number | null
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          estimated_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          estimated_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      itineraria_progress: {
        Row: {
          completed_at: string
          id: string
          itinerarium_id: string
          reflection: string | null
          step_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          itinerarium_id: string
          reflection?: string | null
          step_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          itinerarium_id?: string
          reflection?: string | null
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraria_progress_itinerarium_id_fkey"
            columns: ["itinerarium_id"]
            isOneToOne: false
            referencedRelation: "itineraria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraria_progress_itinerarium_id_fkey"
            columns: ["itinerarium_id"]
            isOneToOne: false
            referencedRelation: "view_itineraria_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraria_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "itineraria_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraria_steps: {
        Row: {
          content: Json
          created_at: string
          duration_minutes: number | null
          id: string
          is_free: boolean | null
          itinerarium_id: string
          step_order: number
          step_type: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          itinerarium_id: string
          step_order?: number
          step_type?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          itinerarium_id?: string
          step_order?: number
          step_type?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraria_steps_itinerarium_id_fkey"
            columns: ["itinerarium_id"]
            isOneToOne: false
            referencedRelation: "itineraria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraria_steps_itinerarium_id_fkey"
            columns: ["itinerarium_id"]
            isOneToOne: false
            referencedRelation: "view_itineraria_with_stats"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "journey_progress_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "view_journeys_with_stats"
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
          {
            foreignKeyName: "journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "view_journeys_with_stats"
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
          tags: string[] | null
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
          tags?: string[] | null
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
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      nexus_synonyms: {
        Row: {
          canonical_slug: string
          created_at: string
          id: string
          term: string
          updated_at: string
        }
        Insert: {
          canonical_slug: string
          created_at?: string
          id?: string
          term: string
          updated_at?: string
        }
        Update: {
          canonical_slug?: string
          created_at?: string
          id?: string
          term?: string
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
          contemplative_preferences: Json | null
          created_at: string
          diocese: string | null
          estado: string | null
          id: string
          is_premium: boolean
          journey_reminder_time: string | null
          last_action_at: string | null
          last_active_at: string | null
          last_notified_at: string | null
          last_reminder_sent_at: string | null
          last_visit: string | null
          level: number | null
          max_streak: number | null
          mercado_pago_subscription_id: string | null
          movimento_pastoral: string | null
          name: string
          notification_settings: Json | null
          paroquia: string | null
          preferred_reminder_time: string | null
          premium_expires_at: string | null
          premium_status: string | null
          program_duration: number | null
          reading_settings: Json | null
          ritual_reminder_time: string | null
          ritual_silent_mode: boolean | null
          role: string | null
          spiritual_themes: string[] | null
          streak: number | null
          total_minutes_read: number | null
          updated_at: string
          weekly_goal: number | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          completed_books?: string[] | null
          contemplative_preferences?: Json | null
          created_at?: string
          diocese?: string | null
          estado?: string | null
          id: string
          is_premium?: boolean
          journey_reminder_time?: string | null
          last_action_at?: string | null
          last_active_at?: string | null
          last_notified_at?: string | null
          last_reminder_sent_at?: string | null
          last_visit?: string | null
          level?: number | null
          max_streak?: number | null
          mercado_pago_subscription_id?: string | null
          movimento_pastoral?: string | null
          name?: string
          notification_settings?: Json | null
          paroquia?: string | null
          preferred_reminder_time?: string | null
          premium_expires_at?: string | null
          premium_status?: string | null
          program_duration?: number | null
          reading_settings?: Json | null
          ritual_reminder_time?: string | null
          ritual_silent_mode?: boolean | null
          role?: string | null
          spiritual_themes?: string[] | null
          streak?: number | null
          total_minutes_read?: number | null
          updated_at?: string
          weekly_goal?: number | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          completed_books?: string[] | null
          contemplative_preferences?: Json | null
          created_at?: string
          diocese?: string | null
          estado?: string | null
          id?: string
          is_premium?: boolean
          journey_reminder_time?: string | null
          last_action_at?: string | null
          last_active_at?: string | null
          last_notified_at?: string | null
          last_reminder_sent_at?: string | null
          last_visit?: string | null
          level?: number | null
          max_streak?: number | null
          mercado_pago_subscription_id?: string | null
          movimento_pastoral?: string | null
          name?: string
          notification_settings?: Json | null
          paroquia?: string | null
          preferred_reminder_time?: string | null
          premium_expires_at?: string | null
          premium_status?: string | null
          program_duration?: number | null
          reading_settings?: Json | null
          ritual_reminder_time?: string | null
          ritual_silent_mode?: boolean | null
          role?: string | null
          spiritual_themes?: string[] | null
          streak?: number | null
          total_minutes_read?: number | null
          updated_at?: string
          weekly_goal?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      profiles_private: {
        Row: {
          created_at: string | null
          id: string
          push_enabled: boolean | null
          updated_at: string | null
          whatsapp_enabled: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          push_enabled?: boolean | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          push_enabled?: boolean | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_management_stats"
            referencedColumns: ["id"]
          },
        ]
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
      quiz_results: {
        Row: {
          created_at: string
          id: string
          percentage: number
          score: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          percentage: number
          score: number
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          percentage?: number
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      reading_marks: {
        Row: {
          chapter: number | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          is_last_read: boolean | null
          label: string | null
          paragraph: number | null
          position: number | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          chapter?: number | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          is_last_read?: boolean | null
          label?: string | null
          paragraph?: number | null
          position?: number | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          chapter?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          is_last_read?: boolean | null
          label?: string | null
          paragraph?: number | null
          position?: number | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_reflections: {
        Row: {
          content: string | null
          context_id: string | null
          created_at: string
          id: string
          reading_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          context_id?: string | null
          created_at?: string
          id?: string
          reading_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          context_id?: string | null
          created_at?: string
          id?: string
          reading_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ritual_progress: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          id: string
          progress_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          progress_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          progress_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rls_test_results: {
        Row: {
          details: string | null
          id: string
          run_at: string
          status: string
          test_name: string
        }
        Insert: {
          details?: string | null
          id?: string
          run_at?: string
          status: string
          test_name: string
        }
        Update: {
          details?: string | null
          id?: string
          run_at?: string
          status?: string
          test_name?: string
        }
        Relationships: []
      }
      saints: {
        Row: {
          bible_refs: Json | null
          bio: string | null
          born: string | null
          catechism_refs: number[] | null
          category: string | null
          church_doc_refs: Json | null
          created_at: string | null
          died: string | null
          feast_day: string | null
          feast_day_num: number | null
          feast_month: number | null
          full_bio: string | null
          id: string
          image: string | null
          name: string
          patron_of: string[] | null
          prayer: string | null
          quotes: string[] | null
          title: string | null
          updated_at: string | null
          virtues: string[] | null
          works: Json | null
        }
        Insert: {
          bible_refs?: Json | null
          bio?: string | null
          born?: string | null
          catechism_refs?: number[] | null
          category?: string | null
          church_doc_refs?: Json | null
          created_at?: string | null
          died?: string | null
          feast_day?: string | null
          feast_day_num?: number | null
          feast_month?: number | null
          full_bio?: string | null
          id: string
          image?: string | null
          name: string
          patron_of?: string[] | null
          prayer?: string | null
          quotes?: string[] | null
          title?: string | null
          updated_at?: string | null
          virtues?: string[] | null
          works?: Json | null
        }
        Update: {
          bible_refs?: Json | null
          bio?: string | null
          born?: string | null
          catechism_refs?: number[] | null
          category?: string | null
          church_doc_refs?: Json | null
          created_at?: string | null
          died?: string | null
          feast_day?: string | null
          feast_day_num?: number | null
          feast_month?: number | null
          full_bio?: string | null
          id?: string
          image?: string | null
          name?: string
          patron_of?: string[] | null
          prayer?: string | null
          quotes?: string[] | null
          title?: string | null
          updated_at?: string | null
          virtues?: string[] | null
          works?: Json | null
        }
        Relationships: []
      }
      secret_leaks: {
        Row: {
          details: Json | null
          detected_at: string | null
          id: string
          severity: string | null
          source: string | null
        }
        Insert: {
          details?: Json | null
          detected_at?: string | null
          id?: string
          severity?: string | null
          source?: string | null
        }
        Update: {
          details?: Json | null
          detected_at?: string | null
          id?: string
          severity?: string | null
          source?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          severity: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          severity?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          severity?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          resource: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          resource: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          resource?: string
          user_id?: string | null
        }
        Relationships: []
      }
      seo_audits: {
        Row: {
          created_at: string
          findings: Json
          headings: Json
          id: string
          links: Json
          meta_tags: Json
          score: number | null
          url: string
        }
        Insert: {
          created_at?: string
          findings?: Json
          headings?: Json
          id?: string
          links?: Json
          meta_tags?: Json
          score?: number | null
          url: string
        }
        Update: {
          created_at?: string
          findings?: Json
          headings?: Json
          id?: string
          links?: Json
          meta_tags?: Json
          score?: number | null
          url?: string
        }
        Relationships: []
      }
      seo_corrections: {
        Row: {
          applied_at: string | null
          applied_correction: string | null
          audit_id: string | null
          created_at: string
          id: string
          issue_details: string | null
          issue_type: string
          status: string
        }
        Insert: {
          applied_at?: string | null
          applied_correction?: string | null
          audit_id?: string | null
          created_at?: string
          id?: string
          issue_details?: string | null
          issue_type: string
          status?: string
        }
        Update: {
          applied_at?: string | null
          applied_correction?: string | null
          audit_id?: string | null
          created_at?: string
          id?: string
          issue_details?: string | null
          issue_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_corrections_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "seo_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          business_address: string | null
          business_email: string | null
          business_name: string | null
          business_phone: string | null
          business_whatsapp: string | null
          created_at: string
          ga4_measurement_id: string | null
          google_maps_url: string | null
          gsc_verification_code: string | null
          id: string
          json_ld_schema: Json | null
          latitude: number | null
          longitude: number | null
          og_image_url: string | null
          opening_hours: string | null
          site_description: string | null
          site_keywords: string | null
          site_title: string
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_whatsapp?: string | null
          created_at?: string
          ga4_measurement_id?: string | null
          google_maps_url?: string | null
          gsc_verification_code?: string | null
          id?: string
          json_ld_schema?: Json | null
          latitude?: number | null
          longitude?: number | null
          og_image_url?: string | null
          opening_hours?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_title?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_whatsapp?: string | null
          created_at?: string
          ga4_measurement_id?: string | null
          google_maps_url?: string | null
          gsc_verification_code?: string | null
          id?: string
          json_ld_schema?: Json | null
          latitude?: number | null
          longitude?: number | null
          og_image_url?: string | null
          opening_hours?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_title?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_keywords: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          keyword: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          keyword: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          keyword?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      spiritual_contents: {
        Row: {
          content_text: string
          created_at: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          content_text: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          tags?: string[] | null
          title: string
          type: string
        }
        Update: {
          content_text?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      spiritual_journal: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          is_reviewed: boolean
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
          is_reviewed?: boolean
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
          is_reviewed?: boolean
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
            foreignKeyName: "spiritual_journal_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "view_journeys_with_stats"
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
      tags: {
        Row: {
          category: string | null
          created_at: string | null
          emoji: string | null
          id: string
          label: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          label: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      telemetry_audit_logs: {
        Row: {
          action_type: string | null
          id: string
          inspected_at: string | null
          inspector_id: string | null
          masked_ip: string | null
          request_id: string
        }
        Insert: {
          action_type?: string | null
          id?: string
          inspected_at?: string | null
          inspector_id?: string | null
          masked_ip?: string | null
          request_id: string
        }
        Update: {
          action_type?: string | null
          id?: string
          inspected_at?: string | null
          inspector_id?: string | null
          masked_ip?: string | null
          request_id?: string
        }
        Relationships: []
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
          category: string | null
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          name: string
          order_index: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name?: string
          order_index?: number | null
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
          coupon_code: string | null
          created_at: string | null
          description: string | null
          error_message: string | null
          id: string
          is_donation: boolean | null
          payment_id: string | null
          plan_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          webhook_payload: Json | null
        }
        Insert: {
          amount: number
          coupon_code?: string | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          is_donation?: boolean | null
          payment_id?: string | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_payload?: Json | null
        }
        Update: {
          amount?: number
          coupon_code?: string | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          is_donation?: boolean | null
          payment_id?: string | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_payload?: Json | null
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
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
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
          book_abbr: string | null
          chapter: number | null
          content_id: string
          content_type: string
          created_at: string
          highlight_color: string | null
          id: string
          is_reviewed: boolean
          metadata: Json | null
          note_text: string
          paragraph: number | null
          updated_at: string
          user_id: string
          verse: number | null
        }
        Insert: {
          book_abbr?: string | null
          chapter?: number | null
          content_id: string
          content_type: string
          created_at?: string
          highlight_color?: string | null
          id?: string
          is_reviewed?: boolean
          metadata?: Json | null
          note_text?: string
          paragraph?: number | null
          updated_at?: string
          user_id: string
          verse?: number | null
        }
        Update: {
          book_abbr?: string | null
          chapter?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          highlight_color?: string | null
          id?: string
          is_reviewed?: boolean
          metadata?: Json | null
          note_text?: string
          paragraph?: number | null
          updated_at?: string
          user_id?: string
          verse?: number | null
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
      user_reminder_settings: {
        Row: {
          email_enabled: boolean
          push_enabled: boolean
          reminder_frequency: string
          reminder_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          email_enabled?: boolean
          push_enabled?: boolean
          reminder_frequency?: string
          reminder_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          email_enabled?: boolean
          push_enabled?: boolean
          reminder_frequency?: string
          reminder_time?: string
          updated_at?: string
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
      visual_regression_runs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          pages_failed: number | null
          pages_total: number | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          pages_failed?: number | null
          pages_total?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          pages_failed?: number | null
          pages_total?: number | null
          status?: string
        }
        Relationships: []
      }
      visual_regression_snapshots: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          baseline_url: string | null
          created_at: string
          current_url: string | null
          diff_url: string | null
          id: string
          page_name: string
          reason: string | null
          route: string
          run_id: string | null
          status: string
          typography_errors: Json | null
          viewport: string
          wcag_score: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          baseline_url?: string | null
          created_at?: string
          current_url?: string | null
          diff_url?: string | null
          id?: string
          page_name: string
          reason?: string | null
          route: string
          run_id?: string | null
          status?: string
          typography_errors?: Json | null
          viewport: string
          wcag_score?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          baseline_url?: string | null
          created_at?: string
          current_url?: string | null
          diff_url?: string | null
          id?: string
          page_name?: string
          reason?: string | null
          route?: string
          run_id?: string | null
          status?: string
          typography_errors?: Json | null
          viewport?: string
          wcag_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_regression_snapshots_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "visual_regression_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_goals_history: {
        Row: {
          achieved_count: number
          completed: boolean | null
          created_at: string
          goal_count: number
          id: string
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          achieved_count: number
          completed?: boolean | null
          created_at?: string
          goal_count: number
          id?: string
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          achieved_count?: number
          completed?: boolean | null
          created_at?: string
          goal_count?: number
          id?: string
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_partners: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          status: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
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
      public_seo_settings: {
        Row: {
          business_address: string | null
          business_email: string | null
          business_name: string | null
          business_phone: string | null
          business_whatsapp: string | null
          created_at: string | null
          google_maps_url: string | null
          id: string | null
          json_ld_schema: Json | null
          latitude: number | null
          longitude: number | null
          og_image_url: string | null
          opening_hours: string | null
          site_description: string | null
          site_keywords: string | null
          site_title: string | null
          twitter_handle: string | null
          updated_at: string | null
        }
        Insert: {
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_whatsapp?: string | null
          created_at?: string | null
          google_maps_url?: string | null
          id?: string | null
          json_ld_schema?: Json | null
          latitude?: number | null
          longitude?: number | null
          og_image_url?: string | null
          opening_hours?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_title?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
        }
        Update: {
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_whatsapp?: string | null
          created_at?: string | null
          google_maps_url?: string | null
          id?: string | null
          json_ld_schema?: Json | null
          latitude?: number | null
          longitude?: number | null
          og_image_url?: string | null
          opening_hours?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_title?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
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
      view_itineraria_with_stats: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_days: number | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          is_premium: boolean | null
          sort_order: number | null
          steps_count: number | null
          subtitle: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_days?: number | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          sort_order?: number | null
          steps_count?: never
          subtitle?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_days?: number | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          sort_order?: number | null
          steps_count?: never
          subtitle?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      view_journeys_with_stats: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_days: number | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          is_premium: boolean | null
          sort_order: number | null
          steps_count: number | null
          subtitle: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_daily_reminders: { Args: never; Returns: undefined }
      cleanup_telemetry_logs:
        | { Args: never; Returns: undefined }
        | { Args: { retention_days?: number }; Returns: undefined }
      get_latest_journey_title: { Args: { p_user_id: string }; Returns: string }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      is_current_user_admin: { Args: never; Returns: boolean }
      log_access_denial: {
        Args: {
          attempted_action: string
          extra_details?: Json
          resource_name: string
        }
        Returns: undefined
      }
      mask_ip: { Args: { ip: string }; Returns: string }
      search_community_posts_fuzzy: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "community_posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_glossary_fuzzy: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          bible_verses: string[] | null
          catechism_references: string[] | null
          category: string | null
          created_at: string
          deep_interpretation: string | null
          definition: string
          id: string
          journey_id: string | null
          language: string
          magisterium_references: string[] | null
          practical_application: string | null
          reference: string | null
          term: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "glossary"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_journeys_fuzzy: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
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
          tags: string[] | null
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "journeys"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_saints_fuzzy: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          bible_refs: Json | null
          bio: string | null
          born: string | null
          catechism_refs: number[] | null
          category: string | null
          church_doc_refs: Json | null
          created_at: string | null
          died: string | null
          feast_day: string | null
          feast_day_num: number | null
          feast_month: number | null
          full_bio: string | null
          id: string
          image: string | null
          name: string
          patron_of: string[] | null
          prayer: string | null
          quotes: string[] | null
          title: string | null
          updated_at: string | null
          virtues: string[] | null
          works: Json | null
        }[]
        SetofOptions: {
          from: "*"
          to: "saints"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_tags_fuzzy: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          category: string | null
          created_at: string | null
          emoji: string | null
          id: string
          label: string
          slug: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tags"
          isOneToOne: false
          isSetofReturn: true
        }
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
