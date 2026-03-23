/**
 * PlantDatabase unit tests
 *
 * Strategy: expo-sqlite and expo-file-system are native modules unavailable in Jest.
 * We test query logic by:
 *  1. Building an in-memory better-sqlite3 DB with the canonical schema + a small fixture
 *  2. Adapting better-sqlite3's sync API to expo-sqlite's async shape via a shim
 *  3. Mocking expo-sqlite so PlantDatabase uses the shim
 *  4. Mocking plantDbInit so it is a no-op
 *
 * This verifies all SQL and result-mapping without a simulator.
 *
 * Regression coverage:
 *  - frost_tolerant 0/1 → boolean mapping (regression: was returning raw integer)
 *  - can_direct_sow / can_transplant 0/1 → boolean mapping
 *  - planting_windows is per-plant (not per-zone) as per design doc
 *  - water_needs_detail field present on PlantDetail
 */

import BetterSQLite from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Build in-memory DB with schema + fixture data
// ---------------------------------------------------------------------------

function buildTestDb(): BetterSQLite.Database {
  const db = new BetterSQLite(':memory:');
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(
    path.join(__dirname, '../../config/plant-db-schema.sql'),
    'utf8',
  );
  db.exec(schema);

  const insertPlant = db.prepare(`
    INSERT INTO plants (id, common_name, botanical_name, category,
      days_to_germination_min, days_to_germination_max,
      days_to_maturity_min, days_to_maturity_max,
      spacing_in_row_inches, spacing_between_rows_inches,
      water_needs, water_needs_detail, sun_requirements, frost_tolerant,
      frost_tolerance_detail, description, harvest_indicators, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPlant.run('tomato', 'Tomato', 'Solanum lycopersicum', 'vegetable', 6, 14, 60, 85, 24, 36, 'medium', '1-2 inches/week; water at base', 'full-sun', 0, 'Killed by frost', 'A popular vegetable', 'Red and firm', 'seed');
  insertPlant.run('basil', 'Basil', 'Ocimum basilicum', 'herb', 5, 10, 25, 35, 10, 12, 'medium', 'Keep evenly moist', 'full-sun', 0, 'Frost sensitive', 'Aromatic herb', 'Before flowering', 'seed');
  insertPlant.run('carrot', 'Carrot', 'Daucus carota', 'vegetable', 10, 21, 70, 80, 3, 12, 'medium', '1 inch/week; consistent moisture', 'full-sun', 1, 'Tolerates light frost', 'Root vegetable', 'Half-inch shoulder', 'seed');
  insertPlant.run('mint', 'Mint', 'Mentha spicata', 'herb', 10, 16, 60, 90, 18, 24, 'medium', 'Keep soil moist', 'partial', 1, 'Hardy perennial', 'Vigorous perennial', 'Cut before flowering', 'seed');
  insertPlant.run('strawberry', 'Strawberry', 'Fragaria x ananassa', 'fruit', 14, 28, 60, 90, 12, 24, 'medium', 'Drip preferred', 'full-sun', 1, 'Hardy to zone 3', 'Perennial fruit', 'Fully red', 'seed');

  // Growth stages (tomato only — sufficient to cover multi-stage ordering test)
  const insertStage = db.prepare(`
    INSERT INTO growth_stages (plant_id, stage_name, stage_order, height_cm_min, height_cm_max, description, duration_days)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertStage.run('tomato', 'germination', 1, 0, 2, 'Sprouts', 10);
  insertStage.run('tomato', 'seedling', 2, 2, 15, 'True leaves', 42);
  insertStage.run('tomato', 'vegetative', 3, 15, 90, 'Rapid growth', 30);
  insertStage.run('tomato', 'flowering', 4, 60, 120, 'Yellow flowers', 14);
  insertStage.run('tomato', 'fruiting', 5, 60, 150, 'Fruits develop', 55);

  // Companions
  const insertCompanion = db.prepare(`
    INSERT INTO companion_plants (plant_id, companion_id, relationship, notes)
    VALUES (?, ?, ?, ?)
  `);
  insertCompanion.run('tomato', 'basil', 'beneficial', 'Repels aphids');
  insertCompanion.run('tomato', 'carrot', 'beneficial', 'Loosens soil');

  // Planting windows (frost-relative, one row per plant)
  const insertWindow = db.prepare(`
    INSERT INTO planting_windows (
      plant_id, can_direct_sow, can_transplant,
      direct_sow_weeks_from_last_frost, transplant_weeks_from_last_frost,
      direct_sow_weeks_from_first_frost, transplant_weeks_from_first_frost,
      min_soil_temp_f, weeks_before_first_frost_to_harvest
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // tomato: transplant only, 1 week after last frost, frost-sensitive
  insertWindow.run('tomato', 0, 1, null, 1.0, null, null, 60, 12);
  // carrot: direct sow only, 4 weeks before last frost, frost-tolerant
  insertWindow.run('carrot', 1, 0, -4.0, null, null, null, 45, null);

  // Rebuild FTS
  db.exec(`INSERT INTO plants_fts(plants_fts) VALUES ('rebuild')`);

  return db;
}

// ---------------------------------------------------------------------------
// Shim: adapt better-sqlite3 sync API to expo-sqlite async shape
// ---------------------------------------------------------------------------

function makeExpoSqliteShim(testDb: BetterSQLite.Database) {
  return {
    getAllAsync: async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
      return testDb.prepare(sql).all(...params) as T[];
    },
    getFirstAsync: async <T>(sql: string, params: unknown[] = []): Promise<T | null> => {
      return (testDb.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    closeAsync: async () => {},
  };
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let testDb: BetterSQLite.Database;

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('../../src/database/plantDbInit', () => ({
  ensurePlantDbReady: jest.fn().mockResolvedValue(undefined),
}));

import * as SQLite from 'expo-sqlite';
import { PlantDatabase } from '../../src/database/PlantDatabase';

beforeAll(() => {
  testDb = buildTestDb();
  (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(makeExpoSqliteShim(testDb));
});

afterAll(() => {
  testDb.close();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlantDatabase.open', () => {
  it('returns a PlantDatabase instance', async () => {
    const db = await PlantDatabase.open();
    expect(db).toBeInstanceOf(PlantDatabase);
    await db.close();
  });
});

describe('getPlantCount', () => {
  it('returns the number of plants in the fixture', async () => {
    const db = await PlantDatabase.open();
    expect(await db.getPlantCount()).toBe(5);
    await db.close();
  });
});

describe('getAllPlants', () => {
  it('returns all plants ordered by common_name', async () => {
    const db = await PlantDatabase.open();
    const plants = await db.getAllPlants();
    expect(plants.length).toBe(5);
    expect(plants[0].common_name).toBe('Basil');
    await db.close();
  });

  it('respects the limit parameter', async () => {
    const db = await PlantDatabase.open();
    const plants = await db.getAllPlants(2);
    expect(plants.length).toBe(2);
    await db.close();
  });
});

describe('getByCategory', () => {
  it('filters vegetables', async () => {
    const db = await PlantDatabase.open();
    const veggies = await db.getByCategory('vegetable');
    expect(veggies.every((p) => p.category === 'vegetable')).toBe(true);
    expect(veggies.length).toBe(2);
    await db.close();
  });

  it('filters herbs', async () => {
    const db = await PlantDatabase.open();
    expect((await db.getByCategory('herb')).length).toBe(2);
    await db.close();
  });

  it('filters fruit', async () => {
    const db = await PlantDatabase.open();
    const fruits = await db.getByCategory('fruit');
    expect(fruits.length).toBe(1);
    expect(fruits[0].common_name).toBe('Strawberry');
    await db.close();
  });
});

describe('getPlant', () => {
  it('returns full detail for a known plant', async () => {
    const db = await PlantDatabase.open();
    const plant = await db.getPlant('tomato');
    expect(plant).not.toBeNull();
    expect(plant!.common_name).toBe('Tomato');
    expect(plant!.botanical_name).toBe('Solanum lycopersicum');
    expect(plant!.days_to_maturity_min).toBe(60);
    await db.close();
  });

  it('returns null for an unknown id', async () => {
    const db = await PlantDatabase.open();
    expect(await db.getPlant('does-not-exist')).toBeNull();
    await db.close();
  });

  // Regression: SQLite stores booleans as 0/1 integers — must be mapped to JS boolean
  it('maps frost_tolerant integer 0 to boolean false', async () => {
    const db = await PlantDatabase.open();
    const plant = await db.getPlant('tomato');
    expect(typeof plant!.frost_tolerant).toBe('boolean');
    expect(plant!.frost_tolerant).toBe(false);
    await db.close();
  });

  it('maps frost_tolerant integer 1 to boolean true', async () => {
    const db = await PlantDatabase.open();
    const plant = await db.getPlant('carrot');
    expect(plant!.frost_tolerant).toBe(true);
    await db.close();
  });

  it('includes water_needs_detail', async () => {
    const db = await PlantDatabase.open();
    const plant = await db.getPlant('tomato');
    expect(plant!.water_needs_detail).toBe('1-2 inches/week; water at base');
    await db.close();
  });
});

describe('getGrowthStages', () => {
  it('returns stages in ascending stage_order for tomato', async () => {
    const db = await PlantDatabase.open();
    const stages = await db.getGrowthStages('tomato');
    expect(stages.length).toBe(5);
    expect(stages[0].stage_name).toBe('germination');
    expect(stages[4].stage_name).toBe('fruiting');
    expect(stages.map((s) => s.stage_order)).toEqual([1, 2, 3, 4, 5]);
    await db.close();
  });

  it('returns empty array for a plant with no stages', async () => {
    const db = await PlantDatabase.open();
    expect(await db.getGrowthStages('mint')).toEqual([]);
    await db.close();
  });
});

describe('getCompanions', () => {
  it('returns companions with companion_name resolved via JOIN', async () => {
    const db = await PlantDatabase.open();
    const companions = await db.getCompanions('tomato');
    expect(companions.length).toBe(2);
    expect(companions.map((c) => c.companion_name)).toContain('Basil');
    expect(companions.map((c) => c.companion_name)).toContain('Carrot');
    await db.close();
  });

  it('all returned companions are beneficial', async () => {
    const db = await PlantDatabase.open();
    const companions = await db.getCompanions('tomato');
    expect(companions.every((c) => c.relationship === 'beneficial')).toBe(true);
    await db.close();
  });

  it('returns empty array when no companions defined', async () => {
    const db = await PlantDatabase.open();
    expect(await db.getCompanions('strawberry')).toEqual([]);
    await db.close();
  });
});

describe('getPlantingWindow', () => {
  // Regression: schema changed from per-zone week numbers to per-plant frost-relative offsets
  it('returns frost-relative planting window for tomato', async () => {
    const db = await PlantDatabase.open();
    const window = await db.getPlantingWindow('tomato');
    expect(window).not.toBeNull();
    expect(window!.can_direct_sow).toBe(false);
    expect(window!.can_transplant).toBe(true);
    expect(window!.transplant_weeks_from_last_frost).toBe(1);
    expect(window!.direct_sow_weeks_from_last_frost).toBeNull();
    expect(window!.weeks_before_first_frost_to_harvest).toBe(12);
    expect(window!.min_soil_temp_f).toBe(60);
    await db.close();
  });

  it('returns frost-relative planting window for carrot (cool-season, sow before last frost)', async () => {
    const db = await PlantDatabase.open();
    const window = await db.getPlantingWindow('carrot');
    expect(window!.can_direct_sow).toBe(true);
    expect(window!.can_transplant).toBe(false);
    expect(window!.direct_sow_weeks_from_last_frost).toBe(-4);
    expect(window!.weeks_before_first_frost_to_harvest).toBeNull();
    await db.close();
  });

  // Regression: can_direct_sow / can_transplant must be boolean, not integer
  it('maps can_direct_sow integer 0 to boolean false', async () => {
    const db = await PlantDatabase.open();
    const window = await db.getPlantingWindow('tomato');
    expect(typeof window!.can_direct_sow).toBe('boolean');
    expect(typeof window!.can_transplant).toBe('boolean');
    await db.close();
  });

  it('returns null for a plant with no planting window defined', async () => {
    const db = await PlantDatabase.open();
    expect(await db.getPlantingWindow('mint')).toBeNull();
    await db.close();
  });
});

describe('searchPlants', () => {
  it('returns results matching FTS query', async () => {
    const db = await PlantDatabase.open();
    const results = await db.searchPlants('tomato');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].common_name).toBe('Tomato');
    await db.close();
  });

  it('returns all plants when query is empty', async () => {
    const db = await PlantDatabase.open();
    const results = await db.searchPlants('');
    expect(results.length).toBe(5);
    await db.close();
  });
});
