import { useEffect, useState } from 'react';
import { api, OrdersAnalytics } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    BarChart3,
    Calendar,
    Clock,
    CreditCard,
    RefreshCw,
    TrendingUp,
    Package,
    DollarSign,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Area,
    AreaChart,
} from 'recharts';

// Professional color palette
const CHART_COLORS = {
    primary: '#8b5cf6',    // Purple
    secondary: '#3b82f6',  // Blue
    success: '#10b981',    // Green
    warning: '#f59e0b',    // Orange
    danger: '#ef4444',     // Red
    info: '#06b6d4',       // Cyan
    purple: '#a855f7',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6',
};

const PAYMENT_COLORS: Record<string, string> = {
    cash: CHART_COLORS.success,
    'credit card': CHART_COLORS.primary,
    'debit card': CHART_COLORS.secondary,
    'mobile pay': CHART_COLORS.info,
    unknown: '#9ca3af',
};

interface InventoryUsageMetric {
    inventoryItemId: string;
    inventoryItemName: string;
    unit: string;
    totalQuantityUsed: number;
    transactionCount: number;
    averagePerTransaction: number;
    costOfUsage: number;
}

export default function SalesVisualizations() {
    const [activeTab, setActiveTab] = useState('hourly');
    const [analytics, setAnalytics] = useState<OrdersAnalytics | null>(null);
    const [inventoryUsage, setInventoryUsage] = useState<InventoryUsageMetric[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'custom'>('7d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadVisualizationData();
    }, [dateRange, customFrom, customTo]);

    const loadVisualizationData = async () => {
        try {
            setLoading(true);
            const options = dateRange === 'custom' 
                ? { type: dateRange, from: customFrom, to: customTo }
                : { type: dateRange };
            
            const [analyticsData, inventoryUsageData] = await Promise.all([
                api.getOrdersAnalytics(options),
                api.getInventoryUsageAnalytics(options).catch(err => {
                    console.warn('Failed to load inventory usage:', err);
                    return [];
                }),
            ]);
            
            setAnalytics(analyticsData);
            setInventoryUsage(inventoryUsageData);
        } catch (error: any) {
            console.error('Error loading visualizations:', error);
            toast({
                title: 'Error Loading Visualizations',
                description: error.message || 'Failed to fetch data',
                variant: 'destructive',
            });
            setAnalytics(null);
            setInventoryUsage([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-foreground mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.name.includes('$') || entry.name.includes('Revenue') || entry.name.includes('Sales') 
                                ? formatCurrency(entry.value) 
                                : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Timeframe Selection */}
            <Card className="p-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Label>Timeframe</Label>
                        <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24h">Last 24 Hours</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {dateRange === 'custom' && (
                        <>
                            <div>
                                <Label>From</Label>
                                <Input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>To</Label>
                                <Input
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <Button onClick={loadVisualizationData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* Visualization Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 mb-6 flex-wrap h-auto">
                    <TabsTrigger value="hourly" className="data-[state=active]:bg-primary/10">
                        <Clock className="h-4 w-4 mr-2" />
                        Hourly Sales
                    </TabsTrigger>
                    <TabsTrigger value="dayofweek" className="data-[state=active]:bg-primary/10">
                        <Calendar className="h-4 w-4 mr-2" />
                        Day of Week
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="data-[state=active]:bg-primary/10">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payments
                    </TabsTrigger>
                    <TabsTrigger value="topitems" className="data-[state=active]:bg-primary/10">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Top Items
                    </TabsTrigger>
                    <TabsTrigger value="productusage" className="data-[state=active]:bg-primary/10">
                        <Package className="h-4 w-4 mr-2" />
                        Inventory Usage
                    </TabsTrigger>
                    <TabsTrigger value="salesreport" className="data-[state=active]:bg-primary/10">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Sales Report
                    </TabsTrigger>
                </TabsList>

                {/* Hourly Sales Tab */}
                <TabsContent value="hourly" className="space-y-4">
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Hourly Sales Performance</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Sales breakdown by hour of day
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-3 text-muted-foreground">Loading data...</span>
                            </div>
                        ) : !analytics || analytics.hourly.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-xl font-semibold">No hourly data available</p>
                                <p className="text-muted-foreground mt-2">Try selecting a different time range</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Peak Hour Sales</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(Math.max(...analytics.hourly.map(h => h.total)))}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Peak Hour</p>
                                                <p className="text-2xl font-bold">
                                                    {analytics.hourly.reduce((max, h) => h.total > max.total ? h : max).hour}:00
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Avg Hourly Sales</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(analytics.hourly.reduce((sum, h) => sum + h.total, 0) / analytics.hourly.length)}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Bar Chart */}
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={analytics.hourly.map(h => ({
                                                hour: `${h.hour.toString().padStart(2, '0')}:00`,
                                                'Sales ($)': h.total,
                                                'Orders': h.orders,
                                            }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis 
                                                dataKey="hour" 
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis yAxisId="left" stroke={CHART_COLORS.primary} />
                                            <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.secondary} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar yAxisId="left" dataKey="Sales ($)" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                                            <Bar yAxisId="right" dataKey="Orders" fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Area Chart Alternative */}
                                <div className="h-96 mt-8">
                                    <h3 className="text-lg font-semibold mb-4">Sales Trend by Hour</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={analytics.hourly.map(h => ({
                                                hour: `${h.hour.toString().padStart(2, '0')}:00`,
                                                'Sales': h.total,
                                            }))}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis 
                                                dataKey="hour" 
                                                angle={-45}
                                                textAnchor="end"
                                                height={70}
                                            />
                                            <YAxis />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="Sales" 
                                                stroke={CHART_COLORS.primary} 
                                                fillOpacity={1} 
                                                fill="url(#colorSales)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* Day of Week Tab */}
                <TabsContent value="dayofweek" className="space-y-4">
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Sales by Day of Week</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Performance comparison across days of the week
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !analytics || analytics.dayOfWeek.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-xl font-semibold">No day of week data available</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                                        <p className="text-sm text-muted-foreground mb-1">Best Day</p>
                                        <p className="text-2xl font-bold">
                                            {analytics.dayOfWeek.reduce((max, d) => d.total > max.total ? d : max).dow}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatCurrency(Math.max(...analytics.dayOfWeek.map(d => d.total)))}
                                        </p>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                                        <p className="text-sm text-muted-foreground mb-1">Slowest Day</p>
                                        <p className="text-2xl font-bold">
                                            {analytics.dayOfWeek.reduce((min, d) => d.total < min.total ? d : min).dow}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatCurrency(Math.min(...analytics.dayOfWeek.map(d => d.total)))}
                                        </p>
                                    </Card>
                                </div>

                                {/* Bar Chart */}
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={analytics.dayOfWeek.map(d => ({
                                                day: d.dow,
                                                'Total Sales ($)': d.total,
                                                'Orders': d.orders,
                                            }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="day" />
                                            <YAxis yAxisId="left" stroke={CHART_COLORS.success} />
                                            <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.info} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="Total Sales ($)" fill={CHART_COLORS.success} radius={[8, 8, 0, 0]} />
                                            <Bar yAxisId="right" dataKey="Orders" fill={CHART_COLORS.info} radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Radar Chart */}
                                <div className="h-96 mt-8">
                                    <h3 className="text-lg font-semibold mb-4">Weekly Performance Radar</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={analytics.dayOfWeek.map(d => ({
                                            day: d.dow,
                                            sales: d.total,
                                        }))}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="day" />
                                            <PolarRadiusAxis />
                                            <Radar 
                                                name="Sales" 
                                                dataKey="sales" 
                                                stroke={CHART_COLORS.primary} 
                                                fill={CHART_COLORS.primary} 
                                                fillOpacity={0.6} 
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments" className="space-y-4">
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Payment Method Breakdown</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Distribution of sales by payment type
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !analytics || Object.keys(analytics.paymentBreakdown).length === 0 ? (
                            <div className="text-center py-12">
                                <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-xl font-semibold">No payment data available</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {Object.entries(analytics.paymentBreakdown).map(([method, data]) => (
                                        <Card key={method} className="p-4">
                                            <p className="text-sm text-muted-foreground capitalize">{method}</p>
                                            <p className="text-xl font-bold mt-1">{formatCurrency(data.amount)}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{data.count} transactions</p>
                                        </Card>
                                    ))}
                                </div>

                                {/* Pie Chart */}
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(analytics.paymentBreakdown).map(([method, data]) => ({
                                                    name: method.charAt(0).toUpperCase() + method.slice(1),
                                                    value: data.amount,
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {Object.keys(analytics.paymentBreakdown).map((method, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={PAYMENT_COLORS[method.toLowerCase()] || Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} 
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Bar Chart */}
                                <div className="h-80 mt-8">
                                    <h3 className="text-lg font-semibold mb-4">Transaction Volume by Payment Method</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={Object.entries(analytics.paymentBreakdown).map(([method, data]) => ({
                                                method: method.charAt(0).toUpperCase() + method.slice(1),
                                                'Amount': data.amount,
                                                'Count': data.count,
                                            }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="method" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="Amount" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                                            <Bar yAxisId="right" dataKey="Count" fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* Top Items Tab */}
                <TabsContent value="topitems" className="space-y-4">
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Top Selling Items</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Best performing menu items by revenue and quantity
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !analytics || analytics.topItems.length === 0 ? (
                            <div className="text-center py-12">
                                <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-xl font-semibold">No item data available</p>
                            </div>
                        ) : (
                            <>
                                {/* Top 3 Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {analytics.topItems.slice(0, 3).map((item, idx) => (
                                        <Card 
                                            key={item.name} 
                                            className={`p-4 ${
                                                idx === 0 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900' :
                                                idx === 1 ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900' :
                                                'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">#{idx + 1} Best Seller</p>
                                                    <p className="text-lg font-bold mt-1">{item.name}</p>
                                                    <p className="text-sm mt-2">Revenue: {formatCurrency(item.revenue)}</p>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="text-3xl">
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Horizontal Bar Chart */}
                                <div className="h-[600px]">
                                    <h3 className="text-lg font-semibold mb-4">Top 15 Items by Revenue</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={analytics.topItems.slice(0, 15).reverse()}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={110} style={{ fontSize: '12px' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[0, 8, 8, 0]}>
                                                {analytics.topItems.slice(0, 15).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Quantity vs Revenue Scatter */}
                                <div className="h-96 mt-8">
                                    <h3 className="text-lg font-semibold mb-4">Quantity Sold vs Revenue (Top 20)</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={analytics.topItems.slice(0, 20).map(item => ({
                                                name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
                                                'Revenue': item.revenue,
                                                'Quantity': item.quantity,
                                            }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis 
                                                dataKey="name" 
                                                angle={-45}
                                                textAnchor="end"
                                                height={120}
                                                style={{ fontSize: '11px' }}
                                            />
                                            <YAxis yAxisId="left" stroke={CHART_COLORS.primary} />
                                            <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.secondary} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="Revenue" fill={CHART_COLORS.primary} />
                                            <Bar yAxisId="right" dataKey="Quantity" fill={CHART_COLORS.secondary} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* Product Usage Tab - Now shows Inventory Usage */}
                <TabsContent value="productusage" className="space-y-4">
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Inventory Item Usage Analytics</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Detailed breakdown of inventory item consumption and usage statistics
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !inventoryUsage || inventoryUsage.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-xl font-semibold">No inventory usage data available</p>
                                <p className="text-muted-foreground mt-2">Try selecting a different time range</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                                        <div className="flex items-center gap-3">
                                            <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Items Used</p>
                                                <p className="text-2xl font-bold">{inventoryUsage.length}</p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Transactions</p>
                                                <p className="text-2xl font-bold">
                                                    {inventoryUsage.reduce((sum, item) => sum + item.transactionCount, 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Cost</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(inventoryUsage.reduce((sum, item) => sum + item.costOfUsage, 0))}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Most Used Item</p>
                                                <p className="text-lg font-bold">
                                                    {inventoryUsage[0]?.inventoryItemName || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Top Inventory Items by Quantity Used */}
                                <div className="h-[500px] mb-8">
                                    <h3 className="text-lg font-semibold mb-4">Top Inventory Items by Quantity Used</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={inventoryUsage.slice(0, 15).map(item => ({
                                                name: item.inventoryItemName.length > 20 
                                                    ? item.inventoryItemName.substring(0, 20) + '...' 
                                                    : item.inventoryItemName,
                                                'Quantity Used': item.totalQuantityUsed,
                                                'Transactions': item.transactionCount,
                                            }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis 
                                                dataKey="name" 
                                                angle={-45}
                                                textAnchor="end"
                                                height={120}
                                                style={{ fontSize: '11px' }}
                                            />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="Quantity Used" fill={CHART_COLORS.info} radius={[8, 8, 0, 0]} />
                                            <Bar yAxisId="right" dataKey="Transactions" fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Cost of Usage Chart */}
                                <div className="h-[500px] mb-8">
                                    <h3 className="text-lg font-semibold mb-4">Cost of Inventory Usage</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={inventoryUsage.slice(0, 15).map(item => ({
                                                name: item.inventoryItemName.length > 20 
                                                    ? item.inventoryItemName.substring(0, 20) + '...' 
                                                    : item.inventoryItemName,
                                                'Cost': item.costOfUsage,
                                            }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis 
                                                dataKey="name" 
                                                angle={-45}
                                                textAnchor="end"
                                                height={120}
                                                style={{ fontSize: '11px' }}
                                            />
                                            <YAxis />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="Cost" fill={CHART_COLORS.warning} radius={[8, 8, 0, 0]}>
                                                {inventoryUsage.slice(0, 15).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Usage Distribution Pie Chart */}
                                <div className="h-96 mt-8">
                                    <h3 className="text-lg font-semibold mb-4">Usage Distribution (Top 10 Items)</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={inventoryUsage.slice(0, 10).map(item => ({
                                                    name: item.inventoryItemName,
                                                    value: item.totalQuantityUsed,
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={(entry) => `${entry.name}: ${entry.value.toFixed(1)} ${inventoryUsage.find(i => i.inventoryItemName === entry.name)?.unit || ''}`}
                                                outerRadius={120}
                                                dataKey="value"
                                            >
                                                {inventoryUsage.slice(0, 10).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Detailed Table */}
                                <div className="mt-8">
                                    <h3 className="text-lg font-semibold mb-4">Detailed Inventory Usage Statistics</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3 font-semibold">Inventory Item</th>
                                                    <th className="text-right p-3 font-semibold">Total Quantity Used</th>
                                                    <th className="text-right p-3 font-semibold">Unit</th>
                                                    <th className="text-right p-3 font-semibold">Transactions</th>
                                                    <th className="text-right p-3 font-semibold">Avg per Transaction</th>
                                                    <th className="text-right p-3 font-semibold">Total Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inventoryUsage.map((item, index) => (
                                                    <tr key={item.inventoryItemId} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                                                        <td className="p-3 font-medium">{item.inventoryItemName}</td>
                                                        <td className="p-3 text-right">{item.totalQuantityUsed.toFixed(2)}</td>
                                                        <td className="p-3 text-right text-muted-foreground">{item.unit}</td>
                                                        <td className="p-3 text-right">{item.transactionCount}</td>
                                                        <td className="p-3 text-right">{item.averagePerTransaction.toFixed(2)} {item.unit}</td>
                                                        <td className="p-3 text-right font-semibold">{formatCurrency(item.costOfUsage)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* Sales Report Tab */}
                <TabsContent value="salesreport" className="space-y-4">
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Comprehensive Sales Report</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Overall sales trends and performance metrics
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !analytics || analytics.daily.length === 0 ? (
                            <div className="text-center py-12">
                                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-xl font-semibold">No sales data available</p>
                            </div>
                        ) : (
                            <>
                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(analytics.daily.reduce((sum, d) => sum + d.total, 0))}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                                <p className="text-2xl font-bold">
                                                    {analytics.daily.reduce((sum, d) => sum + d.orders, 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(
                                                        analytics.daily.reduce((sum, d) => sum + d.total, 0) /
                                                        analytics.daily.reduce((sum, d) => sum + d.orders, 0)
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Days Analyzed</p>
                                                <p className="text-2xl font-bold">
                                                    {analytics.daily.length}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Daily Sales Trend */}
                                <div className="h-96">
                                    <h3 className="text-lg font-semibold mb-4">Daily Sales Trend</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={analytics.daily.map(d => ({
                                                date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                                'Sales': d.total,
                                                'Orders': d.orders,
                                            }))}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis 
                                                dataKey="date" 
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis yAxisId="left" stroke={CHART_COLORS.primary} />
                                            <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.secondary} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Line 
                                                yAxisId="left" 
                                                type="monotone" 
                                                dataKey="Sales" 
                                                stroke={CHART_COLORS.primary} 
                                                strokeWidth={3}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line 
                                                yAxisId="right" 
                                                type="monotone" 
                                                dataKey="Orders" 
                                                stroke={CHART_COLORS.secondary} 
                                                strokeWidth={3}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Combined Area Chart */}
                                <div className="h-96 mt-8">
                                    <h3 className="text-lg font-semibold mb-4">Sales Performance Over Time</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={analytics.daily.map(d => ({
                                                date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                                'Revenue': d.total,
                                            }))}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis 
                                                dataKey="date" 
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="Revenue" 
                                                stroke={CHART_COLORS.success} 
                                                strokeWidth={2}
                                                fillOpacity={1} 
                                                fill="url(#colorRevenue)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

