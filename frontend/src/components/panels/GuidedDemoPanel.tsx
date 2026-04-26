import { BarChart3, Clipboard, Download, FileArchive, FileJson, FileText, HeartPulse, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react'
import { GuidedTranscriptEntry } from '../../utils/missionReport'

interface GuidedStep {
  title: string
  explanation: string
  focus: string
}

interface Props {
  open: boolean
  steps: GuidedStep[]
  activeStep: number
  playing: boolean
  busy: boolean
  transcript: GuidedTranscriptEntry[]
  reportReady: boolean
  reportNotice?: string
  onNext: () => void
  onPrevious: () => void
  onAutoPlay: () => void
  onPause: () => void
  onReset: () => void
  onReplayFromStart: () => void
  onExit: () => void
  onGoToStep: (index: number) => void
  onGenerateReport: () => void | Promise<void>
  onDownloadMarkdown: () => void
  onDownloadJson: () => void
  onCopySummary: () => void
  onRunHealthCheck: () => void
  onRunBenchmark: () => void
  onLoadReplay: () => void
  onExportEvidenceBundle: () => void
}

function GuidedDemoPanel({
  open,
  steps,
  activeStep,
  playing,
  busy,
  transcript,
  reportReady,
  reportNotice,
  onNext,
  onPrevious,
  onAutoPlay,
  onPause,
  onReset,
  onReplayFromStart,
  onExit,
  onGoToStep,
  onGenerateReport,
  onDownloadMarkdown,
  onDownloadJson,
  onCopySummary,
  onRunHealthCheck,
  onRunBenchmark,
  onLoadReplay,
  onExportEvidenceBundle,
}: Props) {
  if (!open) return null
  const step = steps[activeStep]
  const progress = steps.length > 1 ? (activeStep / (steps.length - 1)) * 100 : 0

  return (
    <section className="guided-demo-panel glass-card" aria-label="Guided Drifted Twin Test">
      <div className="guided-demo-header">
        <div>
          <span>Guided Experiment</span>
          <strong>Drifted Twin Test</strong>
        </div>
        <button type="button" onClick={onExit} aria-label="Exit guided demo">
          <X size={16} />
        </button>
      </div>

      <div className="guided-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="guided-step-copy">
        <span>Step {activeStep + 1} / {steps.length} - Focus: {step.focus}</span>
        <h3>{step.title}</h3>
        <p>{step.explanation}</p>
      </div>

      <div className="guided-step-dots" aria-label="Guided demo timeline">
        {steps.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={index === activeStep ? 'active' : ''}
            title={item.title}
            onClick={() => onGoToStep(index)}
            aria-label={`Step ${index + 1}: ${item.title}`}
          />
        ))}
      </div>

      <div className="guided-controls">
        <button type="button" onClick={onPrevious} disabled={busy || activeStep === 0}>
          <ChevronLeft size={14} /> Previous
        </button>
        <button type="button" onClick={playing ? onPause : onAutoPlay} disabled={busy}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : 'Auto Play'}
        </button>
        <button type="button" onClick={onNext} disabled={busy || activeStep === steps.length - 1}>
          Next <ChevronRight size={14} />
        </button>
        <button type="button" onClick={onReset} disabled={busy}>
          <RotateCcw size={14} /> Reset Demo
        </button>
        <button type="button" onClick={onReplayFromStart} disabled={busy}>
          <Play size={14} /> Replay from Start
        </button>
        <button type="button" onClick={onRunHealthCheck} disabled={busy}>
          <HeartPulse size={14} /> Health Check
        </button>
        <button type="button" onClick={onRunBenchmark} disabled={busy}>
          <BarChart3 size={14} /> Benchmark
        </button>
        <button type="button" onClick={onLoadReplay} disabled={busy}>
          <Play size={14} /> Load Replay
        </button>
      </div>

      <div className="guided-report-card">
        <div>
          <span>Artifact Package</span>
          <strong>{transcript.length} transcript entries</strong>
        </div>
        <div className="guided-report-actions">
          <button type="button" onClick={onGenerateReport} disabled={busy || transcript.length === 0}>
            <FileText size={13} /> Generate Mission Report
          </button>
          <button type="button" onClick={onDownloadMarkdown} disabled={!reportReady}>
            <Download size={13} /> Markdown
          </button>
          <button type="button" onClick={onDownloadJson} disabled={!reportReady}>
            <FileJson size={13} /> JSON
          </button>
          <button type="button" onClick={onCopySummary} disabled={!reportReady}>
            <Clipboard size={13} /> Copy Summary
          </button>
          <button type="button" onClick={onExportEvidenceBundle} disabled={busy}>
            <FileArchive size={13} /> Evidence Bundle
          </button>
        </div>
        {reportNotice && <p>{reportNotice}</p>}
      </div>
    </section>
  )
}

export default GuidedDemoPanel
