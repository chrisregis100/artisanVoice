const formatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDate(dateString: string): string {
  try {
    return formatter.format(new Date(dateString));
  } catch {
    return dateString;
  }
}
