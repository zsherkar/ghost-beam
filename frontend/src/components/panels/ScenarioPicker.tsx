import { ScenarioSummary } from '../../api/client'
import { scenarioLabel } from '../../utils/format'

interface Props {
  scenarios: ScenarioSummary[]
  selectedId: string
  onSelect: (scenarioId: string) => void
}

function ScenarioPicker({ scenarios = [], selectedId, onSelect }: Props) {
  const safeScenarios = Array.isArray(scenarios) ? scenarios : []
  return (
    <section className="glass-card scenario-card">
      <h2>Scenario</h2>
      <div className="scenario-list">
        {safeScenarios.length === 0 && <p className="scenario-empty">Backend scenarios unavailable.</p>}
        {safeScenarios.map((scenario) => (
          <button
            type="button"
            key={scenario.scenario_id}
            className={scenario.scenario_id === selectedId ? 'selected' : ''}
            onClick={() => onSelect(scenario.scenario_id)}
          >
            {scenarioLabel(scenario.scenario_id)}
          </button>
        ))}
      </div>
    </section>
  )
}

export default ScenarioPicker
