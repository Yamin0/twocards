/* Types de la base twocards.

   Source : l'outil Supabase (generate_typescript_types) sur le projet de
   production, le 11 novembre 2026. Les lignes (`Row`) et les fonctions
   (`Functions`) sont reprises telles quelles. Pour rester lisible, `Insert`
   et `Update` sont dérivés de `Row` (tous les champs facultatifs) au lieu
   d'être listés un par un : le client n'y perd que le contrôle des champs
   obligatoires à l'insertion, que la base vérifie de toute façon.

   Les paramètres de RPC que la base accepte vides (`p_time`, `p_notes`,
   `p_service`, `p_table_id`, `p_comment`) sont déclarés `| null` à la main :
   le générateur ne le sait pas, et le code envoie bien `null`.

   Pour régénérer après une migration : relancer l'outil et remplacer les
   blocs `Row` et `Functions`. */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type Table<R, Rels extends Rel[] = []> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: Rels;
};

type Rows = {
  admin_audit: {
    action: string;
    admin_id: string | null;
    created_at: string;
    id: number;
    target_id: string | null;
  };
  app_errors: {
    app_version: string | null;
    context: string | null;
    created_at: string;
    device: string | null;
    id: number;
    kind: string;
    message: string;
    os_version: string | null;
    platform: string | null;
    stack: string | null;
    user_id: string | null;
  };
  catalog_offers: {
    active: boolean;
    category: string;
    city: string | null;
    created_at: string;
    deposit_amount: number | null;
    deposit_currency: string;
    deposit_mode: string;
    description: string;
    image_url: string | null;
    images: string[];
    name: string;
    price: string | null;
    slug: string;
    sort_order: number;
    tag: string;
    updated_at: string;
  };
  commission_settlements: {
    amount: number;
    hotel_id: string;
    id: string;
    note: string;
    period: string;
    settled_at: string;
    settled_by: string | null;
    venue_owner_id: string;
  };
  conversations: {
    concierge_id: string;
    created_at: string;
    id: string;
    venue_id: string;
  };
  email_optouts: {
    created_at: string;
    email: string;
    reason: string;
    source: string;
  };
  hotel_offers: {
    active: boolean;
    category: string;
    created_at: string;
    description: string;
    id: string;
    image_url: string | null;
    images: string[];
    name: string;
    price: string | null;
    slug: string;
    sort_order: number;
    tag: string;
    updated_at: string;
    user_id: string;
  };
  hotel_profiles: {
    accent_color: string;
    background_color: string;
    category_images: Json;
    city: string | null;
    cover_url: string | null;
    hidden_offers: string[];
    hotel_name: string | null;
    reception_phone: string | null;
    show_prices: boolean;
    updated_at: string;
    user_id: string;
    welcome_message: string | null;
  };
  hotel_qr_codes: {
    active: boolean;
    code: string;
    created_at: string;
    hidden_categories: string[];
    hidden_offers: string[];
    hidden_until: string | null;
    id: string;
    label: string;
    scans: number;
    user_id: string;
  };
  messages: {
    body: string;
    conversation_id: string;
    created_at: string;
    id: number;
    read_at: string | null;
    sender_id: string;
  };
  pos_events: {
    amount: number | null;
    created_at: string;
    id: number;
    owner_id: string;
    provider: string | null;
    reason: string | null;
    reservation_id: string | null;
    status: string;
    table_label: string | null;
    ticket_id: string | null;
  };
  profiles: {
    city: string | null;
    created_at: string;
    full_name: string | null;
    id: string;
    role: string;
    venue_name: string | null;
  };
  push_tokens: {
    created_at: string;
    platform: string;
    token: string;
    updated_at: string;
    user_id: string;
  };
  qr_reservations: {
    amount_source: string;
    amount_spent: number | null;
    arrived_at: string | null;
    category: string;
    commission: number;
    commission_rate: number;
    created_at: string;
    deposit_amount: number | null;
    deposit_currency: string | null;
    deposit_paid_at: string | null;
    deposit_refunded_at: string | null;
    guest_name: string;
    guest_phone: string;
    id: string;
    notes: string | null;
    party_size: number;
    pos_ticket_id: string | null;
    qr_code_id: string | null;
    rated_at: string | null;
    rating: number | null;
    rating_comment: string | null;
    referrer_id: string | null;
    referrer_name: string | null;
    reservation_date: string;
    reservation_time: string | null;
    service_name: string | null;
    source: string;
    status: string;
    table_id: number | null;
    venue_name: string;
    venue_owner_id: string | null;
    venue_slug: string | null;
  };
  venue_events: {
    closed: boolean;
    cover_image: string | null;
    created_at: string;
    description: string;
    event_day: number | null;
    event_month: number | null;
    event_year: number | null;
    genres: string[];
    gradient: string;
    icon_idx: number;
    id: number;
    owner_id: string;
    reservations: number;
    revenue: string;
    rp_count: number;
    spots: number;
    status: string;
    time_range: string;
    title: string;
    total_spots: number;
    venue: string;
  };
  venue_integrations: {
    api_key_hash: string | null;
    created_at: string;
    last_event_at: string | null;
    owner_id: string;
    provider: string;
    status: string;
  };
  venue_notifications: {
    body: string;
    created_at: string;
    href: string;
    id: number;
    kind: string;
    owner_id: string;
    read: boolean;
    title: string;
  };
  venue_portals: {
    accent_color: string;
    active: boolean;
    background_color: string;
    cover_url: string | null;
    created_at: string;
    display_name: string;
    end_time: string;
    interval_minutes: number;
    owner_id: string;
    party_max: number;
    slug: string;
    start_time: string;
    tagline: string;
  };
  venue_services: {
    active: boolean;
    created_at: string;
    description: string;
    duration: string;
    id: string;
    image_url: string | null;
    name: string;
    owner_id: string;
    price: string;
    sort_order: number;
    updated_at: string;
    venue_slug: string | null;
  };
  venue_tables: {
    capacity: number;
    created_at: string;
    id: number;
    label: string;
    owner_id: string;
    shape: string;
    status: string;
    vip: boolean;
    x: number;
    y: number;
  };
  venues: {
    city: string;
    created_at: string;
    name: string;
    owner_id: string | null;
    slug: string;
    type: string;
  };
};

