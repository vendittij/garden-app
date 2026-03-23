import * as SQLite from 'expo-sqlite';
import { ensurePlantDbReady } from './plantDbInit';
import type {
  PlantSummary,
  PlantDetail,
  GrowthStage,
  CompanionRelation,
  PlantingWindow,
  PlantCategory,
} from '../types/plant';

const DB_NAME = 'plants.db';

/**
 * Read-only service for the bundled plant reference database.
 *
 * Usage:
 *   const db = await PlantDatabase.open();
 *   const results = await db.searchPlants('tomato');
 *
 * Call open() once at app startup (e.g. in App.tsx) and pass the instance
 * via context or prop. The underlying SQLite connection is kept open for
 * the lifetime of the app.
 */
export class PlantDatabase {
  private constructor(private readonly db: SQLite.SQLiteDatabase) {}

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  static async open(): Promise<PlantDatabase> {
    await ensurePlantDbReady();
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    return new PlantDatabase(db);
  }

  async close(): Promise<void> {
    await this.db.closeAsync();
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Full-text search across common and botanical names.
   * Falls back to getAllPlants when the query is empty.
   */
  async searchPlants(query: string, limit = 20): Promise<PlantSummary[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.getAllPlants(limit);

    const rows = await this.db.getAllAsync<PlantSummary>(
      `SELECT p.id, p.common_name, p.botanical_name, p.category,
              p.days_to_maturity_min, p.days_to_maturity_max,
              p.water_needs, p.sun_requirements
       FROM plants_fts
       JOIN plants p ON plants_fts.id = p.id
       WHERE plants_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
      [`${trimmed}*`, limit],
    );
    return rows;
  }

  async getAllPlants(limit = 100): Promise<PlantSummary[]> {
    return this.db.getAllAsync<PlantSummary>(
      `SELECT id, common_name, botanical_name, category,
              days_to_maturity_min, days_to_maturity_max,
              water_needs, sun_requirements
       FROM plants
       ORDER BY common_name
       LIMIT ?`,
      [limit],
    );
  }

  async getByCategory(category: PlantCategory, limit = 100): Promise<PlantSummary[]> {
    return this.db.getAllAsync<PlantSummary>(
      `SELECT id, common_name, botanical_name, category,
              days_to_maturity_min, days_to_maturity_max,
              water_needs, sun_requirements
       FROM plants
       WHERE category = ?
       ORDER BY common_name
       LIMIT ?`,
      [category, limit],
    );
  }

  async getPlant(id: string): Promise<PlantDetail | null> {
    const row = await this.db.getFirstAsync<PlantDetail>(
      `SELECT id, common_name, botanical_name, category,
              days_to_germination_min, days_to_germination_max,
              days_to_maturity_min, days_to_maturity_max,
              spacing_in_row_inches, spacing_between_rows_inches,
              water_needs, water_needs_detail, sun_requirements,
              frost_tolerant, frost_tolerance_detail,
              description, harvest_indicators, source
       FROM plants
       WHERE id = ?`,
      [id],
    );
    if (!row) return null;
    return {
      ...row,
      frost_tolerant: Boolean(row.frost_tolerant),
    };
  }

  async getGrowthStages(plantId: string): Promise<GrowthStage[]> {
    return this.db.getAllAsync<GrowthStage>(
      `SELECT id, plant_id, stage_name, stage_order,
              height_cm_min, height_cm_max, description, duration_days
       FROM growth_stages
       WHERE plant_id = ?
       ORDER BY stage_order`,
      [plantId],
    );
  }

  async getCompanions(plantId: string): Promise<CompanionRelation[]> {
    return this.db.getAllAsync<CompanionRelation>(
      `SELECT cp.plant_id, cp.companion_id, p.common_name AS companion_name,
              cp.relationship, cp.notes
       FROM companion_plants cp
       JOIN plants p ON cp.companion_id = p.id
       WHERE cp.plant_id = ?
       ORDER BY cp.relationship, p.common_name`,
      [plantId],
    );
  }

  /**
   * Returns the planting window parameters for a plant.
   * GARDEN-008 combines these frost-relative offsets with the user's frost dates
   * to produce the actual planting calendar dates.
   */
  async getPlantingWindow(plantId: string): Promise<PlantingWindow | null> {
    const row = await this.db.getFirstAsync<PlantingWindow>(
      `SELECT plant_id, can_direct_sow, can_transplant,
              direct_sow_weeks_from_last_frost, transplant_weeks_from_last_frost,
              direct_sow_weeks_from_first_frost, transplant_weeks_from_first_frost,
              min_soil_temp_f, weeks_before_first_frost_to_harvest
       FROM planting_windows
       WHERE plant_id = ?`,
      [plantId],
    );
    if (!row) return null;
    return {
      ...row,
      can_direct_sow: Boolean(row.can_direct_sow),
      can_transplant: Boolean(row.can_transplant),
    };
  }

  async getPlantCount(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM plants');
    return row?.n ?? 0;
  }
}
