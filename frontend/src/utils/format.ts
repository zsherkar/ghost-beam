export function scenarioLabel(id?: string) {
  return id ? id.replace(/_/g, ' ') : 'Loading'
}

export function decisionLabel(value?: string) {
  return value ? value.replace(/_/g, ' ') : 'Pending'
}

export function formatNumber(value: number | undefined, digits = 2) {
  return value === undefined || Number.isNaN(value) ? '--' : value.toFixed(digits)
}

export function signed(value: number | undefined, digits = 2) {
  if (value === undefined || Number.isNaN(value)) return '--'
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`
}

export function nowRunLabel() {
  return formatLocalDateTime(new Date())
}

export function formatLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
