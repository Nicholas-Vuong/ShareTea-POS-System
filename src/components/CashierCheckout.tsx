import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CashierCheckoutProps {
  onBack: () => void;
  onComplete: (paymentMethod: string, promoCode: string | null, customerId: string | undefined) => void;
  isSubmitting?: boolean;
}

// Simple promo code validation
const validatePromoCode = (code: string): number => {
  const promoCodes: Record<string, number> = {
    'SAVE10': 0.10,
    'SAVE20': 0.20,
    'WELCOME': 0.15,
  };
  return promoCodes[code.toUpperCase()] || 0;
};

export const CashierCheckout = ({ onBack, onComplete, isSubmitting = false }: CashierCheckoutProps) => {
  const { items, getTotal } = useCartStore();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState('');

  // Customer information
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);

  const subtotal = getTotal();
  const discount = subtotal * discountPercent;
  const tax = (subtotal - discount) * 0.0825;
  const total = subtotal - discount + tax;

  const handleApplyPromoCode = () => {
    if (!promoCode.trim()) {
      setPromoError('');
      return;
    }

    const discount = validatePromoCode(promoCode);
    if (discount > 0) {
      setAppliedPromoCode(promoCode.toUpperCase());
      setDiscountPercent(discount);
      setPromoError('');
      setPromoCode('');
    } else {
      setPromoError('Invalid promo code');
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null);
    setDiscountPercent(0);
    setPromoCode('');
    setPromoError('');
  };

  const handleLookupOrCreateCustomer = async () => {
    // Email is required for customer lookup/creation
    if (!customerEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please provide customer email to lookup or create account',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLookingUpCustomer(true);
    try {
      // Try to find customer by email first
      const customer = await api.findCustomerByEmail(customerEmail.trim());
      
      if (customer) {
        setCustomerId(customer.userId);
        setCustomerName(customer.fullName || customerName || customerEmail.split('@')[0]);
        toast({
          title: 'Customer found',
          description: `Found customer: ${customer.fullName || customerEmail}`,
        });
        setIsLookingUpCustomer(false);
        return;
      }

      // Customer doesn't exist, create new one
      // Use provided name or derive from email
      const nameToUse = customerName.trim() || customerEmail.split('@')[0];
      const id = await api.findOrCreateCustomer(
        customerEmail,
        nameToUse,
        customerPhone || undefined
      );
      setCustomerId(id);
      setCustomerName(nameToUse);
      toast({
        title: 'Customer account created',
        description: 'New customer account has been created',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to process customer',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLookingUpCustomer(false);
    }
  };

  const handleComplete = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    // Email is required for customer lookup/creation
    if (!customerEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please provide customer email to complete order',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    // If customer hasn't been verified, verify now
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      try {
        setIsLookingUpCustomer(true);
        // Try to find customer by email first
        const customer = await api.findCustomerByEmail(customerEmail.trim());
        
        if (customer) {
          finalCustomerId = customer.userId;
          setCustomerId(customer.userId);
          setCustomerName(customer.fullName || customerName || customerEmail.split('@')[0]);
        } else {
          // Customer doesn't exist, create new one
          const nameToUse = customerName.trim() || customerEmail.split('@')[0];
          finalCustomerId = await api.findOrCreateCustomer(
            customerEmail,
            nameToUse,
            customerPhone || undefined
          );
          setCustomerId(finalCustomerId);
          setCustomerName(nameToUse);
        }
        setIsLookingUpCustomer(false);
      } catch (error: any) {
        setIsLookingUpCustomer(false);
        toast({
          title: 'Failed to process customer',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
        return;
      }
    }

    onComplete(paymentMethod, appliedPromoCode, finalCustomerId);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="touch-target">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>

            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">Customer Information</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customer-name">Full Name (Optional)</Label>
                    <Input
                      id="customer-name"
                      placeholder="Customer full name (auto-filled if found)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Will be auto-filled when customer is found, or derived from email if creating new account
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="customer-email">Email *</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter email to lookup or create customer account
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="customer-phone">Phone (Optional)</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleLookupOrCreateCustomer}
                    disabled={isLookingUpCustomer || !customerEmail.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    {isLookingUpCustomer 
                      ? 'Processing...' 
                      : customerId 
                        ? 'Customer Verified ✓' 
                        : 'Lookup/Create Customer'}
                  </Button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="payment-cash" className="touch-target" />
                      <Label htmlFor="payment-cash" className="cursor-pointer">
                        Cash
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="payment-card" className="touch-target" />
                      <Label htmlFor="payment-card" className="cursor-pointer">
                        Card
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Promo Code */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">Promo Code</Label>
                {appliedPromoCode ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="flex-1 font-semibold">{appliedPromoCode}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePromoCode}
                      className="touch-target"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyPromoCode();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleApplyPromoCode}
                        variant="outline"
                        className="touch-target"
                      >
                        Apply
                      </Button>
                    </div>
                    {promoError && (
                      <p className="text-sm text-destructive">{promoError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item, index) => (
                <div key={`${item.menuItemId}-${index}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full mt-6 touch-target"
              size="lg"
              disabled={
                items.length === 0 || 
                !customerEmail.trim() || 
                isLookingUpCustomer ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Complete Order'
              )}
            </Button>
            {!customerEmail.trim() && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Please enter customer email to continue
              </p>
            )}
            {customerEmail.trim() && !customerId && !isLookingUpCustomer && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Click "Lookup/Create Customer" to verify account, or proceed to create account automatically
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

