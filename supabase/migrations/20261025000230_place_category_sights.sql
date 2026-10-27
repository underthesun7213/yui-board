-- A seventh place category, sights: shrines and temples, parks, viewpoints,
-- museums — places to go out to rather than errands (owner, 2026-10-25).
-- Clients already have USAGE on the type (grants), and create_place /
-- update_place take app.place_category, so nothing else changes. A new enum
-- value cannot be used in the transaction that adds it; nothing here does.
alter type app.place_category add value if not exists 'sights';
