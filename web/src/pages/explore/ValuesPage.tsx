import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import FormatQuoteRounded from '@mui/icons-material/FormatQuoteRounded'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { IconTile } from '../../components/IconTile'
import { PersonAvatar } from '../../components/PersonAvatar'
import { values } from '../../data/explore'
import { SubPageHeader } from './SubPageHeader'

/** The five values, each opening a deep dive. */
export function ValuesPage() {
  const navigate = useNavigate()
  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title="Our values" subtitle="How we work together, every day" />
      <Stack spacing={1.25} role="list" aria-label="Our values">
        {values.map((v, i) => (
          <Card key={v.id} role="listitem">
            <CardActionArea onClick={() => navigate(`/explore/values/${v.id}`)}>
              <CardContent sx={{ display: 'flex', gap: 1.75, alignItems: 'center', py: 2 }}>
                <IconTile name={v.icon} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    Value {i + 1}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {v.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {v.tagline}
                  </Typography>
                </Box>
                <ChevronRightRounded color="action" />
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Illustrative values, modelled on our public values. Stories are fictional.
      </Typography>
    </Stack>
  )
}

/** Deep dive: meaning, what it looks like, what it isn't, and a colleague's story. */
export function ValueDetailPage() {
  const { valueId = '' } = useParams()
  const navigate = useNavigate()
  const index = values.findIndex((v) => v.id === valueId)
  if (index === -1) return <Navigate to="/explore/values" replace />
  const v = values[index]
  const next = values[(index + 1) % values.length]

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title={v.name} subtitle={v.tagline} back="/explore/values" />

      <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ opacity: 0.85 }}>
            What it means
          </Typography>
          <Typography>{v.meaning}</Typography>
        </CardContent>
      </Card>

      <Box>
        <Typography variant="overline" color="text.secondary">
          What it looks like
        </Typography>
        <Card>
          <CardContent>
            {v.behaviours.map((b) => (
              <Stack key={b} direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', mb: 1.25, '&:last-child': { mb: 0 } }}>
                <CheckRounded color="primary" fontSize="small" sx={{ mt: 0.25 }} />
                <Typography variant="body2">{b}</Typography>
              </Stack>
            ))}
          </CardContent>
        </Card>
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary">
          What it isn’t
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2">{v.isNot}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary">
          A colleague’s story
        </Typography>
        <Card sx={{ borderColor: 'secondary.main', borderWidth: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <FormatQuoteRounded color="secondary" />
            <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2 }}>
              {v.story.text}
            </Typography>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <PersonAvatar name={v.story.name} size={36} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {v.story.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {v.story.role} · {v.story.location}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardActionArea onClick={() => navigate(`/explore/values/${next.id}`)}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.75 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Next value
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {next.name}
              </Typography>
            </Box>
            <ChevronRightRounded color="action" />
          </CardContent>
        </CardActionArea>
      </Card>
    </Stack>
  )
}
