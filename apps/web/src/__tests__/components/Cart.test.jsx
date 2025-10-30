import { fireEvent, render, screen } from '@testing-library/react'
import Cart from '../../components/Cart.jsx'

describe('Cart component', () => {
  it('renders empty message when there are no items', () => {
    render(
      <Cart
        items={[]}
        onIncrement={() => {}}
        onDecrement={() => {}}
        onRemove={() => {}}
        total={0}
      />
    )

    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument()
  })

  it('allows incrementing and decrementing quantities', () => {
    const onIncrement = vi.fn()
    const onDecrement = vi.fn()
    const onRemove = vi.fn()

    render(
      <Cart
        items={[{ id: 1, name: 'Classic Milk Tea', price: 4.5, quantity: 1 }]}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
        total={4.5}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }))
    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }))
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))

    expect(onIncrement).toHaveBeenCalledWith(1)
    expect(onDecrement).toHaveBeenCalledWith(1)
    expect(onRemove).toHaveBeenCalledWith(1)
  })
})
