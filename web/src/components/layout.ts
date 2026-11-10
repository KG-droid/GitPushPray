/** Phone column width; also the sheet width on every screen size. */
export const PHONE_WIDTH = 440
/** Left navigation rail shown from the md breakpoint up (joiner view only). */
export const SIDEBAR_WIDTH = 240
/** Width of the content column on desktop. */
export const CONTENT_WIDTH = 960
/** Chat and Ask stay a readable width even though the page column is wider. */
export const CHAT_WIDTH = 760

/** sx for a composer pinned to the bottom: above the tabs on phones, centred in the content area beside the rail on desktop. */
export const pinnedComposerSx = {
  position: 'fixed',
  // Equal side gaps centre the capped column. Auto margins don't work here: a parent Stack resets its children's margins to 0.
  left: { xs: `max(0px, calc((100% - ${PHONE_WIDTH}px) / 2))`, md: `calc(${SIDEBAR_WIDTH}px + max(0px, (100% - ${SIDEBAR_WIDTH}px - ${CHAT_WIDTH}px) / 2))` },
  right: { xs: `max(0px, calc((100% - ${PHONE_WIDTH}px) / 2))`, md: `max(0px, calc((100% - ${SIDEBAR_WIDTH}px - ${CHAT_WIDTH}px) / 2))` },
  bottom: { xs: 'calc(56px + env(safe-area-inset-bottom))', md: 0 },
} as const

/** A list of cards: one column on phones, two from md up. */
export const cardGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
  gap: 1.25,
} as const
