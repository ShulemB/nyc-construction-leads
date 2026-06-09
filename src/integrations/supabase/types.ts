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
          applicant_business_address: string | null
          applicant_business_name: string | null
          applicant_first_name: string | null
          applicant_last_name: string | null
          applicant_license: string | null
          applicant_middle_name: string | null
          approved_date: string | null
          apt_condo_no: string | null
          bin: string
          created_at: string
          estimated_job_costs: string | null
          expired_date: string | null
          filing_reason: string | null
          filing_rep_business_name: string | null
          filing_rep_first_name: string | null
          filing_rep_last_name: string | null
          filing_rep_middle_initial: string | null
          id: number
          issued_date: string | null
          job_description: string | null
          job_filing_number: string | null
          owner_business_name: string | null
          owner_city: string | null
          owner_name: string | null
          owner_state: string | null
          owner_street_address: string | null
          owner_zip_code: string | null
          permit_status: string | null
          permittee_license_type: string | null
          sequence_number: string | null
          tracking_number: string | null
          updated_at: string
          work_on_floor: string | null
          work_permit: string | null
          work_type: string | null
          zip_code: string | null
        }
        Insert: {
          applicant_business_address?: string | null
          applicant_business_name?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_license?: string | null
          applicant_middle_name?: string | null
          approved_date?: string | null
          apt_condo_no?: string | null
          bin: string
          created_at?: string
          estimated_job_costs?: string | null
          expired_date?: string | null
          filing_reason?: string | null
          filing_rep_business_name?: string | null
          filing_rep_first_name?: string | null
          filing_rep_last_name?: string | null
          filing_rep_middle_initial?: string | null
          id?: number
          issued_date?: string | null
          job_description?: string | null
          job_filing_number?: string | null
          owner_business_name?: string | null
          owner_city?: string | null
          owner_name?: string | null
          owner_state?: string | null
          owner_street_address?: string | null
          owner_zip_code?: string | null
          permit_status?: string | null
          permittee_license_type?: string | null
          sequence_number?: string | null
          tracking_number?: string | null
          updated_at?: string
          work_on_floor?: string | null
          work_permit?: string | null
          work_type?: string | null
          zip_code?: string | null
        }
        Update: {
          applicant_business_address?: string | null
          applicant_business_name?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_license?: string | null
          applicant_middle_name?: string | null
          approved_date?: string | null
          apt_condo_no?: string | null
          bin?: string
          created_at?: string
          estimated_job_costs?: string | null
          expired_date?: string | null
          filing_reason?: string | null
          filing_rep_business_name?: string | null
          filing_rep_first_name?: string | null
          filing_rep_last_name?: string | null
          filing_rep_middle_initial?: string | null
          id?: number
          issued_date?: string | null
          job_description?: string | null
          job_filing_number?: string | null
          owner_business_name?: string | null
          owner_city?: string | null
          owner_name?: string | null
          owner_state?: string | null
          owner_street_address?: string | null
          owner_zip_code?: string | null
          permit_status?: string | null
          permittee_license_type?: string | null
          sequence_number?: string | null
          tracking_number?: string | null
          updated_at?: string
          work_on_floor?: string | null
          work_permit?: string | null
          work_type?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_permits_bin_fkey"
            columns: ["bin"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["bin"]
          },
        ]
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
          license_number: string | null
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
          license_number?: string | null
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
          license_number?: string | null
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
          applicant_first_name: string | null
          applicant_last_name: string | null
          applicant_license: string | null
          applicant_professional_title: string | null
          approved: string | null
          assigned: string | null
          bin: string
          boiler: string | null
          created_at: string
          curb_cut: string | null
          dob_run_date: string | null
          doc_number: string | null
          efiling_filed: string | null
          enlargement_sq_footage: string | null
          equipment: string | null
          existing_zoning_sqft: string | null
          fee_status: string | null
          fire_alarm: string | null
          fire_suppression: string | null
          fuel_burning: string | null
          fuel_storage: string | null
          fully_paid: string | null
          fully_permitted: string | null
          horizontal_enlrgmt: string | null
          id: number
          initial_cost: string | null
          job_description: string | null
          job_no_good_count: string | null
          job_number: string | null
          job_s1_no: string | null
          job_status: string | null
          job_status_descrp: string | null
          job_type: string | null
          latest_action_date: string | null
          lead_score: number | null
          mechanical: string | null
          other: string | null
          other_description: string | null
          paid: string | null
          pc_filed: string | null
          plumbing: string | null
          pre_filing_date: string | null
          professional_cert: string | null
          proposed_dwelling_units: string | null
          proposed_height: string | null
          proposed_occupancy: string | null
          proposed_stories: string | null
          proposed_zoning_sqft: string | null
          signoff_date: string | null
          site_fill: string | null
          special_action_date: string | null
          special_action_status: string | null
          sprinkler: string | null
          standpipe: string | null
          total_construction_floor_area: string | null
          total_est_fee: string | null
          updated_at: string
          vertical_enlrgmt: string | null
          withdrawal_flag: string | null
        }
        Insert: {
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_license?: string | null
          applicant_professional_title?: string | null
          approved?: string | null
          assigned?: string | null
          bin: string
          boiler?: string | null
          created_at?: string
          curb_cut?: string | null
          dob_run_date?: string | null
          doc_number?: string | null
          efiling_filed?: string | null
          enlargement_sq_footage?: string | null
          equipment?: string | null
          existing_zoning_sqft?: string | null
          fee_status?: string | null
          fire_alarm?: string | null
          fire_suppression?: string | null
          fuel_burning?: string | null
          fuel_storage?: string | null
          fully_paid?: string | null
          fully_permitted?: string | null
          horizontal_enlrgmt?: string | null
          id?: number
          initial_cost?: string | null
          job_description?: string | null
          job_no_good_count?: string | null
          job_number?: string | null
          job_s1_no?: string | null
          job_status?: string | null
          job_status_descrp?: string | null
          job_type?: string | null
          latest_action_date?: string | null
          lead_score?: number | null
          mechanical?: string | null
          other?: string | null
          other_description?: string | null
          paid?: string | null
          pc_filed?: string | null
          plumbing?: string | null
          pre_filing_date?: string | null
          professional_cert?: string | null
          proposed_dwelling_units?: string | null
          proposed_height?: string | null
          proposed_occupancy?: string | null
          proposed_stories?: string | null
          proposed_zoning_sqft?: string | null
          signoff_date?: string | null
          site_fill?: string | null
          special_action_date?: string | null
          special_action_status?: string | null
          sprinkler?: string | null
          standpipe?: string | null
          total_construction_floor_area?: string | null
          total_est_fee?: string | null
          updated_at?: string
          vertical_enlrgmt?: string | null
          withdrawal_flag?: string | null
        }
        Update: {
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_license?: string | null
          applicant_professional_title?: string | null
          approved?: string | null
          assigned?: string | null
          bin?: string
          boiler?: string | null
          created_at?: string
          curb_cut?: string | null
          dob_run_date?: string | null
          doc_number?: string | null
          efiling_filed?: string | null
          enlargement_sq_footage?: string | null
          equipment?: string | null
          existing_zoning_sqft?: string | null
          fee_status?: string | null
          fire_alarm?: string | null
          fire_suppression?: string | null
          fuel_burning?: string | null
          fuel_storage?: string | null
          fully_paid?: string | null
          fully_permitted?: string | null
          horizontal_enlrgmt?: string | null
          id?: number
          initial_cost?: string | null
          job_description?: string | null
          job_no_good_count?: string | null
          job_number?: string | null
          job_s1_no?: string | null
          job_status?: string | null
          job_status_descrp?: string | null
          job_type?: string | null
          latest_action_date?: string | null
          lead_score?: number | null
          mechanical?: string | null
          other?: string | null
          other_description?: string | null
          paid?: string | null
          pc_filed?: string | null
          plumbing?: string | null
          pre_filing_date?: string | null
          professional_cert?: string | null
          proposed_dwelling_units?: string | null
          proposed_height?: string | null
          proposed_occupancy?: string | null
          proposed_stories?: string | null
          proposed_zoning_sqft?: string | null
          signoff_date?: string | null
          site_fill?: string | null
          special_action_date?: string | null
          special_action_status?: string | null
          sprinkler?: string | null
          standpipe?: string | null
          total_construction_floor_area?: string | null
          total_est_fee?: string | null
          updated_at?: string
          vertical_enlrgmt?: string | null
          withdrawal_flag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_application_filings_bin_fkey"
            columns: ["bin"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["bin"]
          },
        ]
      }
      leads: {
        Row: {
          bin: string
          created_at: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bin: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bin?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_bin_fkey"
            columns: ["bin"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["bin"]
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
      properties: {
        Row: {
          adult_estab: string | null
          bbl: string | null
          bin: string
          block: string | null
          borough: string | null
          building_class: string | null
          building_type: string | null
          census_tract: string | null
          city_owned: string | null
          cluster: string | null
          community_board: string | null
          council_district: string | null
          created_at: string
          existing_dwelling_units: string | null
          existing_height: string | null
          existing_occupancy: string | null
          existing_stories: string | null
          full_address: string | null
          house_number: string | null
          landmarked: string | null
          latitude: number | null
          little_e: string | null
          loft_board: string | null
          longitude: number | null
          lot: string | null
          non_profit: string | null
          nta: string | null
          owner_business_name: string | null
          owner_city: string | null
          owner_first_name: string | null
          owner_house_number: string | null
          owner_last_name: string | null
          owner_state: string | null
          owner_street_name: string | null
          owner_type: string | null
          owner_zip: string | null
          special_district1: string | null
          special_district2: string | null
          street_frontage: string | null
          street_name: string | null
          updated_at: string
          zoning_dist1: string | null
          zoning_dist2: string | null
          zoning_dist3: string | null
        }
        Insert: {
          adult_estab?: string | null
          bbl?: string | null
          bin: string
          block?: string | null
          borough?: string | null
          building_class?: string | null
          building_type?: string | null
          census_tract?: string | null
          city_owned?: string | null
          cluster?: string | null
          community_board?: string | null
          council_district?: string | null
          created_at?: string
          existing_dwelling_units?: string | null
          existing_height?: string | null
          existing_occupancy?: string | null
          existing_stories?: string | null
          full_address?: string | null
          house_number?: string | null
          landmarked?: string | null
          latitude?: number | null
          little_e?: string | null
          loft_board?: string | null
          longitude?: number | null
          lot?: string | null
          non_profit?: string | null
          nta?: string | null
          owner_business_name?: string | null
          owner_city?: string | null
          owner_first_name?: string | null
          owner_house_number?: string | null
          owner_last_name?: string | null
          owner_state?: string | null
          owner_street_name?: string | null
          owner_type?: string | null
          owner_zip?: string | null
          special_district1?: string | null
          special_district2?: string | null
          street_frontage?: string | null
          street_name?: string | null
          updated_at?: string
          zoning_dist1?: string | null
          zoning_dist2?: string | null
          zoning_dist3?: string | null
        }
        Update: {
          adult_estab?: string | null
          bbl?: string | null
          bin?: string
          block?: string | null
          borough?: string | null
          building_class?: string | null
          building_type?: string | null
          census_tract?: string | null
          city_owned?: string | null
          cluster?: string | null
          community_board?: string | null
          council_district?: string | null
          created_at?: string
          existing_dwelling_units?: string | null
          existing_height?: string | null
          existing_occupancy?: string | null
          existing_stories?: string | null
          full_address?: string | null
          house_number?: string | null
          landmarked?: string | null
          latitude?: number | null
          little_e?: string | null
          loft_board?: string | null
          longitude?: number | null
          lot?: string | null
          non_profit?: string | null
          nta?: string | null
          owner_business_name?: string | null
          owner_city?: string | null
          owner_first_name?: string | null
          owner_house_number?: string | null
          owner_last_name?: string | null
          owner_state?: string | null
          owner_street_name?: string | null
          owner_type?: string | null
          owner_zip?: string | null
          special_district1?: string | null
          special_district2?: string | null
          street_frontage?: string | null
          street_name?: string | null
          updated_at?: string
          zoning_dist1?: string | null
          zoning_dist2?: string | null
          zoning_dist3?: string | null
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
