import { useMemo, useState } from 'react'
import { Copy, Download, X } from 'lucide-react'
import { DecisionRecord, ExperimentState } from '../../api/client'
import { buildGhostBeamDiagnosis, diagnosisFilename } from '../../utils/diagnosis'
import { downloadTextFile } from '../../utils/missionReport'

interface Props {
  record: DecisionRecord | null
  experiment?: ExperimentState | null
  open: boolean
  onClose: () => void
  onDownload: () => void
  onExportSession?: () => void
  onExportEvidenceBundle?: () => void
  exportNotice?: string
}

type ArtifactTab = 'diagnosis' | 'json' | 'evidence' | 'export'

function DecisionRecordDrawer({
  record,
  experiment,
  open,
  onClose,
  onDownload,
  onExportSession,
  onExportEvidenceBundle,
  exportNotice,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [copiedDiagnosis, setCopiedDiagnosis] = useState(false)
  const [activeTab, setActiveTab] = useState<ArtifactTab>('diagnosis')
  const diagnosis = useMemo(() => buildGhostBeamDiagnosis(record, experiment), [experiment, record])
  if (!open || !record) return null

  async function copyJson() {
    if (!record) return
    await navigator.clipboard.writeText(JSON.stringify(record, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  async function copyDiagnosis() {
    if (!diagnosis) return
    await navigator.clipboard.writeText(diagnosis.summary)
    setCopiedDiagnosis(true)
    window.setTimeout(() => setCopiedDiagnosis(false), 1500)
  }

  function downloadDiagnosis() {
    if (!diagnosis) return
    downloadTextFile(diagnosisFilename(record), diagnosis.markdown, 'text/markdown')
  }

  const timestamp = new Date().toLocaleString()

  return (
    <div className="drawer-backdrop">
      <aside className="drawer json-drawer glass-card">
        <div className="drawer-header">
          <div>
            <h2>{activeTab === 'json' ? 'Decision Record JSON' : activeTab === 'diagnosis' ? 'Ghost Beam Diagnosis' : 'Decision Record'}</h2>
            <p>Machine-readable audit trail plus human-readable Ghost Beam diagnosis.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Decision Record drawer">
            <X size={18} />
          </button>
        </div>
        <div className="artifact-tabs" role="tablist" aria-label="Decision Record views">
          {(['diagnosis', 'json', 'evidence', 'export'] as ArtifactTab[]).map((tab) => (
            <button key={tab} className={activeTab === tab ? 'active' : ''} type="button" onClick={() => setActiveTab(tab)}>
              {tab === 'diagnosis' ? 'Diagnosis' : tab === 'json' ? 'JSON' : tab === 'evidence' ? 'Evidence' : 'Export'}
            </button>
          ))}
        </div>
        <div className="artifact-meta-grid">
          <div><span>Scenario</span><strong>{record.scenario_id}</strong></div>
          <div><span>Step</span><strong>{experiment?.step_number ?? 0}</strong></div>
          <div><span>Generated</span><strong>{timestamp}</strong></div>
          <div><span>Decision</span><strong>{record.gate_decision.decision}</strong></div>
        </div>

        {exportNotice && <p className="export-notice">{exportNotice}</p>}

        {activeTab === 'diagnosis' && diagnosis && (
          <div className="diagnosis-panel">
            <section>
              <span>What happened</span>
              <p>{diagnosis.whatHappened}</p>
            </section>
            <section>
              <span>Why Ghost Beam intervened</span>
              <p>{diagnosis.whyIntervened}</p>
            </section>
            <section>
              <span>Decision</span>
              <strong>{diagnosis.decision}</strong>
              <p>{diagnosis.actionTaken}</p>
            </section>
            <section>
              <span>Outcome</span>
              <p>{diagnosis.outcome}</p>
            </section>
            <section>
              <span>Next recommended step</span>
              <p>{diagnosis.nextStep}</p>
            </section>
            <div className="diagnosis-actions">
              <button type="button" onClick={() => void copyDiagnosis()}><Copy size={15} /> {copiedDiagnosis ? 'Copied' : 'Copy Diagnosis Summary'}</button>
              <button type="button" onClick={downloadDiagnosis}><Download size={15} /> Export Diagnosis Markdown</button>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && diagnosis && (
          <div className="diagnosis-panel">
            <section>
              <span>Evidence used</span>
              <ul className="diagnosis-list">
                {diagnosis.evidenceUsed.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
            <section>
              <span>What Ghost Beam did</span>
              <div className="intervention-timeline">
                {diagnosis.timeline.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <em>{index + 1}</em>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'json' && (
          <>
            <div className="drawer-actions">
              <button type="button" onClick={() => void copyJson()}><Copy size={15} /> {copied ? 'Copied' : 'Copy JSON'}</button>
              <button type="button" onClick={onDownload}><Download size={15} /> Export Latest Decision</button>
            </div>
            <pre>{JSON.stringify(record, null, 2)}</pre>
          </>
        )}

        {activeTab === 'export' && (
          <div className="diagnosis-panel">
            <section>
              <span>Export package</span>
              <p>Export the machine-readable decision, human diagnosis, full session, or complete evidence bundle.</p>
            </section>
            <div className="drawer-actions artifact-export-actions">
              <button type="button" onClick={downloadDiagnosis}><Download size={15} /> Export Diagnosis Markdown</button>
              <button type="button" onClick={() => void copyDiagnosis()}><Copy size={15} /> {copiedDiagnosis ? 'Copied' : 'Copy Diagnosis Summary'}</button>
              <button type="button" onClick={onDownload}><Download size={15} /> Export Latest Decision JSON</button>
              {onExportSession && <button type="button" onClick={onExportSession}><Download size={15} /> Export Full Session</button>}
              {onExportEvidenceBundle && <button type="button" onClick={onExportEvidenceBundle}><Download size={15} /> Export Evidence Bundle</button>}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default DecisionRecordDrawer
