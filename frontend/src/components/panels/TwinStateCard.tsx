import { Activity } from 'lucide-react'
import { DecisionRecord } from '../../api/client'
import { formatNumber } from '../../utils/format'

interface Props {
  record: DecisionRecord | null
  currentEvent?: string | null
}

function twinState(record: DecisionRecord | null) {
  const decision = record?.gate_decision.decision
  const trust = record?.virtual_diagnostic.trust_state
  if (decision === 'REQUEST_CALIBRATION') return 'Needs Calibration'
  if (trust === 'RED') return 'Drifted'
  if (trust === 'YELLOW') return 'Watch'
  return 'In Sync'
}

function TwinStateCard({ record, currentEvent }: Props) {
  return (
    <section className={`glass-card twin-state-card ${currentEvent === 'calibrating' ? 'event-calibrating' : ''}`}>
      <div>
        <h2>Twin State</h2>
        <strong>{twinState(record)}</strong>
        <span>Last updated 2.1s ago</span>
        <p>RF readback {formatNumber(record?.safe_signals.rf_readback, 3)} · temp {formatNumber(record?.safe_signals.temperature, 1)} C</p>
      </div>
      <div className="pulse-icon">
        <Activity size={28} />
      </div>
    </section>
  )
}

export default TwinStateCard
