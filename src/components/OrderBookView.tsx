import { memo } from 'react';
import type { OrderBook } from '@/types';
import { formatPrice } from '@/utils/format';

interface OrderBookViewProps {
  book: OrderBook;
}

function OrderBookViewInner({ book }: OrderBookViewProps) {
  const maxBidSize = Math.max(...book.bids.map((b) => b.size), 1);
  const maxAskSize = Math.max(...book.asks.map((a) => a.size), 1);

  const midPrice = book.bids[0] && book.asks[0]
    ? (book.bids[0].price + book.asks[0].price) / 2
    : 0;
  const spread = book.asks[0] && book.bids[0]
    ? book.asks[0].price - book.bids[0].price
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-3 px-3 py-1.5 text-[9px] font-mono text-brand-ash uppercase tracking-wider border-b border-glass-border">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Depth</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col-reverse">
        {book.asks.slice(0, 8).map((ask, i) => (
          <div
            key={`ask-${i}`}
            className="grid grid-cols-3 px-3 py-0.5 text-[10px] font-mono tabular-nums relative"
          >
            <div
              className="absolute top-0 right-0 h-full rounded-l-sm bg-[rgba(255,59,48,0.08)]"
              style={{ width: `${(ask.size / maxAskSize) * 100}%` }}
            />
            <span className="text-brand-coral relative z-10">{formatPrice(ask.price)}</span>
            <span className="text-right text-brand-silver/60 relative z-10">{ask.size.toFixed(0)}</span>
            <span className="text-right text-brand-ash/40 relative z-10">
              {(ask.size * ask.price).toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      <div className="px-3 py-1.5 border-y border-glass-border bg-[rgba(41,151,255,0.04)] flex items-center justify-between">
        <span className="text-[9px] font-mono text-brand-ash">Spread</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-brand-silver tabular-nums">{formatPrice(midPrice)}</span>
          <span className="text-[9px] font-mono text-brand-ash tabular-nums">{formatPrice(spread)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {book.bids.slice(0, 8).map((bid, i) => (
          <div
            key={`bid-${i}`}
            className="grid grid-cols-3 px-3 py-0.5 text-[10px] font-mono tabular-nums relative"
          >
            <div
              className="absolute top-0 right-0 h-full rounded-l-sm bg-[rgba(48,213,200,0.08)]"
              style={{ width: `${(bid.size / maxBidSize) * 100}%` }}
            />
            <span className="text-brand-mint relative z-10">{formatPrice(bid.price)}</span>
            <span className="text-right text-brand-silver/60 relative z-10">{bid.size.toFixed(0)}</span>
            <span className="text-right text-brand-ash/40 relative z-10">
              {(bid.size * bid.price).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const OrderBookView = memo(OrderBookViewInner);
