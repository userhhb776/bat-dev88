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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_events: {
        Row: {
          created_at: string
          detail: Json
          id: string
          kind: string
          page: string
          user_agent: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          id?: string
          kind: string
          page?: string
          user_agent?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: Json
          id?: string
          kind?: string
          page?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_audios: {
        Row: {
          agent_id: string
          created_at: string
          data: string
          id: string
          mime: string
          title: string
          trigger: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          data: string
          id?: string
          mime?: string
          title: string
          trigger?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          data?: string
          id?: string
          mime?: string
          title?: string
          trigger?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_audios_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_events: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          kind: string
          text: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          kind?: string
          text: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          kind?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_leads: {
        Row: {
          address: string | null
          agent_id: string
          city: string
          created_at: string
          id: string
          maps_url: string | null
          name: string
          niche: string
          phone: string | null
          photos: number | null
          place_id: string
          qualification: Json | null
          rating: number | null
          reviews_count: number
          send_at: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          agent_id: string
          city?: string
          created_at?: string
          id?: string
          maps_url?: string | null
          name: string
          niche?: string
          phone?: string | null
          photos?: number | null
          place_id: string
          qualification?: Json | null
          rating?: number | null
          reviews_count?: number
          send_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          agent_id?: string
          city?: string
          created_at?: string
          id?: string
          maps_url?: string | null
          name?: string
          niche?: string
          phone?: string | null
          photos?: number | null
          place_id?: string
          qualification?: Json | null
          rating?: number | null
          reviews_count?: number
          send_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          agent_id: string
          body: string
          contact_name: string
          created_at: string
          direction: string
          hot: boolean
          id: string
          manual: boolean
          phone: string
          provider_message_id: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          body: string
          contact_name?: string
          created_at?: string
          direction: string
          hot?: boolean
          id?: string
          manual?: boolean
          phone: string
          provider_message_id?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          body?: string
          contact_name?: string
          created_at?: string
          direction?: string
          hot?: boolean
          id?: string
          manual?: boolean
          phone?: string
          provider_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_pauses: {
        Row: {
          agent_id: string
          created_at: string
          phone: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          phone: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          phone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_pauses_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          active: boolean
          ai_key: string | null
          ai_provider: string
          auto_reply: boolean
          avatar_url: string | null
          btx: Json
          context: string
          created_at: string
          id: string
          ideal_client: string
          instance: string
          learned: string
          limp: Json
          miner: Json
          mission: string
          model: string
          name: string
          offer: string
          pace: string
          persona: Json
          rules: string
          script_steps: Json
          squad: string | null
          style: string
          training_mode: boolean
          training_phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          ai_key?: string | null
          ai_provider?: string
          auto_reply?: boolean
          avatar_url?: string | null
          btx?: Json
          context?: string
          created_at?: string
          id?: string
          ideal_client?: string
          instance?: string
          learned?: string
          limp?: Json
          miner?: Json
          mission?: string
          model?: string
          name: string
          offer?: string
          pace?: string
          persona?: Json
          rules?: string
          script_steps?: Json
          squad?: string | null
          style?: string
          training_mode?: boolean
          training_phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          ai_key?: string | null
          ai_provider?: string
          auto_reply?: boolean
          avatar_url?: string | null
          btx?: Json
          context?: string
          created_at?: string
          id?: string
          ideal_client?: string
          instance?: string
          learned?: string
          limp?: Json
          miner?: Json
          mission?: string
          model?: string
          name?: string
          offer?: string
          pace?: string
          persona?: Json
          rules?: string
          script_steps?: Json
          squad?: string | null
          style?: string
          training_mode?: boolean
          training_phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      batops_state: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      block_items: {
        Row: {
          address: string | null
          block_id: string
          city: string | null
          created_at: string
          id: string
          maps_url: string | null
          name: string
          niche: string | null
          phone: string | null
          place_id: string
          rating: number | null
          reviews_count: number
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          block_id: string
          city?: string | null
          created_at?: string
          id?: string
          maps_url?: string | null
          name: string
          niche?: string | null
          phone?: string | null
          place_id: string
          rating?: number | null
          reviews_count?: number
          user_id?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          block_id?: string
          city?: string | null
          created_at?: string
          id?: string
          maps_url?: string | null
          name?: string
          niche?: string | null
          phone?: string | null
          place_id?: string
          rating?: number | null
          reviews_count?: number
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_items_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "lead_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      bo_contacts: {
        Row: {
          agent: string
          created_at: string
          id: string
          name: string
          notes: string
          phone: string
          spent: number
          stage: string
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          agent?: string
          created_at?: string
          id?: string
          name: string
          notes?: string
          phone?: string
          spent?: number
          stage?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          agent?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
          spent?: number
          stage?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          block_id: string | null
          created_at: string
          daily_limit: number
          days: number[]
          from_h: number
          id: string
          instance: string
          max_gap_s: number
          min_gap_s: number
          msg_gap_s: number
          name: string
          script_id: string | null
          start_at: string
          status: string
          texts: string[]
          to_h: number
          user_id: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          daily_limit?: number
          days?: number[]
          from_h?: number
          id?: string
          instance: string
          max_gap_s?: number
          min_gap_s?: number
          msg_gap_s?: number
          name: string
          script_id?: string | null
          start_at?: string
          status?: string
          texts?: string[]
          to_h?: number
          user_id?: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          daily_limit?: number
          days?: number[]
          from_h?: number
          id?: string
          instance?: string
          max_gap_s?: number
          min_gap_s?: number
          msg_gap_s?: number
          name?: string
          script_id?: string | null
          start_at?: string
          status?: string
          texts?: string[]
          to_h?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "lead_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_tokens: {
        Row: {
          created_at: string
          name: string
          token: string
        }
        Insert: {
          created_at?: string
          name: string
          token?: string
        }
        Update: {
          created_at?: string
          name?: string
          token?: string
        }
        Relationships: []
      }
      daily_leads: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          found_on: string
          id: string
          maps_url: string | null
          name: string
          niche: string | null
          phone: string | null
          place_id: string
          rating: number | null
          reviews_count: number
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          found_on?: string
          id?: string
          maps_url?: string | null
          name: string
          niche?: string | null
          phone?: string | null
          place_id: string
          rating?: number | null
          reviews_count?: number
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          found_on?: string
          id?: string
          maps_url?: string | null
          name?: string
          niche?: string | null
          phone?: string | null
          place_id?: string
          rating?: number | null
          reviews_count?: number
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      jarvis_tokens: {
        Row: {
          created_at: string
          last_used_at: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_used_at?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_used_at?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_blocks: {
        Row: {
          created_at: string
          id: string
          name: string
          niche: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          niche?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          niche?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          audit: Json | null
          city: string | null
          created_at: string
          delivered_at: string | null
          delivered_site_url: string | null
          id: string
          instagram: string | null
          last_contact_at: string | null
          maps_url: string | null
          message: string | null
          name: string
          next_followup_at: string | null
          niche: string | null
          notes: string | null
          phone: string | null
          place_id: string
          rating: number | null
          reviews_count: number | null
          script_id: string | null
          source: string
          source_url: string | null
          status: string
          tags: string[]
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          audit?: Json | null
          city?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_site_url?: string | null
          id?: string
          instagram?: string | null
          last_contact_at?: string | null
          maps_url?: string | null
          message?: string | null
          name: string
          next_followup_at?: string | null
          niche?: string | null
          notes?: string | null
          phone?: string | null
          place_id: string
          rating?: number | null
          reviews_count?: number | null
          script_id?: string | null
          source?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          audit?: Json | null
          city?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_site_url?: string | null
          id?: string
          instagram?: string | null
          last_contact_at?: string | null
          maps_url?: string | null
          message?: string | null
          name?: string
          next_followup_at?: string | null
          niche?: string | null
          notes?: string | null
          phone?: string | null
          place_id?: string
          rating?: number | null
          reviews_count?: number | null
          script_id?: string | null
          source?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_feedback: {
        Row: {
          address: string | null
          created_at: string
          id: string
          kind: string
          name: string | null
          niche: string | null
          place_id: string
          rating: number | null
          reviews_count: number
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          kind: string
          name?: string | null
          niche?: string | null
          place_id: string
          rating?: number | null
          reviews_count?: number
          user_id?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          kind?: string
          name?: string | null
          niche?: string | null
          place_id?: string
          rating?: number | null
          reviews_count?: number
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          title: string
          url?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      pl_campaigns: {
        Row: {
          created_at: string
          daily_limit: number
          id: string
          instance: string
          list_id: string | null
          max_contacts: number | null
          max_gap_min: number
          min_gap_min: number
          name: string
          script_id: string | null
          start_at: string
          status: string
          texts: string[]
          user_id: string
          weekdays_only: boolean
          window_end: number
          window_start: number
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          id?: string
          instance: string
          list_id?: string | null
          max_contacts?: number | null
          max_gap_min?: number
          min_gap_min?: number
          name: string
          script_id?: string | null
          start_at?: string
          status?: string
          texts?: string[]
          user_id?: string
          weekdays_only?: boolean
          window_end?: number
          window_start?: number
        }
        Update: {
          created_at?: string
          daily_limit?: number
          id?: string
          instance?: string
          list_id?: string | null
          max_contacts?: number | null
          max_gap_min?: number
          min_gap_min?: number
          name?: string
          script_id?: string | null
          start_at?: string
          status?: string
          texts?: string[]
          user_id?: string
          weekdays_only?: boolean
          window_end?: number
          window_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "pl_campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "pl_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pl_campaigns_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "pl_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      pl_contacts: {
        Row: {
          created_at: string
          id: string
          list_id: string
          name: string
          notes: string
          opted_out: boolean
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id: string
          name?: string
          notes?: string
          opted_out?: boolean
          phone: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          list_id?: string
          name?: string
          notes?: string
          opted_out?: boolean
          phone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pl_contacts_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "pl_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      pl_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          source?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      pl_queue: {
        Row: {
          campaign_id: string
          contact_id: string | null
          created_at: string
          error: string | null
          id: string
          name: string
          phone: string
          replied: boolean
          send_at: string
          sent_at: string | null
          status: string
          texts: string[]
          user_id: string
        }
        Insert: {
          campaign_id: string
          contact_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          name?: string
          phone: string
          replied?: boolean
          send_at: string
          sent_at?: string | null
          status?: string
          texts: string[]
          user_id?: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          name?: string
          phone?: string
          replied?: boolean
          send_at?: string
          sent_at?: string | null
          status?: string
          texts?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pl_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pl_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pl_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "pl_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      pl_scripts: {
        Row: {
          body: string
          created_at: string
          id: string
          message2: string
          message3: string
          title: string
          user_id: string
          variants: Json
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          message2?: string
          message3?: string
          title: string
          user_id?: string
          variants?: Json
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          message2?: string
          message3?: string
          title?: string
          user_id?: string
          variants?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string
          created_at: string
          email: string
          id: string
          name: string
          reviewed_at: string | null
        }
        Insert: {
          approval_status?: string
          created_at?: string
          email?: string
          id: string
          name?: string
          reviewed_at?: string | null
        }
        Update: {
          approval_status?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          reviewed_at?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          amount: number
          completed_work: string
          created_at: string
          deadline: string
          id: string
          lead_id: string
          outcome: string
          payment_terms: string
          project_cost: number
          received_amount: number
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          completed_work?: string
          created_at?: string
          deadline?: string
          id?: string
          lead_id: string
          outcome?: string
          payment_terms?: string
          project_cost?: number
          received_amount?: number
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          completed_work?: string
          created_at?: string
          deadline?: string
          id?: string
          lead_id?: string
          outcome?: string
          payment_terms?: string
          project_cost?: number
          received_amount?: number
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          body: string
          created_at: string
          id: string
          message2: string
          message3: string
          niche: string
          site_filter: string
          stage: string
          title: string
          updated_at: string
          user_id: string
          variants: Json
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          message2?: string
          message3?: string
          niche?: string
          site_filter?: string
          stage?: string
          title: string
          updated_at?: string
          user_id?: string
          variants?: Json
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          message2?: string
          message3?: string
          niche?: string
          site_filter?: string
          stage?: string
          title?: string
          updated_at?: string
          user_id?: string
          variants?: Json
        }
        Relationships: []
      }
      service_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_prompts: {
        Row: {
          business_name: string
          city: string | null
          created_at: string
          id: string
          niche: string | null
          place_id: string
          prompt: string
          user_id: string
        }
        Insert: {
          business_name: string
          city?: string | null
          created_at?: string
          id?: string
          niche?: string | null
          place_id: string
          prompt: string
          user_id?: string
        }
        Update: {
          business_name?: string
          city?: string | null
          created_at?: string
          id?: string
          niche?: string | null
          place_id?: string
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          last_active_at: string | null
          last_reminder_at: string | null
          mining_enabled: boolean
          niche_filter: string | null
          state_filter: string | null
          updated_at: string
          user_id: string
          wa_labels: Json
        }
        Insert: {
          last_active_at?: string | null
          last_reminder_at?: string | null
          mining_enabled?: boolean
          niche_filter?: string | null
          state_filter?: string | null
          updated_at?: string
          user_id: string
          wa_labels?: Json
        }
        Update: {
          last_active_at?: string | null
          last_reminder_at?: string | null
          mining_enabled?: boolean
          niche_filter?: string | null
          state_filter?: string | null
          updated_at?: string
          user_id?: string
          wa_labels?: Json
        }
        Relationships: []
      }
      wa_scheduled: {
        Row: {
          campaign_id: string | null
          created_at: string
          error: string | null
          id: string
          instance: string
          lead_id: string | null
          name: string
          phone: string
          send_at: string
          sent_at: string | null
          status: string
          texts: string[]
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          instance: string
          lead_id?: string | null
          name: string
          phone: string
          send_at: string
          sent_at?: string | null
          status?: string
          texts: string[]
          user_id?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          instance?: string
          lead_id?: string | null
          name?: string
          phone?: string
          send_at?: string
          sent_at?: string | null
          status?: string
          texts?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_scheduled_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_scheduled_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      db_usage: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      record_access: {
        Args: { _detail?: Json; _kind: string; _page?: string }
        Returns: undefined
      }
      schedule_dispatch_wake: { Args: { _at: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
