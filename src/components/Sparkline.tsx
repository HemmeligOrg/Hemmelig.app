interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}

export function Sparkline({
    data,
    width = 80,
    height = 24,
    color = 'currentColor',
    className = '',
}: SparklineProps) {
    if (data.length === 0) return null;

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data
        .map((value, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
            const y = padding + chartHeight - ((value - min) / range) * chartHeight;
            return `${x},${y}`;
        })
        .join(' ');

    // Create fill polygon by closing the path along the bottom
    const fillPoints =
        `${padding},${padding + chartHeight} ` +
        points +
        ` ${padding + chartWidth},${padding + chartHeight}`;

    return (
        <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
            <polygon points={fillPoints} fill={color} fillOpacity={0.15} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
