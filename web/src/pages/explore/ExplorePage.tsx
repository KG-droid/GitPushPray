import type { ReactNode } from 'react'
import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material'
import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import FlagRounded from '@mui/icons-material/FlagRounded'
import FavoriteRounded from '@mui/icons-material/FavoriteRounded'
import PublicRounded from '@mui/icons-material/PublicRounded'
import StarsRounded from '@mui/icons-material/StarsRounded'
import { useNavigate } from 'react-router-dom'
import { IconTile } from '../../components/IconTile'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import { goalCascade } from '../../domain/explore'

/** Explore hub: You (goals, organisation) · Your benefits · Lloyds culture (purpose, values). */
export function ExplorePage() {
  const { journey } = useDemo()
  const navigate = useNavigate()
  const { persona } = journey
  const manager = repository.getPerson(persona.managerId)?.name.split(' ')[0] ?? 'Your manager'
  const cascade = goalCascade(journey)
  const benefitChosen = journey.steps.find((s) => s.id === 'choose-benefits')?.state === 'done'

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Box>
        <Typography variant="h4" component="h1">
          Explore
        </Typography>
        <Typography color="text.secondary">You, your benefits, and the bank you’re joining.</Typography>
      </Box>

      <Group title="You">
        <HubCard
          icon={<FlagRounded color="primary" />}
          title="My goals"
          body={
            cascade.myGoals.length
              ? `${cascade.myGoals.length} goals from ${manager}, and how they support ${cascade.team}`
              : `${manager} is setting your first goals. See your team’s goals now.`
          }
          onClick={() => navigate('/explore/goals')}
        />
        <HubCard
          icon={<AccountTreeRounded color="primary" />}
          title="My organisation"
          body={`Where you sit in ${persona.team}, from your team up to the Group Chief Executive`}
          onClick={() => navigate('/explore/organisation')}
        />
      </Group>

      <Group title="Your benefits">
        <HubCard
          icon={<FavoriteRounded color="primary" />}
          title="Benefits and reward"
          body={benefitChosen ? 'Your choices, your pension and your total reward' : 'Choose your flexible benefit, set up your pension and see your total reward'}
          onClick={() => navigate('/explore/benefits')}
          highlight={!benefitChosen}
        />
      </Group>

      <Group title="Lloyds culture">
        <HubCard
          icon={<PublicRounded color="primary" />}
          title="Helping Britain Prosper"
          body="Our purpose, and how your role fits into it"
          onClick={() => navigate('/explore/purpose')}
        />
        <HubCard
          icon={<StarsRounded color="primary" />}
          title="Our values"
          body="Five values, what they look like day to day, and colleague stories"
          onClick={() => navigate('/explore/values')}
        />
      </Group>
    </Stack>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" aria-label={title}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Stack spacing={1.25}>{children}</Stack>
    </Box>
  )
}

function HubCard({ icon, title, body, onClick, highlight = false }: { icon: ReactNode; title: string; body: string; onClick: () => void; highlight?: boolean }) {
  return (
    <Card sx={highlight ? { borderColor: 'secondary.main', borderWidth: 2 } : undefined}>
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ display: 'flex', gap: 1.75, alignItems: 'center', py: 2 }}>
          <IconTile icon={icon} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {body}
            </Typography>
          </Box>
          <ChevronRightRounded color="action" />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
