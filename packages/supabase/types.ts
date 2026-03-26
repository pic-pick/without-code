export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          folder_name: string | null
          id: string
          post_id: string | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_name?: string | null
          id?: string
          post_id?: string | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_name?: string | null
          id?: string
          post_id?: string | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      build_log_subscriptions: {
        Row: {
          created_at: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_log_subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "build_log_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      build_logs: {
        Row: {
          author_id: string
          created_at: string | null
          did_today: string | null
          id: string
          learned: string | null
          next_todo: string | null
          progress_pct: number | null
          project_id: string | null
          title: string
        }
        Insert: {
          author_id: string
          created_at?: string | null
          did_today?: string | null
          id?: string
          learned?: string | null
          next_todo?: string | null
          progress_pct?: number | null
          project_id?: string | null
          title: string
        }
        Update: {
          author_id?: string
          created_at?: string | null
          did_today?: string | null
          id?: string
          learned?: string | null
          next_todo?: string | null
          progress_pct?: number | null
          project_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_logs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "build_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          like_count: number | null
          parent_id: string | null
          post_id: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          room_id: string
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "dm_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_rooms: {
        Row: {
          created_at: string | null
          id: string
          last_message: string | null
          last_msg_at: string | null
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_msg_at?: string | null
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_msg_at?: string | null
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_rooms_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_rooms_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_applications: {
        Row: {
          applicant_id: string
          created_at: string | null
          id: string
          message: string | null
          request_id: string
          status: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          request_id: string
          status?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          request_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_applications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "matching_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_profiles: {
        Row: {
          available: boolean | null
          created_at: string | null
          interests: string[] | null
          role: string
          skills: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          interests?: string[] | null
          role: string
          skills?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          interests?: string[] | null
          role?: string
          skills?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          description: string
          duration_days: number | null
          id: string
          requester_id: string
          skills_needed: string[] | null
          status: string | null
          title: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          description: string
          duration_days?: number | null
          id?: string
          requester_id: string
          skills_needed?: string[] | null
          status?: string | null
          title: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          description?: string
          duration_days?: number | null
          id?: string
          requester_id?: string
          skills_needed?: string[] | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          comment_inapp: boolean | null
          comment_push: boolean | null
          dnd_end: string | null
          dnd_start: string | null
          follow_inapp: boolean | null
          follow_push: boolean | null
          like_inapp: boolean | null
          like_push: boolean | null
          mention_inapp: boolean | null
          mention_push: boolean | null
          system_email: boolean | null
          system_inapp: boolean | null
          user_id: string
          weekly_email: boolean | null
        }
        Insert: {
          comment_inapp?: boolean | null
          comment_push?: boolean | null
          dnd_end?: string | null
          dnd_start?: string | null
          follow_inapp?: boolean | null
          follow_push?: boolean | null
          like_inapp?: boolean | null
          like_push?: boolean | null
          mention_inapp?: boolean | null
          mention_push?: boolean | null
          system_email?: boolean | null
          system_inapp?: boolean | null
          user_id: string
          weekly_email?: boolean | null
        }
        Update: {
          comment_inapp?: boolean | null
          comment_push?: boolean | null
          dnd_end?: string | null
          dnd_start?: string | null
          follow_inapp?: boolean | null
          follow_push?: boolean | null
          like_inapp?: boolean | null
          like_push?: boolean | null
          mention_inapp?: boolean | null
          mention_push?: boolean | null
          system_email?: boolean | null
          system_inapp?: boolean | null
          user_id?: string
          weekly_email?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          provider: string | null
          provider_tx_id: string | null
          status: string
          sub_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          provider?: string | null
          provider_tx_id?: string | null
          status: string
          sub_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          provider?: string | null
          provider_tx_id?: string | null
          status?: string
          sub_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_sub_id_fkey"
            columns: ["sub_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comment_count: number | null
          content: string
          created_at: string | null
          id: string
          image_urls: string[] | null
          is_deleted: boolean | null
          like_count: number | null
          tool_tags: string[] | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_deleted?: boolean | null
          like_count?: number | null
          tool_tags?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_deleted?: boolean | null
          like_count?: number | null
          tool_tags?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          delete_requested_at: string | null
          display_name: string
          expo_push_token: string | null
          follower_count: number | null
          following_count: number | null
          github_handle: string | null
          id: string
          interest_cats: string[] | null
          interest_tools: string[] | null
          is_active: boolean | null
          is_premium: boolean | null
          marketing_agreed: boolean
          onboarding_completed: boolean
          premium_until: string | null
          project_count: number | null
          terms_agreed_at: string | null
          username: string
          username_changed_at: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          delete_requested_at?: string | null
          display_name: string
          expo_push_token?: string | null
          follower_count?: number | null
          following_count?: number | null
          github_handle?: string | null
          id: string
          interest_cats?: string[] | null
          interest_tools?: string[] | null
          is_active?: boolean | null
          is_premium?: boolean | null
          marketing_agreed?: boolean
          onboarding_completed?: boolean
          premium_until?: string | null
          project_count?: number | null
          terms_agreed_at?: string | null
          username: string
          username_changed_at?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          delete_requested_at?: string | null
          display_name?: string
          expo_push_token?: string | null
          follower_count?: number | null
          following_count?: number | null
          github_handle?: string | null
          id?: string
          interest_cats?: string[] | null
          interest_tools?: string[] | null
          is_active?: boolean | null
          is_premium?: boolean | null
          marketing_agreed?: boolean
          onboarding_completed?: boolean
          premium_until?: string | null
          project_count?: number | null
          terms_agreed_at?: string | null
          username?: string
          username_changed_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      project_drafts: {
        Row: {
          author_id: string
          created_at: string | null
          data: Json
          id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          created_at?: string | null
          data: Json
          id?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string | null
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_drafts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          sort_order: number
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          sort_order?: number
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          sort_order?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_prompts: {
        Row: {
          content: string
          copy_count: number | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_masked: boolean | null
          is_public: boolean | null
          project_id: string
          result_desc: string | null
          step_order: number
          tool_name: string | null
        }
        Insert: {
          content: string
          copy_count?: number | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_masked?: boolean | null
          is_public?: boolean | null
          project_id: string
          result_desc?: string | null
          step_order: number
          tool_name?: string | null
        }
        Update: {
          content?: string
          copy_count?: number | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_masked?: boolean | null
          is_public?: boolean | null
          project_id?: string
          result_desc?: string | null
          step_order?: number
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tools: {
        Row: {
          project_id: string
          tool_id: string
        }
        Insert: {
          project_id: string
          tool_id: string
        }
        Update: {
          project_id?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tools_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          author_id: string
          bookmark_count: number | null
          category: string | null
          comment_count: number | null
          created_at: string | null
          deleted_at: string | null
          demo_url: string
          description: string
          github_url: string | null
          has_prompt: boolean | null
          id: string
          is_deleted: boolean | null
          is_featured: boolean | null
          like_count: number | null
          prompt_copy_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          version: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          bookmark_count?: number | null
          category?: string | null
          comment_count?: number | null
          created_at?: string | null
          deleted_at?: string | null
          demo_url: string
          description: string
          github_url?: string | null
          has_prompt?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_featured?: boolean | null
          like_count?: number | null
          prompt_copy_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          bookmark_count?: number | null
          category?: string | null
          comment_count?: number | null
          created_at?: string | null
          deleted_at?: string | null
          demo_url?: string
          description?: string
          github_url?: string | null
          has_prompt?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_featured?: boolean | null
          like_count?: number | null
          prompt_copy_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qna_answers: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_best: boolean | null
          question_id: string
          updated_at: string | null
          vote_score: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_best?: boolean | null
          question_id: string
          updated_at?: string | null
          vote_score?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_best?: boolean | null
          question_id?: string
          updated_at?: string | null
          vote_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qna_answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "qna_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      qna_questions: {
        Row: {
          answer_count: number | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          image_urls: string[] | null
          is_resolved: boolean | null
          title: string
          tool_tags: string[] | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          answer_count?: number | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_resolved?: boolean | null
          title: string
          tool_tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          answer_count?: number | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_resolved?: boolean | null
          title?: string
          tool_tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qna_questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qna_votes: {
        Row: {
          answer_id: string
          id: string
          is_helpful: boolean
          user_id: string
        }
        Insert: {
          answer_id: string
          id?: string
          is_helpful: boolean
          user_id: string
        }
        Update: {
          answer_id?: string
          id?: string
          is_helpful?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qna_votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "qna_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          detail: string | null
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          detail?: string | null
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          detail?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          plan: string
          provider: string | null
          provider_sub_id: string | null
          started_at: string
          status: string
          trial_ends_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          plan: string
          provider?: string | null
          provider_sub_id?: string | null
          started_at: string
          status: string
          trial_ends_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          plan?: string
          provider?: string | null
          provider_sub_id?: string | null
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_reviews: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          rating: number
          tool_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          rating: number
          tool_id: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          tool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_reviews_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          created_at: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
          website: string | null
        }
        Insert: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
          website?: string | null
        }
        Update: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string
          website?: string | null
        }
        Relationships: []
      }
      weekly_bests: {
        Row: {
          id: string
          project_id: string
          rank: number
          score: number
          week_start: string
        }
        Insert: {
          id?: string
          project_id: string
          rank: number
          score: number
          week_start: string
        }
        Update: {
          id?: string
          project_id?: string
          rank?: number
          score?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_bests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_weekly_bests: { Args: never; Returns: undefined }
      get_following_feed: {
        Args: { p_cursor?: string; p_limit?: number; p_user_id: string }
        Returns: {
          author_id: string
          bookmark_count: number
          category: string
          comment_count: number
          created_at: string
          demo_url: string
          description: string
          has_prompt: boolean
          id: string
          like_count: number
          thumbnail_url: string
          title: string
          view_count: number
        }[]
      }
      get_popular_feed: {
        Args: {
          p_cursor?: number
          p_cursor_id?: string
          p_limit?: number
          p_user_id?: string
        }
        Returns: {
          author_id: string
          bookmark_count: number
          category: string
          comment_count: number
          created_at: string
          demo_url: string
          description: string
          has_prompt: boolean
          id: string
          like_count: number
          score: number
          thumbnail_url: string
          title: string
          view_count: number
        }[]
      }
      increment_prompt_copy: {
        Args: { p_prompt_id: string }
        Returns: undefined
      }
      increment_view_count: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      vote_qna_answer: {
        Args: { p_answer_id: string; p_helpful: boolean; p_user_id: string }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

