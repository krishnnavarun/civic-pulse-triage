import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { triage } from './triage'
import { createComplaintId } from './complaints'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('civic triage', () => {
  it('classifies urgent road reports as high priority', () => {
    expect(triage('The bridge is collapsed and may cause an accident', 'Roads')).toEqual({
      severity: 'High',
      department: 'Public Works Department',
    })
  })

  it('allows a citizen to submit and receive a triage result', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: /report an issue/i })[0])
    await user.type(screen.getByLabelText(/issue title/i), 'Broken road barrier')
    await user.type(screen.getByLabelText(/describe the issue/i), 'A large barrier is blocking the lane')
    await user.type(screen.getByPlaceholderText(/street, landmark, or area/i), 'Central Avenue')
    await user.click(screen.getByRole('button', { name: /submit complaint/i }))

    expect(screen.getByText('Complaint submitted')).toBeTruthy()
    expect(screen.getByText('Public Works Department')).toBeTruthy()
  })

  it('creates increasing complaint identifiers', () => {
    expect(createComplaintId([{ id: 'CP-1048' }, { id: 'CP-1051' }])).toBe('CP-1052')
  })
})
