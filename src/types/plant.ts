export type PlantCategory = 'vegetable' | 'herb' | 'fruit';
export type WaterNeeds = 'low' | 'medium' | 'high';
export type SunRequirements = 'full-sun' | 'partial' | 'shade';
export type CompanionRelationship = 'beneficial' | 'antagonistic';
export type GrowthStageName =
  | 'germination'
  | 'seedling'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'harvest';

export interface PlantSummary {
  id: string;
  common_name: string;
  botanical_name: string | null;
  category: PlantCategory;
  days_to_maturity_min: number | null;
  days_to_maturity_max: number | null;
  water_needs: WaterNeeds;
  sun_requirements: SunRequirements;
}

export interface PlantDetail extends PlantSummary {
  days_to_germination_min: number | null;
  days_to_germination_max: number | null;
  spacing_in_row_inches: number | null;
  spacing_between_rows_inches: number | null;
  water_needs_detail: string | null;
  frost_tolerant: boolean;
  frost_tolerance_detail: string | null;
  description: string | null;
  harvest_indicators: string | null;
  source: string;
}

export interface GrowthStage {
  id: number;
  plant_id: string;
  stage_name: GrowthStageName;
  stage_order: number;
  height_cm_min: number | null;
  height_cm_max: number | null;
  description: string | null;
  duration_days: number | null;
}

export interface CompanionRelation {
  plant_id: string;
  companion_id: string;
  companion_name: string;
  relationship: CompanionRelationship;
  notes: string | null;
}

/**
 * Frost-relative planting parameters for a plant species.
 * One row per plant — zone-independent.
 *
 * GARDEN-008 combines these offsets with the user's frost dates to produce
 * the actual planting calendar dates.
 *
 * Offset convention (all values in weeks):
 *   negative = before the reference frost date
 *   positive = after the reference frost date
 *   null     = not applicable
 */
export interface PlantingWindow {
  plant_id: string;
  can_direct_sow: boolean;
  can_transplant: boolean;
  /** Weeks after spring last-frost to direct sow. Negative = before last frost. */
  direct_sow_weeks_from_last_frost: number | null;
  /** Weeks after spring last-frost to transplant outdoors. Negative = before last frost. */
  transplant_weeks_from_last_frost: number | null;
  /** Weeks before autumn first-frost to direct sow (fall-planted crops, e.g. garlic). */
  direct_sow_weeks_from_first_frost: number | null;
  /** Weeks before autumn first-frost to transplant (fall-planted crops). */
  transplant_weeks_from_first_frost: number | null;
  /** Minimum soil temperature for germination (°F). */
  min_soil_temp_f: number | null;
  /**
   * For frost-sensitive plants: harvest must begin this many weeks before first frost.
   * Null means frost-tolerant or perennial — no deadline applies.
   */
  weeks_before_first_frost_to_harvest: number | null;
}
