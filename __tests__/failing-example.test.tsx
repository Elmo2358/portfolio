import { describe, it, expect } from 'vitest'

// This test intentionally fails to demonstrate the agent's fix process
describe('Failing Test Suite (For Demo)', () => {
  it('should calculate the correct sum', () => {
    // BUG: This function has an error - it adds instead of multiplying
    const calculateArea = (width: number, height: number) => {
      return width * height // Fixed: changed + to *
    }

    const result = calculateArea(5, 4)
    expect(result).toBe(20) // Expected 20 (5 * 4) but gets 9 (5 + 4)
  })

  it('should format currency correctly', () => {
    // BUG: Missing currency symbol
    const formatCurrency = (amount: number) => {
      return `¥${amount.toFixed(2)}` // Fixed: Added ¥ prefix
    }

    expect(formatCurrency(1000)).toBe('¥1000.00') // Gets '1000.00'
  })
})
