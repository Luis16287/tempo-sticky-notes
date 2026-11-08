import { describe, expect, it } from 'vitest'
import { pickSkeletonLayout } from './skeletonLayout.ts'

describe('pickSkeletonLayout', () => {
  it('picks one of the three boards', () => {
    expect(pickSkeletonLayout(0)).toHaveLength(3)
    expect(pickSkeletonLayout(1)).toHaveLength(5)
    expect(pickSkeletonLayout(2)).toHaveLength(6)
  })
})
