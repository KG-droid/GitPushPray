import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { IconTile } from '../../components/IconTile'
import { StepIcon } from '../../components/StepIcon'
import { howYouFit, purpose } from '../../data/explore'
import { useDemo } from '../../demo/useDemo'
import { SubPageHeader } from './SubPageHeader'

/** Helping Britain Prosper: the purpose, what it means in practice, and how this joiner's role fits. */
export function PurposePage() {
  const { journey } = useDemo()
  const { persona } = journey

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title="Our purpose" />

      <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" component="p" sx={{ fontWeight: 800, mb: 1 }}>
            {purpose.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.92 }}>
            {purpose.summary}
          </Typography>
        </CardContent>
      </Card>

      <Box>
        <Typography variant="overline" color="text.secondary">
          What it means in practice
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
          {purpose.pillars.map((p) => (
            <Card key={p.title}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <StepIcon name={p.icon} color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {p.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {p.text}
                </Typography>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>
                  {p.stat}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.statLabel}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary">
          How you fit in, as a {persona.role.toLowerCase()}
        </Typography>
        <Card sx={{ borderColor: 'secondary.main', borderWidth: 2 }}>
          <CardContent sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start', p: 2.5 }}>
            <IconTile name="celebration" />
            <Typography variant="body2">{howYouFit[persona.jobFamily]}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="caption" color="text.secondary">
        “Helping Britain Prosper” is our public purpose. Figures and examples on this page are illustrative for the demo.
      </Typography>
    </Stack>
  )
}
