import { Activity, Bell, ChevronDown, List, Monitor, Moon, Network, Play, Presentation, Stethoscope, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DecisionRecord, ScenarioSummary } from '../../api/client'
import { decisionLabel, formatLocalDateTime, scenarioLabel } from '../../utils/format'
import { trustTone } from '../../utils/trust'

type ThemeMode = 'dark' | 'light' | 'system'

interface Props {
  record: DecisionRecord | null
  selectedScenarioId?: string
  scenarios: ScenarioSummary[]
  backendConnected: boolean
  themeMode: ThemeMode
  judgeMode: boolean
  onThemeModeChange: (mode: ThemeMode) => void
  onScenarioChange: (scenarioId: string) => void
  onRunGuidedDemo: () => void
  onJudgeDemoMode: () => void
  onRunHealthCheck: () => void
}

const themeOrder: ThemeMode[] = ['dark', 'light', 'system']

function TopBar({
  record,
  selectedScenarioId,
  scenarios,
  backendConnected,
  themeMode,
  judgeMode,
  onThemeModeChange,
  onScenarioChange,
  onRunGuidedDemo,
  onJudgeDemoMode,
  onRunHealthCheck,
}: Props) {
  const trust = record?.virtual_diagnostic.trust_state ?? 'YELLOW'
  const decision = record?.gate_decision.decision
  const ThemeIcon = themeMode === 'light' ? Sun : themeMode === 'system' ? Monitor : Moon
  const nextTheme = themeOrder[(themeOrder.indexOf(themeMode) + 1) % themeOrder.length]
  const [clock, setClock] = useState(() => formatLocalDateTime(new Date()))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(formatLocalDateTime(new Date()))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <h1>Ghost Beam</h1>
        <p>Accelerator trust agent.</p>
      </div>

      <div className={`system-card ${trustTone(trust)}`}>
        <span className="system-led" />
        <div>
          <small>System</small>
          <strong>{backendConnected ? decisionLabel(decision) : 'Backend Disconnected'}</strong>
        </div>
      </div>

      <div className="topbar-controls">
        <div className="select-card clock-card" aria-label="Local time clock">
          <span>
            <small>Local Time</small>
            <strong>{clock}</strong>
          </span>
        </div>
        <label className="select-card scenario-select-card">
          <span>
            <small>Scenario</small>
            <strong>{scenarioLabel(selectedScenarioId)}</strong>
          </span>
          <select
            aria-label="Scenario"
            value={selectedScenarioId ?? ''}
            onChange={(event) => onScenarioChange(event.currentTarget.value)}
          >
            {scenarios.map((scenario) => (
              <option key={scenario.scenario_id} value={scenario.scenario_id}>
                {scenarioLabel(scenario.scenario_id)}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </label>
        <button
          className="select-card theme-select-card"
          type="button"
          onClick={() => onThemeModeChange(nextTheme)}
          aria-label={`Theme ${themeMode}. Click to switch to ${nextTheme}.`}
          title={`Theme: ${themeMode}`}
        >
          <span>
            <small>Theme</small>
            <strong>{themeMode}</strong>
          </span>
          <ThemeIcon size={15} />
        </button>
        <button className="icon-button guided-top-button" type="button" aria-label="Run Guided Demo" onClick={onRunGuidedDemo}>
          <Play size={16} />
        </button>
        <button
          className={`icon-button judge-mode-button ${judgeMode ? 'active' : ''}`}
          type="button"
          aria-label="Judge Demo Mode"
          title="Judge Demo Mode"
          onClick={onJudgeDemoMode}
        >
          <Presentation size={16} />
        </button>
        <button className="icon-button health-check-button" type="button" aria-label="Demo Health Check" title="Demo Health Check" onClick={onRunHealthCheck}>
          <Stethoscope size={16} />
        </button>
        <button className="icon-button secondary-topbar-icon" type="button" aria-label="Activity">
          <Activity size={18} />
        </button>
        <button className="icon-button secondary-topbar-icon" type="button" aria-label="Alerts">
          <Bell size={17} />
        </button>
        <button className="icon-button secondary-topbar-icon" type="button" aria-label="Network">
          <Network size={17} />
        </button>
        <button className="icon-button secondary-topbar-icon" type="button" aria-label="List">
          <List size={18} />
        </button>
      </div>
    </header>
  )
}

export default TopBar
