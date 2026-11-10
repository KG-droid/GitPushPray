import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Slider,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'
import { StepActions } from '../../components/StepActions'
import { StepIcon } from '../../components/StepIcon'
import { benefitCategories, bankPensionRate } from '../../data/explore'
import { useDemo } from '../../demo/useDemo'
import { formatGBP, totalReward, type RewardPart } from '../../domain/explore'
import { SubPageHeader } from './SubPageHeader'

/**
 * Categorical slots 1–4 (validated with the dataviz palette validator against our card surfaces:
 * white in light mode, #141E1B in dark). Fixed order by part, never by rank.
 */
const partColors: Record<RewardPart['id'], { light: string; dark: string }> = {
  salary: { light: '#2a78d6', dark: '#3987e5' },
  pension: { light: '#eb6834', dark: '#d95926' },
  other: { light: '#eda100', dark: '#c98500' },
}

/** Benefits and reward: the joiner's choices live here; the journey steps point to this screen. */
export function BenefitsPage() {
  const { journey, completeStep } = useDemo()
  const flexStep = journey.steps.find((s) => s.id === 'choose-benefits')
  const payStep = journey.steps.find((s) => s.id === 'pay-and-pension')
  const savedPercent = payStep?.state === 'done' && payStep.value ? Number(payStep.value) : undefined
  const [percent, setPercent] = useState(savedPercent ?? 6)
  const reward = totalReward(journey, percent)

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title="Benefits and reward" subtitle="Your interests, your pension and everything you get" />

      {/* ── My choices ───────────────────────── */}
      <Box component="section" aria-label="Your interests">
        <Typography variant="overline" color="text.secondary">
          Your interests
        </Typography>
        <Stack spacing={1.25}>
          {flexStep && (
            <Card sx={flexStep.state === 'available' ? { borderColor: 'secondary.main', borderWidth: 2 } : undefined}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
                  <StepIcon name={flexStep.icon} color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {flexStep.title}
                  </Typography>
                </Stack>
                {flexStep.state !== 'done' && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {flexStep.body}
                  </Typography>
                )}
                <StepActions step={flexStep} inline />
              </CardContent>
            </Card>
          )}

          {/* Pension calculator: always explorable, confirmable once checks clear */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.5 }}>
                <StepIcon name="payments" color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Your pension
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Contribute 6% and the bank adds 15%. Slide to see how it works.
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: 600 }} id="pension-label">
                You contribute: {percent}%
              </Typography>
              <Slider
                value={percent}
                min={0}
                max={10}
                step={1}
                marks={[{ value: 0, label: '0%' }, { value: 6, label: '6%' }, { value: 10, label: '10%' }]}
                onChange={(_, v) => setPercent(v as number)}
                aria-labelledby="pension-label"
                getAriaValueText={(v) => `${v}%, bank adds ${bankPensionRate(v)}%`}
                disabled={payStep?.state === 'done'}
                sx={{ mb: 1 }}
              />
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Stat label="You, each month" value={formatGBP(reward.monthly.you)} />
                <Stat label={`Bank adds (${reward.bankPercent}%)`} value={formatGBP(reward.monthly.bank)} emphasis />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {percent === 0
                  ? 'At 0% you miss out on the bank’s contribution entirely.'
                  : reward.bankPercent < 15
                    ? `Contribute ${Math.ceil((15 - 3) / 2)}% to get the full 15% from the bank.`
                    : 'You’re getting the maximum 15% from the bank.'}
              </Typography>

              {payStep?.state === 'done' ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
                  <CheckCircleRounded fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Pay and pension set up at {savedPercent}%
                  </Typography>
                </Stack>
              ) : payStep?.state === 'available' ? (
                <Button variant="contained" onClick={() => completeStep('pay-and-pension', { value: String(percent) })}>
                  Set up pay with a {percent}% pension
                </Button>
              ) : (
                <Stack direction="row" spacing={1} sx={{ color: 'text.secondary' }}>
                  <LockRounded fontSize="small" />
                  <Typography variant="body2">{payStep?.lockedHint}</Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* ── Total reward ─────────────────────── */}
      <Box component="section" aria-label="Your total reward">
        <Typography variant="overline" color="text.secondary">
          Your total reward
        </Typography>
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
              Each year, estimated
            </Typography>
            <Typography sx={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, mb: 2 }}>{formatGBP(reward.total)}</Typography>
            <SegmentedBar parts={reward.parts} total={reward.total} />
            <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0, mt: 2 }} aria-label="Total reward breakdown">
              {reward.parts.map((p) => (
                <Stack component="li" key={p.id} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Box aria-hidden sx={(t) => ({ width: 12, height: 12, borderRadius: '3px', flexShrink: 0, bgcolor: partColors[p.id].light, ...t.applyStyles('dark', { bgcolor: partColors[p.id].dark }) })} />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {p.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatGBP(p.amount)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2, color: 'text.secondary', alignItems: 'flex-start' }}>
              <VisibilityOffRounded sx={{ fontSize: 16, mt: 0.25 }} />
              <Typography variant="caption">Only you can see this. Figures are illustrative for the demo.</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* ── All benefits ─────────────────────── */}
      <Box component="section" aria-label="All benefits">
        <Typography variant="overline" color="text.secondary">
          Everything you get
        </Typography>
        {benefitCategories.map((c) => (
          <Accordion key={c.id} disableGutters elevation={0} sx={{ border: 1, borderColor: 'divider', '&:not(:last-of-type)': { borderBottom: 0 }, '&::before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreRounded />}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <StepIcon name={c.icon} color="primary" fontSize="small" />
                <Typography sx={{ fontWeight: 600 }}>{c.title}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {c.items.map((i) => (
                <Box key={i.name} sx={{ mb: 1.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {i.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {i.detail}
                  </Typography>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Stack>
  )
}

function Stat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <Box sx={{ flex: 1, bgcolor: emphasis ? 'action.selected' : 'action.hover', borderRadius: 3, p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  )
}

/** Thin segmented bar (8px, rounded ends, 2px surface gaps). Figures live in the list beside it. */
function SegmentedBar({ parts, total }: { parts: RewardPart[]; total: number }) {
  const visible = parts.filter((p) => p.amount > 0)
  return (
    <Box role="img" aria-label={visible.map((p) => `${p.label} ${formatGBP(p.amount)} (${Math.round((p.amount / total) * 100)}%)`).join(', ')} sx={{ display: 'flex', gap: '2px', height: 8 }}>
      {visible.map((p, i) => (
        <Box
          key={p.id}
          title={`${p.label}: ${formatGBP(p.amount)} (${Math.round((p.amount / total) * 100)}%)`}
          sx={(t) => ({
            flexGrow: p.amount,
            flexBasis: 0,
            minWidth: 4,
            bgcolor: partColors[p.id].light,
            ...t.applyStyles('dark', { bgcolor: partColors[p.id].dark }),
            borderTopLeftRadius: i === 0 ? 4 : 0,
            borderBottomLeftRadius: i === 0 ? 4 : 0,
            borderTopRightRadius: i === visible.length - 1 ? 4 : 0,
            borderBottomRightRadius: i === visible.length - 1 ? 4 : 0,
          })}
        />
      ))}
    </Box>
  )
}
