import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest doesn't expose globals, so Testing Library can't auto-clean between tests.
afterEach(() => cleanup())

// jsdom doesn't implement scrolling.
if (typeof window !== 'undefined') window.scrollTo = () => {}
