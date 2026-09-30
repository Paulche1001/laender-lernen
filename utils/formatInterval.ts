export function getIntervalLabel(due: Date) {
  const diffMs = due.getTime() - Date.now();
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes}m`;
  }

  if (minutes < 1440) {
    return `${Math.round(minutes / 60)}h`;
  }

  return `${Math.round(minutes / 1440)}d`;
}
