import { useState } from 'react'
import { Box, Card, CardContent, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { glossary } from '../../data/glossary'
import { searchGlossary } from '../../domain/glossary'
import { SubPageHeader } from './SubPageHeader'

/** Every term the app explains, searchable. */
export function GlossaryPage() {
  const [query, setQuery] = useState('')
  const terms = searchGlossary(glossary, query)

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title="Jargon buster" subtitle="Banks love an acronym. Here is what they mean." />
      <TextField
        fullWidth
        type="search"
        placeholder="Search, e.g. DBS or pension"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        slotProps={{
          htmlInput: { 'aria-label': 'Search terms' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded />
              </InputAdornment>
            ),
          },
        }}
      />
      {terms.length === 0 ? (
        <Typography color="text.secondary">
          Nothing matches “{query}”. Try the Ask tab, or ask your buddy: no question is too small.
        </Typography>
      ) : (
        <Box component="ul" aria-label="Terms" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 1.25 }}>
          {terms.map((t) => (
            <Card component="li" key={t.id}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
                  {t.term}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.meaning}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  )
}
