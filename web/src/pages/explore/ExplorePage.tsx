import type { ReactNode } from 'react'
import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material'
import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import FlagRounded from '@mui/icons-material/FlagRounded'
import FavoriteRounded from '@mui/icons-material/FavoriteRounded'
import RateReviewRounded from '@mui/icons-material/RateReviewRounded'
import AccessibilityNewRounded from '@mui/icons-material/AccessibilityNewRounded'
import PublicRounded from '@mui/icons-material/PublicRounded'
import StarsRounded from '@mui/icons-material/StarsRounded'
import { useNavigate } from 'react-router-dom'
import { IconTile } from '../../components/IconTile'
import { repository } from '../../data/repository'
import { cardGridSx } from '../../components/layout'
import { useDemo } from '../../demo/useDemo'
import { goalCascade } from '../../domain/explore'
import { dueCheckIns } from '../../domain/feedback'

/** Explore hub: You (goals, organisation) · Your benefits · Lloyds culture (purpose, values). */
export function ExplorePage() {
  const { journey, answeredCheckIns } = useDemo()
  const navigate = useNavigate()
  const { persona } = journey
  const manager = repository.getPerson(persona.managerId)?.name.split(' ')[0] ?? 'Your manager'
  const cascade = goalCascade(journey)
  const feedbackDue = dueCheckIns(-journey.daysToStart, answeredCheckIns).length > 0
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
        <HubCard
          icon={<AccessibilityNewRounded color="primary" />}
          title="Accessibility and inclusion"
          body="Our workplace adjustment policies, assistive technology, and how to ask for support"
          onClick={() => navigate('/explore/accessibility')}
        />
      </Group>

      <Group title="Help us improve">
        <HubCard
          icon={<RateReviewRounded color="primary" />}
          title="Your feedback"
          body={feedbackDue ? 'A check-in is open. Tell us how it’s going, and what we missed.' : 'Tell us what we missed and what we could do better'}
          onClick={() => navigate('/explore/feedback')}
          highlight={feedbackDue}
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
      <Box sx={cardGridSx}>{children}</Box>
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
