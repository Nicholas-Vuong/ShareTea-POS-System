import React from 'react'

function Cart ({ items, onIncrement, onDecrement, onRemove, total }) {
  if (items.length === 0) {
    return (
      <section aria-label="Shopping cart" className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
        Your cart is empty. Add a drink to get started.
      </section>
    )
  }

  return (
    <section aria-label="Shopping cart" className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Cart</h2>
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-slate-500">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded border px-2 py-1" aria-label={`Decrease quantity for ${item.name}`} onClick={() => onDecrement(item.id)}>
                -
              </button>
              <span aria-live="polite" className="min-w-[2rem] text-center">{item.quantity}</span>
              <button type="button" className="rounded border px-2 py-1" aria-label={`Increase quantity for ${item.name}`} onClick={() => onIncrement(item.id)}>
                +
              </button>
              <button type="button" className="rounded border px-2 py-1 text-sm text-red-600" onClick={() => onRemove(item.id)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-semibold">${total.toFixed(2)}</span>
      </div>
    </section>
  )
}

export default Cart
