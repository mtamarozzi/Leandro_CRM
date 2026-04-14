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
      chat_conversations: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          lead_id: string | null
          metadata: Json | null
          page_url: string | null
          source: string
          status: Database["public"]["Enums"]["conversation_status"]
          unread_count: number
          updated_at: string
          visitor_email: string | null
          visitor_id: string
          visitor_name: string | null
          visitor_phone: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          page_url?: string | null
          source?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number
          updated_at?: string
          visitor_email?: string | null
          visitor_id: string
          visitor_name?: string | null
          visitor_phone?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          page_url?: string | null
          source?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number
          updated_at?: string
          visitor_email?: string | null
          visitor_id?: string
          visitor_name?: string | null
          visitor_phone?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: number
          metadata: Json | null
          sender_name: string | null
          sender_type: Database["public"]["Enums"]["chat_sender_type"]
          workspace_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: number
          metadata?: Json | null
          sender_name?: string | null
          sender_type: Database["public"]["Enums"]["chat_sender_type"]
          workspace_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: number
          metadata?: Json | null
          sender_name?: string | null
          sender_type?: Database["public"]["Enums"]["chat_sender_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          lead_id: string | null
          location: string | null
          property_id: string | null
          protocol_code: string | null
          reminder_minutes_before: number | null
          reminder_sent: boolean
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          property_id?: string | null
          protocol_code?: string | null
          reminder_minutes_before?: number | null
          reminder_sent?: boolean
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          property_id?: string | null
          protocol_code?: string | null
          reminder_minutes_before?: number | null
          reminder_sent?: boolean
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          content: string | null
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          occurred_at: string
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          occurred_at?: string
          type: Database["public"]["Enums"]["interaction_type"]
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          occurred_at?: string
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_properties: {
        Row: {
          added_at: string
          interest_level: number | null
          lead_id: string
          property_id: string
          workspace_id: string
        }
        Insert: {
          added_at?: string
          interest_level?: number | null
          lead_id: string
          property_id: string
          workspace_id: string
        }
        Update: {
          added_at?: string
          interest_level?: number | null
          lead_id?: string
          property_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_properties_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_properties_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_analyzed_at: string | null
          ai_next_action: string | null
          ai_score: number | null
          ai_summary: string | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          interest_purpose:
            | Database["public"]["Enums"]["property_purpose"]
            | null
          interest_type: string | null
          last_contact_at: string | null
          name: string
          notes: string | null
          origin: Database["public"]["Enums"]["lead_origin"]
          phone: string
          preferred_city: string | null
          preferred_region: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_analyzed_at?: string | null
          ai_next_action?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          interest_purpose?:
            | Database["public"]["Enums"]["property_purpose"]
            | null
          interest_type?: string | null
          last_contact_at?: string | null
          name: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["lead_origin"]
          phone: string
          preferred_city?: string | null
          preferred_region?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ai_analyzed_at?: string | null
          ai_next_action?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          interest_purpose?:
            | Database["public"]["Enums"]["property_purpose"]
            | null
          interest_type?: string | null
          last_contact_at?: string | null
          name?: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["lead_origin"]
          phone?: string
          preferred_city?: string | null
          preferred_region?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          is_cover: boolean | null
          property_id: string
          storage_path: string
          url: string
          workspace_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean | null
          property_id: string
          storage_path: string
          url: string
          workspace_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean | null
          property_id?: string
          storage_path?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          workspace_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          availability: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          condo_fee: number | null
          contract_type: string | null
          created_at: string
          deleted_at: string | null
          developer: string | null
          development_name: string | null
          floor: string | null
          full_address: string | null
          garage_type: string | null
          guarantee_type: string | null
          has_balcony: boolean | null
          highlights: string | null
          id: string
          iptu: number | null
          is_featured: boolean | null
          is_furnished: boolean | null
          is_public: boolean | null
          kind: Database["public"]["Enums"]["property_kind"]
          latitude: number | null
          longitude: number | null
          min_contract: string | null
          neighborhood: string
          parking_spots: number | null
          payment_conditions: string | null
          pet_friendly: boolean | null
          public_description: string | null
          purpose: Database["public"]["Enums"]["property_purpose"]
          ref_code: string | null
          rent_price: number | null
          sale_price: number | null
          status: Database["public"]["Enums"]["property_status"]
          suites: number | null
          total_monthly: number | null
          updated_at: string
          usable_area_m2: number | null
          workspace_id: string
        }
        Insert: {
          availability?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          condo_fee?: number | null
          contract_type?: string | null
          created_at?: string
          deleted_at?: string | null
          developer?: string | null
          development_name?: string | null
          floor?: string | null
          full_address?: string | null
          garage_type?: string | null
          guarantee_type?: string | null
          has_balcony?: boolean | null
          highlights?: string | null
          id?: string
          iptu?: number | null
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_public?: boolean | null
          kind?: Database["public"]["Enums"]["property_kind"]
          latitude?: number | null
          longitude?: number | null
          min_contract?: string | null
          neighborhood: string
          parking_spots?: number | null
          payment_conditions?: string | null
          pet_friendly?: boolean | null
          public_description?: string | null
          purpose: Database["public"]["Enums"]["property_purpose"]
          ref_code?: string | null
          rent_price?: number | null
          sale_price?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          suites?: number | null
          total_monthly?: number | null
          updated_at?: string
          usable_area_m2?: number | null
          workspace_id: string
        }
        Update: {
          availability?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          condo_fee?: number | null
          contract_type?: string | null
          created_at?: string
          deleted_at?: string | null
          developer?: string | null
          development_name?: string | null
          floor?: string | null
          full_address?: string | null
          garage_type?: string | null
          guarantee_type?: string | null
          has_balcony?: boolean | null
          highlights?: string | null
          id?: string
          iptu?: number | null
          is_featured?: boolean | null
          is_furnished?: boolean | null
          is_public?: boolean | null
          kind?: Database["public"]["Enums"]["property_kind"]
          latitude?: number | null
          longitude?: number | null
          min_contract?: string | null
          neighborhood?: string
          parking_spots?: number | null
          payment_conditions?: string | null
          pet_friendly?: boolean | null
          public_description?: string | null
          purpose?: Database["public"]["Enums"]["property_purpose"]
          ref_code?: string | null
          rent_price?: number | null
          sale_price?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          suites?: number | null
          total_monthly?: number | null
          updated_at?: string
          usable_area_m2?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      property_ref_counters: {
        Row: {
          last_seq: number
          updated_at: string
          workspace_id: string
          year: number
        }
        Insert: {
          last_seq?: number
          updated_at?: string
          workspace_id: string
          year: number
        }
        Update: {
          last_seq?: number
          updated_at?: string
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_ref_counters_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          creci: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: string
          primary_color: string | null
          slug: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creci?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: string
          primary_color?: string | null
          slug: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creci?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: string
          primary_color?: string | null
          slug?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_workspace_id: { Args: never; Returns: string }
      generate_property_ref_code: { Args: never; Returns: string }
    }
    Enums: {
      chat_sender_type: "visitor" | "ai" | "human" | "system"
      conversation_status: "ai_mode" | "human_mode" | "archived" | "resolved"
      event_status:
        | "agendado"
        | "confirmado"
        | "realizado"
        | "cancelado"
        | "nao_compareceu"
      event_type: "followup" | "visita" | "reuniao" | "tarefa" | "ligacao"
      interaction_type:
        | "whatsapp"
        | "call"
        | "email"
        | "visit"
        | "meeting"
        | "note"
        | "status_change"
        | "ai_action"
      lead_origin:
        | "chat_widget"
        | "whatsapp"
        | "facebook"
        | "instagram"
        | "google"
        | "indicacao"
        | "site"
        | "trafego_pago"
        | "manual"
        | "outro"
      lead_status:
        | "novo"
        | "contato"
        | "visita"
        | "proposta"
        | "ganho"
        | "perdido"
      notification_type:
        | "new_lead"
        | "event_reminder"
        | "lead_assigned"
        | "ai_insight"
        | "ai_handoff"
        | "system"
      property_kind:
        | "apartamento"
        | "casa"
        | "cobertura"
        | "studio"
        | "sobrado"
        | "terreno"
        | "comercial"
        | "sala_comercial"
        | "galpao"
        | "chacara"
        | "outro"
      property_purpose: "venda" | "locacao" | "lancamento"
      property_status:
        | "disponivel"
        | "reservado"
        | "alugado"
        | "vendido"
        | "indisponivel"
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
    Enums: {
      chat_sender_type: ["visitor", "ai", "human", "system"],
      conversation_status: ["ai_mode", "human_mode", "archived", "resolved"],
      event_status: [
        "agendado",
        "confirmado",
        "realizado",
        "cancelado",
        "nao_compareceu",
      ],
      event_type: ["followup", "visita", "reuniao", "tarefa", "ligacao"],
      interaction_type: [
        "whatsapp",
        "call",
        "email",
        "visit",
        "meeting",
        "note",
        "status_change",
        "ai_action",
      ],
      lead_origin: [
        "chat_widget",
        "whatsapp",
        "facebook",
        "instagram",
        "google",
        "indicacao",
        "site",
        "trafego_pago",
        "manual",
        "outro",
      ],
      lead_status: [
        "novo",
        "contato",
        "visita",
        "proposta",
        "ganho",
        "perdido",
      ],
      notification_type: [
        "new_lead",
        "event_reminder",
        "lead_assigned",
        "ai_insight",
        "ai_handoff",
        "system",
      ],
      property_kind: [
        "apartamento",
        "casa",
        "cobertura",
        "studio",
        "sobrado",
        "terreno",
        "comercial",
        "sala_comercial",
        "galpao",
        "chacara",
        "outro",
      ],
      property_purpose: ["venda", "locacao", "lancamento"],
      property_status: [
        "disponivel",
        "reservado",
        "alugado",
        "vendido",
        "indisponivel",
      ],
    },
  },
} as const
