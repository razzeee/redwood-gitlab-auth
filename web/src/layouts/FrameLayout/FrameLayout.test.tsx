import { render } from '@redwoodjs/testing/web'

import FrameLayout from './FrameLayout'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('FrameLayout', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<FrameLayout />)
    }).not.toThrow()
  })
})
