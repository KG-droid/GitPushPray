import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import RateReviewRounded from '@mui/icons-material/RateReviewRounded'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../demo/useDemo'
import { dueCheckIns } from '../domain/feedback'
import { IconTile } from './IconTile'

/** Nudges the joiner when a check-in is open. Renders nothing otherwise. */
export function FeedbackPrompt() {
  const { journey, answeredCheckIns } = useDemo()
  const navigate = useNavigate()
  const due = dueCheckIns(-journey.daysToStart, answeredCheckIns)
  const latest = due.at(-1)
  if (!latest) return null

  return (
    <Card sx={{ borderColor: 'secondary.main', borderWidth: 2 }}>
      <CardActionArea onClick={() => navigate(`/explore/feedback?m=${latest.id}`)}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1.75 }}>
          <IconTile icon={<RateReviewRounded color="primary" />} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              {latest.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {latest.id === 'day-30' ? 'Two minutes. Tell us what we missed.' : 'One tap. Tell us how it’s going.'}
            </Typography>
          </Box>
          <ChevronRightRounded color="action" />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
