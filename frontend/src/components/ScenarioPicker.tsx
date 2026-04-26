import { ScenarioSummary } from '../api/client'

interface Props {
  scenarios: ScenarioSummary[]
  selectedId: string
  onSelect: (scenarioId: string) => void
}

function label(id: string) {
  return id.replace(/_/g, ' ')
}

function ScenarioPicker({ scenarios, selectedId, onSelect }: Props) {
  return (
    <section className="panel-block">
      <h2>Scenario</h2>
      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <button
            type="button"
            key={scenario.scenario_id}
            className={scenario.scenario_id === selectedId ? 'selected' : ''}
            onClick={() => onSelect(scenario.scenario_id)}
          >
            {label(scenario.scenario_id)}
          </button>
        ))}
      </div>
    </section>
  )
}

export default ScenarioPicker
