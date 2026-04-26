import { X } from 'lucide-react'
import {
  DecisionRecord,
  ExperimentState,
  PlatformAdaptersResponse,
  PlatformCapabilitiesResponse,
  PlatformVersionResponse,
  ScenarioSummary,
} from '../../api/client'
import { decisionLabel, scenarioLabel } from '../../utils/format'

interface Props {
  panel: string | null
  record: DecisionRecord | null
  experiment: ExperimentState | null
  scenarios: ScenarioSummary[]
  platformAdapters?: PlatformAdaptersResponse | null
  platformCapabilities?: PlatformCapabilitiesResponse | null
  platformVersion?: PlatformVersionResponse | null
  syntheticManifest?: Record<string, unknown> | null
  onClose: () => void
  onOpenPolicy: () => void
}

function NavigationPanelDrawer({
  panel,
  record,
  experiment,
  scenarios,
  platformAdapters,
  platformCapabilities,
  platformVersion,
  syntheticManifest,
  onClose,
  onOpenPolicy,
}: Props) {
  if (!panel) return null

  const devices = experiment?.device_registry ?? []
  const rows = (() => {
    if (panel === 'Overview') {
      return [
        ['Scenario', scenarioLabel(experiment?.scenario_id ?? 'green_zone')],
        ['Step', String(experiment?.step_number ?? 0)],
        ['Decision', decisionLabel(record?.gate_decision.decision)],
        ['Trust', record?.virtual_diagnostic.trust_state ?? 'Pending'],
      ]
    }
    if (panel === 'Lattice') {
      return devices.map((device) => [device.id, `${device.type} | ${device.pv} | z=${device.position[2]}`])
    }
    if (panel === 'Devices') {
      return devices.map((device) => [device.id, `${device.value.toFixed(3)} ${device.unit}`])
    }
    if (panel === 'Interlocks') {
      return devices.filter((device) => device.min !== null).map((device) => [device.pv, `${device.min} to ${device.max}, max step ${device.max_delta}`])
    }
    if (panel === 'Vacuum') {
      return [['Vacuum sector', 'Nominal synthetic pressure'], ['Pump chain', 'Stable'], ['Interlock', 'No simulated trip']]
    }
    if (panel === 'Diagnostics') {
      return [
        ['Quality', record?.virtual_diagnostic.predicted_quality.toFixed(3) ?? '--'],
        ['Uncertainty', record?.virtual_diagnostic.uncertainty.toFixed(3) ?? '--'],
        ['Vision labels', record?.vision_diagnostic.labels.join(', ') ?? '--'],
      ]
    }
    if (panel === 'Twin State') {
      return [
        ['Drift', experiment?.drift.toFixed(2) ?? '--'],
        ['Calibration freshness', experiment?.calibration_freshness.toFixed(2) ?? '--'],
        ['OOD score', record?.virtual_diagnostic.ood_score.toFixed(2) ?? '--'],
      ]
    }
    if (panel === 'Policy') {
      return (record?.gate_decision.reasons ?? ['No DecisionRecord yet.']).map((reason, index) => [`Rule ${index + 1}`, reason])
    }
    if (panel === 'eLog') {
      return (record?.elog_hits ?? []).map((hit) => [hit.title, `${hit.similarity.toFixed(2)} | ${hit.recommended_action}`])
    }
    if (panel === 'Evidence') {
      return (experiment?.history ?? []).slice(-12).reverse().map((event) => [event.kind, event.title])
    }
    if (panel === 'Agents') {
      return [['Action source', record?.proposed_action.source ?? 'none'], ['Optimizer', 'Local gradient/random-search proposal'], ['LLM agent', 'Stubbed; deterministic gate remains local']]
    }
    if (panel === 'Simulations') {
      return scenarios.map((scenario) => [scenarioLabel(scenario.scenario_id), scenario.expected_behavior])
    }
    if (panel === 'Settings') {
      const activeAdapter = platformAdapters?.adapters.find((adapter) => adapter.id === platformAdapters.active_adapter_id)
      return [
        ['API', 'Local FastAPI backend'],
        ['Active adapter', activeAdapter ? `${activeAdapter.name} (${activeAdapter.status})` : 'Simulated JAX Twin'],
        ['Backend version', String(platformVersion?.version ?? '0.1.0')],
        ['Backend started', String(platformVersion?.backend_started_at ?? 'not reported')],
        ['Real hardware writes', platformCapabilities?.real_hardware_writes_enabled ? 'enabled' : 'disabled'],
        ['EPICS', 'stub only; no network discovery or hardware writes'],
        ['Benchmark', platformVersion?.benchmark_enabled ? 'enabled' : 'available after backend restart'],
        ['Evidence bundle', platformVersion?.evidence_bundle_enabled ? 'enabled' : 'available after backend restart'],
        ['Decision schema', String(platformVersion?.schema_version ?? '0.1.0')],
        ['Synthetic eLogs', 'active local TF-IDF corpus'],
        ['Data manifest', syntheticManifest?.name ? String(syntheticManifest.name) : 'backend/data/synthetic_data_manifest.json'],
        ['Provenance', String(syntheticManifest?.provenance_disclosure ?? 'Synthetic data only; no real facility logs.')],
        ['Telemetry', 'Disabled'],
      ]
    }
    return [['Beamline focus', 'Orbit, zoom, and click devices in the L1 Transfer Line twin.']]
  })()

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer nav-drawer glass-card" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2>{panel}</h2>
            <p>Interactive Ghost Beam workspace panel.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close navigation panel">
            <X size={18} />
          </button>
        </div>
        {panel === 'Trust Gate' && (
          <button className="nav-primary" type="button" onClick={onOpenPolicy}>
            Open full policy breakdown
          </button>
        )}
        <div className="nav-panel-list">
          {rows.map(([label, value], index) => (
            <div key={`${panel}-${index}-${label}-${value}`}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

export default NavigationPanelDrawer
