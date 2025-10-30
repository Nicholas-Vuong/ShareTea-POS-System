import React from 'react'

function MenuItemCard ({ item, onAdd }) {
  return (
    <article className="flex h-full flex-col justify-between rounded-lg border bg-white p-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-secondary">
      <div>
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="text-sm text-slate-600">{item.description ?? 'Tasty Sharetea drink.'}</p>
        <p className="mt-2 text-brand-primary font-semibold">${Number(item.price).toFixed(2)}</p>
        <p className="text-xs uppercase tracking-wide text-slate-400">{item.category}</p>
      </div>
      <button
        type="button"
        className="mt-4 w-full rounded bg-brand-primary px-3 py-2 text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => onAdd(item)}
        disabled={!item.is_available}
      >
        {item.is_available ? 'Add to Cart' : 'Sold Out'}
      </button>
    </article>
  )
}

export default MenuItemCard
