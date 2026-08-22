// Hand-written types mirroring supabase/migrations/0001_init.sql — kept in
// sync manually since this project isn't running `supabase gen types` yet.
// Passed as the generic to createClient() so query results are typed instead
// of collapsing to `never`. Every table needs `Relationships: []` and the
// schema needs `Views`/`Functions` to satisfy postgrest-js's GenericSchema
// constraint — omitting them silently falls back to an untyped client.

export interface Database {
  public: {
    Tables: {
      mailboxes: {
        Row: {
          id: string;
          owner_id: string;
          address: string;
          role: string | null;
          dot_color: string | null;
          state: "ok" | "reauth" | "sync";
          scan_paused: boolean;
          last_scanned_at: string | null;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          provider: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["mailboxes"]["Row"]> & {
          owner_id: string;
          address: string;
        };
        Update: Partial<Database["public"]["Tables"]["mailboxes"]["Row"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          password_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      threads: {
        Row: {
          id: string;
          mailbox_id: string;
          gmail_thread_id: string;
          tier: "today" | "week" | "fyi" | null;
          status: "needs_reply" | "low_confidence" | "dismissed" | "sent" | "manual_followup";
          low_confidence: boolean;
          subject: string | null;
          snippet: string | null;
          body: string | null;
          sender_name: string | null;
          sender_org: string | null;
          sender_email: string | null;
          why: string | null;
          waited_hours: number | null;
          feedback: "up" | "down" | null;
          feedback_note: string | null;
          feedback_tags: string[] | null;
          metadata: Record<string, unknown>;
          dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["threads"]["Row"]> & {
          mailbox_id: string;
          gmail_thread_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["threads"]["Row"]>;
        Relationships: [];
      };
      drafts: {
        Row: {
          id: string;
          thread_id: string;
          label: string | null;
          tone: string | null;
          body: string;
          source: "ai" | "custom";
          selected: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["drafts"]["Row"]> & {
          thread_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["drafts"]["Row"]>;
        Relationships: [];
      };
      sent: {
        Row: {
          id: string;
          thread_id: string | null;
          mailbox_id: string;
          gmail_message_id: string | null;
          gmail_thread_id: string | null;
          subject: string | null;
          body: string | null;
          origin: "option_a" | "option_b" | "edited" | "custom" | "direct_in_gmail" | null;
          feedback: "up" | "down" | null;
          feedback_note: string | null;
          feedback_tags: string[] | null;
          sent_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sent"]["Row"]> & {
          mailbox_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["sent"]["Row"]>;
        Relationships: [];
      };
      meetings: {
        Row: {
          id: string;
          mailbox_id: string;
          calendar_event_id: string;
          title: string | null;
          attendee_name: string | null;
          attendee_org: string | null;
          attendee_email: string | null;
          state: "waiting" | "found" | "none" | "dismissed" | "sent";
          transcript_source: string | null;
          summary: string | null;
          action_items: unknown[];
          drafts: { label: string; text: string }[];
          ended_at: string | null;
          wait_deadline: string | null;
          metadata: Record<string, unknown>;
          dismissed_at: string | null;
          feedback: "up" | "down" | null;
          feedback_note: string | null;
          feedback_tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["meetings"]["Row"]> & {
          mailbox_id: string;
          calendar_event_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["meetings"]["Row"]>;
        Relationships: [];
      };
      followups: {
        Row: {
          id: string;
          sent_id: string;
          business_days_waited: number;
          nudge_reasoning: string | null;
          status: "pending" | "dismissed" | "sent";
          drafts: { label: string; text: string }[];
          dismissed_at: string | null;
          feedback: "up" | "down" | null;
          feedback_note: string | null;
          feedback_tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["followups"]["Row"]> & {
          sent_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["followups"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "followups_sent_id_fkey";
            columns: ["sent_id"];
            isOneToOne: false;
            referencedRelation: "sent";
            referencedColumns: ["id"];
          }
        ];
      };
      cron_runs: {
        Row: {
          id: string;
          job_name: string;
          started_at: string;
          finished_at: string | null;
          status: "running" | "ok" | "error" | null;
          detail: Record<string, unknown> | null;
        };
        Insert: Partial<Database["public"]["Tables"]["cron_runs"]["Row"]> & {
          job_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["cron_runs"]["Row"]>;
        Relationships: [];
      };
      senders: {
        Row: {
          id: string;
          owner_id: string;
          address: string;
          name: string | null;
          importance: "vip" | "normal" | "excluded";
          source: "onboarding" | "manual" | "default";
          message_count: number;
          mutual_count: number;
          last_contact_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["senders"]["Row"]> & {
          owner_id: string;
          address: string;
        };
        Update: Partial<Database["public"]["Tables"]["senders"]["Row"]>;
        Relationships: [];
      };
      app_settings: {
        Row: {
          owner_id: string;
          onboarding_completed_at: string | null;
          owner_name: string | null;
          reply_promise_hours: number;
          draft_voice: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["app_settings"]["Row"]> & {
          owner_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
        Relationships: [];
      };
      mcp_tokens: {
        Row: {
          owner_id: string;
          token_hash: string;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["mcp_tokens"]["Row"]> & {
          owner_id: string;
          token_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["mcp_tokens"]["Row"]>;
        Relationships: [];
      };
      ai_call_logs: {
        Row: {
          id: string;
          owner_id: string;
          decision_point: string;
          model: string;
          latency_ms: number;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          total_tokens: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_call_logs"]["Row"]> & {
          owner_id: string;
          decision_point: string;
          model: string;
          latency_ms: number;
        };
        Update: Partial<Database["public"]["Tables"]["ai_call_logs"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
