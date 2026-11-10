import { Fragment, useState } from 'react'
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { useNavigate } from 'react-router-dom'
import { glossary, type GlossaryTerm } from '../data/glossary'
import { splitGlossary } from '../domain/glossary'

/** Text in which the first mention of any bank jargon can be tapped for a plain-English explanation. */
export function GlossaryText({ text }: { text: string }) {
  const [open, setOpen] = useState<GlossaryTerm | null>(null)
  const navigate = useNavigate()

  return (
    <>
      {splitGlossary(text, glossary).map((s, i) =>
        'term' in s ? (
          <Box
            key={i}
            component="button"
            type="button"
            aria-haspopup="dialog"
            onClick={() => setOpen(s.term)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              color: 'primary.main',
              textDecoration: 'underline dotted',
              textUnderlineOffset: 3,
              borderRadius: 0.5,
              '&:focus-visible': { outline: 2, outlineStyle: 'solid', outlineColor: 'primary.main' },
            }}
          >
            {s.text}
          </Box>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        ),
      )}
      <Drawer
        anchor="bottom"
        open={!!open}
        onClose={() => setOpen(null)}
        slotProps={{ paper: { sx: { maxWidth: 440, mx: 'auto', borderTopLeftRadius: 24, borderTopRightRadius: 24 } } }}
      >
        {open && (
          <Box sx={{ p: 3, pb: 'calc(24px + env(safe-area-inset-bottom))' }} role="dialog" aria-label={`What is ${open.term}?`}>
            <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="overline" color="text.secondary">
                Jargon buster
              </Typography>
              <IconButton aria-label="Close" edge="end" onClick={() => setOpen(null)}>
                <CloseRounded />
              </IconButton>
            </Stack>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              {open.term}
            </Typography>
            <Typography sx={{ mb: 2.5 }}>{open.meaning}</Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setOpen(null)
                navigate('/explore/glossary')
              }}
            >
              See all terms
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  )
}
