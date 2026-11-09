import { Alert, AlertTitle } from '@mui/material'
import { formatShortDate } from '../domain/dates'
import type { Notice } from '../domain/journey'

/** Empathetic banner explaining a change of plan. */
export function NoticeCard({ notice }: { notice: Notice }) {
  if (notice.kind === 'start-date-moved') {
    return (
      <Alert severity="info" variant="outlined" sx={{ borderRadius: '20px', bgcolor: 'background.paper' }}>
        <AlertTitle sx={{ fontWeight: 700 }}>Your new start date is {formatShortDate(notice.to)}</AlertTitle>
        {notice.reason} Everything you’ve chosen and unlocked stays as it is, and your manager and buddy know.
      </Alert>
    )
  }
  return (
    <Alert severity="warning" variant="outlined" sx={{ borderRadius: '20px', bgcolor: 'background.paper' }}>
      <AlertTitle sx={{ fontWeight: 700 }}>{notice.label} is taking a little longer</AlertTitle>
      {notice.note} We now expect it around {formatShortDate(notice.expectedClearOn)}.
    </Alert>
  )
}
