import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import FlagRounded from '@mui/icons-material/FlagRounded'
import HourglassTopRounded from '@mui/icons-material/HourglassTopRounded'
import PublicRounded from '@mui/icons-material/PublicRounded'
import { repository } from '../../data/repository'
import { purpose } from '../../data/explore'
import { useDemo } from '../../demo/useDemo'
import { goalCascade } from '../../domain/explore'
import { SubPageHeader } from './SubPageHeader'

/** The goal cascade: Group purpose → Group priorities → team goals → the joiner's own goals. */
export function GoalsPage() {
  const { journey } = useDemo()
  const cascade = goalCascade(journey)
  const manager = repository.getPerson(journey.persona.managerId)?.name.split(' ')[0] ?? 'Your manager'

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title="My goals" subtitle={`How your work supports ${cascade.team} and the Group`} />

      {cascade.myGoals.length > 0 ? (
        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="overline" sx={{ opacity: 0.85 }}>
              Your first 3 months, from {manager}
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
              {cascade.myGoals.map((g) => (
                <Typography key={g.title} component="li" variant="body2" sx={{ mb: 0.75 }}>
                  {g.title}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ borderStyle: 'dashed' }}>
          <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <HourglassTopRounded color="action" />
            <Typography variant="body2">
              {manager} is setting your first 3-month goals, usually the week before you start. Meanwhile, here’s what your team is working towards.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box>
        <Typography variant="overline" color="text.secondary">
          How it all connects
        </Typography>
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
              <PublicRounded color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Our purpose
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {purpose.name}
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2} role="list" aria-label="Group priorities">
              {cascade.priorities.map((p) => (
                <Box key={p.id} role="listitem" sx={{ borderLeft: 3, borderColor: 'primary.main', pl: 1.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    Group priority
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {p.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {p.detail}
                  </Typography>

                  <Stack spacing={1.25}>
                    {p.teamGoals.map((t) => (
                      <Box key={t.title} sx={{ borderLeft: 3, borderColor: 'secondary.main', pl: 1.5, ml: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {cascade.team}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t.title}
                        </Typography>
                        {t.mine.map((m) => (
                          <Stack key={m} direction="row" spacing={1} sx={{ alignItems: 'flex-start', mt: 0.75, bgcolor: 'action.hover', borderRadius: 2, p: 1 }}>
                            <FlagRounded sx={{ fontSize: 18, mt: 0.1 }} color="primary" />
                            <Box>
                              <Chip size="small" label="Your goal" color="primary" sx={{ height: 20, mb: 0.25 }} />
                              <Typography variant="body2">{m}</Typography>
                            </Box>
                          </Stack>
                        ))}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Group priorities and team goals are illustrative for this demo.
        </Typography>
      </Box>
    </Stack>
  )
}
