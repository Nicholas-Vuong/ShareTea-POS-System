import { Fragment, useEffect, useState } from 'react';
import {
    MenuItem,
    LowStockItem,
    InventoryItem,
    Employee,
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
import Reports from '@/components/Reports';
import SalesVisualizations from '@/components/SalesVisualizations';
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
    const [restockItems, setRestockItems] = useState<
        Array<{ name: string; onHand: number; reorderPoint: number; needed: number; costPerUnit: number; reorderCost: number }>
    >([]);
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


    // Load data based on active tab
    useEffect(() => {
        if (activeTab === 'menu') {
            loadMenu();
        } else if (activeTab === 'inventory') {
            loadInventory();
            loadLowStock();
            loadRestock();
        } else if (activeTab === 'employees') {
            loadEmployees();
        }
    }, [activeTab]);

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
                    <TabsList className="w-full justify-start bg-muted/50 mb-6 flex-wrap h-auto">
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
                        <TabsTrigger value="visualizations" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                            Sales Visualizations
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
                        <Reports />
                    </TabsContent>

                    {/* Sales Visualizations Tab */}
                    <TabsContent value="visualizations" className="space-y-4">
                        <SalesVisualizations />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