export type Database = {
  public: {
    Tables: { [K in keyof Rows]: Table<Rows[K], Rel[]> };
    Views: { [_ in never]: never };
    Functions: {
      admin_account_overview: {
        Args: never;
        Returns: {
          city: string;
          conversation_count: number;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          last_sign_in_at: string;
          message_count: number;
          role: string;
          unread_count: number;
          venue_name: string;
        }[];
      };
      admin_commission_ledger: {
        Args: never;
        Returns: {
          amount_spent: number;
          category: string;
          commission: number;
          commission_rate: number;
          created_at: string;
          guest_name: string;
          hotel_id: string;
          hotel_name: string;
          id: string;
          period: string;
          reservation_date: string;
          service_name: string;
          source: string;
          status: string;
          venue_account: string;
          venue_name: string;
          venue_owner_id: string;
          venue_slug: string;
        }[];
      };
      admin_set_role: { Args: { new_role: string; target_id: string }; Returns: undefined };
      portal_create_reservation: {
        Args: {
          p_date: string;
          p_guest_name: string;
          p_guest_phone: string;
          p_notes?: string | null;
          p_party_size: number;
          p_slug: string;
          p_time: string;
        };
        Returns: string;
      };
      portal_full_slots: { Args: { p_date: string; p_slug: string }; Returns: { slot: string }[] };
      portal_get: {
        Args: { p_slug: string };
        Returns: {
          accent_color: string;
          background_color: string;
          cover_url: string;
          display_name: string;
          end_time: string;
          interval_minutes: number;
          party_max: number;
          start_time: string;
          tagline: string;
        }[];
      };
      pos_rotate_key: { Args: { p_provider?: string }; Returns: string };
      qr_create_reservation: {
        Args: {
          p_category: string;
          p_code: string;
          p_date: string;
          p_guest_name: string;
          p_guest_phone: string;
          p_notes: string | null;
          p_party_size: number;
          p_service?: string | null;
          p_time: string | null;
          p_venue: string;
          p_venue_slug?: string | null;
        };
        Returns: string;
      };
      qr_deposit_quote: {
        Args: { p_code: string; p_party_size: number; p_venue_slug: string; p_service?: string | null };
        Returns: Json;
      };
      qr_menu_extras: { Args: { p_slugs: string[] }; Returns: Json };
      qr_mark_deposit_refunded: { Args: { p_payment_intent: string }; Returns: undefined };
      qr_record_paid_reservation: {
        Args: {
          p_amount: number;
          p_category: string;
          p_code: string;
          p_currency: string;
          p_date: string;
          p_guest_name: string;
          p_guest_phone: string;
          p_notes: string | null;
          p_party_size: number;
          p_payment_intent: string;
          p_service: string | null;
          p_session_id: string;
          p_time: string | null;
          p_venue: string;
          p_venue_slug: string;
        };
        Returns: string;
      };
      qr_get_menu: {
        Args: { p_code: string };
        Returns: {
          accent_color: string;
          background_color: string;
          catalog: Json;
          category_images: Json;
          city: string;
          cover_url: string;
          hidden_categories: string[];
          hidden_offers: string[];
          hidden_until: string;
          hotel_name: string;
          hotel_offers: Json;
          label: string;
          /* Ajoutée par 20261112100000_menu_role_du_proprietaire : absente
             tant que la migration n'est pas lancée. */
          owner_role?: string;
          reception_phone: string;
          show_prices: boolean;
          welcome_message: string;
        }[];
      };
      qr_rate_reservation: {
        Args: { p_comment?: string | null; p_id: string; p_rating: number };
        Returns: undefined;
      };
      qr_rating_context: {
        Args: { p_id: string };
        Returns: {
          already_rated: boolean;
          google_review_url: string;
          reservation_date: string;
          venue_name: string;
        }[];
      };
      qr_track_scan: { Args: { p_code: string }; Returns: { label: string }[] };
      venue_create_reservation: {
        Args: {
          p_date: string;
          p_guest_name: string;
          p_guest_phone: string | null;
          p_notes?: string | null;
          p_party_size: number;
          p_table_id?: number | null;
          p_time: string | null;
        };
        Returns: string;
      };
      venue_referrers: {
        Args: never;
        Returns: {
          avg_rating: number;
          commissions: number;
          covers: number;
          last_reservation: string;
          referrer_id: string;
          referrer_name: string;
          reservations: number;
          revenue: number;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

/** Ligne d'une table : `Tables<"qr_reservations">`. */
export type Tables<T extends keyof Rows> = Rows[T];
export type TablesInsert<T extends keyof Rows> = Partial<Rows[T]>;
export type TablesUpdate<T extends keyof Rows> = Partial<Rows[T]>;

/* Valeurs fermées (contraintes CHECK de la base). Elles sont en français :
   ne jamais les traduire avant de les envoyer ou de les comparer. */
export type ReservationStatus = "en attente" | "confirmée" | "annulée" | "no-show";
export type ReservationSource = "qr" | "portal" | "venue";
export type AmountSource = "manuel" | "pos";
export type AccountRole = "etablissement" | "hotel" | "concierge" | "admin";
