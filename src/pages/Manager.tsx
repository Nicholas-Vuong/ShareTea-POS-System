import { Fragment, useEffect, useState } from 'react';
import {
  MenuItem,
  LowStockItem,
  InventoryItem,
  Employee,
  ReportSummary,
  OrderSummary,
  OrdersAnalytics,
  api,
} from '@/lib/api';
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
import { LogOut, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MenuNutritionSummary } from '@/components/MenuNutritionSummary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Manager() {
  const [activeTab, setActiveTab] = useState('menu');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analytics, setAnalytics] = useState<OrdersAnalytics | null>(null);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  // Default manager reports to a 30-day custom window so past orders always show
  const defaultReportFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();
  const defaultReportTo = new Date().toISOString().split('T')[0];
  const [reportType, setReportType] = useState<'24h' | '7d' | '30d' | 'custom'>('7d');
  const [reportFrom, setReportFrom] = useState(defaultReportFrom);
  const [reportTo, setReportTo] = useState(defaultReportTo);
  const [reportSubTab, setReportSubTab] = useState<'summary' | 'orders' | 'top' | 'x' | 'z' | 'restock'>('summary');
  const [restockItems, setRestockItems] = useState<
    Array<{ name: string; onHand: number; reorderPoint: number; needed: number; costPerUnit: number; reorderCost: number }>
  >([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingInventory, setEditingInventory] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', category: '', price: 0, description: '', active: true });
  const [expandedNutritionId, setExpandedNutritionId] = useState<string | null>(null);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const buildRangeParams = () => {
    if (reportType === 'custom') {
      const from = reportFrom || defaultReportFrom;
      const to = reportTo || defaultReportTo;
      return { type: 'custom' as const, from, to };
    }
    return { type: reportType };
  };

  type ChartPoint = { label: string; value: number; helper?: string };

  const LineChart = ({ data, height = 280 }: { data: ChartPoint[]; height?: number }) => {
    if (!data.length) return <p className="text-sm text-muted-foreground">No data</p>;

    const max = Math.max(...data.map((d) => d.value), 1);
    const longestLabel = Math.max(...data.map((d) => d.label.length), 1);
    const slotWidth = Math.max(80, Math.min(160, longestLabel * 7));
    const width = Math.max(520, data.length * slotWidth + 120);

    const points = data.map((d, i) => {
      const x = 60 + i * slotWidth;
      const y = height - 60 - (d.value / max) * (height - 120);
      return { ...d, x, y };
    });

    const path = points.map((p) => `${p.x},${p.y}`).join(' ');

    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" style={{ width: '100%', minHeight: height }}>
          <line x1={60} y1={height - 60} x2={width - 20} y2={height - 60} stroke="#e5e7eb" />
          <line x1={60} y1={30} x2={60} y2={height - 60} stroke="#e5e7eb" />
          <polyline fill="none" stroke="#6366f1" strokeWidth={3} points={path} />
          {points.map((p) => (
            <g key={p.label}>
              <circle cx={p.x} cy={p.y} r={5} fill="#6366f1" />
              <text
                x={p.x}
                y={height - 24}
                textAnchor="end"
                fontSize="11"
                fill="#6b7280"
                transform={`rotate(-25, ${p.x}, ${height - 24})`}
              >
                {p.label}
              </text>
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fill="#111827">
                ${p.value.toFixed(2)}
              </text>
              {p.helper && (
                <text x={p.x} y={p.y + 18} textAnchor="middle" fontSize="10" fill="#4b5563">
                  {p.helper}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const BarChart = ({ data, height = 300 }: { data: ChartPoint[]; height?: number }) => {
    if (!data.length) return <p className="text-sm text-muted-foreground">No data</p>;

    const max = Math.max(...data.map((d) => d.value), 1);
    const longestLabel = Math.max(...data.map((d) => d.label.length), 1);
    // Allow more room for long labels to avoid truncation/overlap
    const slotWidth = Math.max(100, Math.min(220, longestLabel * 9));
    const barWidth = Math.min(72, slotWidth - 30);
    const gap = slotWidth - barWidth;
    const width = Math.max(560, data.length * (barWidth + gap) + 120);

    return (
      <div className="overflow-x-auto pb-1">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" style={{ width: '100%', minHeight: height }}>
          <line x1={60} y1={height - 60} x2={width - 20} y2={height - 60} stroke="#e5e7eb" />
          <line x1={60} y1={30} x2={60} y2={height - 60} stroke="#e5e7eb" />
          {data.map((d, i) => {
            const x = 60 + i * (barWidth + gap);
            const barHeight = Math.max(12, (d.value / max) * (height - 140));
            const y = height - 60 - barHeight;
            return (
              <g key={d.label}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill="#6366f1" rx={10} />
                <text x={x + barWidth / 2} y={y - 12} textAnchor="middle" fontSize="11" fill="#111827">
                  ${d.value.toFixed(2)}
                </text>
                {d.helper && (
                  <text x={x + barWidth / 2} y={y + 16} textAnchor="middle" fontSize="10" fill="#4b5563">
                    {d.helper}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={height - 24}
                  textAnchor="end"
                  fontSize="11"
                  fill="#6b7280"
                  transform={`rotate(-20, ${x + barWidth / 2}, ${height - 24})`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const RangeControls = ({ onRefresh }: { onRefresh?: () => void }) => {
    const currentLabel = analytics?.range?.label || reportSummary?.range?.label;
    const isCustom = reportType === 'custom';

    return (
      <div className="w-full rounded-lg border bg-muted/40 p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col min-w-[180px]">
            <Label className="text-xs font-semibold text-muted-foreground">Preset</Label>
            <Select
              value={reportType}
              onValueChange={(val) => {
                const next = val as '24h' | '7d' | '30d' | 'custom';
                setReportType(next);
                if (next === 'custom') {
                  setReportFrom(defaultReportFrom);
                  setReportTo(defaultReportTo);
                } else {
                  setReportFrom('');
                  setReportTo('');
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col min-w-[150px]">
              <Label htmlFor="range-from">From</Label>
              <Input
                id="range-from"
                type="date"
                value={reportFrom}
                disabled={!isCustom}
                onChange={(e) => setReportFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col min-w-[150px]">
              <Label htmlFor="range-to">To</Label>
              <Input
                id="range-to"
                type="date"
                value={reportTo}
                disabled={!isCustom}
                onChange={(e) => setReportTo(e.target.value)}
              />
            </div>
          </div>

          {onRefresh && (
            <Button variant="outline" onClick={onRefresh} disabled={isLoadingReports}>
              Refresh
            </Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {currentLabel ? `Showing: ${currentLabel}` : 'Choose a range to update charts.'}
        </div>
      </div>
    );
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'menu') {
      loadMenu();
    } else if (activeTab === 'inventory') {
      loadInventory();
      loadLowStock();
    } else if (activeTab === 'employees') {
      loadEmployees();
    } else if (activeTab === 'reports') {
      loadAnalytics();
      loadReportSummary();
      loadRestock();
    } else if (activeTab === 'visualization') {
      loadAnalytics();
    }
  }, [activeTab]);

  // Reload report summary when type/date changes
  useEffect(() => {
    if (activeTab === 'reports') {
      loadReportSummary();
      loadAnalytics();
    }
    if (activeTab === 'visualization') {
      loadAnalytics();
    }
  }, [reportType, reportFrom, reportTo, activeTab]);

  const loadMenu = async () => {
    try {
      const data = await api.getAllMenuItems();
      setMenu(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadInventory = async () => {
    try {
      const data = await api.getAllInventoryItems();
      setInventory(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadLowStock = async () => {
    try {
      const data = await api.getLowStock();
      setLowStock(data);
    } catch (error: any) {
      console.error('Failed to load low stock:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadReportSummary = async () => {
    try {
      setIsLoadingReports(true);
      const rangeParams = buildRangeParams();
      const summary = await api.getReportSummary(rangeParams);
      setReportSummary(summary);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsLoadingReports(true);
      const rangeParams = buildRangeParams();
      const data = await api.getOrdersAnalytics(rangeParams);
      setAnalytics(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingReports(false);
    }
  };


  const loadRestock = async () => {
    try {
      const inventoryItems = await api.getAllInventoryItems();
      const restock = inventoryItems
        .filter((item) => item.onHandQuantity <= item.reorderPoint)
        .map((item) => {
          const needed = Math.max(item.reorderPoint - item.onHandQuantity, 0);
          const reorderCost = needed * (item.costPerUnit || 0);
          return {
            name: item.name,
            onHand: item.onHandQuantity,
            reorderPoint: item.reorderPoint,
            needed,
            costPerUnit: item.costPerUnit,
            reorderCost,
          };
        });
      setRestockItems(restock);
    } catch (error: any) {
      console.error(error);
    }
  };

  const loadSalesData = async () => {
    try {
      const data = await api.getSalesData(30);
      setSalesData(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveMenuItem = async (item: MenuItem) => {
    try {
      await api.updateMenuItem(item.id, {
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description,
        active: item.active,
      });
      setEditingItem(null);
      await loadMenu();
      toast({
        title: 'Success',
        description: 'Menu item updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateMenuItem = async () => {
    try {
      await api.createMenuItem(newMenuItem);
      setIsMenuDialogOpen(false);
      setNewMenuItem({ name: '', category: '', price: 0, description: '', active: true });
      await loadMenu();
      toast({
        title: 'Success',
        description: 'Menu item created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMenuItem(id);
      await loadMenu();
      toast({
        title: 'Success',
        description: 'Menu item deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveInventoryItem = async (item: InventoryItem) => {
    try {
      await api.updateInventoryItem(item.inventoryId, {
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        onHandQuantity: item.onHandQuantity,
        reorderPoint: item.reorderPoint,
        costPerUnit: item.costPerUnit,
      });
      setEditingInventory(null);
      await loadInventory();
      await loadLowStock();
      toast({
        title: 'Success',
        description: 'Inventory item updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveEmployee = async (employee: Employee) => {
    try {
      await api.updateEmployee(employee.userId, {
        username: employee.username,
        fullName: employee.fullName,
        email: employee.email || '',
        role: employee.role,
      });
      setEditingEmployee(null);
      await loadEmployees();
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Manager Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 mb-6">
            <TabsTrigger value="menu" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Menu Management
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Inventory Management
            </TabsTrigger>
            <TabsTrigger value="employees" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Employee Management
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Reports
            </TabsTrigger>
            <TabsTrigger value="visualization" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Sales Visualization
            </TabsTrigger>
          </TabsList>

          {/* Menu Management Tab */}
          <TabsContent value="menu" className="space-y-4">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Menu Items</h2>
                <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Menu Item</DialogTitle>
                      <DialogDescription>Create a new menu item</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={newMenuItem.name}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={newMenuItem.category}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newMenuItem.price}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={newMenuItem.description}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateMenuItem}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nutrition summary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menu.map((item) => (
                    <Fragment key={item.id}>
                      <TableRow>
                        {editingItem === item.id ? (
                          <>
                            <TableCell>
                              <Input
                                value={item.name}
                                onChange={(e) => setMenu(menu.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.category}
                                onChange={(e) => setMenu(menu.map(i => i.id === item.id ? { ...i, category: e.target.value } : i))}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => setMenu(menu.map(i => i.id === item.id ? { ...i, price: parseFloat(e.target.value) || 0 } : i))}
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.active ? 'active' : 'inactive'}
                                onValueChange={(val) => setMenu(menu.map(i => i.id === item.id ? { ...i, active: val === 'active' } : i))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              Save changes to view nutrition
                            </TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => handleSaveMenuItem(item)}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={item.active ? 'default' : 'secondary'}>
                                {item.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={expandedNutritionId === item.id ? 'default' : 'outline'}
                                onClick={() =>
                                  setExpandedNutritionId((prev) => (prev === item.id ? null : item.id))
                                }
                                aria-expanded={expandedNutritionId === item.id}
                                className="touch-target"
                              >
                                {expandedNutritionId === item.id ? 'Hide summary' : 'Show summary'}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => setEditingItem(item.id)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteMenuItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                      {expandedNutritionId === item.id && (
                        <TableRow className="bg-muted/40">
                          <TableCell colSpan={6}>
                            {/* Manager view exposes quick USDA macro summary for Project 3 demo */}
                            <MenuNutritionSummary menuItemId={item.id} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Inventory Management Tab */}
          <TabsContent value="inventory" className="space-y-4">
            {lowStock.length > 0 && (
              <Card className="p-6 border-warning">
                <h2 className="text-2xl font-bold mb-4 text-warning">Low Stock Alert</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStock.map((item) => (
                    <Card key={item.inventoryId} className="p-4 border-warning/50">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        On hand: {item.onHandQuantity} / Reorder at: {item.reorderPoint}
                      </p>
                    </Card>
                  ))}
                </div>
              </Card>
            )}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Inventory Items</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>On Hand</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.inventoryId}>
                      {editingInventory === item.inventoryId ? (
                        <>
                          <TableCell>
                            <Input
                              value={item.name}
                              onChange={(e) => setInventory(inventory.map(i => i.inventoryId === item.inventoryId ? { ...i, name: e.target.value } : i))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.sku}
                              onChange={(e) => setInventory(inventory.map(i => i.inventoryId === item.inventoryId ? { ...i, sku: e.target.value } : i))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.unit}
                              onChange={(e) => setInventory(inventory.map(i => i.inventoryId === item.inventoryId ? { ...i, unit: e.target.value } : i))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.001"
                              value={item.onHandQuantity}
                              onChange={(e) => setInventory(inventory.map(i => i.inventoryId === item.inventoryId ? { ...i, onHandQuantity: parseFloat(e.target.value) || 0 } : i))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.001"
                              value={item.reorderPoint}
                              onChange={(e) => setInventory(inventory.map(i => i.inventoryId === item.inventoryId ? { ...i, reorderPoint: parseFloat(e.target.value) || 0 } : i))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.0001"
                              value={item.costPerUnit}
                              onChange={(e) => setInventory(inventory.map(i => i.inventoryId === item.inventoryId ? { ...i, costPerUnit: parseFloat(e.target.value) || 0 } : i))}
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => handleSaveInventoryItem(item)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingInventory(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.sku || '-'}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.onHandQuantity}</TableCell>
                          <TableCell>{item.reorderPoint}</TableCell>
                          <TableCell>${item.costPerUnit.toFixed(4)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => setEditingInventory(item.inventoryId)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Employee Management Tab */}
          <TabsContent value="employees" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Employees</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.userId}>
                      {editingEmployee === employee.userId ? (
                        <>
                          <TableCell>
                            <Input
                              value={employee.username}
                              onChange={(e) => setEmployees(employees.map(emp => emp.userId === employee.userId ? { ...emp, username: e.target.value } : emp))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={employee.fullName}
                              onChange={(e) => setEmployees(employees.map(emp => emp.userId === employee.userId ? { ...emp, fullName: e.target.value } : emp))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={employee.role}
                              onChange={(e) => setEmployees(employees.map(emp => emp.userId === employee.userId ? { ...emp, role: e.target.value } : emp))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={employee.email || ''}
                              onChange={(e) => setEmployees(employees.map(emp => emp.userId === employee.userId ? { ...emp, email: e.target.value } : emp))}
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => handleSaveEmployee(employee)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingEmployee(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{employee.username}</TableCell>
                          <TableCell>{employee.fullName}</TableCell>
                          <TableCell>
                            <Badge>{employee.role}</Badge>
                          </TableCell>
                          <TableCell>{employee.email || '-'}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => setEditingEmployee(employee.userId)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold">Reports</h2>
                <p className="text-sm text-muted-foreground">Select timeframe to refresh all report data.</p>
              </div>

              <RangeControls onRefresh={() => { loadReportSummary(); loadAnalytics(); }} />

              <Tabs value={reportSubTab} onValueChange={(v) => setReportSubTab(v as any)} className="mt-6">
                <TabsList className="flex flex-wrap">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="orders">Order History</TabsTrigger>
                  <TabsTrigger value="top">Top Items</TabsTrigger>
                  <TabsTrigger value="x">X-Report</TabsTrigger>
                  <TabsTrigger value="z">Z-Report</TabsTrigger>
                  <TabsTrigger value="restock">Restock</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">Gross Sales</p>
                      <p className="text-2xl font-bold">
                        ${reportSummary ? reportSummary.grossSales.toFixed(2) : '0.00'}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">Net Sales</p>
                      <p className="text-2xl font-bold">
                        ${reportSummary ? reportSummary.netSales.toFixed(2) : '0.00'}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">Tax Collected</p>
                      <p className="text-2xl font-bold">
                        ${reportSummary ? reportSummary.tax.toFixed(2) : '0.00'}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">Order Count</p>
                      <p className="text-2xl font-bold">{reportSummary?.orderCount ?? 0}</p>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">Discounts</p>
                      <p className="text-2xl font-bold">
                        ${reportSummary ? reportSummary.discounts.toFixed(2) : '0.00'}
                      </p>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Recent Orders (5 most recent)</h3>
                      <Button size="sm" variant="secondary" onClick={() => setReportSubTab('orders')}>
                        View all
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Tender</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics?.orderHistory?.length ? (
                          analytics.orderHistory
                            .slice(-5)
                            .reverse()
                            .map((order) => (
                              <TableRow key={order.orderId}>
                                <TableCell className="font-medium">{order.orderId}</TableCell>
                                <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                                <TableCell>${order.total.toFixed(2)}</TableCell>
                                <TableCell className="capitalize">{order.paymentMethod || 'unknown'}</TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No recent orders
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                  <h3 className="text-lg font-semibold">Order History (range)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Tender</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics?.orderHistory?.length ? (
                        [...analytics.orderHistory]
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((order) => (
                            <TableRow key={order.orderId}>
                              <TableCell className="font-medium">{order.orderId}</TableCell>
                              <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                              <TableCell>${order.total.toFixed(2)}</TableCell>
                              <TableCell className="capitalize">{order.paymentMethod || 'unknown'}</TableCell>
                              <TableCell>{order.status || '—'}</TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No orders
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="top" className="space-y-4">
                  <h3 className="text-lg font-semibold">Top Selling Items (range)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty Sold</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Order Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics?.topItems?.length ? (
                        analytics.topItems.map((item) => (
                          <TableRow key={item.name}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.revenue.toFixed(2)}</TableCell>
                            <TableCell>{item.orderCount}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No item data
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="x" className="space-y-4">
                  <h3 className="text-lg font-semibold">X-Report (snapshot)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card className="p-4"><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-2xl font-bold">${analytics?.xReport.total.toFixed(2) ?? '0.00'}</p></Card>
                    <Card className="p-4"><p className="text-sm text-muted-foreground">Orders</p><p className="text-2xl font-bold">{analytics?.xReport.orders ?? 0}</p></Card>
                    <Card className="p-4"><p className="text-sm text-muted-foreground">Avg Order</p><p className="text-2xl font-bold">${analytics?.xReport.avgOrderValue.toFixed(2) ?? '0.00'}</p></Card>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Payment Breakdown</h4>
                    {analytics?.xReport.payments && Object.keys(analytics.xReport.payments).length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(analytics.xReport.payments).map(([method, val]) => (
                          <Card key={method} className="p-3">
                            <div className="flex justify-between">
                              <span className="capitalize">{method}</span>
                              <span className="font-semibold">${val.amount.toFixed(2)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{val.count} orders</p>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No payment data</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Hourly Orders/Sales</h4>
                    <div className="space-y-2">
                      {analytics?.xReport.hourly?.length ? (
                        analytics.xReport.hourly.map((h) => (
                          <div key={h.hour} className="flex items-center gap-3">
                            <div className="w-16 text-sm text-muted-foreground">{h.hour}:00</div>
                            <div className="flex-1 bg-muted rounded-full h-4 relative">
                              <div
                                className="bg-primary h-4 rounded-full"
                                style={{ width: `${(h.total / Math.max(...analytics.xReport.hourly.map((x) => x.total || 1))) * 100}%` }}
                              />
                            </div>
                            <div className="w-24 text-right text-sm">${h.total.toFixed(2)} / {h.orders} orders</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No hourly data</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="z" className="space-y-4">
                  <h3 className="text-lg font-semibold">Z-Report (per day)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4"><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-2xl font-bold">${analytics?.zReport.aggregate.total.toFixed(2) ?? '0.00'}</p></Card>
                    <Card className="p-4"><p className="text-sm text-muted-foreground">Orders</p><p className="text-2xl font-bold">{analytics?.zReport.aggregate.orders ?? 0}</p></Card>
                    <Card className="p-4"><p className="text-sm text-muted-foreground">Avg Order</p><p className="text-2xl font-bold">${analytics?.zReport.aggregate.avgOrderValue.toFixed(2) ?? '0.00'}</p></Card>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Per-Day Breakdown</h4>
                    <div className="space-y-3">
                      {analytics?.zReport.perDay?.length ? (
                        analytics.zReport.perDay.map((day) => (
                          <Card key={day.date} className="p-4 space-y-2">
                            <div className="flex flex-wrap justify-between">
                              <span className="font-semibold">{new Date(day.date).toLocaleDateString()}</span>
                              <span className="text-sm text-muted-foreground">
                                ${day.total.toFixed(2)} • {day.orders} orders • Avg ${day.avgOrderValue.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(day.payments).map(([method, val]) => (
                                <Badge key={method} variant="secondary">
                                  {method}: ${val.amount.toFixed(2)} ({val.count})
                                </Badge>
                              ))}
                            </div>
                            <div className="space-y-1">
                              {day.hourly.map((h) => (
                                <div key={h.hour} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="w-12">{h.hour}:00</span>
                                  <div className="flex-1 bg-muted rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${(h.total / Math.max(...day.hourly.map((x) => x.total || 1))) * 100}%` }}
                                    />
                                  </div>
                                  <span className="w-24 text-right text-xs">${h.total.toFixed(2)} / {h.orders}</span>
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No Z-report data</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="restock" className="space-y-3">
                  <h3 className="text-lg font-semibold">Restock Report</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>On Hand</TableHead>
                        <TableHead>Reorder Point</TableHead>
                        <TableHead>Needed</TableHead>
                        <TableHead>Cost/Unit</TableHead>
                        <TableHead>Est. Reorder Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restockItems.length ? (
                        restockItems.map((item) => (
                          <TableRow key={item.name}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.onHand}</TableCell>
                            <TableCell>{item.reorderPoint}</TableCell>
                            <TableCell>{item.needed}</TableCell>
                            <TableCell>${item.costPerUnit.toFixed(2)}</TableCell>
                            <TableCell>${item.reorderCost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No items below reorder point
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </Card>
          </TabsContent>

          {/* Sales Visualization Tab */}
          <TabsContent value="visualization" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Sales Visualizations</h2>
                <p className="text-sm text-muted-foreground">Select timeframe to update all charts.</p>
              </div>

              <RangeControls />

              <Tabs defaultValue="hourly" className="mt-2">
                <TabsList className="flex flex-wrap">
                  <TabsTrigger value="hourly">Hourly Sales</TabsTrigger>
                  <TabsTrigger value="dow">Day of Week</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="top">Top Items</TabsTrigger>
                </TabsList>

                <TabsContent value="hourly" className="mt-4">
                  <LineChart
                    data={
                      analytics?.hourly?.map((h) => ({
                        label: `${h.hour}:00`,
                        value: h.total,
                        helper: `${h.orders} orders`,
                      })) || []
                    }
                  />
                </TabsContent>

                <TabsContent value="dow" className="mt-4">
                  <BarChart
                    data={
                      (() => {
                        const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return labels.map((lbl) => {
                          const match = analytics?.dayOfWeek?.find((d) => d.dow === lbl);
                          return {
                            label: lbl,
                            value: match ? match.total : 0,
                            helper: `${match ? match.orders : 0} orders`,
                          };
                        });
                      })()
                    }
                  />
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                  <BarChart
                    data={
                      analytics?.paymentBreakdown
                        ? Object.entries(analytics.paymentBreakdown).map(([method, val]) => ({
                            label: method,
                            value: val.amount,
                            helper: `${val.count} orders`,
                          }))
                        : []
                    }
                  />
                </TabsContent>

                <TabsContent value="top" className="mt-4">
                  <BarChart
                    data={
                      analytics?.topItems
                        ? analytics.topItems.slice(0, 5).map((item, idx) => {
                            return {
                              label: `#${idx + 1} ${item.name}`,
                              value: item.revenue,
                              helper: `${item.quantity} sold`,
                            };
                          })
                        : []
                    }
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
