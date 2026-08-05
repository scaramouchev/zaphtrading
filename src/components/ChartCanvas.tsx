import { useEffect, useRef, memo } from 'react';
import type { Candle } from '@/types';

interface ChartCanvasProps {
  candles: Candle[];
  height?: number;
}

const UP_COLOR = 'rgba(48, 213, 200, 0.85)';
const DOWN_COLOR = 'rgba(255, 59, 48, 0.85)';
const UP_WICK = 'rgba(48, 213, 200, 0.5)';
const DOWN_WICK = 'rgba(255, 59, 48, 0.5)';
const GRID_COLOR = 'rgba(255, 255, 255, 0.03)';
const LABEL_COLOR = 'rgba(134, 134, 139, 0.6)';

function ChartCanvasInner({ candles, height = 280 }: ChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padding = { top: 16, right: 76, bottom: 28, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxPrice = Math.max(...candles.map((c) => c.high));
    const minPrice = Math.min(...candles.map((c) => c.low));
    const range = maxPrice - minPrice || 0.0001;
    const paddedMin = minPrice - range * 0.1;
    const paddedMax = maxPrice + range * 0.1;
    const paddedRange = paddedMax - paddedMin;

    const candleWidth = chartW / candles.length;
    const candleBody = Math.max(2, candleWidth * 0.6);
    const priceToY = (p: number) =>
      padding.top + chartH - ((p - paddedMin) / paddedRange) * chartH;

    // Grid lines + price axis labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const labelCount = 5;
    for (let i = 0; i <= labelCount; i++) {
      const price = paddedMin + (paddedRange * i) / labelCount;
      const y = priceToY(price);
      ctx.fillStyle = LABEL_COLOR;
      ctx.fillText(price.toFixed(price >= 1 ? 2 : 6), w - padding.right + 8, y);
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Candles
    candles.forEach((c, i) => {
      const x = padding.left + i * candleWidth + candleWidth / 2;
      const isUp = c.close >= c.open;

      // Wick
      ctx.strokeStyle = isUp ? UP_WICK : DOWN_WICK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(c.high));
      ctx.lineTo(x, priceToY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = priceToY(Math.max(c.open, c.close));
      const bodyBottom = priceToY(Math.min(c.open, c.close));
      const bodyH = Math.max(1, bodyBottom - bodyTop);
      ctx.fillStyle = isUp ? UP_COLOR : DOWN_COLOR;
      ctx.fillRect(x - candleBody / 2, bodyTop, candleBody, bodyH);
    });

    // Current price dashed line
    const last = candles[candles.length - 1];
    const lastY = priceToY(last.close);
    const lastIsUp = last.close >= last.open;
    ctx.strokeStyle = lastIsUp ? 'rgba(48,213,200,0.4)' : 'rgba(255,59,48,0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, lastY);
    ctx.lineTo(w - padding.right, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price tag badge
    const badgeBg = lastIsUp ? 'rgba(48,213,200,0.15)' : 'rgba(255,59,48,0.15)';
    ctx.fillStyle = badgeBg;
    ctx.fillRect(w - padding.right, lastY - 9, padding.right - 4, 18);
    ctx.fillStyle = lastIsUp ? '#30D5C8' : '#FF3B30';
    ctx.fillText(
      last.close >= 1 ? last.close.toFixed(2) : last.close.toFixed(6),
      w - padding.right + 6,
      lastY,
    );

    // Volume bars at bottom
    const maxVol = Math.max(...candles.map((c) => c.volume));
    const volH = 28;
    candles.forEach((c, i) => {
      const x = padding.left + i * candleWidth + candleWidth / 2;
      const barH = (c.volume / maxVol) * volH;
      const isUp = c.close >= c.open;
      ctx.fillStyle = isUp ? 'rgba(48,213,200,0.10)' : 'rgba(255,59,48,0.10)';
      ctx.fillRect(x - candleBody / 2, h - padding.bottom - barH, candleBody, barH);
    });
  }, [candles, height]);

  return (
    <div ref={containerRef} className="relative w-full no-select" style={{ height }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

export const ChartCanvas = memo(ChartCanvasInner);
