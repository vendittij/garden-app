#!/usr/bin/env node
/**
 * GARDEN-005: Plant database builder
 *
 * Usage:
 *   node scripts/build-plant-db.js --seed      Build from scripts/seed-plants.json (fast, offline)
 *   node scripts/build-plant-db.js             Fetch full ~500 plants from OpenFarm API
 *
 * Output: assets/plants.db
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SEED_MODE = process.argv.includes('--seed');
const DB_PATH = path.join(__dirname, '..', 'assets', 'plants.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'config', 'plant-db-schema.sql');
const SEED_PATH = path.join(__dirname, 'seed-plants.json');
const OPENFARM_BASE = 'https://openfarm.cc/api/v1/crops';
const OPENFARM_PAGE_SIZE = 100;
const OPENFARM_TARGET_CATEGORIES = new Set(['Vegetables', 'Herbs', 'Fruits', 'Fruit']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'GardenApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normaliseWaterNeeds(raw) {
  if (!raw) return 'medium';
  const s = raw.toLowerCase();
  if (s.includes('high') || s.includes('frequent')) return 'high';
  if (s.includes('low') || s.includes('drought') || s.includes('minimal')) return 'low';
  return 'medium';
}

function normaliseSun(raw) {
  if (!raw) return 'full-sun';
  const s = raw.toLowerCase();
  if (s.includes('shade') && !s.includes('partial')) return 'shade';
  if (s.includes('partial') || s.includes('part')) return 'partial';
  return 'full-sun';
}

function normaliseCategory(raw) {
  if (!raw) return 'vegetable';
  const s = raw.toLowerCase();
  if (s.includes('herb')) return 'herb';
  if (s.includes('fruit')) return 'fruit';
  return 'vegetable';
}

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------

function initDb() {
  const assetsDir = path.dirname(DB_PATH);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Removed existing plants.db');
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  console.log('Schema applied');
  return db;
}

// ---------------------------------------------------------------------------
// Insert helpers
// ---------------------------------------------------------------------------

function insertPlant(db, plant) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO plants (
      id, common_name, botanical_name, category,
      days_to_germination_min, days_to_germination_max,
      days_to_maturity_min, days_to_maturity_max,
      spacing_in_row_inches, spacing_between_rows_inches,
      water_needs, water_needs_detail, sun_requirements,
      frost_tolerant, frost_tolerance_detail,
      description, harvest_indicators, source
    ) VALUES (
      @id, @common_name, @botanical_name, @category,
      @days_to_germination_min, @days_to_germination_max,
      @days_to_maturity_min, @days_to_maturity_max,
      @spacing_in_row_inches, @spacing_between_rows_inches,
      @water_needs, @water_needs_detail, @sun_requirements,
      @frost_tolerant, @frost_tolerance_detail,
      @description, @harvest_indicators, @source
    )
  `);
  stmt.run(plant);
}

function insertGrowthStages(db, plantId, stages) {
  if (!stages || stages.length === 0) return;
  const stmt = db.prepare(`
    INSERT INTO growth_stages (plant_id, stage_name, stage_order, height_cm_min, height_cm_max, description, duration_days)
    VALUES (@plant_id, @stage_name, @stage_order, @height_cm_min, @height_cm_max, @description, @duration_days)
  `);
  for (const stage of stages) {
    stmt.run({ plant_id: plantId, ...stage });
  }
}

function insertCompanions(db, plantId, companions, allIds) {
  if (!companions || companions.length === 0) return;
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO companion_plants (plant_id, companion_id, relationship, notes)
    VALUES (@plant_id, @companion_id, @relationship, @notes)
  `);
  for (const c of companions) {
    if (!allIds.has(c.companion_id)) continue; // skip if companion not in DB
    stmt.run({ plant_id: plantId, companion_id: c.companion_id, relationship: c.relationship, notes: c.notes || null });
  }
}

function insertPlantingWindow(db, plantId, w) {
  if (!w) return;
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO planting_windows (
      plant_id, can_direct_sow, can_transplant,
      direct_sow_weeks_from_last_frost, transplant_weeks_from_last_frost,
      direct_sow_weeks_from_first_frost, transplant_weeks_from_first_frost,
      min_soil_temp_f, weeks_before_first_frost_to_harvest
    ) VALUES (
      @plant_id, @can_direct_sow, @can_transplant,
      @direct_sow_weeks_from_last_frost, @transplant_weeks_from_last_frost,
      @direct_sow_weeks_from_first_frost, @transplant_weeks_from_first_frost,
      @min_soil_temp_f, @weeks_before_first_frost_to_harvest
    )
  `);
  stmt.run({
    plant_id: plantId,
    can_direct_sow: w.can_direct_sow ? 1 : 0,
    can_transplant: w.can_transplant ? 1 : 0,
    direct_sow_weeks_from_last_frost: w.direct_sow_weeks_from_last_frost ?? null,
    transplant_weeks_from_last_frost: w.transplant_weeks_from_last_frost ?? null,
    direct_sow_weeks_from_first_frost: w.direct_sow_weeks_from_first_frost ?? null,
    transplant_weeks_from_first_frost: w.transplant_weeks_from_first_frost ?? null,
    min_soil_temp_f: w.min_soil_temp_f ?? null,
    weeks_before_first_frost_to_harvest: w.weeks_before_first_frost_to_harvest ?? null,
  });
}

// ---------------------------------------------------------------------------
// Seed mode
// ---------------------------------------------------------------------------

function buildFromSeed(db) {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const plants = seed.plants;

  console.log(`Building from seed: ${plants.length} plants`);

  const allIds = new Set(plants.map((p) => p.id));

  const insertAll = db.transaction(() => {
    for (const plant of plants) {
      insertPlant(db, {
        id: plant.id,
        common_name: plant.common_name,
        botanical_name: plant.botanical_name || null,
        category: plant.category,
        days_to_germination_min: plant.days_to_germination_min ?? null,
        days_to_germination_max: plant.days_to_germination_max ?? null,
        days_to_maturity_min: plant.days_to_maturity_min ?? null,
        days_to_maturity_max: plant.days_to_maturity_max ?? null,
        spacing_in_row_inches: plant.spacing_in_row_inches ?? null,
        spacing_between_rows_inches: plant.spacing_between_rows_inches ?? null,
        water_needs: plant.water_needs,
        water_needs_detail: plant.water_needs_detail || null,
        sun_requirements: plant.sun_requirements,
        frost_tolerant: plant.frost_tolerant ? 1 : 0,
        frost_tolerance_detail: plant.frost_tolerance_detail || null,
        description: plant.description || null,
        harvest_indicators: plant.harvest_indicators || null,
        source: plant.source || 'seed',
      });

      insertGrowthStages(db, plant.id, plant.growth_stages || []);
      insertPlantingWindow(db, plant.id, plant.planting_window || null);
    }

    // Insert companions after all plants exist
    for (const plant of plants) {
      insertCompanions(db, plant.id, plant.companions || [], allIds);
    }
  });

  insertAll();
}

// ---------------------------------------------------------------------------
// OpenFarm fetch mode
// ---------------------------------------------------------------------------

function mapOpenFarmCrop(crop, attr) {
  const id = slugify(attr.name || crop.id);
  if (!id) return null;

  const daysMin = parseInt(attr.growing_degree_days, 10) || null;
  const maturityMin = parseInt(attr.days_to_maturity, 10) || null;
  const maturityMax = maturityMin ? maturityMin + 14 : null;
  const spacingCm = parseFloat(attr.spread) || null;
  const spacingInches = spacingCm ? Math.round(spacingCm / 2.54) : null;

  const category = normaliseCategory(attr.main_image_path); // fallback; OpenFarm doesn't have clean category
  const water = normaliseWaterNeeds(attr.sun_requirements); // OpenFarm field name confusion
  const sun = normaliseSun(attr.sun_requirements);

  return {
    id,
    common_name: attr.name,
    botanical_name: attr.binomial_name || null,
    category,
    days_to_germination_min: daysMin,
    days_to_germination_max: daysMin ? daysMin + 7 : null,
    days_to_maturity_min: maturityMin,
    days_to_maturity_max: maturityMax,
    spacing_in_row_inches: spacingInches,
    spacing_between_rows_inches: spacingInches ? spacingInches * 1.5 : null,
    water_needs: water,
    sun_requirements: sun,
    frost_tolerant: 0,
    frost_tolerance_detail: null,
    description: attr.description || null,
    harvest_indicators: attr.harvest_methods || null,
    source: 'openfarm',
  };
}

async function buildFromOpenFarm(db) {
  console.log('Fetching from OpenFarm API...');
  let page = 1;
  let total = 0;
  const seen = new Set();

  const insertAll = db.transaction((plants) => {
    for (const p of plants) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      insertPlant(db, p);
      total++;
    }
  });

  while (true) {
    const url = `${OPENFARM_BASE}?filter[crop_name]=&page=${page}&per_page=${OPENFARM_PAGE_SIZE}`;
    let json;
    try {
      json = await fetchJson(url);
    } catch (e) {
      console.error(`Error on page ${page}: ${e.message}`);
      break;
    }

    const data = json.data || [];
    if (data.length === 0) break;

    const batch = [];
    for (const crop of data) {
      const attr = crop.attributes || {};
      const mapped = mapOpenFarmCrop(crop, attr);
      if (mapped && mapped.common_name) batch.push(mapped);
    }

    insertAll(batch);
    console.log(`Page ${page}: fetched ${data.length}, inserted ${batch.length} (total: ${total})`);

    if (total >= 500 || data.length < OPENFARM_PAGE_SIZE) break;
    page++;

    // Polite rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`OpenFarm build complete: ${total} plants`);
}

// ---------------------------------------------------------------------------
// FTS population
// ---------------------------------------------------------------------------

function populateFts(db) {
  // Rebuild FTS from content table (triggers handle incremental updates,
  // but a full rebuild is safer after a batch insert)
  db.exec(`INSERT INTO plants_fts(plants_fts) VALUES ('rebuild')`);
  console.log('FTS index rebuilt');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Mode: ${SEED_MODE ? 'seed' : 'OpenFarm API'}`);
  const db = initDb();

  try {
    if (SEED_MODE) {
      buildFromSeed(db);
    } else {
      await buildFromOpenFarm(db);
    }

    populateFts(db);

    const count = db.prepare('SELECT COUNT(*) AS n FROM plants').get();
    const stageCount = db.prepare('SELECT COUNT(*) AS n FROM growth_stages').get();
    const companionCount = db.prepare('SELECT COUNT(*) AS n FROM companion_plants').get();
    const windowCount = db.prepare('SELECT COUNT(*) AS n FROM planting_windows').get();
    const sizeKb = Math.round(fs.statSync(DB_PATH).size / 1024);

    console.log('\n--- Build summary ---');
    console.log(`Plants:          ${count.n}`);
    console.log(`Growth stages:   ${stageCount.n}`);
    console.log(`Companions:      ${companionCount.n}`);
    console.log(`Planting windows:${windowCount.n}`);
    console.log(`DB size:         ${sizeKb} KB`);
    console.log(`Output:          ${DB_PATH}`);
  } finally {
    db.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
