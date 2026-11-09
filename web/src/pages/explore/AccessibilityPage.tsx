import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { StepSheet } from '../../components/StepSheet'
import { assistiveTechnology } from '../../data/catalogue'
import { useDemo } from '../../demo/useDemo'
import { SubPageHeader } from './SubPageHeader'

const EQUIPMENT_STEP = 'choose-equipment'

/** Illustrative policy summaries for the demo. Replace with the real Lloyds wording before launch. */
const policies = [
  { title: 'Workplace adjustments', text: 'Colleagues can ask for changes to their equipment, hours, workspace or ways of working. You don’t need a formal diagnosis to ask.' },
  { title: 'Your information stays confidential', text: 'Details go only to IT and Occupational Health. Your manager is told that adjustments were requested, not what they are or why.' },
  { title: 'Ask at any time', text: 'You can ask before you start, on day one, or months later. Adjustments are reviewed as your needs change.' },
  { title: 'Occupational Health can help', text: 'Not sure what would help? Occupational Health can arrange a workplace assessment with you.' },
]

type Answer = 'yes' | 'later' | 'talk'

/** Accessibility and inclusion: policies, the assistive technology on offer, and a gentle way to ask for adjustments. */
export function AccessibilityPage() {
  const { journey } = useDemo()
  const navigate = useNavigate()
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [sheet, setSheet] = useState<string | null>(null)
  const step = journey.steps.find((s) => s.id === EQUIPMENT_STEP)
  const requested = step?.state === 'done'

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title="Accessibility and inclusion" />

      <Card sx={{ borderColor: 'secondary.main', borderWidth: 2 }}>
        <CardContent component="section" aria-label="Workplace adjustments" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Lloyds promotes an inclusive workplace for every colleague. Do you need any adjustments or additional support to help you be at your best when you start?
          </Typography>
          <Stack spacing={1} role="group" aria-label="Your answer">
            <Button variant={answer === 'yes' ? 'contained' : 'outlined'} onClick={() => { setAnswer('yes'); setSheet(EQUIPMENT_STEP) }}>
              Yes, I’d like to ask for support
            </Button>
            <Button variant={answer === 'later' ? 'contained' : 'outlined'} onClick={() => setAnswer('later')}>
              Not right now
            </Button>
            <Button variant={answer === 'talk' ? 'contained' : 'outlined'} onClick={() => setAnswer('talk')}>
              I’d prefer to talk to someone first
            </Button>
          </Stack>
          {requested && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Your request has gone to IT and Occupational Health, in confidence.
            </Alert>
          )}
          {answer === 'yes' && !requested && (
            <Button sx={{ mt: 1.5 }} onClick={() => setSheet(EQUIPMENT_STEP)}>
              Continue your request
            </Button>
          )}
          {answer === 'later' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              That’s fine. You can come back here and ask at any time, now or after you’ve started.
            </Typography>
          )}
          {answer === 'talk' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Occupational Health can talk it through with you in confidence, with no commitment. Ask the People team or the IT service desk to put you in touch.
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Anything you share is kept confidential. Your manager only sees that adjustments were requested.
          </Typography>
        </CardContent>
      </Card>

      <Box component="section" aria-label="Our policies">
        <Typography variant="overline" color="text.secondary">
          Our policies
        </Typography>
        <Stack spacing={1.25}>
          {policies.map((p) => (
            <Card key={p.title}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {p.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {p.text}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      <Box component="section" aria-label="Assistive technology">
        <Typography variant="overline" color="text.secondary">
          Assistive technology we offer
        </Typography>
        <Card>
          <CardContent component="ul" sx={{ m: 0, p: 2, pl: 4, '&:last-child': { pb: 2 } }}>
            {assistiveTechnology.map((o) => (
              <Typography key={o.value} component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>{o.label}</strong>
                <br />
                <Typography component="span" variant="caption" color="text.secondary">
                  {o.detail}
                </Typography>
              </Typography>
            ))}
          </CardContent>
        </Card>
        <Button sx={{ mt: 1 }} onClick={() => navigate('/journey')}>
          See your joining journey
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Policy summaries on this page are illustrative for the demo.
      </Typography>

      <StepSheet stepId={sheet} onClose={() => setSheet(null)} />
    </Stack>
  )
}
