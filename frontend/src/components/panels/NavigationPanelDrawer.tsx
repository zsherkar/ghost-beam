import { X } from 'lucide-react'
import {
  DataSourceRecord,
  DataSourcesRegistryResponse,
  DecisionRecord,
  ExperimentState,
  PlatformAdaptersResponse,
  PlatformCapabilitiesResponse,
  PlatformVersionResponse,
  PublicDataAnalysisArtifact,
  PublicDataImportResponse,
  PublicDataSourcesResponse,
  RecordedRunLoadResponse,
  RecordedRunsResponse,
  RecordedRunStepResponse,
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
  recordedRuns?: RecordedRunsResponse | null
  recordedRunResult?: RecordedRunLoadResponse | null
  recordedStepResult?: RecordedRunStepResponse | null
  recordedRunBusy?: boolean
  publicDataSources?: PublicDataSourcesResponse | null
  dataSourcesRegistry?: DataSourcesRegistryResponse | null
  publicDataImport?: PublicDataImportResponse | null
  publicDataAnalysis?: PublicDataAnalysisArtifact | null
  publicDataBusy?: boolean
  onRefreshPublicDataSources: () => void
  onImportPublicData: () => void
  onEvaluatePublicDataWindow: () => void
  onLoadRecordedRun: (runId?: string) => void
  onEvaluateRecordedStep: (step: number) => void
  onClearLocalUiState: () => void
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
  recordedRuns,
  recordedRunResult,
  recordedStepResult,
  recordedRunBusy = false,
  publicDataSources,
  dataSourcesRegistry,
  publicDataImport,
  publicDataAnalysis,
  publicDataBusy = false,
  onRefreshPublicDataSources,
  onImportPublicData,
  onEvaluatePublicDataWindow,
  onLoadRecordedRun,
  onEvaluateRecordedStep,
  onClearLocalUiState,
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
      const safeScenarios = Array.isArray(scenarios) ? scenarios : []
      return safeScenarios.length
        ? safeScenarios.map((scenario) => [scenarioLabel(scenario.scenario_id), scenario.expected_behavior])
        : [['Scenarios', 'Backend scenarios unavailable.']]
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
        ['Recorded run ingestion', platformVersion?.recorded_run_ingestion_enabled ? 'enabled' : 'available after backend restart'],
        ['Public data adapters', platformVersion?.public_data_adapters_enabled ? (platformVersion.public_data_adapters?.join(', ') || 'boostr') : 'available after backend restart'],
        ['Data source', publicDataAnalysis || publicDataImport ? 'Public BOOSTR read-only analysis' : experiment?.data_source === 'recorded_fixture' ? `Recorded fixture ${experiment.recorded_run_id ?? ''}` : 'Synthetic live twin'],
        ['Decision schema', String(platformVersion?.schema_version ?? '0.1.0')],
        ['Synthetic eLogs', 'active local TF-IDF corpus'],
        ['Data manifest', syntheticManifest?.name ? String(syntheticManifest.name) : 'backend/data/synthetic_data_manifest.json'],
        ['Provenance', String(syntheticManifest?.provenance_disclosure ?? 'Synthetic data only; no real facility logs.')],
        ['Telemetry', 'Disabled'],
      ]
    }
    return [['Beamline focus', 'Orbit, zoom, and click devices in the L1 Transfer Line twin.']]
  })()

  const dataSourceGroups: Array<[string, string[], string]> = [
    ['Active Demo Sources', ['synthetic_jax_twin', 'synthetic_recorded_fixture'], 'Core demo layer'],
    ['Public Dataset Adapters', ['boostr', 'fermilab_bpm_ipm'], 'Read-only local slice / manifest layer'],
    ['Facility Connector Stubs', ['epics_archiver_stub', 'pyarchappl_compatible'], 'Disabled read-only future connectors'],
    ['Artifact & Validation Standards', ['ro_crate', 'frictionless', 'openpmd', 'workflowhub'], 'Evidence, schema, provenance, and validation'],
    ['Future Genesis Extensions', ['materials_project'], 'Inactive context adapters'],
  ]
  const sourceById = new Map((dataSourcesRegistry?.sources ?? []).map((source) => [source.id, source] as [string, DataSourceRecord]))
  const renderSourceCard = (source: DataSourceRecord) => (
    <div className="data-source-card" key={source.id}>
      <div>
        <span>{source.status}</span>
        <strong>{source.name}</strong>
      </div>
      <p>{source.role}</p>
      <div className="data-source-facts">
        {source.doi && <small>DOI {source.doi}</small>}
        {source.license && <small>{source.license}</small>}
        <small>Writes {source.writes_allowed === false ? 'disabled' : String(source.writes_allowed)}</small>
        <small>{source.runtime_network_required ? 'network required' : 'no runtime network'}</small>
        {source.manifest_available !== undefined && <small>{source.manifest_available ? 'manifest ready' : 'manifest missing'}</small>}
      </div>
    </div>
  )

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
        {panel === 'Settings' && (
          <button className="nav-primary" type="button" onClick={onClearLocalUiState}>
            Clear Local UI State
          </button>
        )}
        {panel === 'Settings' && (
          <div className="nav-data-sources-panel">
            <div>
              <span>Data Sources &amp; Provenance</span>
              <strong>Core demo separated from read-only external data</strong>
              <p>The live demo runs on the synthetic JAX twin for safety. External sources are read-only adapters, manifests, validation layers, or provenance exports. They cannot write to hardware.</p>
            </div>
            {dataSourceGroups.map(([title, ids, subtitle]) => {
              const groupSources = ids.map((id) => sourceById.get(id)).filter(Boolean) as DataSourceRecord[]
              return (
                <section className="data-source-group" key={title}>
                  <div className="data-source-group-header">
                    <h3>{title}</h3>
                    <small>{subtitle}</small>
                  </div>
                  {groupSources.length ? groupSources.map(renderSourceCard) : <small>Backend registry unavailable until restart.</small>}
                </section>
              )
            })}
          </div>
        )}
        {panel === 'Settings' && (
          <div className="nav-recorded-panel">
            <div>
              <span>Data Source</span>
              <strong>{experiment?.data_source === 'recorded_fixture' ? 'Recorded Run Fixture' : 'Synthetic Live Twin'}</strong>
              <p>Recorded fixtures are synthetic PV/eLog traces. No real facility data or EPICS writes are used.</p>
            </div>
            <div className="nav-recorded-actions">
              <button
                type="button"
                disabled={recordedRunBusy || !recordedRuns?.runs.length}
                onClick={() => onLoadRecordedRun(recordedRuns?.runs[0]?.run_id)}
              >
                Load Recorded Fixture
              </button>
              {(recordedRunResult?.available_steps ?? [0, 1, 2, 3, 4, 5, 6]).map((step) => (
                <button
                  key={`recorded-step-${step}`}
                  type="button"
                  disabled={recordedRunBusy || !recordedRunResult}
                  className={experiment?.recorded_step === step ? 'active' : ''}
                  onClick={() => onEvaluateRecordedStep(step)}
                >
                  {step}
                </button>
              ))}
            </div>
            {recordedStepResult && (
              <small>
                Latest recorded step {recordedStepResult.step}: {decisionLabel(recordedStepResult.decision_record.gate_decision.decision)}
              </small>
            )}
          </div>
        )}
        {panel === 'Settings' && (
          <div className="nav-public-data-panel">
            <div>
              <span>Public Dataset: BOOSTR</span>
              <strong>{publicDataSources?.sources.find((source) => source.dataset_id === 'boostr')?.name ?? 'BOOSTR adapter'}</strong>
              <p>Read-only public-data analysis path. No full dataset is bundled, no runtime download is attempted, and no hardware actions are available.</p>
            </div>
            <div className="public-data-meta">
              <div>
                <span>DOI</span>
                <strong>{publicDataSources?.sources.find((source) => source.dataset_id === 'boostr')?.doi ?? '10.5281/zenodo.4382663'}</strong>
              </div>
              <div>
                <span>License</span>
                <strong>{publicDataSources?.sources.find((source) => source.dataset_id === 'boostr')?.license ?? 'CC BY 4.0'}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{publicDataImport ? 'Local slice loaded' : publicDataSources?.sources.find((source) => source.dataset_id === 'boostr')?.status === 'local_slice_available' ? 'Local slice available' : 'No local BOOSTR slice installed'}</strong>
              </div>
              <div>
                <span>Policy</span>
                <strong>{publicDataAnalysis?.decision ?? 'Read-only'}</strong>
              </div>
            </div>
            <div className="nav-recorded-actions public-data-actions">
              <button type="button" disabled={publicDataBusy} onClick={onRefreshPublicDataSources}>
                Check Local Slice
              </button>
              <button type="button" disabled={publicDataBusy} onClick={onImportPublicData}>
                Import Local Slice
              </button>
              <button type="button" disabled={publicDataBusy || !publicDataImport} onClick={onEvaluatePublicDataWindow}>
                Evaluate Window
              </button>
            </div>
            {publicDataImport && (
              <small>
                Imported {publicDataImport.row_count} rows from {publicDataImport.source_path}; {publicDataImport.detected_numeric_signals.length} numeric signals mapped.
              </small>
            )}
            {publicDataAnalysis && (
              <small>
                Latest BOOSTR analysis: {publicDataAnalysis.decision}; anomaly {publicDataAnalysis.anomaly_score.toFixed(2)}; trust {publicDataAnalysis.trust_score.toFixed(2)}. No writes permitted.
              </small>
            )}
            {!publicDataImport && (
              <small>
                Place a local CSV/Parquet slice under backend/data/public_datasets/boostr/ to enable import.
              </small>
            )}
          </div>
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
