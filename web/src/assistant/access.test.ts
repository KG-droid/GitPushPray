import { beforeEach, describe, expect, it } from 'vitest'
import { accessHeaders, captureAccessCode } from './access'

describe('access code', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('has no header until a code has been seen', () => {
    expect(accessHeaders()).toEqual({})
  })

  it('keeps the code from the link and removes it from the address bar', () => {
    window.history.replaceState(null, '', '/today?k=abc123&x=1')
    captureAccessCode()
    expect(accessHeaders()).toEqual({ 'X-Demo-Key': 'abc123' })
    expect(window.location.search).toBe('?x=1')
  })

  it('keeps using the code on later visits without the link', () => {
    window.history.replaceState(null, '', '/?k=abc123')
    captureAccessCode()
    window.history.replaceState(null, '', '/journey')
    captureAccessCode()
    expect(accessHeaders()).toEqual({ 'X-Demo-Key': 'abc123' })
  })
})
