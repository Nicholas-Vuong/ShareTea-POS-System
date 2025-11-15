import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CashierCheckoutProps {
  onBack: () => void;
  onComplete: (paymentMethod: string, promoCode: string | null, customerId: string | undefined) => void;
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

export const CashierCheckout = ({ onBack, onComplete }: CashierCheckoutProps) => {
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
    if (!customerName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide customer name (required)',
        variant: 'destructive',
      });
      return;
    }

    // Only lookup/create customer if email is provided
    if (!customerEmail.trim()) {
      toast({
        title: 'No email provided',
        description: 'Order will be created without a customer account',
      });
      setCustomerId(undefined);
      return;
    }

    // Validate email format if provided
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
      const id = await api.findOrCreateCustomer(
        customerEmail,
        customerName,
        customerPhone || undefined
      );
      setCustomerId(id);
      toast({
        title: 'Customer found/created',
        description: 'Customer information saved',
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
    if (!customerName.trim()) {
      toast({
        title: 'Missing customer information',
        description: 'Please provide customer name (required) before completing order',
        variant: 'destructive',
      });
      return;
    }

    // If email is provided but customer hasn't been verified, verify now
    if (customerEmail.trim() && !customerId) {
      // Validate email format if provided
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        toast({
          title: 'Invalid email',
          description: 'Please enter a valid email address or remove it',
          variant: 'destructive',
        });
        return;
      }

      try {
        setIsLookingUpCustomer(true);
        const id = await api.findOrCreateCustomer(
          customerEmail,
          customerName,
          customerPhone || undefined
        );
        setCustomerId(id);
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

    // Only lookup/create customer if email is provided
    let finalCustomerId = customerId;
    if (customerEmail.trim()) {
      // Validate email format if provided
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        toast({
          title: 'Invalid email',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
        return;
      }

      // If customer hasn't been looked up yet, do it now
      if (!finalCustomerId) {
        try {
          setIsLookingUpCustomer(true);
          finalCustomerId = await api.findOrCreateCustomer(
            customerEmail,
            customerName,
            customerPhone || undefined
          );
          setCustomerId(finalCustomerId);
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
    } else {
      // No email provided - one-time order without account
      finalCustomerId = undefined;
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
                    <Label htmlFor="customer-name">Full Name *</Label>
                    <Input
                      id="customer-name"
                      placeholder="Customer full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-email">Email (Optional)</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="mt-1"
                    />
                    {!customerEmail.trim() && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Order will be created without a customer account
                      </p>
                    )}
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
                    disabled={isLookingUpCustomer || !customerName.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    {isLookingUpCustomer 
                      ? 'Processing...' 
                      : customerId 
                        ? 'Customer Verified ✓' 
                        : customerEmail.trim()
                          ? 'Lookup/Create Customer'
                          : 'Skip Customer Account'}
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
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mobile" id="payment-mobile" className="touch-target" />
                      <Label htmlFor="payment-mobile" className="cursor-pointer">
                        Mobile Payment
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
                !customerName.trim() || 
                isLookingUpCustomer ||
                (customerEmail.trim() && !customerId)
              }
            >
              Complete Order
            </Button>
            {!customerName.trim() && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Please enter customer name to continue
              </p>
            )}
            {customerName.trim() && customerEmail.trim() && !customerId && !isLookingUpCustomer && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Please click "Lookup/Create Customer" to verify account, or remove email for one-time order
              </p>
            )}
            {customerName.trim() && !customerEmail.trim() && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Order will be created as one-time order (no account)
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

