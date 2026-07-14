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
      _migration_env: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      _test_http_response_store: {
        Row: {
          created_at: string
          error_msg: string | null
          request_id: number
          response_body: string | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          error_msg?: string | null
          request_id: number
          response_body?: string | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          error_msg?: string | null
          request_id?: number
          response_body?: string | null
          status_code?: number | null
        }
        Relationships: []
      }
      _test_http_responses: {
        Row: {
          consumed: boolean
          created_at: string
          error_msg: string | null
          id: number
          response_body: string | null
          status_code: number | null
          url: string
        }
        Insert: {
          consumed?: boolean
          created_at?: string
          error_msg?: string | null
          id?: number
          response_body?: string | null
          status_code?: number | null
          url: string
        }
        Update: {
          consumed?: boolean
          created_at?: string
          error_msg?: string | null
          id?: number
          response_body?: string | null
          status_code?: number | null
          url?: string
        }
        Relationships: []
      }
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
      app_feature_flags: {
        Row: {
          description: string | null
          feature_key: string
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          feature_key: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          feature_key?: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
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
      bible_audit_a11y_config: {
        Row: {
          device_overrides: Json | null
          id: string
          threshold_large: number | null
          threshold_normal: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          device_overrides?: Json | null
          id?: string
          threshold_large?: number | null
          threshold_normal?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          device_overrides?: Json | null
          id?: string
          threshold_large?: number | null
          threshold_normal?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      bible_audit_action_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      bible_audit_alerts: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          is_resolved: boolean | null
          last_attempt_at: string | null
          message: string
          notification_status: string | null
          resolved_at: string | null
          retry_count: number | null
          run_id: string | null
          severity: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          last_attempt_at?: string | null
          message: string
          notification_status?: string | null
          resolved_at?: string | null
          retry_count?: number | null
          run_id?: string | null
          severity: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          last_attempt_at?: string | null
          message?: string
          notification_status?: string | null
          resolved_at?: string | null
          retry_count?: number | null
          run_id?: string | null
          severity?: string
        }
        Relationships: []
      }
      bible_audit_log_cleanup_runs: {
        Row: {
          created_at: string
          duration_ms: number
          error: string | null
          id: string
          retention_days: number
          rows_deleted: number
          status: string
          triggered_by: string
          triggered_user: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number
          error?: string | null
          id?: string
          retention_days: number
          rows_deleted?: number
          status?: string
          triggered_by?: string
          triggered_user?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number
          error?: string | null
          id?: string
          retention_days?: number
          rows_deleted?: number
          status?: string
          triggered_by?: string
          triggered_user?: string | null
        }
        Relationships: []
      }
      bible_audit_log_retention_config: {
        Row: {
          auto_cleanup_enabled: boolean
          id: boolean
          retention_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_cleanup_enabled?: boolean
          id?: boolean
          retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_cleanup_enabled?: boolean
          id?: boolean
          retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      bible_audit_notification_versions: {
        Row: {
          channel: string | null
          created_at: string | null
          created_by: string | null
          headers: Json | null
          id: string
          notification_id: string | null
          priority: string | null
          retry_config: Json | null
          rules: Json | null
          target: string | null
          version: number
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          created_by?: string | null
          headers?: Json | null
          id?: string
          notification_id?: string | null
          priority?: string | null
          retry_config?: Json | null
          rules?: Json | null
          target?: string | null
          version: number
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          created_by?: string | null
          headers?: Json | null
          id?: string
          notification_id?: string | null
          priority?: string | null
          retry_config?: Json | null
          rules?: Json | null
          target?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_audit_notification_versions_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "bible_audit_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_audit_notifications: {
        Row: {
          channel: string | null
          created_at: string | null
          headers: Json | null
          id: string
          is_active: boolean | null
          is_latest: boolean | null
          priority: string | null
          priority_threshold: string | null
          retry_config: Json | null
          rules: Json | null
          secret_key: string | null
          target: string
          type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          is_latest?: boolean | null
          priority?: string | null
          priority_threshold?: string | null
          retry_config?: Json | null
          rules?: Json | null
          secret_key?: string | null
          target: string
          type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          is_latest?: boolean | null
          priority?: string | null
          priority_threshold?: string | null
          retry_config?: Json | null
          rules?: Json | null
          secret_key?: string | null
          target?: string
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      bible_audit_runs: {
        Row: {
          completed_at: string | null
          config: Json | null
          covered_books: number | null
          covered_chapters: number | null
          covered_verses: number | null
          created_at: string
          created_by: string | null
          empty_books: string[] | null
          id: string
          logs: Json | null
          metadata: Json | null
          search_queries: Json | null
          started_at: string | null
          status: string
          total_books: number | null
          total_chapters: number | null
          total_verses: number | null
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          covered_books?: number | null
          covered_chapters?: number | null
          covered_verses?: number | null
          created_at?: string
          created_by?: string | null
          empty_books?: string[] | null
          id?: string
          logs?: Json | null
          metadata?: Json | null
          search_queries?: Json | null
          started_at?: string | null
          status: string
          total_books?: number | null
          total_chapters?: number | null
          total_verses?: number | null
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          covered_books?: number | null
          covered_chapters?: number | null
          covered_verses?: number | null
          created_at?: string
          created_by?: string | null
          empty_books?: string[] | null
          id?: string
          logs?: Json | null
          metadata?: Json | null
          search_queries?: Json | null
          started_at?: string | null
          status?: string
          total_books?: number | null
          total_chapters?: number | null
          total_verses?: number | null
        }
        Relationships: []
      }
      bible_audit_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_run_id: string | null
          name: string
          next_run: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_run_id?: string | null
          name: string
          next_run?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_id?: string | null
          name?: string
          next_run?: string | null
        }
        Relationships: []
      }
      bible_audit_security_logs: {
        Row: {
          action: string
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          created_by: string | null
          details: Json
          entity_name: string
          id: string
          scan_id: string | null
          severity: string | null
          summary: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          created_by?: string | null
          details: Json
          entity_name: string
          id?: string
          scan_id?: string | null
          severity?: string | null
          summary?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          created_by?: string | null
          details?: Json
          entity_name?: string
          id?: string
          scan_id?: string | null
          severity?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      bible_audit_security_scans: {
        Row: {
          completed_at: string | null
          compliance_score: number | null
          id: string
          issues_found: Json | null
          metadata: Json | null
          started_at: string | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          compliance_score?: number | null
          id?: string
          issues_found?: Json | null
          metadata?: Json | null
          started_at?: string | null
          status: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          compliance_score?: number | null
          id?: string
          issues_found?: Json | null
          metadata?: Json | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      bible_audit_webhook_deliveries: {
        Row: {
          alert_id: string | null
          attempt_number: number | null
          delivered_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          notification_id: string | null
          request_payload: Json | null
          response_payload: string | null
          status_code: number | null
          verification_details: Json | null
        }
        Insert: {
          alert_id?: string | null
          attempt_number?: number | null
          delivered_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          notification_id?: string | null
          request_payload?: Json | null
          response_payload?: string | null
          status_code?: number | null
          verification_details?: Json | null
        }
        Update: {
          alert_id?: string | null
          attempt_number?: number | null
          delivered_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          notification_id?: string | null
          request_payload?: Json | null
          response_payload?: string | null
          status_code?: number | null
          verification_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bible_audit_webhook_deliveries_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "bible_audit_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_audit_webhook_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "bible_audit_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_audit_webhook_logs: {
        Row: {
          delivered_at: string | null
          id: string
          notification_id: string | null
          payload: Json | null
          response_body: string | null
          response_status: number | null
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          notification_id?: string | null
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
        }
        Update: {
          delivered_at?: string | null
          id?: string
          notification_id?: string | null
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bible_audit_webhook_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "bible_audit_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_books: {
        Row: {
          abbrev: string
          canonical_type: string | null
          chapters_count: number
          created_at: string
          id: string
          name: string
          testament: string | null
          updated_at: string
        }
        Insert: {
          abbrev: string
          canonical_type?: string | null
          chapters_count: number
          created_at?: string
          id?: string
          name: string
          testament?: string | null
          updated_at?: string
        }
        Update: {
          abbrev?: string
          canonical_type?: string | null
          chapters_count?: number
          created_at?: string
          id?: string
          name?: string
          testament?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bible_cache_admin_audit: {
        Row: {
          abbrev: string | null
          action: string
          actor_email: string | null
          actor_id: string | null
          chapter_from: number | null
          chapter_to: number | null
          count: number | null
          created_at: string
          details: Json
          failed: number | null
          id: number
          succeeded: number | null
          target: string | null
        }
        Insert: {
          abbrev?: string | null
          action: string
          actor_email?: string | null
          actor_id?: string | null
          chapter_from?: number | null
          chapter_to?: number | null
          count?: number | null
          created_at?: string
          details?: Json
          failed?: number | null
          id?: number
          succeeded?: number | null
          target?: string | null
        }
        Update: {
          abbrev?: string | null
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          chapter_from?: number | null
          chapter_to?: number | null
          count?: number | null
          created_at?: string
          details?: Json
          failed?: number | null
          id?: number
          succeeded?: number | null
          target?: string | null
        }
        Relationships: []
      }
      bible_cache_alerts: {
        Row: {
          abbrev: string | null
          baseline_p95_ms: number | null
          bucket_start: string | null
          correlation_id: string | null
          created_at: string
          details: Json
          id: string
          kind: string
          l1_phase: string | null
          message: string
          metric_kind: string | null
          observed_p95_ms: number | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          abbrev?: string | null
          baseline_p95_ms?: number | null
          bucket_start?: string | null
          correlation_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind: string
          l1_phase?: string | null
          message: string
          metric_kind?: string | null
          observed_p95_ms?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
        }
        Update: {
          abbrev?: string | null
          baseline_p95_ms?: number | null
          bucket_start?: string | null
          correlation_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          l1_phase?: string | null
          message?: string
          metric_kind?: string | null
          observed_p95_ms?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: []
      }
      bible_cache_l2: {
        Row: {
          cache_key: string
          content: Json
          created_at: string | null
          expires_at: string
          hash: string
          id: string
          version: number | null
        }
        Insert: {
          cache_key: string
          content: Json
          created_at?: string | null
          expires_at: string
          hash: string
          id?: string
          version?: number | null
        }
        Update: {
          cache_key?: string
          content?: Json
          created_at?: string | null
          expires_at?: string
          hash?: string
          id?: string
          version?: number | null
        }
        Relationships: []
      }
      bible_cache_metadata: {
        Row: {
          client_version: number
          created_at: string
          id: string
          last_purged_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_version?: number
          created_at?: string
          id?: string
          last_purged_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_version?: number
          created_at?: string
          id?: string
          last_purged_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bible_cache_metric_events: {
        Row: {
          abbrev: string
          bolls_called: boolean
          bolls_ms: number | null
          bolls_ok: boolean | null
          cache: string
          cache_level: string | null
          chapter: number
          cold_start: boolean | null
          correlation_id: string | null
          created_at: string
          edge_ms: number | null
          id: number
          instance_id: string | null
          l1_phase: string | null
          render_ms: number | null
          request_source: string | null
          source: string | null
          sql_breakdown: Json | null
          sql_ms: number | null
          status_code: number
          total_ms: number
          total_wall_clock_ms: number | null
        }
        Insert: {
          abbrev: string
          bolls_called?: boolean
          bolls_ms?: number | null
          bolls_ok?: boolean | null
          cache: string
          cache_level?: string | null
          chapter: number
          cold_start?: boolean | null
          correlation_id?: string | null
          created_at?: string
          edge_ms?: number | null
          id?: number
          instance_id?: string | null
          l1_phase?: string | null
          render_ms?: number | null
          request_source?: string | null
          source?: string | null
          sql_breakdown?: Json | null
          sql_ms?: number | null
          status_code?: number
          total_ms: number
          total_wall_clock_ms?: number | null
        }
        Update: {
          abbrev?: string
          bolls_called?: boolean
          bolls_ms?: number | null
          bolls_ok?: boolean | null
          cache?: string
          cache_level?: string | null
          chapter?: number
          cold_start?: boolean | null
          correlation_id?: string | null
          created_at?: string
          edge_ms?: number | null
          id?: number
          instance_id?: string | null
          l1_phase?: string | null
          render_ms?: number | null
          request_source?: string | null
          source?: string | null
          sql_breakdown?: Json | null
          sql_ms?: number | null
          status_code?: number
          total_ms?: number
          total_wall_clock_ms?: number | null
        }
        Relationships: []
      }
      bible_cache_metrics: {
        Row: {
          abbrev: string
          bolls_calls: number
          bolls_failures: number
          bolls_sum_ms: number
          bucket_start: string
          errors: number
          hits: number
          l1_fresh: number
          l1_invalidate: number
          l1_miss: number
          l1_single_flight: number
          l1_stale: number
          l1_swr_refresh: number
          max_ms: number
          misses: number
          p95_ms: number
          render_samples: number
          stale: number
          sum_edge_ms: number
          sum_ms: number
          sum_render_ms: number
          sum_sql_ms: number
          total: number
          updated_at: string
        }
        Insert: {
          abbrev: string
          bolls_calls?: number
          bolls_failures?: number
          bolls_sum_ms?: number
          bucket_start: string
          errors?: number
          hits?: number
          l1_fresh?: number
          l1_invalidate?: number
          l1_miss?: number
          l1_single_flight?: number
          l1_stale?: number
          l1_swr_refresh?: number
          max_ms?: number
          misses?: number
          p95_ms?: number
          render_samples?: number
          stale?: number
          sum_edge_ms?: number
          sum_ms?: number
          sum_render_ms?: number
          sum_sql_ms?: number
          total?: number
          updated_at?: string
        }
        Update: {
          abbrev?: string
          bolls_calls?: number
          bolls_failures?: number
          bolls_sum_ms?: number
          bucket_start?: string
          errors?: number
          hits?: number
          l1_fresh?: number
          l1_invalidate?: number
          l1_miss?: number
          l1_single_flight?: number
          l1_stale?: number
          l1_swr_refresh?: number
          max_ms?: number
          misses?: number
          p95_ms?: number
          render_samples?: number
          stale?: number
          sum_edge_ms?: number
          sum_ms?: number
          sum_render_ms?: number
          sum_sql_ms?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      bible_chapters: {
        Row: {
          book_id: string
          created_at: string
          id: string
          number: number
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          number: number
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
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
      bible_connections: {
        Row: {
          category: string
          created_at: string
          id: string
          reference_id: string | null
          reference_title: string
          relevance_level: string | null
          relevance_score: number | null
          summary: string | null
          theological_theme: string | null
          updated_at: string
          verse_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          reference_id?: string | null
          reference_title: string
          relevance_level?: string | null
          relevance_score?: number | null
          summary?: string | null
          theological_theme?: string | null
          updated_at?: string
          verse_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          reference_id?: string | null
          reference_title?: string
          relevance_level?: string | null
          relevance_score?: number | null
          summary?: string | null
          theological_theme?: string | null
          updated_at?: string
          verse_id?: string
        }
        Relationships: []
      }
      bible_diagnostic_findings: {
        Row: {
          abbrev: string
          book_name: string
          chapter: number | null
          created_at: string
          finding_type: string
          id: string
          message: string
          metadata: Json
          run_id: string
          severity: string
        }
        Insert: {
          abbrev: string
          book_name: string
          chapter?: number | null
          created_at?: string
          finding_type: string
          id?: string
          message: string
          metadata?: Json
          run_id: string
          severity?: string
        }
        Update: {
          abbrev?: string
          book_name?: string
          chapter?: number | null
          created_at?: string
          finding_type?: string
          id?: string
          message?: string
          metadata?: Json
          run_id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_diagnostic_findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "bible_diagnostic_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_diagnostic_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          metadata: Json
          started_at: string
          status: string
          total_books_checked: number
          total_chapters_checked: number
          total_findings: number
          triggered_by: string
          triggered_user: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          metadata?: Json
          started_at?: string
          status?: string
          total_books_checked?: number
          total_chapters_checked?: number
          total_findings?: number
          triggered_by?: string
          triggered_user?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          metadata?: Json
          started_at?: string
          status?: string
          total_books_checked?: number
          total_chapters_checked?: number
          total_findings?: number
          triggered_by?: string
          triggered_user?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bible_favorites: {
        Row: {
          book_abbr: string
          chapter: number
          content: string
          created_at: string
          id: string
          user_id: string
          verse_number: number
        }
        Insert: {
          book_abbr: string
          chapter: number
          content: string
          created_at?: string
          id?: string
          user_id: string
          verse_number: number
        }
        Update: {
          book_abbr?: string
          chapter?: number
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          verse_number?: number
        }
        Relationships: []
      }
      bible_import_jobs: {
        Row: {
          audit_log: Json
          created_at: string
          created_by: string | null
          current_book: string | null
          error: string | null
          finished_at: string | null
          id: string
          message: string | null
          progress: number
          source_id: string
          started_at: string | null
          status: string
          total: number
          updated_at: string
          verification: Json | null
        }
        Insert: {
          audit_log?: Json
          created_at?: string
          created_by?: string | null
          current_book?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          message?: string | null
          progress?: number
          source_id: string
          started_at?: string | null
          status?: string
          total?: number
          updated_at?: string
          verification?: Json | null
        }
        Update: {
          audit_log?: Json
          created_at?: string
          created_by?: string | null
          current_book?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          message?: string | null
          progress?: number
          source_id?: string
          started_at?: string | null
          status?: string
          total?: number
          updated_at?: string
          verification?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bible_import_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "bible_translation_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_integrity_reports: {
        Row: {
          book_id: string | null
          calculated_hash: string
          chapter_number: number
          correlation_id: string | null
          created_at: string | null
          discrepancy_details: Json | null
          encoding_issues_detected: boolean | null
          expected_hash: string | null
          id: string
          special_chars_count: number | null
          status: string
        }
        Insert: {
          book_id?: string | null
          calculated_hash: string
          chapter_number: number
          correlation_id?: string | null
          created_at?: string | null
          discrepancy_details?: Json | null
          encoding_issues_detected?: boolean | null
          expected_hash?: string | null
          id?: string
          special_chars_count?: number | null
          status: string
        }
        Update: {
          book_id?: string | null
          calculated_hash?: string
          chapter_number?: number
          correlation_id?: string | null
          created_at?: string | null
          discrepancy_details?: Json | null
          encoding_issues_detected?: boolean | null
          expected_hash?: string | null
          id?: string
          special_chars_count?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_integrity_reports_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_translation_sources: {
        Row: {
          attribution: string
          author: string | null
          books_count: number
          certified_at: string | null
          certified_by: string | null
          chapters_count: number
          code: string
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          import_completed_at: string | null
          import_started_at: string | null
          imported_at: string | null
          is_primary: boolean
          language: string
          license: string
          metadata: Json
          name: string
          notes: string | null
          payload_bytes: number | null
          payload_hash: string | null
          pcl_activated_at: string | null
          pcl_activated_by: string | null
          pcl_status: string
          provider: string | null
          source_origin: string | null
          source_url: string | null
          status: string
          translation: string
          updated_at: string
          verses_count: number
          year_published: number | null
        }
        Insert: {
          attribution: string
          author?: string | null
          books_count?: number
          certified_at?: string | null
          certified_by?: string | null
          chapters_count?: number
          code: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          import_completed_at?: string | null
          import_started_at?: string | null
          imported_at?: string | null
          is_primary?: boolean
          language?: string
          license: string
          metadata?: Json
          name: string
          notes?: string | null
          payload_bytes?: number | null
          payload_hash?: string | null
          pcl_activated_at?: string | null
          pcl_activated_by?: string | null
          pcl_status?: string
          provider?: string | null
          source_origin?: string | null
          source_url?: string | null
          status?: string
          translation: string
          updated_at?: string
          verses_count?: number
          year_published?: number | null
        }
        Update: {
          attribution?: string
          author?: string | null
          books_count?: number
          certified_at?: string | null
          certified_by?: string | null
          chapters_count?: number
          code?: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          import_completed_at?: string | null
          import_started_at?: string | null
          imported_at?: string | null
          is_primary?: boolean
          language?: string
          license?: string
          metadata?: Json
          name?: string
          notes?: string | null
          payload_bytes?: number | null
          payload_hash?: string | null
          pcl_activated_at?: string | null
          pcl_activated_by?: string | null
          pcl_status?: string
          provider?: string | null
          source_origin?: string | null
          source_url?: string | null
          status?: string
          translation?: string
          updated_at?: string
          verses_count?: number
          year_published?: number | null
        }
        Relationships: []
      }
      bible_verse_modernizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          method: string
          modernization_version: string
          modernized_text: string
          notes: string | null
          translation_id: string
          updated_at: string
          verse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          modernization_version?: string
          modernized_text: string
          notes?: string | null
          translation_id: string
          updated_at?: string
          verse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          modernization_version?: string
          modernized_text?: string
          notes?: string | null
          translation_id?: string
          updated_at?: string
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_verse_modernizations_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "bible_translation_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_verse_modernizations_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "bible_verses"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_verses: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          number: number
          text: string
          translation_id: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          number: number
          text: string
          translation_id: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          number?: number
          text?: string
          translation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_verses_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "bible_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_verses_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "bible_translation_sources"
            referencedColumns: ["id"]
          },
        ]
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
      cid_compliance_snapshots: {
        Row: {
          branch: string | null
          by_category: Json
          captured_at: string
          cid_counts: Json
          commit_sha: string | null
          coverage_pct: string
          coverage_ratio: number
          created_at: string
          failing_functions: Json
          http_counts: Json
          id: string
          passed: boolean
          test_counts: Json
          total_functions: number
          validation_counts: Json
        }
        Insert: {
          branch?: string | null
          by_category: Json
          captured_at?: string
          cid_counts: Json
          commit_sha?: string | null
          coverage_pct: string
          coverage_ratio: number
          created_at?: string
          failing_functions?: Json
          http_counts: Json
          id?: string
          passed?: boolean
          test_counts: Json
          total_functions: number
          validation_counts: Json
        }
        Update: {
          branch?: string | null
          by_category?: Json
          captured_at?: string
          cid_counts?: Json
          commit_sha?: string | null
          coverage_pct?: string
          coverage_ratio?: number
          created_at?: string
          failing_functions?: Json
          http_counts?: Json
          id?: string
          passed?: boolean
          test_counts?: Json
          total_functions?: number
          validation_counts?: Json
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
      core_audit_logs: {
        Row: {
          capitulo: number | null
          content_hash: string | null
          correlation_id: string
          created_at: string | null
          db_content_hash: string | null
          duration_ms: number | null
          error_code: string | null
          event_name: string
          id: string
          livro: string | null
          payload: Json | null
          response: Json | null
          status_code: number | null
          timestamp: string | null
        }
        Insert: {
          capitulo?: number | null
          content_hash?: string | null
          correlation_id: string
          created_at?: string | null
          db_content_hash?: string | null
          duration_ms?: number | null
          error_code?: string | null
          event_name: string
          id?: string
          livro?: string | null
          payload?: Json | null
          response?: Json | null
          status_code?: number | null
          timestamp?: string | null
        }
        Update: {
          capitulo?: number | null
          content_hash?: string | null
          correlation_id?: string
          created_at?: string | null
          db_content_hash?: string | null
          duration_ms?: number | null
          error_code?: string | null
          event_name?: string
          id?: string
          livro?: string | null
          payload?: Json | null
          response?: Json | null
          status_code?: number | null
          timestamp?: string | null
        }
        Relationships: []
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
      governance_audit_log: {
        Row: {
          actor_id: string | null
          actor_role: string
          after_state: Json | null
          before_state: Json | null
          correlation_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string
          entity_type: string
          id: string
          occurred_at: string
          operation: string
          request_ip: unknown
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          occurred_at?: string
          operation: string
          request_ip?: unknown
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          occurred_at?: string
          operation?: string
          request_ip?: unknown
        }
        Relationships: []
      }
      governance_audit_log_archive: {
        Row: {
          actor_id: string | null
          actor_role: string
          after_state: Json | null
          archived_at: string
          before_state: Json | null
          correlation_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string
          entity_type: string
          id: string
          occurred_at: string
          operation: string
          request_ip: unknown
        }
        Insert: {
          actor_id?: string | null
          actor_role: string
          after_state?: Json | null
          archived_at?: string
          before_state?: Json | null
          correlation_id?: string | null
          created_at: string
          diff?: Json | null
          entity_id: string
          entity_type: string
          id: string
          occurred_at: string
          operation: string
          request_ip?: unknown
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          after_state?: Json | null
          archived_at?: string
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          occurred_at?: string
          operation?: string
          request_ip?: unknown
        }
        Relationships: []
      }
      governance_audit_log_cleanup_runs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          retention_days: number
          rows_archived: number
          status: string
          triggered_by: string
          triggered_user: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          retention_days: number
          rows_archived?: number
          status: string
          triggered_by: string
          triggered_user?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          retention_days?: number
          rows_archived?: number
          status?: string
          triggered_by?: string
          triggered_user?: string | null
        }
        Relationships: []
      }
      governance_audit_retention_config: {
        Row: {
          auto_archive_enabled: boolean
          id: boolean
          retention_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_archive_enabled?: boolean
          id?: boolean
          retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_archive_enabled?: boolean
          id?: boolean
          retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
      language_allowlist: {
        Row: {
          added_by: string | null
          created_at: string
          description: string | null
          id: string
          term: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          term: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          term?: string
        }
        Relationships: []
      }
      nexus_relation_types: {
        Row: {
          code: string
          created_at: string
          description: string
          label_pt: string
          provisional: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          label_pt: string
          provisional?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          label_pt?: string
          provisional?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      nexus_relations: {
        Row: {
          attributed_to: string | null
          confidence: number | null
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          relation_type: string
          source_kind: string
          source_ref: Json
          target_kind: string
          target_ref: Json
          updated_at: string
        }
        Insert: {
          attributed_to?: string | null
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          relation_type: string
          source_kind: string
          source_ref: Json
          target_kind: string
          target_ref: Json
          updated_at?: string
        }
        Update: {
          attributed_to?: string | null
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          relation_type?: string
          source_kind?: string
          source_ref?: Json
          target_kind?: string
          target_ref?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_relations_relation_type_fkey"
            columns: ["relation_type"]
            isOneToOne: false
            referencedRelation: "nexus_relation_types"
            referencedColumns: ["code"]
          },
        ]
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
      pg_stat_notif_attempts: {
        Row: {
          attempt_no: number
          created_at: string
          error_msg: string | null
          event: string
          id: string
          next_attempt_at: string | null
          notification_id: string
          request_id: number | null
          status_code: number | null
        }
        Insert: {
          attempt_no: number
          created_at?: string
          error_msg?: string | null
          event: string
          id?: string
          next_attempt_at?: string | null
          notification_id: string
          request_id?: number | null
          status_code?: number | null
        }
        Update: {
          attempt_no?: number
          created_at?: string
          error_msg?: string | null
          event?: string
          id?: string
          next_attempt_at?: string | null
          notification_id?: string
          request_id?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pg_stat_notif_attempts_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "pg_stat_pending_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      pg_stat_pending_notifications: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          id: string
          last_attempt_at: string | null
          last_error: string | null
          last_request_id: number | null
          last_status_code: number | null
          max_attempts: number
          next_attempt_at: string
          payload: Json
          status: string
          succeeded_at: string | null
          target_url: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          last_request_id?: number | null
          last_status_code?: number | null
          max_attempts?: number
          next_attempt_at?: string
          payload: Json
          status?: string
          succeeded_at?: string | null
          target_url: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          last_request_id?: number | null
          last_status_code?: number | null
          max_attempts?: number
          next_attempt_at?: string
          payload?: Json
          status?: string
          succeeded_at?: string | null
          target_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      pg_stat_snapshot_config: {
        Row: {
          consecutive_failures: number
          enabled: boolean
          id: number
          interval_minutes: number
          last_error_at: string | null
          last_error_message: string | null
          last_notification_error: string | null
          last_notified_at: string | null
          last_run_at: string | null
          last_snapshot_id: string | null
          last_success_at: string | null
          notify_slack_webhook_url: string | null
          notify_webhook_url: string | null
          retention_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          consecutive_failures?: number
          enabled?: boolean
          id?: number
          interval_minutes?: number
          last_error_at?: string | null
          last_error_message?: string | null
          last_notification_error?: string | null
          last_notified_at?: string | null
          last_run_at?: string | null
          last_snapshot_id?: string | null
          last_success_at?: string | null
          notify_slack_webhook_url?: string | null
          notify_webhook_url?: string | null
          retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          consecutive_failures?: number
          enabled?: boolean
          id?: number
          interval_minutes?: number
          last_error_at?: string | null
          last_error_message?: string | null
          last_notification_error?: string | null
          last_notified_at?: string | null
          last_run_at?: string | null
          last_snapshot_id?: string | null
          last_success_at?: string | null
          notify_slack_webhook_url?: string | null
          notify_webhook_url?: string | null
          retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      pg_stat_snapshots: {
        Row: {
          created_at: string
          id: string
          label: string | null
          note: string | null
          row_count: number | null
          rows: Json
          taken_at: string
          taken_by: string | null
          total_calls: number | null
          total_exec_ms: number | null
          window_seconds: number | null
          window_started_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          note?: string | null
          row_count?: number | null
          rows: Json
          taken_at?: string
          taken_by?: string | null
          total_calls?: number | null
          total_exec_ms?: number | null
          window_seconds?: number | null
          window_started_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          note?: string | null
          row_count?: number | null
          rows?: Json
          taken_at?: string
          taken_by?: string | null
          total_calls?: number | null
          total_exec_ms?: number | null
          window_seconds?: number | null
          window_started_at?: string | null
        }
        Relationships: []
      }
      pg_stats_admin_views: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_update_rate: {
        Row: {
          count: number
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          count?: number
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          count?: number
          updated_at?: string
          user_id?: string
          window_start?: string
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
          nexus_high_contrast: boolean
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
          nexus_high_contrast?: boolean
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
          nexus_high_contrast?: boolean
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
      reading_state_history: {
        Row: {
          chapter: number | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          metadata: Json | null
          paragraph: number | null
          scroll_position: number | null
          user_id: string
          verse: number | null
          view_mode: string | null
        }
        Insert: {
          chapter?: number | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          paragraph?: number | null
          scroll_position?: number | null
          user_id: string
          verse?: number | null
          view_mode?: string | null
        }
        Update: {
          chapter?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          paragraph?: number | null
          scroll_position?: number | null
          user_id?: string
          verse?: number | null
          view_mode?: string | null
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
          bio_source_url: string | null
          born: string | null
          catechism_refs: number[] | null
          category: string | null
          church_doc_refs: Json | null
          content_hash: string | null
          created_at: string | null
          died: string | null
          feast_day: string | null
          feast_day_num: number | null
          feast_month: number | null
          full_bio: string | null
          id: string
          image: string | null
          last_scraped_at: string | null
          name: string
          patron_of: string[] | null
          prayer: string | null
          prayer_source_url: string | null
          quotes: string[] | null
          source_name: string | null
          source_url: string | null
          title: string | null
          updated_at: string | null
          virtues: string[] | null
          works: Json | null
        }
        Insert: {
          bible_refs?: Json | null
          bio?: string | null
          bio_source_url?: string | null
          born?: string | null
          catechism_refs?: number[] | null
          category?: string | null
          church_doc_refs?: Json | null
          content_hash?: string | null
          created_at?: string | null
          died?: string | null
          feast_day?: string | null
          feast_day_num?: number | null
          feast_month?: number | null
          full_bio?: string | null
          id: string
          image?: string | null
          last_scraped_at?: string | null
          name: string
          patron_of?: string[] | null
          prayer?: string | null
          prayer_source_url?: string | null
          quotes?: string[] | null
          source_name?: string | null
          source_url?: string | null
          title?: string | null
          updated_at?: string | null
          virtues?: string[] | null
          works?: Json | null
        }
        Update: {
          bible_refs?: Json | null
          bio?: string | null
          bio_source_url?: string | null
          born?: string | null
          catechism_refs?: number[] | null
          category?: string | null
          church_doc_refs?: Json | null
          content_hash?: string | null
          created_at?: string | null
          died?: string | null
          feast_day?: string | null
          feast_day_num?: number | null
          feast_month?: number | null
          full_bio?: string | null
          id?: string
          image?: string | null
          last_scraped_at?: string | null
          name?: string
          patron_of?: string[] | null
          prayer?: string | null
          prayer_source_url?: string | null
          quotes?: string[] | null
          source_name?: string | null
          source_url?: string | null
          title?: string | null
          updated_at?: string | null
          virtues?: string[] | null
          works?: Json | null
        }
        Relationships: []
      }
      saints_audit: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: number
          new_content_hash: string | null
          new_full_bio: string | null
          new_last_scraped_at: string | null
          new_prayer: string | null
          new_source_url: string | null
          old_content_hash: string | null
          old_full_bio: string | null
          old_last_scraped_at: string | null
          old_prayer: string | null
          old_source_url: string | null
          saint_id: string
          source_note: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: number
          new_content_hash?: string | null
          new_full_bio?: string | null
          new_last_scraped_at?: string | null
          new_prayer?: string | null
          new_source_url?: string | null
          old_content_hash?: string | null
          old_full_bio?: string | null
          old_last_scraped_at?: string | null
          old_prayer?: string | null
          old_source_url?: string | null
          saint_id: string
          source_note?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: number
          new_content_hash?: string | null
          new_full_bio?: string | null
          new_last_scraped_at?: string | null
          new_prayer?: string | null
          new_source_url?: string | null
          old_content_hash?: string | null
          old_full_bio?: string | null
          old_last_scraped_at?: string | null
          old_prayer?: string | null
          old_source_url?: string | null
          saint_id?: string
          source_note?: string | null
        }
        Relationships: []
      }
      saints_reimport_runs: {
        Row: {
          applied_summary: Json | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          error: string | null
          id: string
          preview: Json
          source: string
          status: string
          summary: Json
          ttl_days: number
        }
        Insert: {
          applied_summary?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          error?: string | null
          id?: string
          preview?: Json
          source?: string
          status?: string
          summary?: Json
          ttl_days?: number
        }
        Update: {
          applied_summary?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          error?: string | null
          id?: string
          preview?: Json
          source?: string
          status?: string
          summary?: Json
          ttl_days?: number
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string | null
          filter_by: string | null
          id: string
          name: string
          project_id: string | null
          query: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filter_by?: string | null
          id?: string
          name: string
          project_id?: string | null
          query?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filter_by?: string | null
          id?: string
          name?: string
          project_id?: string | null
          query?: string | null
          updated_at?: string | null
          user_id?: string
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
      security_alerts: {
        Row: {
          created_at: string | null
          finding_id: string | null
          id: string
          is_read: boolean | null
          message: string
          scan_id: string | null
          severity: string
          title: string
        }
        Insert: {
          created_at?: string | null
          finding_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          scan_id?: string | null
          severity: string
          title: string
        }
        Update: {
          created_at?: string | null
          finding_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          scan_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "security_findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alerts_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "security_scans"
            referencedColumns: ["id"]
          },
        ]
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
      security_findings: {
        Row: {
          category: string
          created_at: string | null
          description: string
          evidence: Json | null
          id: string
          recommendation: string | null
          resolved_at: string | null
          scan_id: string | null
          severity: string
          target: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          evidence?: Json | null
          id?: string
          recommendation?: string | null
          resolved_at?: string | null
          scan_id?: string | null
          severity: string
          target: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          evidence?: Json | null
          id?: string
          recommendation?: string | null
          resolved_at?: string | null
          scan_id?: string | null
          severity?: string
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_findings_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "security_scans"
            referencedColumns: ["id"]
          },
        ]
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
      security_scans: {
        Row: {
          completed_at: string | null
          findings_count: number | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          findings_count?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          findings_count?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
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
      telemetry_audit: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          severity: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          severity?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          severity?: string | null
          title?: string | null
          user_id?: string | null
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
      telemetry_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
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
      vatican_cache: {
        Row: {
          content: string
          content_length: number | null
          created_at: string | null
          fetched_status: string | null
          id: string
          last_attempt_at: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          content: string
          content_length?: number | null
          created_at?: string | null
          fetched_status?: string | null
          id?: string
          last_attempt_at?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          content?: string
          content_length?: number | null
          created_at?: string | null
          fetched_status?: string | null
          id?: string
          last_attempt_at?: string | null
          title?: string
          updated_at?: string | null
          url?: string
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
      webhook_alerts: {
        Row: {
          alert_type: string
          count: number | null
          created_at: string | null
          id: string
          last_occurrence: string | null
          message: string
          severity: string | null
        }
        Insert: {
          alert_type: string
          count?: number | null
          created_at?: string | null
          id?: string
          last_occurrence?: string | null
          message: string
          severity?: string | null
        }
        Update: {
          alert_type?: string
          count?: number | null
          created_at?: string | null
          id?: string
          last_occurrence?: string | null
          message?: string
          severity?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_id: string | null
          event_type: string | null
          id: string
          last_retry_at: string | null
          next_retry_at: string | null
          payload: Json | null
          processed_at: string | null
          provider: string
          retry_count: number | null
          status: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: string
          last_retry_at?: string | null
          next_retry_at?: string | null
          payload?: Json | null
          processed_at?: string | null
          provider: string
          retry_count?: number | null
          status: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: string
          last_retry_at?: string | null
          next_retry_at?: string | null
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          retry_count?: number | null
          status?: string
        }
        Relationships: []
      }
      webhook_settings: {
        Row: {
          alert_notification_email: string | null
          alert_threshold_invalid_sig: number | null
          alert_threshold_timeout: number | null
          alert_window_minutes: number | null
          created_at: string | null
          id: string
          max_retries: number | null
          retry_backoff_factor: number | null
          updated_at: string | null
        }
        Insert: {
          alert_notification_email?: string | null
          alert_threshold_invalid_sig?: number | null
          alert_threshold_timeout?: number | null
          alert_window_minutes?: number | null
          created_at?: string | null
          id?: string
          max_retries?: number | null
          retry_backoff_factor?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_notification_email?: string | null
          alert_threshold_invalid_sig?: number | null
          alert_threshold_timeout?: number | null
          alert_window_minutes?: number | null
          created_at?: string | null
          id?: string
          max_retries?: number | null
          retry_backoff_factor?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      _notif_http_post: {
        Args: {
          p_body: Json
          p_headers: Json
          p_timeout_ms: number
          p_url: string
        }
        Returns: number
      }
      _notif_http_response: {
        Args: { p_request_id: number }
        Returns: {
          error_msg: string
          status: string
          status_code: number
        }[]
      }
      _test_enqueue_http: {
        Args: {
          p_body?: string
          p_error?: string
          p_status: number
          p_url: string
        }
        Returns: number
      }
      _test_notif_admin_retry_run_all: {
        Args: never
        Returns: {
          case_name: string
          result: string
        }[]
      }
      _test_notif_concurrency_cleanup: { Args: never; Returns: undefined }
      _test_notif_concurrency_seed: {
        Args: { p_count?: number; p_fail_ratio?: number }
        Returns: number
      }
      _test_notif_concurrency_verify: { Args: never; Returns: Json }
      _test_notif_reset: { Args: never; Returns: undefined }
      _test_notif_retry_snapshot_row: { Args: { p_id: string }; Returns: Json }
      _test_notif_retry_snapshots: { Args: never; Returns: Json }
      _test_notif_run_all: {
        Args: never
        Returns: {
          case_name: string
          result: string
        }[]
      }
      admin_capture_pg_stat_snapshot: {
        Args: { p_label?: string; p_limit?: number; p_note?: string }
        Returns: string
      }
      admin_explain_query: {
        Args: { p_analyze?: boolean; p_query: string }
        Returns: string
      }
      admin_get_pg_stat_snapshot_config: {
        Args: never
        Returns: {
          consecutive_failures: number
          enabled: boolean
          id: number
          interval_minutes: number
          last_error_at: string | null
          last_error_message: string | null
          last_notification_error: string | null
          last_notified_at: string | null
          last_run_at: string | null
          last_snapshot_id: string | null
          last_success_at: string | null
          notify_slack_webhook_url: string | null
          notify_webhook_url: string | null
          retention_days: number
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "pg_stat_snapshot_config"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_get_pg_stat_statements: {
        Args: { p_limit?: number; p_min_calls?: number; p_order_by?: string }
        Returns: {
          calls: number
          max_exec_ms: number
          mean_exec_ms: number
          min_exec_ms: number
          query: string
          rows_returned: number
          shared_blks_hit: number
          shared_blks_read: number
          stats_since: string
          stddev_exec_ms: number
          total_exec_ms: number
        }[]
      }
      admin_list_notification_attempts: {
        Args: { p_id: string }
        Returns: {
          attempt_no: number
          created_at: string
          error_msg: string
          event: string
          id: string
          next_attempt_at: string
          request_id: number
          status_code: number
        }[]
      }
      admin_list_pending_notifications: {
        Args: { p_limit?: number; p_status?: string }
        Returns: {
          attempts: number
          channel: string
          created_at: string
          id: string
          last_attempt_at: string
          last_error: string
          last_request_id: number
          last_status_code: number
          max_attempts: number
          next_attempt_at: string
          payload: Json
          status: string
          succeeded_at: string
          target_url: string
        }[]
      }
      admin_list_translation_sources: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_pcl_status?: string
          p_search?: string
        }
        Returns: {
          author: string
          certified_at: string
          code: string
          id: string
          imported_at: string
          is_primary: boolean
          language: string
          name: string
          pcl_activated_at: string
          pcl_activated_by: string
          pcl_status: string
          provider: string
          status: string
          total_count: number
          updated_at: string
          year_published: number
        }[]
      }
      admin_notif_failures_report: {
        Args: {
          p_channel?: string
          p_from?: string
          p_status?: string
          p_to?: string
        }
        Returns: Json
      }
      admin_notif_queue_stats: { Args: never; Returns: Json }
      admin_notif_send_test: { Args: { p_channel: string }; Returns: Json }
      admin_notif_validate_channel: {
        Args: { p_channel: string; p_url: string }
        Returns: Json
      }
      admin_notif_validate_payload: {
        Args: { p_channel: string; p_payload: Json }
        Returns: Json
      }
      admin_pcl_kpis: {
        Args: never
        Returns: {
          pcl_status: string
          total: number
        }[]
      }
      admin_reset_pg_stat_statements: { Args: never; Returns: string }
      admin_retry_pending_notification: {
        Args: { p_id: string }
        Returns: {
          attempts: number
          channel: string
          created_at: string
          id: string
          last_attempt_at: string | null
          last_error: string | null
          last_request_id: number | null
          last_status_code: number | null
          max_attempts: number
          next_attempt_at: string
          payload: Json
          status: string
          succeeded_at: string | null
          target_url: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pg_stat_pending_notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_pg_stat_snapshot_config: {
        Args: {
          p_enabled: boolean
          p_interval_minutes: number
          p_notify_slack_webhook_url?: string
          p_notify_webhook_url?: string
          p_retention_days: number
        }
        Returns: {
          consecutive_failures: number
          enabled: boolean
          id: number
          interval_minutes: number
          last_error_at: string | null
          last_error_message: string | null
          last_notification_error: string | null
          last_notified_at: string | null
          last_run_at: string | null
          last_snapshot_id: string | null
          last_success_at: string | null
          notify_slack_webhook_url: string | null
          notify_webhook_url: string | null
          retention_days: number
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "pg_stat_snapshot_config"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      aggregate_bible_cache_metrics: {
        Args: { p_since?: string }
        Returns: number
      }
      audit_security_definer_privileges: {
        Args: never
        Returns: {
          details: string
          function_name: string
          issue_type: string
          schema_name: string
          severity: string
        }[]
      }
      bible_cache_baseline_p95: {
        Args: { p_abbrev: string; p_metric: string }
        Returns: number
      }
      bible_cache_timeseries: {
        Args: {
          p_abbrev?: string
          p_since_hours?: number
          p_window_minutes?: number
        }
        Returns: {
          abbrev: string
          bucket_start: string
          cache_hit_rate: number
          edge_avg_ms: number
          edge_max_ms: number
          edge_p50_ms: number
          edge_p95_ms: number
          hits: number
          invalidation_rate: number
          l1_bypass: number
          l1_fresh: number
          l1_miss: number
          l1_stale: number
          misses: number
          sql_avg_ms: number
          sql_p95_ms: number
          stale: number
          total: number
          total_avg_ms: number
          total_max_ms: number
          total_p50_ms: number
          total_p95_ms: number
          worst_correlation_ids: string[]
        }[]
      }
      bible_cache_worst_offender: {
        Args: { p_abbrev: string; p_bucket_start: string; p_metric: string }
        Returns: {
          cache: string
          correlation_id: string
          l1_phase: string
          value_ms: number
        }[]
      }
      bible_canonical_coverage: {
        Args: never
        Returns: {
          abbrev: string
          canonical_type: string
          chapters_present: number
          coverage_pct: number
          english_verse_count: number
          expected_chapters: number
          name: string
          status: string
          testament: string
          verses_total: number
        }[]
      }
      bible_chapter_drilldown: {
        Args: { p_abbrev: string; p_hours?: number }
        Returns: {
          avg_ms: number
          bolls_calls: number
          bolls_failures: number
          chapter: number
          hits: number
          max_ms: number
          misses: number
          p95_ms: number
          stale: number
          total: number
        }[]
      }
      bible_detect_english_verses: {
        Args: { p_abbrev?: string; p_min_hits?: number }
        Returns: {
          abbrev: string
          book_id: string
          book_name: string
          chapter_number: number
          hit_count: number
          sample: string
          verse_number: number
        }[]
      }
      bible_read_gate_status: {
        Args: never
        Returns: {
          blocked: boolean
          blocking_findings: number
          last_run_at: string
          reason: string
          run_id: string
          status: string
        }[]
      }
      bible_source_sprint1_passed: {
        Args: { p_source_id: string }
        Returns: boolean
      }
      bible_translation_readable: {
        Args: { p_translation_id: string }
        Returns: {
          pcl_status: string
          provider: string
          readable: boolean
          reason: string
        }[]
      }
      bible_translation_ready: {
        Args: { p_translation_id: string }
        Returns: {
          gate_blocked: boolean
          ready: boolean
          reason: string
          sprint1_passed: boolean
        }[]
      }
      bible_translations_readiness: {
        Args: never
        Returns: {
          author: string
          books_count: number
          certified_at: string
          chapters_count: number
          code: string
          gate_blocked: boolean
          id: string
          imported_at: string
          is_primary: boolean
          name: string
          ready: boolean
          reason: string
          sprint1_passed: boolean
          status: string
          verses_count: number
          year_published: number
        }[]
      }
      capture_governance_audit: {
        Args: {
          p_after_state: Json
          p_before_state: Json
          p_entity_id: string
          p_entity_type: string
          p_operation: string
        }
        Returns: undefined
      }
      check_daily_reminders: { Args: never; Returns: undefined }
      cleanup_bible_audit_action_logs: {
        Args: { p_override_days?: number; p_triggered_by?: string }
        Returns: {
          retention_days: number
          rows_deleted: number
          status: string
        }[]
      }
      cleanup_telemetry_logs:
        | { Args: never; Returns: undefined }
        | { Args: { retention_days?: number }; Returns: undefined }
      fn_archive_governance_audit: {
        Args: { p_override_days?: number; p_triggered_by?: string }
        Returns: {
          retention_days: number
          rows_archived: number
          status: string
        }[]
      }
      generate_security_diff_summary: {
        Args: { after_val: Json; before_val: Json }
        Returns: string
      }
      generate_security_scan_alerts: {
        Args: { p_scan_id: string }
        Returns: number
      }
      get_correlation_trail: {
        Args: { _cid: string; _include_responses?: boolean }
        Returns: {
          actor_id: string
          details: Json
          duration_ms: number
          entity_id: string
          entity_type: string
          occurred_at: string
          operation: string
          source: string
          status_code: number
        }[]
      }
      get_latest_journey_title: { Args: { p_user_id: string }; Returns: string }
      get_pending_webhook_retries: {
        Args: never
        Returns: {
          event_id: string
          id: string
          payload: Json
          retry_count: number
          status: string
        }[]
      }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      is_current_user_admin: { Args: never; Returns: boolean }
      jsonb_shallow_diff: {
        Args: { p_after: Json; p_before: Json }
        Returns: Json
      }
      log_access_denial: {
        Args: {
          attempted_action: string
          extra_details?: Json
          resource_name: string
        }
        Returns: undefined
      }
      log_bible_audit_action: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type?: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_description: string
          p_event_type: string
          p_metadata?: Json
          p_severity?: string
        }
        Returns: undefined
      }
      log_security_policy_change: {
        Args: {
          p_action: string
          p_details: Json
          p_entity_name: string
          p_scan_id?: string
        }
        Returns: string
      }
      mask_ip: { Args: { ip: string }; Returns: string }
      pg_stat_notif_backoff: { Args: { p_attempts: number }; Returns: string }
      pg_stat_notif_enqueue: {
        Args: {
          p_channel: string
          p_max_attempts?: number
          p_payload: Json
          p_target_url: string
        }
        Returns: string
      }
      pg_stat_notif_is_retryable: {
        Args: { p_status_code: number }
        Returns: boolean
      }
      pg_stat_notif_process_queue: { Args: never; Returns: number }
      pg_stat_snapshot_auto_run: { Args: never; Returns: undefined }
      purge_user_bible_cache: {
        Args: { p_book_abbr?: string; p_user_id: string }
        Returns: undefined
      }
      run_manual_security_scan: { Args: never; Returns: string }
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
          bio_source_url: string | null
          born: string | null
          catechism_refs: number[] | null
          category: string | null
          church_doc_refs: Json | null
          content_hash: string | null
          created_at: string | null
          died: string | null
          feast_day: string | null
          feast_day_num: number | null
          feast_month: number | null
          full_bio: string | null
          id: string
          image: string | null
          last_scraped_at: string | null
          name: string
          patron_of: string[] | null
          prayer: string | null
          prayer_source_url: string | null
          quotes: string[] | null
          source_name: string | null
          source_url: string | null
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
      track_webhook_alert: {
        Args: { p_message: string; p_severity: string; p_type: string }
        Returns: undefined
      }
      verify_security_invariants: {
        Args: never
        Returns: {
          error_message: string
          status: string
          test_name: string
        }[]
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
