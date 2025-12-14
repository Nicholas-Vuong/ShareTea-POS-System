import { Fragment, useEffect, useState } from 'react';
import { api, OrdersAnalytics, InventoryItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Calendar, 
    DollarSign, 
    ShoppingCart, 
    TrendingUp, 
    Package, 
    FileText,
    RefreshCw,
    Download,
    Clock,
    BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface RestockItem {
    name: string;
    onHand: number;
    reorderPoint: number;
    needed: number;
    costPerUnit: number;
    reorderCost: number;
}

export default function Reports() {
    const [activeReport, setActiveReport] = useState('summary');
    const [analytics, setAnalytics] = useState<OrdersAnalytics | null>(null);
    const [restockItems, setRestockItems] = useState<RestockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'custom'>('7d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadReportData();
    }, [dateRange, customFrom, customTo]);

    useEffect(() => {
        if (activeReport === 'restock') {
            loadRestockData();
        }
    }, [activeReport]);

    const loadReportData = async () => {
        try {
            setLoading(true);
            const options = dateRange === 'custom' 
                ? { type: dateRange, from: customFrom, to: customTo }
                : { type: dateRange };
            
            const data = await api.getOrdersAnalytics(options);
            setAnalytics(data);
        } catch (error: any) {
            console.error('Error loading reports:', error);
            toast({
                title: 'Error Loading Reports',
                description: error.message || 'Failed to fetch orders',
                variant: 'destructive',
            });
            // Set empty analytics to prevent crashes
            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    };

    const loadRestockData = async () => {
        try {
            setLoading(true);
            const inventory = await api.getAllInventoryItems();
            
            // Calculate restock needs
            const restock = inventory
                .filter(item => item.onHandQuantity < item.reorderPoint)
                .map(item => ({
                    name: item.name,
                    onHand: item.onHandQuantity,
                    reorderPoint: item.reorderPoint,
                    needed: item.reorderPoint - item.onHandQuantity,
                    costPerUnit: item.costPerUnit || 0,
                    reorderCost: (item.reorderPoint - item.onHandQuantity) * (item.costPerUnit || 0),
                }))
                .sort((a, b) => b.reorderCost - a.reorderCost);
            
            setRestockItems(restock);
        } catch (error: any) {
            console.error('Error loading restock data:', error);
            toast({
                title: 'Error Loading Restock Data',
                description: error.message || 'Failed to fetch inventory',
                variant: 'destructive',
            });
            setRestockItems([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateOnly = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
            Object.values(row).map(val => 
                typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
        );
        
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Date Range Selector */}
            <Card className="p-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Label>Report Period</Label>
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

                    <Button onClick={loadReportData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* Report Tabs */}
            <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 mb-6 flex-wrap h-auto">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-primary/10">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Summary
                    </TabsTrigger>
                    <TabsTrigger value="order-history" className="data-[state=active]:bg-primary/10">
                        <FileText className="h-4 w-4 mr-2" />
                        Order History
                    </TabsTrigger>
                    <TabsTrigger value="top-items" className="data-[state=active]:bg-primary/10">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Top Items
                    </TabsTrigger>
                    <TabsTrigger value="x-report" className="data-[state=active]:bg-primary/10">
                        <Clock className="h-4 w-4 mr-2" />
                        X-Report
                    </TabsTrigger>
                    <TabsTrigger value="z-report" className="data-[state=active]:bg-primary/10">
                        <Calendar className="h-4 w-4 mr-2" />
                        Z-Report
                    </TabsTrigger>
                    <TabsTrigger value="restock" className="data-[state=active]:bg-primary/10">
                        <Package className="h-4 w-4 mr-2" />
                        Restock
                    </TabsTrigger>
                </TabsList>

                {/* Summary Report */}
                <TabsContent value="summary" className="space-y-4">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Business Performance Summary</h2>
                            {analytics && <Badge variant="outline">{analytics.range.label}</Badge>}
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-3 text-muted-foreground">Loading reports...</span>
                            </div>
                        ) : !analytics ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No data available. Please try again.</p>
                            </div>
                        ) : analytics.daily.length === 0 ? (
                            <div className="text-center py-12">
                                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-xl font-semibold">No orders found</p>
                                <p className="text-muted-foreground mt-2">Try selecting a different date range</p>
                            </div>
                        ) : (
                            <>
                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Sales</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(analytics.daily.reduce((sum, d) => sum + d.total, 0))}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                                        <div className="flex items-center gap-3">
                                            <ShoppingCart className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                                            <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Avg Ticket Size</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(
                                                        analytics.daily.reduce((sum, d) => sum + d.total, 0) /
                                                        analytics.daily.reduce((sum, d) => sum + d.orders, 0) || 0
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Best Day</p>
                                                <p className="text-lg font-bold">
                                                    {analytics.daily.length > 0
                                                        ? formatDateOnly(analytics.daily.reduce((max, d) => 
                                                            d.total > max.total ? d : max
                                                        ).date)
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Daily Breakdown */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold">Daily Breakdown</h3>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead className="text-right">Orders</TableHead>
                                                    <TableHead className="text-right">Total Sales</TableHead>
                                                    <TableHead className="text-right">Avg Order Value</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {analytics.daily.map((day) => (
                                                    <TableRow key={day.date}>
                                                        <TableCell className="font-medium">{formatDateOnly(day.date)}</TableCell>
                                                        <TableCell className="text-right">{day.orders}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(day.total)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(day.avgOrderValue)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Hourly Performance */}
                                <div className="space-y-4 mt-6">
                                    <h3 className="text-xl font-semibold">Peak Hours</h3>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Hour</TableHead>
                                                    <TableHead className="text-right">Orders</TableHead>
                                                    <TableHead className="text-right">Sales</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {analytics.hourly
                                                    .sort((a, b) => b.total - a.total)
                                                    .slice(0, 10)
                                                    .map((hour) => (
                                                        <TableRow key={hour.hour}>
                                                            <TableCell className="font-medium">
                                                                {hour.hour.toString().padStart(2, '0')}:00
                                                            </TableCell>
                                                            <TableCell className="text-right">{hour.orders}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(hour.total)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* Order History Report */}
                <TabsContent value="order-history" className="space-y-4">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Order History</h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => analytics && exportToCSV(
                                        analytics.orderHistory.map(o => ({
                                            'Order ID': o.orderId,
                                            'Date': formatDate(o.createdAt),
                                            'Total': o.total,
                                            'Payment Method': o.paymentMethod,
                                            'Status': o.status,
                                        })),
                                        'order_history'
                                    )}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>

                        {analytics && (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead>Payment Method</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analytics.orderHistory.slice(0, 100).map((order) => (
                                            <TableRow key={order.orderId}>
                                                <TableCell className="font-mono">{order.orderId}</TableCell>
                                                <TableCell>{formatDate(order.createdAt)}</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(order.total)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{order.paymentMethod}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}
                                                    >
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {analytics.orderHistory.length > 100 && (
                                    <p className="text-sm text-muted-foreground mt-4 text-center">
                                        Showing first 100 of {analytics.orderHistory.length} orders
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* Top Items Report */}
                <TabsContent value="top-items" className="space-y-4">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Product Mix Report</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Best-selling and underperforming menu items
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => analytics && exportToCSV(
                                    analytics.topItems.map(item => ({
                                        'Item Name': item.name,
                                        'Quantity Sold': item.quantity,
                                        'Revenue': item.revenue,
                                        'Order Count': item.orderCount,
                                    })),
                                    'product_mix'
                                )}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>

                        {analytics && (
                            <>
                                {/* Top Performers */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                                        🏆 Top Performers
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Rank</TableHead>
                                                    <TableHead>Item Name</TableHead>
                                                    <TableHead className="text-right">Quantity Sold</TableHead>
                                                    <TableHead className="text-right">Revenue</TableHead>
                                                    <TableHead className="text-right">Avg Price</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {analytics.topItems.slice(0, 10).map((item, idx) => (
                                                    <TableRow key={item.name}>
                                                        <TableCell className="font-bold">#{idx + 1}</TableCell>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {formatCurrency(item.revenue)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(item.revenue / item.quantity)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Underperformers */}
                                {analytics.topItems.length > 10 && (
                                    <div className="space-y-4 mt-8">
                                        <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                            ⚠️ Low Performers
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Item Name</TableHead>
                                                        <TableHead className="text-right">Quantity Sold</TableHead>
                                                        <TableHead className="text-right">Revenue</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {analytics.topItems.slice(-10).reverse().map((item) => (
                                                        <TableRow key={item.name}>
                                                            <TableCell className="font-medium">{item.name}</TableCell>
                                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(item.revenue)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* X-Report (Snapshot) */}
                <TabsContent value="x-report" className="space-y-4">
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">X-Report (Snapshot)</h2>
                            <p className="text-sm text-muted-foreground mt-2">
                                Real-time summary of activity for the selected period. 
                            </p>
                        </div>

                        {analytics && (
                            <>
                                {/* X-Report Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Total Sales</p>
                                            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {formatCurrency(analytics.xReport.total)}
                                            </p>
                                        </div>
                                    </Card>

                                    <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Order Count</p>
                                            <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                                                {analytics.xReport.orders}
                                            </p>
                                        </div>
                                    </Card>

                                    <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Avg Order Value</p>
                                            <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                                                {formatCurrency(analytics.xReport.avgOrderValue)}
                                            </p>
                                        </div>
                                    </Card>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold">Payment Methods</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Method</TableHead>
                                                <TableHead className="text-right">Transaction Count</TableHead>
                                                <TableHead className="text-right">Total Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Object.entries(analytics.xReport.payments).map(([method, data]) => (
                                                <TableRow key={method}>
                                                    <TableCell className="font-medium capitalize">{method}</TableCell>
                                                    <TableCell className="text-right">{data.count}</TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {formatCurrency(data.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Hourly Activity */}
                                <div className="space-y-4 mt-6">
                                    <h3 className="text-xl font-semibold">Hourly Activity</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Hour</TableHead>
                                                <TableHead className="text-right">Orders</TableHead>
                                                <TableHead className="text-right">Sales</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.xReport.hourly.map((hour) => (
                                                <TableRow key={hour.hour}>
                                                    <TableCell className="font-medium">
                                                        {hour.hour.toString().padStart(2, '0')}:00
                                                    </TableCell>
                                                    <TableCell className="text-right">{hour.orders}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(hour.total)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* Z-Report (End of Day) */}
                <TabsContent value="z-report" className="space-y-4">
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Z-Report (End-of-Day)</h2>
                            <p className="text-sm text-muted-foreground mt-2">
                                Official final summary for the selected period. Critical document for accounting and tax purposes.
                            </p>
                        </div>

                        {analytics && (
                            <>
                                {/* Z-Report Aggregate Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Total Sales</p>
                                            <p className="text-3xl font-bold">
                                                {formatCurrency(analytics.zReport.aggregate.total)}
                                            </p>
                                        </div>
                                    </Card>

                                    <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Total Orders</p>
                                            <p className="text-3xl font-bold">
                                                {analytics.zReport.aggregate.orders}
                                            </p>
                                        </div>
                                    </Card>

                                    <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Avg Order Value</p>
                                            <p className="text-3xl font-bold">
                                                {formatCurrency(analytics.zReport.aggregate.avgOrderValue)}
                                            </p>
                                        </div>
                                    </Card>
                                </div>

                                {/* Payment Summary */}
                                <div className="space-y-4 mb-6">
                                    <h3 className="text-xl font-semibold">Payment Summary</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Payment Method</TableHead>
                                                <TableHead className="text-right">Transactions</TableHead>
                                                <TableHead className="text-right">Total Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Object.entries(analytics.zReport.aggregate.payments).map(([method, data]) => (
                                                <TableRow key={method}>
                                                    <TableCell className="font-medium capitalize">{method}</TableCell>
                                                    <TableCell className="text-right">{data.count}</TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {formatCurrency(data.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Per-Day Breakdown */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold">Daily Breakdown</h3>
                                    {analytics.zReport.perDay.map((day) => (
                                        <Card key={day.date} className="p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-lg font-semibold">{formatDateOnly(day.date)}</h4>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold">{formatCurrency(day.total)}</p>
                                                    <p className="text-sm text-muted-foreground">{day.orders} orders</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium mb-2">Payments</p>
                                                    <div className="space-y-1">
                                                        {Object.entries(day.payments).map(([method, data]) => (
                                                            <div key={method} className="flex justify-between text-sm">
                                                                <span className="capitalize">{method}:</span>
                                                                <span>{formatCurrency(data.amount)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium mb-2">Peak Hours</p>
                                                    <div className="space-y-1">
                                                        {day.hourly
                                                            .sort((a, b) => b.total - a.total)
                                                            .slice(0, 3)
                                                            .map((hour) => (
                                                                <div key={hour.hour} className="flex justify-between text-sm">
                                                                    <span>{hour.hour.toString().padStart(2, '0')}:00</span>
                                                                    <span>{formatCurrency(hour.total)}</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* Restock Report */}
                <TabsContent value="restock" className="space-y-4">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Restock Report</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Items below reorder point requiring restocking
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportToCSV(
                                    restockItems.map(item => ({
                                        'Item Name': item.name,
                                        'On Hand': item.onHand,
                                        'Reorder Point': item.reorderPoint,
                                        'Needed': item.needed,
                                        'Cost Per Unit': item.costPerUnit,
                                        'Reorder Cost': item.reorderCost,
                                    })),
                                    'restock_report'
                                )}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>

                        {restockItems.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="h-16 w-16 mx-auto text-green-500 mb-4" />
                                <p className="text-xl font-semibold text-green-600">All Inventory Levels Good!</p>
                                <p className="text-muted-foreground mt-2">No items currently need restocking</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Card */}
                                <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 mb-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Items Needing Restock</p>
                                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                                {restockItems.length}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Est. Total Cost</p>
                                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                                {formatCurrency(restockItems.reduce((sum, item) => sum + item.reorderCost, 0))}
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Restock Table */}
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item Name</TableHead>
                                                <TableHead className="text-right">On Hand</TableHead>
                                                <TableHead className="text-right">Reorder Point</TableHead>
                                                <TableHead className="text-right">Needed</TableHead>
                                                <TableHead className="text-right">Cost/Unit</TableHead>
                                                <TableHead className="text-right">Est. Reorder Cost</TableHead>
                                                <TableHead className="text-center">Priority</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {restockItems.map((item) => {
                                                const percentBelow = ((item.reorderPoint - item.onHand) / item.reorderPoint) * 100;
                                                const priority = percentBelow > 80 ? 'High' : percentBelow > 50 ? 'Medium' : 'Low';
                                                const priorityColor = priority === 'High' ? 'destructive' : priority === 'Medium' ? 'default' : 'secondary';
                                                
                                                return (
                                                    <TableRow key={item.name}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge variant="outline" className="font-mono">
                                                                {item.onHand}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">{item.reorderPoint}</TableCell>
                                                        <TableCell className="text-right font-semibold text-red-600">
                                                            {item.needed}
                                                        </TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.costPerUnit)}</TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {formatCurrency(item.reorderCost)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={priorityColor}>{priority}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

