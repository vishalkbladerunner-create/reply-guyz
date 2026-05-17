export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          slug: string
          platform: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          platform: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          platform?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          client_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          client_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          client_id?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          client_id: string
          platform: string
          post_date: string
          post_time: string | null
          likes: number
          reposts: number
          comments: number
          shares: number
          reactions: number
          impressions: number
          engagements: number
          engagement_rate: number | null
          post_url: string | null
          post_text: string | null
          media_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          platform: string
          post_date: string
          post_time?: string | null
          likes?: number
          reposts?: number
          comments?: number
          shares?: number
          reactions?: number
          impressions?: number
          engagements?: number
          engagement_rate?: number | null
          post_url?: string | null
          post_text?: string | null
          media_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          platform?: string
          post_date?: string
          post_time?: string | null
          likes?: number
          reposts?: number
          comments?: number
          shares?: number
          reactions?: number
          impressions?: number
          engagements?: number
          engagement_rate?: number | null
          post_url?: string | null
          post_text?: string | null
          media_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_metrics: {
        Row: {
          id: string
          client_id: string
          platform: string
          metric_date: string
          impressions: number
          likes: number
          engagements: number
          bookmarks: number
          shares: number
          new_follows: number
          unfollows: number
          replies: number
          reposts: number
          profile_visits: number
          posts_created: number
          net_followers: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          platform: string
          metric_date: string
          impressions?: number
          likes?: number
          engagements?: number
          bookmarks?: number
          shares?: number
          new_follows?: number
          unfollows?: number
          replies?: number
          reposts?: number
          profile_visits?: number
          posts_created?: number
          net_followers?: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          platform?: string
          metric_date?: string
          impressions?: number
          likes?: number
          engagements?: number
          bookmarks?: number
          shares?: number
          new_follows?: number
          unfollows?: number
          replies?: number
          reposts?: number
          profile_visits?: number
          posts_created?: number
          net_followers?: number
          created_at?: string
        }
      }
      engagement_orders: {
        Row: {
          id: string
          client_id: string
          platform: string
          link: string
          post_url: string | null
          order_date: string | null
          followers_ordered: number
          comments_ordered: number
          reposts_ordered: number
          likes_ordered: number
          views_ordered: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          platform: string
          link: string
          post_url?: string | null
          order_date?: string | null
          followers_ordered?: number
          comments_ordered?: number
          reposts_ordered?: number
          likes_ordered?: number
          views_ordered?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          platform?: string
          link?: string
          post_url?: string | null
          order_date?: string | null
          followers_ordered?: number
          comments_ordered?: number
          reposts_ordered?: number
          likes_ordered?: number
          views_ordered?: number
          status?: string
          created_at?: string
        }
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
  }
}
