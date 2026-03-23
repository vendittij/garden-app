-- Garden App — Plant Database Schema
-- Source of truth for assets/plants.db
-- Read-only at runtime; never synced via PowerSync.

CREATE TABLE IF NOT EXISTS plants (
  id                          TEXT    PRIMARY KEY,
  common_name                 TEXT    NOT NULL,
  botanical_name              TEXT,
  category                    TEXT    NOT NULL CHECK (category IN ('vegetable', 'herb', 'fruit')),
  days_to_germination_min     INTEGER,
  days_to_germination_max     INTEGER,
  days_to_maturity_min        INTEGER,
  days_to_maturity_max        INTEGER,
  spacing_in_row_inches       REAL,
  spacing_between_rows_inches REAL,
  water_needs                 TEXT    NOT NULL CHECK (water_needs IN ('low', 'medium', 'high')),
  water_needs_detail          TEXT,                     -- free-text specific requirements
  sun_requirements            TEXT    NOT NULL CHECK (sun_requirements IN ('full-sun', 'partial', 'shade')),
  frost_tolerant              INTEGER NOT NULL DEFAULT 0,  -- 0/1 boolean
  frost_tolerance_detail      TEXT,
  description                 TEXT,
  harvest_indicators          TEXT,
  source                      TEXT    NOT NULL DEFAULT 'seed'
);

CREATE TABLE IF NOT EXISTS growth_stages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id    TEXT    NOT NULL REFERENCES plants(id),
  stage_name  TEXT    NOT NULL CHECK (stage_name IN ('germination','seedling','vegetative','flowering','fruiting','harvest')),
  stage_order INTEGER NOT NULL,
  height_cm_min REAL,
  height_cm_max REAL,
  description TEXT,
  duration_days INTEGER
);

CREATE TABLE IF NOT EXISTS companion_plants (
  plant_id     TEXT NOT NULL REFERENCES plants(id),
  companion_id TEXT NOT NULL REFERENCES plants(id),
  relationship TEXT NOT NULL CHECK (relationship IN ('beneficial', 'antagonistic')),
  notes        TEXT,
  PRIMARY KEY (plant_id, companion_id, relationship)
);

-- Planting window expressed as frost-relative offsets.
-- One row per plant; GARDEN-008 combines these with the user's frost dates to
-- produce the actual planting calendar.
--
-- Offset convention (all values in weeks):
--   negative = before the reference frost date
--   positive = after the reference frost date
--   null     = not applicable (e.g. can_direct_sow = 0)
--
-- Reference dates:
--   *_from_last_frost  → user's spring last-frost date (from GARDEN-008)
--   *_from_first_frost → user's autumn first-frost date (fall-planted crops e.g. garlic)
CREATE TABLE IF NOT EXISTS planting_windows (
  plant_id                            TEXT    NOT NULL PRIMARY KEY REFERENCES plants(id),
  can_direct_sow                      INTEGER NOT NULL DEFAULT 0,
  can_transplant                      INTEGER NOT NULL DEFAULT 0,
  -- Spring sowing/transplanting (relative to last frost)
  direct_sow_weeks_from_last_frost    REAL,
  transplant_weeks_from_last_frost    REAL,
  -- Fall planting (relative to first frost; for garlic, overwintering crops)
  direct_sow_weeks_from_first_frost   REAL,
  transplant_weeks_from_first_frost   REAL,
  -- Minimum soil temperature required for germination (°F)
  min_soil_temp_f                     INTEGER,
  -- For frost-sensitive plants: harvest must begin this many weeks before first frost
  -- NULL means frost-tolerant / perennial — no deadline
  weeks_before_first_frost_to_harvest REAL
);

-- Full-text search index over common and botanical names
CREATE VIRTUAL TABLE IF NOT EXISTS plants_fts USING fts5(
  id UNINDEXED,
  common_name,
  botanical_name,
  content='plants',
  content_rowid='rowid'
);

-- Keep FTS in sync
CREATE TRIGGER IF NOT EXISTS plants_ai AFTER INSERT ON plants BEGIN
  INSERT INTO plants_fts(rowid, id, common_name, botanical_name)
  VALUES (new.rowid, new.id, new.common_name, new.botanical_name);
END;

CREATE TRIGGER IF NOT EXISTS plants_ad AFTER DELETE ON plants BEGIN
  INSERT INTO plants_fts(plants_fts, rowid, id, common_name, botanical_name)
  VALUES ('delete', old.rowid, old.id, old.common_name, old.botanical_name);
END;

CREATE TRIGGER IF NOT EXISTS plants_au AFTER UPDATE ON plants BEGIN
  INSERT INTO plants_fts(plants_fts, rowid, id, common_name, botanical_name)
  VALUES ('delete', old.rowid, old.id, old.common_name, old.botanical_name);
  INSERT INTO plants_fts(rowid, id, common_name, botanical_name)
  VALUES (new.rowid, new.id, new.common_name, new.botanical_name);
END;
