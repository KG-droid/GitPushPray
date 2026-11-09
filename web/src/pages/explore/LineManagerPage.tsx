import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { IconTile } from '../../components/IconTile'
import { managerResponsibilities } from '../../data/explore'
import { SubPageHeader } from './SubPageHeader'

/** What LBG expects of a line manager, for colleagues joining to lead a team. */
export function LineManagerPage() {
  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title="Being a line manager" subtitle="What LBG expects, in practical terms" />

      <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            You’re the person who shapes your team’s day-to-day experience of LBG.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
            That means clear expectations, honest conversations, fair decisions and real support. Here are the eight things that matter most.
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={1.25} role="list" aria-label="Line manager responsibilities">
        {managerResponsibilities.map((r, i) => (
          <Card key={r.id} role="listitem">
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'center', mb: 1.5 }}>
                <IconTile name={r.icon} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {i + 1} of {managerResponsibilities.length}
                  </Typography>
                  <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                    {r.title}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {r.summary}
              </Typography>
              <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
                {r.points.map((p) => (
                  <Typography key={p} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                    {p}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Summaries on this page are illustrative for the demo. Check the current LBG guidance in Workday before acting on them.
      </Typography>
    </Stack>
  )
}
