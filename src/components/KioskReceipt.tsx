import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface OrderItem {
  name: string;
  quantity: number;
  subtotal: number;
}

interface KioskReceiptProps {
  orderId: string;
  items: OrderItem[];
  total: number;
  onNewOrder: () => void;
}

const translations = {
  en: {
    orderConfirmed: 'Order Confirmed!',
    orderNumber: 'Your order number is',
    thankYou: 'Thank you for your order',
    orderSummary: 'Order Summary',
    total: 'Total',
    startNewOrder: 'Start New Order',
    leaveReview: 'Leave a Review',
    rating: 'Rating',
    comment: 'Comment (optional)',
    submitReview: 'Submit Review',
    reviewSubmitted: 'Thank you for your review!',
    reviewError: 'Failed to submit review',
    skipReview: 'Skip',
  },
  es: {
    orderConfirmed: '¡Pedido confirmado!',
    orderNumber: 'Su número de pedido es',
    thankYou: 'Gracias por su pedido',
    orderSummary: 'Resumen del pedido',
    total: 'Total',
    startNewOrder: 'Nuevo pedido',
    leaveReview: 'Dejar una reseña',
    rating: 'Calificación',
    comment: 'Comentario (opcional)',
    submitReview: 'Enviar reseña',
    reviewSubmitted: '¡Gracias por su reseña!',
    reviewError: 'Error al enviar la reseña',
    skipReview: 'Omitir',
  },
};

export const KioskReceipt = ({
  orderId,
  items,
  total,
  onNewOrder,
}: KioskReceiptProps) => {
  const t = useTranslation(translations);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [showReview, setShowReview] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createReview({
        orderId,
        rating,
        comment: comment.trim() || null,
      });
      setReviewSubmitted(true);
      toast({
        title: t.reviewSubmitted,
        description: 'Your feedback helps us improve!',
      });
      setTimeout(() => {
        setShowReview(false);
      }, 2000);
    } catch (error: any) {
      toast({
        title: t.reviewError,
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipReview = () => {
    setShowReview(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-2xl w-full p-12">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-success">{t.orderConfirmed}</h1>
            <p className="text-2xl text-muted-foreground">{t.orderNumber}</p>
            <div className="text-8xl font-bold text-primary py-8">#{orderId.slice(-6)}</div>
            <p className="text-2xl text-muted-foreground">{t.thankYou}</p>
          </div>

          <Separator />

          <div className="text-left space-y-4">
            <h2 className="text-2xl font-semibold">{t.orderSummary}</h2>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>{t.total}</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {showReview && !reviewSubmitted && (
            <>
              <Separator />
              <div className="space-y-4 text-left">
                <h3 className="text-2xl font-semibold">{t.leaveReview}</h3>
                <div className="space-y-2">
                  <Label>{t.rating}</Label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="touch-target p-2"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`h-12 w-12 ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-comment">{t.comment}</Label>
                  <Textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="min-h-[100px] touch-target"
                    rows={4}
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmitReview}
                    size="lg"
                    className="touch-target text-xl px-8 flex-1"
                    disabled={isSubmitting || rating === 0}
                  >
                    {isSubmitting ? 'Submitting...' : t.submitReview}
                  </Button>
                  <Button
                    onClick={handleSkipReview}
                    variant="outline"
                    size="lg"
                    className="touch-target text-xl px-8"
                  >
                    {t.skipReview}
                  </Button>
                </div>
              </div>
            </>
          )}

          {reviewSubmitted && (
            <>
              <div className="text-green-600 text-xl font-semibold mb-4">
                {t.reviewSubmitted}
              </div>
              <Button
                onClick={onNewOrder}
                size="lg"
                className="touch-target text-xl px-12 w-full"
              >
                {t.startNewOrder}
              </Button>
            </>
          )}

          {!showReview && !reviewSubmitted && (
            <Button
              onClick={onNewOrder}
              size="lg"
              className="touch-target text-xl px-12 w-full"
            >
              {t.startNewOrder}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

