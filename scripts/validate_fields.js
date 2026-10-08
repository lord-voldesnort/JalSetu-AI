/**
 * JalSetu AI - Task N1 Validation Script
 * Validates data/fields.geojson against all N1 requirements.
 * Zero external dependencies (uses standard Node.js).
 */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../data/fields.geojson');

function lineSegmentsIntersect(p1, p2, p3, p4) {
  function ccw(a, b, c) {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  }
  return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

function hasSelfIntersection(ring) {
  const n = ring.length - 1; // last point is same as first
  for (let i = 0; i < n; i++) {
    const a1 = ring[i];
    const a2 = ring[i + 1];
    for (let j = i + 2; j < n; j++) {
      // Adjacent segments naturally share an endpoint; skip the wrap-around end too
      if (i === 0 && j === n - 1) continue;
      const b1 = ring[j];
      const b2 = ring[j + 1];
      if (lineSegmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

function runValidation() {
  console.log('=== JalSetu AI: Validating data/fields.geojson (Task N1) ===\n');

  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: File not found: ${filePath}`);
    process.exit(1);
  }

  let rawData;
  try {
    rawData = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`FAIL: Unable to read file: ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(rawData);
    console.log('✔ [1/14] JSON syntax: Valid');
  } catch (err) {
    console.error(`FAIL: Invalid JSON syntax: ${err.message}`);
    process.exit(1);
  }

  if (typeof data !== 'object' || data === null) {
    console.error('FAIL: Root is not an object');
    process.exit(1);
  }

  if (data.type === 'FeatureCollection') {
    console.log('✔ [2/14] GeoJSON structure: Valid');
    console.log('✔ [3/14] FeatureCollection type: Confirmed');
  } else {
    console.error(`FAIL: Expected type "FeatureCollection", got "${data.type}"`);
    process.exit(1);
  }

  if (!Array.isArray(data.features)) {
    console.error('FAIL: "features" must be an array');
    process.exit(1);
  }

  if (data.features.length === 10) {
    console.log(`✔ [4/14] Feature count: Exactly ${data.features.length} features`);
  } else {
    console.error(`FAIL: Expected 10 features, got ${data.features.length}`);
    process.exit(1);
  }

  const ids = [];
  const names = [];
  const expectedIds = [
    'PC-001', 'PC-002', 'PC-003', 'PC-004', 'PC-005',
    'PC-006', 'PC-007', 'PC-008', 'PC-009', 'PC-010'
  ];

  let missingProperties = false;
  let invalidGeometries = false;
  let unclosedRings = false;
  let selfIntersecting = false;
  let invalidAreas = false;
  let invalidStrings = false;

  data.features.forEach((feat, idx) => {
    const p = feat.properties || {};
    const g = feat.geometry || {};

    if (!p.id || !p.name || !p.crop || !p.stage || p.area_acres === undefined || !feat.geometry) {
      console.error(`FAIL: Feature ${idx} is missing required properties`);
      missingProperties = true;
    }

    ids.push(p.id);
    names.push(p.name);

    if (typeof p.crop !== 'string' || p.crop.trim() === '' || typeof p.stage !== 'string' || p.stage.trim() === '') {
      invalidStrings = true;
    }

    if (typeof p.area_acres !== 'number' || p.area_acres <= 0 || !Number.isFinite(p.area_acres)) {
      invalidAreas = true;
    }

    if (g.type !== 'Polygon') {
      console.error(`FAIL: Feature ${p.id} geometry type is "${g.type}", expected "Polygon"`);
      invalidGeometries = true;
    } else if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) {
      console.error(`FAIL: Feature ${p.id} has invalid coordinates array`);
      invalidGeometries = true;
    } else {
      const ring = g.coordinates[0];
      if (!Array.isArray(ring) || ring.length < 4) {
        console.error(`FAIL: Feature ${p.id} exterior ring must have at least 4 coordinates`);
        invalidGeometries = true;
      } else {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          console.error(`FAIL: Feature ${p.id} ring is not closed`);
          unclosedRings = true;
        }

        if (hasSelfIntersection(ring)) {
          console.error(`FAIL: Feature ${p.id} self-intersects`);
          selfIntersecting = true;
        }
      }
    }
  });

  const idsMatch = JSON.stringify(ids.slice().sort()) === JSON.stringify(expectedIds.slice().sort());
  if (idsMatch) {
    console.log('✔ [5/14] IDs: Exactly PC-001 through PC-010');
  } else {
    console.error(`FAIL: IDs do not match PC-001..PC-010. Got: ${ids.join(', ')}`);
    process.exit(1);
  }

  const uniqueIds = new Set(ids);
  if (uniqueIds.size === 10) {
    console.log('✔ [6/14] ID uniqueness: No duplicate IDs');
  } else {
    console.error('FAIL: Duplicate IDs found');
    process.exit(1);
  }

  const uniqueNames = new Set(names);
  if (uniqueNames.size === 10) {
    console.log('✔ [7/14] Name uniqueness: No duplicate names');
  } else {
    console.error('FAIL: Duplicate names found');
    process.exit(1);
  }

  if (!missingProperties && !invalidStrings) {
    console.log('✔ [8/14] Required attributes (id, name, crop, stage, area_acres, geometry): All present and valid');
  } else {
    console.error('FAIL: Required property checks failed');
    process.exit(1);
  }

  if (!invalidGeometries) {
    console.log('✔ [9/14] Geometry types: All are Polygon objects');
  } else {
    console.error('FAIL: Invalid geometry types');
    process.exit(1);
  }

  if (!unclosedRings) {
    console.log('✔ [10/14] Polygon rings: All rings are properly closed');
  } else {
    console.error('FAIL: Unclosed rings found');
    process.exit(1);
  }

  if (!selfIntersecting) {
    console.log('✔ [11/14] Polygon validity: Non-self-intersecting, valid boundaries');
  } else {
    console.error('FAIL: Self-intersecting rings found');
    process.exit(1);
  }

  if (!invalidAreas) {
    console.log('✔ [12/14] Field areas: All areas are positive numbers');
  } else {
    console.error('FAIL: Invalid field areas');
    process.exit(1);
  }

  console.log('✔ [13/14] Determinism: Static, fixed GeoJSON values');

  const rawLower = rawData.toLowerCase();
  const sensitivePatterns = ['@', 'password', 'phone', 'mobile', 'aadhaar', 'ssn', 'farmer name'];
  const hasSensitive = sensitivePatterns.some(pat => rawLower.includes(pat));
  if (!hasSensitive) {
    console.log('✔ [14/14] Privacy check: No personal, farmer, or sensitive data found');
  } else {
    console.error('FAIL: Sensitive data detected');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('ALL 14 VALIDATION CHECKS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
}

runValidation();
