import { useState } from 'react'
import { Box, Button, Card, CardContent, Chip, FormControlLabel, Radio, RadioGroup, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import ExploreRounded from '@mui/icons-material/ExploreRounded'
import RouteRounded from '@mui/icons-material/RouteRounded'
import ChairRounded from '@mui/icons-material/ChairRounded'
import PlaceRounded from '@mui/icons-material/PlaceRounded'
import DirectionsTransitRounded from '@mui/icons-material/DirectionsTransitRounded'
import { dayOneAgenda, dayOneLogistics, deskOptions, minutesBefore, siteTravel, travelOptions, wayfinding } from '../../data/dayOne'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import { formatShortDate } from '../../domain/dates'
import { SubPageHeader } from '../explore/SubPageHeader'

const first = (name: string) => name.split(' ')[0]

/** Hour-by-hour plan for the joiner's first day: who meets them, where, their desk and how to get there. */
export function DayOnePage() {
  const { journey, completeStep } = useDemo()
  const { persona } = journey
  const manager = repository.getPerson(persona.managerId)
  const buddy = persona.buddyId ? repository.getPerson(persona.buddyId) : undefined
  const logistics = dayOneLogistics[persona.id] ?? {
    arriveBy: '09:00',
    meetWho: buddy ? ('buddy' as const) : ('manager' as const),
    meetAt: `Reception, ${persona.location}`,
    desk: persona.workPattern === 'remote' ? undefined : 'Your manager will confirm your desk',
    deskNextTo: buddy ? ('buddy' as const) : ('manager' as const),
  }
  const names = { '{buddy}': first(buddy?.name ?? 'your buddy'), '{manager}': first(manager?.name ?? 'your manager') }
  const fill = (s: string) => s.replace(/\{buddy\}|\{manager\}/g, (m) => names[m as keyof typeof names])

  const meeter = logistics.meetWho === 'buddy' ? (buddy ?? manager) : manager
  const deskPerson = logistics.deskNextTo === 'buddy' ? (buddy ?? manager) : manager
  const travel = siteTravel[persona.site]

  // Desk booking: the desk next to the buddy or manager is held by default, and the joiner can swap it.
  const desks = deskOptions(persona, logistics)
  const bookedId = journey.steps.find((st) => st.id === 'book-desk')?.value ?? 'near'
  const booked = desks.find((d) => d.id === bookedId)
  const [deskPick, setDeskPick] = useState(bookedId)
  const deskLabel = booked?.label ?? logistics.desk
  const keptDefault = !booked || booked.id === 'near'

  const routes = persona.workPattern === 'remote' ? [] : (travelOptions[persona.site] ?? [])
  const route = routes.find((r) => r.id === journey.steps.find((st) => st.id === 'day-one-travel')?.value)
  const way = wayfinding(persona, logistics, deskLabel)
  const agenda = dayOneAgenda(persona, { ...logistics, desk: deskLabel })

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader
        title="Your Day 1 plan"
        subtitle={`${formatShortDate(journey.startDate)} · ${persona.location}`}
        back="/today"
      />

      <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Arrive by {logistics.arriveBy}. {meeter ? first(meeter.name) : 'Someone'} will be waiting for you.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
            You don’t need to find anyone or work out where to go.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5}>
              <PlaceRounded color="primary" />
              <Box>
                <Typography variant="subtitle2" component="h2">Where you’ll meet {meeter ? first(meeter.name) : 'them'}</Typography>
                <Typography variant="body2" color="text.secondary">{logistics.meetAt}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <ChairRounded color="primary" />
              <Box>
                <Typography variant="subtitle2" component="h2">Your desk</Typography>
                {logistics.desk && deskPerson ? (
                  <Typography variant="body2" color="text.secondary">
                    {keptDefault
                      ? `${logistics.desk}, booked next to ${first(deskPerson.name)} (${deskPerson.id.startsWith('buddy') ? 'your buddy' : 'your manager'}).`
                      : `${deskLabel}, booked by you for ${formatShortDate(journey.startDate)}.`}
                    {logistics.deskNote ? ` ${logistics.deskNote}` : ''}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    You’re home-based, so no desk is needed. {deskPerson ? first(deskPerson.name) : 'Your buddy'} will be on the call from the start.
                  </Typography>
                )}
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {desks.length > 0 && (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>Choose your desk</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              A desk is already held for you. Keep it, or pick one that suits you better.
            </Typography>
            <RadioGroup aria-label="Desk for Day 1" value={deskPick} onChange={(e) => setDeskPick(e.target.value)}>
              {desks.map((d) => (
                <FormControlLabel
                  key={d.id}
                  value={d.id}
                  control={<Radio />}
                  sx={{ alignItems: 'flex-start', py: 0.5, '& .MuiRadio-root': { mt: -0.5 } }}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {d.label} {d.id === bookedId && <Chip component="span" size="small" color="success" label="Booked" sx={{ ml: 0.5 }} />}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{fill(d.note)}</Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
            <Button variant="contained" disabled={deskPick === bookedId} onClick={() => completeStep('book-desk', { value: deskPick })} sx={{ mt: 1 }}>
              Book this desk
            </Button>
          </CardContent>
        </Card>
      )}

      {routes.length > 0 && (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 0.5 }}>
              <RouteRounded color="primary" />
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>Plan your journey</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>How will you get in on Day 1?</Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              color="primary"
              aria-label="How you’ll travel"
              value={route?.id ?? null}
              onChange={(_, v: string | null) => v && completeStep('day-one-travel', { value: v })}
            >
              {routes.map((r) => (
                <ToggleButton key={r.id} value={r.id} sx={{ minHeight: 44 }}>{r.mode}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            {route && (
              <Box role="region" aria-label="Your journey" sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2">
                  Be at {route.from} by {minutesBefore(logistics.arriveBy, route.minutes + 5)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  About {route.minutes} minutes to the front door, with 5 to spare. {route.route}
                </Typography>
                {route.tip && <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>{route.tip}</Typography>}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {way && (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
              <ExploreRounded color="primary" />
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>Finding your way</Typography>
            </Stack>
            <Box component="ol" aria-label="From the door to your desk" sx={{ m: 0, mb: 1.5, pl: 2.5 }}>
              {way.steps.map((st) => (
                <Typography key={st} component="li" variant="body2" sx={{ mb: 0.5 }}>{fill(st)}</Typography>
              ))}
            </Box>
            <Typography variant="subtitle2">Handy places</Typography>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {way.nearby.map((n) => (
                <Typography key={n.place} variant="body2" color="text.secondary">
                  <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{n.place}:</Box> {n.where}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Box>
        <Typography variant="overline" color="text.secondary">The day</Typography>
        <Stack spacing={1} component="ol" aria-label="Day 1 agenda" sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {agenda.map((item) => (
            <Card component="li" key={item.time + item.title}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ minWidth: 48, fontWeight: 700 }}>{item.time}</Typography>
                <Box>
                  <Typography variant="subtitle2" component="h3">{fill(item.title)}</Typography>
                  <Typography variant="body2" color="text.secondary">{fill(item.detail)}</Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {travel && (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
              <DirectionsTransitRounded color="primary" />
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
                Getting there: {travel.site}
              </Typography>
            </Stack>
            {travel.fromLbg.length > 0 && (
              <>
                <Typography variant="subtitle2">From LBG</Typography>
                <Box component="ul" sx={{ m: 0, mb: 1, pl: 2.5 }}>
                  {travel.fromLbg.map((t) => (
                    <Typography key={t} component="li" variant="body2" color="text.secondary">{t}</Typography>
                  ))}
                </Box>
              </>
            )}
            {travel.general.length > 0 && (
              <>
                <Typography variant="subtitle2">Good to know (not from LBG, please check your route)</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {travel.general.map((t) => (
                    <Typography key={t} component="li" variant="body2" color="text.secondary">{t}</Typography>
                  ))}
                </Box>
              </>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Office details: lloydsbankinggroup.com/careers/where-we-are
            </Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="caption" color="text.secondary">
        Desks, routes, directions, times and meeting points are examples for the demo. {manager ? first(manager.name) : 'Your manager'} will confirm them before you start.
      </Typography>
    </Stack>
  )
}
