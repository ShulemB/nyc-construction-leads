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
  public: {
    Tables: {
      approved_permits: {
        Row: {
          applicant_business_name: string | null
          applicant_first_name: string | null
          applicant_last_name: string | null
          applicant_license_number: string | null
          applicant_professional_title: string | null
          approved_date: string | null
          bbl: string | null
          bin: string | null
          block: string | null
          borough: string | null
          c_b_no: string | null
          created_at: string
          data_source: string | null
          estimated_job_costs: number | null
          expired_date: string | null
          filing_reason: string | null
          filing_status: string | null
          house_no: string | null
          id: string
          issued_date: string | null
          job_filing_number: string | null
          job_start_date: string | null
          last_synced_at: string | null
          lot: string | null
          match_candidates: Json | null
          match_method: string | null
          match_status: string
          matched_job_number: string | null
          owner_business_name: string | null
          owner_name: string | null
          permit_status: string | null
          permit_subtype: string | null
          permit_type: string | null
          raw: Json | null
          sequence_number: string | null
          street_name: string | null
          tracking_number: string | null
          updated_at: string
          work_on_floor: string | null
          work_permit: string | null
          work_retaining_wall: string | null
          work_type: string | null
        }
        Insert: {
          applicant_business_name?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_license_number?: string | null
          applicant_professional_title?: string | null
          approved_date?: string | null
          bbl?: string | null
          bin?: string | null
          block?: string | null
          borough?: string | null
          c_b_no?: string | null
          created_at?: string
          data_source?: string | null
          estimated_job_costs?: number | null
          expired_date?: string | null
          filing_reason?: string | null
          filing_status?: string | null
          house_no?: string | null
          id?: string
          issued_date?: string | null
          job_filing_number?: string | null
          job_start_date?: string | null
          last_synced_at?: string | null
          lot?: string | null
          match_candidates?: Json | null
          match_method?: string | null
          match_status?: string
          matched_job_number?: string | null
          owner_business_name?: string | null
          owner_name?: string | null
          permit_status?: string | null
          permit_subtype?: string | null
          permit_type?: string | null
          raw?: Json | null
          sequence_number?: string | null
          street_name?: string | null
          tracking_number?: string | null
          updated_at?: string
          work_on_floor?: string | null
          work_permit?: string | null
          work_retaining_wall?: string | null
          work_type?: string | null
        }
        Update: {
          applicant_business_name?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_license_number?: string | null
          applicant_professional_title?: string | null
          approved_date?: string | null
          bbl?: string | null
          bin?: string | null
          block?: string | null
          borough?: string | null
          c_b_no?: string | null
          created_at?: string
          data_source?: string | null
          estimated_job_costs?: number | null
          expired_date?: string | null
          filing_reason?: string | null
          filing_status?: string | null
          house_no?: string | null
          id?: string
          issued_date?: string | null
          job_filing_number?: string | null
          job_start_date?: string | null
          last_synced_at?: string | null
          lot?: string | null
          match_candidates?: Json | null
          match_method?: string | null
          match_status?: string
          matched_job_number?: string | null
          owner_business_name?: string | null
          owner_name?: string | null
          permit_status?: string | null
          permit_subtype?: string | null
          permit_type?: string | null
          raw?: Json | null
          sequence_number?: string | null
          street_name?: string | null
          tracking_number?: string | null
          updated_at?: string
          work_on_floor?: string | null
          work_permit?: string | null
          work_retaining_wall?: string | null
          work_type?: string | null
        }
        Relationships: []
      }
      dob_license_info: {
        Row: {
          bbl: string | null
          bin: number | null
          business_email: string | null
          business_house_number: string | null
          business_name: string | null
          business_phone_number: string | null
          business_state: string | null
          business_street_name: string | null
          business_zip_code: string | null
          census_tract: number | null
          community_board: number | null
          council_district: number | null
          first_name: string | null
          id: number
          imported_at: string
          last_name: string | null
          lat: number | null
          license_business_city: string | null
          license_number: number | null
          license_sl_no: number | null
          license_status: string | null
          license_type: string | null
          long: number | null
          nta: string | null
        }
        Insert: {
          bbl?: string | null
          bin?: number | null
          business_email?: string | null
          business_house_number?: string | null
          business_name?: string | null
          business_phone_number?: string | null
          business_state?: string | null
          business_street_name?: string | null
          business_zip_code?: string | null
          census_tract?: number | null
          community_board?: number | null
          council_district?: number | null
          first_name?: string | null
          id?: number
          imported_at?: string
          last_name?: string | null
          lat?: number | null
          license_business_city?: string | null
          license_number?: number | null
          license_sl_no?: number | null
          license_status?: string | null
          license_type?: string | null
          long?: number | null
          nta?: string | null
        }
        Update: {
          bbl?: string | null
          bin?: number | null
          business_email?: string | null
          business_house_number?: string | null
          business_name?: string | null
          business_phone_number?: string | null
          business_state?: string | null
          business_street_name?: string | null
          business_zip_code?: string | null
          census_tract?: number | null
          community_board?: number | null
          council_district?: number | null
          first_name?: string | null
          id?: number
          imported_at?: string
          last_name?: string | null
          lat?: number | null
          license_business_city?: string | null
          license_number?: number | null
          license_sl_no?: number | null
          license_status?: string | null
          license_type?: string | null
          long?: number | null
          nta?: string | null
        }
        Relationships: []
      }
      job_application_filings: {
        Row: {
          adult_estab: boolean | null
          applicant_first_name: string | null
          applicant_last_name: string | null
          applicant_license_number: string | null
          applicant_professional_title: string | null
          approved_date: string | null
          assigned_date: string | null
          bbl: string | null
          bin_number: string | null
          block: string | null
          borough: string | null
          building_class: string | null
          building_type: string | null
          census_tract: string | null
          city_owned: boolean | null
          cluster: string | null
          community_board: string | null
          council_district: string | null
          data_source: string
          dob_run_date: string | null
          doc_number: string | null
          efiling_filed: boolean | null
          enlargement_sq_footage: number | null
          existing_dwelling_units: number | null
          existing_height: number | null
          existing_occupancy: string | null
          existing_stories: number | null
          existing_zoning_sqft: number | null
          fee_status: string | null
          full_address: string | null
          fully_paid_date: string | null
          fully_permitted_date: string | null
          horizontal_enlargement: boolean | null
          house_number: string | null
          id: string
          ingested_at: string
          initial_cost: number | null
          is_new_this_sync: boolean
          job_description: string | null
          job_no_good_count: number | null
          job_number: string
          job_status: string | null
          job_status_description: string | null
          job_type: string | null
          job_type_label: string | null
          landmarked: boolean | null
          last_synced_at: string
          latest_action_date: string | null
          latitude: number | null
          lead_score: number
          little_e: boolean | null
          loft_board: boolean | null
          longitude: number | null
          lot: string | null
          non_profit: boolean | null
          nta_name: string | null
          owner_business_name: string | null
          owner_city: string | null
          owner_first_name: string | null
          owner_house_number: string | null
          owner_last_name: string | null
          owner_state: string | null
          owner_street_name: string | null
          owner_type: string | null
          owner_type_detail: string | null
          owner_zip: string | null
          paid_date: string | null
          pc_filed: boolean | null
          pre_filing_date: string | null
          professional_cert: boolean | null
          proposed_dwelling_units: number | null
          proposed_height: number | null
          proposed_occupancy: string | null
          proposed_stories: number | null
          proposed_zoning_sqft: number | null
          signoff_date: string | null
          site_fill: string | null
          special_action_date: string | null
          special_action_status: string | null
          special_district_1: string | null
          special_district_2: string | null
          street_frontage: number | null
          street_name: string | null
          total_construction_floor_area: number | null
          total_est_fee: number | null
          vertical_enlargement: boolean | null
          withdrawal_flag: boolean | null
          work_boiler: boolean | null
          work_curb_cut: boolean | null
          work_equipment: boolean | null
          work_fire_alarm: boolean | null
          work_fire_suppression: boolean | null
          work_fuel_burning: boolean | null
          work_fuel_storage: boolean | null
          work_mechanical: boolean | null
          work_other: boolean | null
          work_other_description: string | null
          work_plumbing: boolean | null
          work_sprinkler: boolean | null
          work_standpipe: boolean | null
          zoning_dist1: string | null
          zoning_dist2: string | null
          zoning_dist3: string | null
        }
        Insert: {
          adult_estab?: boolean | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_license_number?: string | null
          applicant_professional_title?: string | null
          approved_date?: string | null
          assigned_date?: string | null
          bbl?: string | null
          bin_number?: string | null
          block?: string | null
          borough?: string | null
          building_class?: string | null
          building_type?: string | null
          census_tract?: string | null
          city_owned?: boolean | null
          cluster?: string | null
          community_board?: string | null
          council_district?: string | null
          data_source?: string
          dob_run_date?: string | null
          doc_number?: string | null
          efiling_filed?: boolean | null
          enlargement_sq_footage?: number | null
          existing_dwelling_units?: number | null
          existing_height?: number | null
          existing_occupancy?: string | null
          existing_stories?: number | null
          existing_zoning_sqft?: number | null
          fee_status?: string | null
          full_address?: string | null
          fully_paid_date?: string | null
          fully_permitted_date?: string | null
          horizontal_enlargement?: boolean | null
          house_number?: string | null
          id?: string
          ingested_at?: string
          initial_cost?: number | null
          is_new_this_sync?: boolean
          job_description?: string | null
          job_no_good_count?: number | null
          job_number: string
          job_status?: string | null
          job_status_description?: string | null
          job_type?: string | null
          job_type_label?: string | null
          landmarked?: boolean | null
          last_synced_at?: string
          latest_action_date?: string | null
          latitude?: number | null
          lead_score?: number
          little_e?: boolean | null
          loft_board?: boolean | null
          longitude?: number | null
          lot?: string | null
          non_profit?: boolean | null
          nta_name?: string | null
          owner_business_name?: string | null
          owner_city?: string | null
          owner_first_name?: string | null
          owner_house_number?: string | null
          owner_last_name?: string | null
          owner_state?: string | null
          owner_street_name?: string | null
          owner_type?: string | null
          owner_type_detail?: string | null
          owner_zip?: string | null
          paid_date?: string | null
          pc_filed?: boolean | null
          pre_filing_date?: string | null
          professional_cert?: boolean | null
          proposed_dwelling_units?: number | null
          proposed_height?: number | null
          proposed_occupancy?: string | null
          proposed_stories?: number | null
          proposed_zoning_sqft?: number | null
          signoff_date?: string | null
          site_fill?: string | null
          special_action_date?: string | null
          special_action_status?: string | null
          special_district_1?: string | null
          special_district_2?: string | null
          street_frontage?: number | null
          street_name?: string | null
          total_construction_floor_area?: number | null
          total_est_fee?: number | null
          vertical_enlargement?: boolean | null
          withdrawal_flag?: boolean | null
          work_boiler?: boolean | null
          work_curb_cut?: boolean | null
          work_equipment?: boolean | null
          work_fire_alarm?: boolean | null
          work_fire_suppression?: boolean | null
          work_fuel_burning?: boolean | null
          work_fuel_storage?: boolean | null
          work_mechanical?: boolean | null
          work_other?: boolean | null
          work_other_description?: string | null
          work_plumbing?: boolean | null
          work_sprinkler?: boolean | null
          work_standpipe?: boolean | null
          zoning_dist1?: string | null
          zoning_dist2?: string | null
          zoning_dist3?: string | null
        }
        Update: {
          adult_estab?: boolean | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_license_number?: string | null
          applicant_professional_title?: string | null
          approved_date?: string | null
          assigned_date?: string | null
          bbl?: string | null
          bin_number?: string | null
          block?: string | null
          borough?: string | null
          building_class?: string | null
          building_type?: string | null
          census_tract?: string | null
          city_owned?: boolean | null
          cluster?: string | null
          community_board?: string | null
          council_district?: string | null
          data_source?: string
          dob_run_date?: string | null
          doc_number?: string | null
          efiling_filed?: boolean | null
          enlargement_sq_footage?: number | null
          existing_dwelling_units?: number | null
          existing_height?: number | null
          existing_occupancy?: string | null
          existing_stories?: number | null
          existing_zoning_sqft?: number | null
          fee_status?: string | null
          full_address?: string | null
          fully_paid_date?: string | null
          fully_permitted_date?: string | null
          horizontal_enlargement?: boolean | null
          house_number?: string | null
          id?: string
          ingested_at?: string
          initial_cost?: number | null
          is_new_this_sync?: boolean
          job_description?: string | null
          job_no_good_count?: number | null
          job_number?: string
          job_status?: string | null
          job_status_description?: string | null
          job_type?: string | null
          job_type_label?: string | null
          landmarked?: boolean | null
          last_synced_at?: string
          latest_action_date?: string | null
          latitude?: number | null
          lead_score?: number
          little_e?: boolean | null
          loft_board?: boolean | null
          longitude?: number | null
          lot?: string | null
          non_profit?: boolean | null
          nta_name?: string | null
          owner_business_name?: string | null
          owner_city?: string | null
          owner_first_name?: string | null
          owner_house_number?: string | null
          owner_last_name?: string | null
          owner_state?: string | null
          owner_street_name?: string | null
          owner_type?: string | null
          owner_type_detail?: string | null
          owner_zip?: string | null
          paid_date?: string | null
          pc_filed?: boolean | null
          pre_filing_date?: string | null
          professional_cert?: boolean | null
          proposed_dwelling_units?: number | null
          proposed_height?: number | null
          proposed_occupancy?: string | null
          proposed_stories?: number | null
          proposed_zoning_sqft?: number | null
          signoff_date?: string | null
          site_fill?: string | null
          special_action_date?: string | null
          special_action_status?: string | null
          special_district_1?: string | null
          special_district_2?: string | null
          street_frontage?: number | null
          street_name?: string | null
          total_construction_floor_area?: number | null
          total_est_fee?: number | null
          vertical_enlargement?: boolean | null
          withdrawal_flag?: boolean | null
          work_boiler?: boolean | null
          work_curb_cut?: boolean | null
          work_equipment?: boolean | null
          work_fire_alarm?: boolean | null
          work_fire_suppression?: boolean | null
          work_fuel_burning?: boolean | null
          work_fuel_storage?: boolean | null
          work_mechanical?: boolean | null
          work_other?: boolean | null
          work_other_description?: string | null
          work_plumbing?: boolean | null
          work_sprinkler?: boolean | null
          work_standpipe?: boolean | null
          zoning_dist1?: string | null
          zoning_dist2?: string | null
          zoning_dist3?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          filing_id: string
          follow_up_date: string | null
          id: string
          notes: string | null
          priority: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filing_id: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filing_id?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_filing_id_fkey"
            columns: ["filing_id"]
            isOneToOne: false
            referencedRelation: "job_application_filings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          boroughs: string[] | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          trade: string[] | null
          updated_at: string
        }
        Insert: {
          boroughs?: string[] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          trade?: string[] | null
          updated_at?: string
        }
        Update: {
          boroughs?: string[] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          trade?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          filename: string | null
          id: string
          rows_added: number
          rows_errored: number
          rows_unchanged: number
          rows_updated: number
          source: string
          started_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          filename?: string | null
          id?: string
          rows_added?: number
          rows_errored?: number
          rows_unchanged?: number
          rows_updated?: number
          source: string
          started_at?: string
          status: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          filename?: string | null
          id?: string
          rows_added?: number
          rows_errored?: number
          rows_unchanged?: number
          rows_updated?: number
          source?: string
          started_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  public: {
    Enums: {},
  },
} as const
