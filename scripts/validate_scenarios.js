/**
 * JalSetu AI - Task N3 Validation Script
 * Validates data/scenarios.json against all N3 requirements and cross-references data/fields.geojson.
 * Zero external dependencies (uses standard Node.js).
 */

const fs = require('fs');
const path = require('path');

const scenariosPath = path.resolve(__dirname, '../data/scenarios.json');
const fieldsPath = path.resolve(__dirname, '../data/fields.geojson');
const obsPath = path.resolve(__dirname, '../data/observations.json');

const REQUIRED_SCENARIO_IDS = [
  'normal_01',
  'rainfall_deficit_heat_01',
  'heavy_rain_pause_01'
];

const VALID_SOURCES = new Set([
  'synthetic_weather_replay',
  'synthetic_satellite_replay',
  'synthetic_soil_proxy',
  'synthetic_irrigation_replay'
]);

const VALID_VARIABLES = new Set([
  'rainfall_daily',
  'forecast_tmax',
  'forecast_rainfall',
  'soil_moisture_proxy',
  'ndvi',
  'ndvi_trend_14d',
  'last_irrigation_depth'
]);

function runValidation() {
  console.log('=== JalSetu AI: Validating data/scenarios.json (Task N3) ===\n');

  // Check file existence
  if (!fs.existsSync(scenariosPath)) {
    console.error(`FAIL: File not found: ${scenariosPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(fieldsPath)) {
    console.error(`FAIL: Fields registry not found: ${fieldsPath}`);
    process.exit(1);
  }

  // Load field IDs from N1 fields.geojson
  let validFieldIds = new Set();
  try {
    const fieldsData = JSON.parse(fs.readFileSync(fieldsPath, 'utf8'));
    validFieldIds = new Set(fieldsData.features.map(f => f.properties.id));
  } catch (err) {
    console.error(`FAIL: Failed to parse fields.geojson: ${err.message}`);
    process.exit(1);
  }

  // Read raw file content
  let rawData;
  try {
    rawData = fs.readFileSync(scenariosPath, 'utf8');
  } catch (err) {
    console.error(`FAIL: Failed to read scenarios.json: ${err.message}`);
    process.exit(1);
  }

  // 1. JSON syntax
  let scenarios;
  try {
    const parsed = JSON.parse(rawData);
    scenarios = Array.isArray(parsed) ? parsed : parsed.scenarios;
    console.log('✔ [1/14] JSON syntax: Valid');
  } catch (err) {
    console.error(`FAIL: Invalid JSON syntax: ${err.message}`);
    process.exit(1);
  }

  // 2. Array structure
  if (!Array.isArray(scenarios)) {
    console.error('FAIL: Scenarios root must be an array or contain a scenarios array');
    process.exit(1);
  }
  if (scenarios.length !== 3) {
    console.error(`FAIL: Expected exactly 3 scenarios, found ${scenarios.length}`);
    process.exit(1);
  }
  console.log(`✔ [2/14] Array structure: Found exactly ${scenarios.length} scenarios`);

  // 3. Exactly the three required scenario IDs
  const scenarioIds = scenarios.map(s => s.id);
  const hasExactIds = REQUIRED_SCENARIO_IDS.every(id => scenarioIds.includes(id)) &&
                      scenarioIds.length === REQUIRED_SCENARIO_IDS.length;
  if (hasExactIds) {
    console.log(`✔ [3/14] Scenario IDs: Exactly ${REQUIRED_SCENARIO_IDS.join(', ')}`);
  } else {
    console.error(`FAIL: Expected scenario IDs [${REQUIRED_SCENARIO_IDS.join(', ')}], found [${scenarioIds.join(', ')}]`);
    process.exit(1);
  }

  // 4. ID uniqueness
  const uniqueIds = new Set(scenarioIds);
  if (uniqueIds.size === scenarios.length) {
    console.log('✔ [4/14] ID uniqueness: All scenario IDs are unique');
  } else {
    console.error('FAIL: Duplicate scenario IDs detected');
    process.exit(1);
  }

  // 5. Field ID integrity (no unknown field IDs)
  let unknownFieldIds = [];
  scenarios.forEach(s => {
    if (Array.isArray(s.affected_field_ids)) {
      s.affected_field_ids.forEach(fid => {
        if (!validFieldIds.has(fid)) {
          unknownFieldIds.push(fid);
        }
      });
    }
  });
  if (unknownFieldIds.length === 0) {
    console.log('✔ [5/14] Field ID integrity: Zero unknown field IDs across all scenarios');
  } else {
    console.error(`FAIL: Unknown field IDs found: ${unknownFieldIds.join(', ')}`);
    process.exit(1);
  }

  // 6. Required contract fields
  const missingContractFields = [];
  scenarios.forEach(s => {
    const required = [
      'id',
      'name',
      'title',
      'description',
      'affected_field_ids',
      'changed_input_signals',
      'expected_risk_direction',
      'reset_behavior'
    ];
    required.forEach(req => {
      if (s[req] === undefined || s[req] === null) {
        missingContractFields.push(`Scenario '${s.id}' missing '${req}'`);
      }
    });

    // Synthetic disclaimer indication check
    if (!s.synthetic_notice && s.is_synthetic_replay !== true) {
      missingContractFields.push(`Scenario '${s.id}' missing synthetic disclaimer/indication`);
    }
  });

  if (missingContractFields.length === 0) {
    console.log('✔ [6/14] Required contract fields: All present across every scenario');
  } else {
    console.error(`FAIL: Contract field errors:\n  ${missingContractFields.join('\n  ')}`);
    process.exit(1);
  }

  // 7. Affected field IDs subsets
  let invalidSubsets = [];
  scenarios.forEach(s => {
    if (!Array.isArray(s.affected_field_ids)) {
      invalidSubsets.push(`Scenario '${s.id}' affected_field_ids is not an array`);
    } else if (s.id === 'normal_01' && s.affected_field_ids.length !== 0) {
      invalidSubsets.push(`Scenario 'normal_01' should have empty affected_field_ids (got ${s.affected_field_ids.length})`);
    } else if (s.id !== 'normal_01' && s.affected_field_ids.length === 0) {
      invalidSubsets.push(`Shock scenario '${s.id}' must have non-empty affected_field_ids`);
    }
  });

  if (invalidSubsets.length === 0) {
    console.log('✔ [7/14] Affected field coverage: Baseline is nominal (0 fields), shock scenarios affect specific subsets');
  } else {
    console.error(`FAIL: Affected fields subset errors:\n  ${invalidSubsets.join('\n  ')}`);
    process.exit(1);
  }

  // 8. Changed input signals structure & consistency
  let signalErrors = [];
  scenarios.forEach(s => {
    if (!Array.isArray(s.changed_input_signals)) {
      signalErrors.push(`Scenario '${s.id}' changed_input_signals is not an array`);
      return;
    }
    if (s.id === 'normal_01' && s.changed_input_signals.length !== 0) {
      signalErrors.push(`Scenario 'normal_01' must have empty changed_input_signals (baseline state)`);
    }
    if (s.id !== 'normal_01' && s.changed_input_signals.length === 0) {
      signalErrors.push(`Shock scenario '${s.id}' must declare changed_input_signals`);
    }
    s.changed_input_signals.forEach((sig, idx) => {
      if (!sig.variable || typeof sig.variable !== 'string') {
        signalErrors.push(`Scenario '${s.id}' signal #${idx} missing variable`);
      }
      if (!sig.source || !VALID_SOURCES.has(sig.source)) {
        signalErrors.push(`Scenario '${s.id}' signal #${idx} invalid source: ${sig.source}`);
      }
      if (!sig.unit || typeof sig.unit !== 'string') {
        signalErrors.push(`Scenario '${s.id}' signal #${idx} missing unit`);
      }
      if (typeof sig.value !== 'number' || !Number.isFinite(sig.value)) {
        signalErrors.push(`Scenario '${s.id}' signal #${idx} value is not a finite number`);
      }
      if (typeof sig.description !== 'string' || sig.description.trim() === '') {
        signalErrors.push(`Scenario '${s.id}' signal #${idx} missing description`);
      }
    });
  });

  if (signalErrors.length === 0) {
    console.log('✔ [8/14] Changed input signals: Consistent structure with valid variables, units, sources, and finite values');
  } else {
    console.error(`FAIL: Changed signals errors:\n  ${signalErrors.join('\n  ')}`);
    process.exit(1);
  }

  // 9. Vocabulary alignment with observations dictionary
  let vocabErrors = [];
  scenarios.forEach(s => {
    s.changed_input_signals.forEach((sig) => {
      if (!VALID_VARIABLES.has(sig.variable)) {
        vocabErrors.push(`Scenario '${s.id}' variable '${sig.variable}' not in observation dictionary`);
      }
    });
  });

  if (vocabErrors.length === 0) {
    console.log('✔ [9/14] Vocabulary alignment: All changed variables match observations vocabulary');
  } else {
    console.error(`FAIL: Vocabulary alignment errors:\n  ${vocabErrors.join('\n  ')}`);
    process.exit(1);
  }

  // 10. Expected risk direction
  let riskDirectionErrors = [];
  scenarios.forEach(s => {
    if (!s.expected_risk_direction || typeof s.expected_risk_direction !== 'string' || s.expected_risk_direction.trim() === '') {
      riskDirectionErrors.push(`Scenario '${s.id}' expected_risk_direction is missing or not a non-empty string`);
    }
  });

  if (riskDirectionErrors.length === 0) {
    console.log('✔ [10/14] Expected risk direction: Defined and valid for all scenarios');
  } else {
    console.error(`FAIL: Risk direction errors:\n  ${riskDirectionErrors.join('\n  ')}`);
    process.exit(1);
  }

  // 11. Reset behavior
  let resetErrors = [];
  scenarios.forEach(s => {
    const rb = s.reset_behavior;
    if (!rb || typeof rb !== 'object') {
      resetErrors.push(`Scenario '${s.id}' reset_behavior must be an object`);
      return;
    }
    if (rb.target_scenario_id !== 'normal_01') {
      resetErrors.push(`Scenario '${s.id}' reset_behavior.target_scenario_id must be 'normal_01' (got '${rb.target_scenario_id}')`);
    }
    if (rb.mutates_base_fixtures !== false) {
      resetErrors.push(`Scenario '${s.id}' reset_behavior.mutates_base_fixtures must be explicitly false`);
    }
    if (typeof rb.description !== 'string' || rb.description.trim() === '') {
      resetErrors.push(`Scenario '${s.id}' reset_behavior missing description`);
    }
  });

  if (resetErrors.length === 0) {
    console.log('✔ [11/14] Reset behavior: Explicitly declared with target "normal_01" and non-mutating guarantee');
  } else {
    console.error(`FAIL: Reset behavior errors:\n  ${resetErrors.join('\n  ')}`);
    process.exit(1);
  }

  // 12. Demonstration narrative validation
  const shockScenario = scenarios.find(s => s.id === 'rainfall_deficit_heat_01');
  const heavyRainScenario = scenarios.find(s => s.id === 'heavy_rain_pause_01');

  let narrativeErrors = [];
  if (shockScenario) {
    const hasHeatSignal = shockScenario.changed_input_signals.some(sig => sig.variable === 'forecast_tmax' && sig.value > 0);
    const hasDeficitSignal = shockScenario.changed_input_signals.some(sig => sig.variable === 'forecast_rainfall' || sig.variable === 'rainfall_daily');
    if (!hasHeatSignal) narrativeErrors.push("rainfall_deficit_heat_01 missing elevated temperature signal");
    if (!hasDeficitSignal) narrativeErrors.push("rainfall_deficit_heat_01 missing rainfall deficit signal");
    if (!shockScenario.expected_risk_direction.includes('increased')) {
      narrativeErrors.push("rainfall_deficit_heat_01 expected_risk_direction should indicate increased risk");
    }
  }

  if (heavyRainScenario) {
    const hasHeavyRainSignal = heavyRainScenario.changed_input_signals.some(sig => (sig.variable === 'rainfall_daily' || sig.variable === 'forecast_rainfall') && sig.value >= 40);
    if (!hasHeavyRainSignal) narrativeErrors.push("heavy_rain_pause_01 missing heavy rainfall signal (>= 40 mm)");
    if (!heavyRainScenario.expected_risk_direction.includes('pause') && !heavyRainScenario.expected_risk_direction.includes('inspect')) {
      narrativeErrors.push("heavy_rain_pause_01 expected_risk_direction should indicate pause/inspect");
    }
  }

  if (narrativeErrors.length === 0) {
    console.log('✔ [12/14] Demonstration narrative: Shock scenarios correctly model heat+deficit escalation and heavy rain pause/inspect');
  } else {
    console.error(`FAIL: Demonstration narrative errors:\n  ${narrativeErrors.join('\n  ')}`);
    process.exit(1);
  }

  // 13. Synthetic/replayed notice & determinism
  let noticeErrors = [];
  scenarios.forEach(s => {
    if (!s.is_synthetic_replay) {
      noticeErrors.push(`Scenario '${s.id}' is_synthetic_replay must be true`);
    }
    if (!s.synthetic_notice || !s.synthetic_notice.toLowerCase().includes('synthetic')) {
      noticeErrors.push(`Scenario '${s.id}' synthetic_notice must state synthetic/replayed data`);
    }
  });

  // Verify determinism: raw file content should not contain dynamic calls
  if (rawData.includes('Math.random') || rawData.includes('Date.now()')) {
    noticeErrors.push("scenarios.json contains non-deterministic dynamic tokens");
  }

  if (noticeErrors.length === 0) {
    console.log('✔ [13/14] Determinism & Synthetic Disclaimer: Static, reproducible fixtures with explicit synthetic notice');
  } else {
    console.error(`FAIL: Disclaimer/determinism errors:\n  ${noticeErrors.join('\n  ')}`);
    process.exit(1);
  }

  // 14. Privacy check (zero PII / sensitive data)
  const piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Email
    /\b(?:\+91|0)?[6-9]\d{9}\b/, // Indian mobile numbers
    /\b\d{4}\s\d{4}\s\d{4}\b/ // Aadhaar-like numbers
  ];
  let piiDetected = false;
  for (const pattern of piiPatterns) {
    if (pattern.test(rawData)) {
      piiDetected = true;
      break;
    }
  }

  if (!piiDetected) {
    console.log('✔ [14/14] Privacy check: Zero PII or sensitive farmer data found');
  } else {
    console.error('FAIL: Potential PII detected in scenarios.json');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('ALL 14 SCENARIO CHECKS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
}

runValidation();
