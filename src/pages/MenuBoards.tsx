import { useEffect, useState, useMemo, useRef } from 'react';
import { MenuItem, api } from '@/lib/api';
import { WeatherDisplay } from '@/components/WeatherDisplay';

export default function MenuBoards() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  const loadMenu = async () => {
    try {
      const data = await api.getMenu();
      const activeItems = data.filter((item) => item.active);
      setMenu(activeItems);
      const cats = Array.from(new Set(activeItems.map((item) => item.category)));
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load menu:', error);
    }
  };

  useEffect(() => {
    loadMenu();
    
    // Refresh menu every 30 seconds to reflect changes from manager
    const interval = setInterval(loadMenu, 30000);
    
    // Also refresh when window regains focus
    const handleFocus = () => {
      loadMenu();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Group menu items by category
  const itemsByCategory = useMemo(() => {
    const grouped: { [key: string]: MenuItem[] } = {};
    categories.forEach((cat) => {
      grouped[cat] = menu.filter((item) => item.category === cat);
    });
    return grouped;
  }, [menu, categories]);

  const currentCategory = categories[currentCategoryIndex] || '';
  const currentItems = itemsByCategory[currentCategory] || [];
  const scrollAnimationRef = useRef<number | null>(null);

  // Continuous scroll animation
  useEffect(() => {
    if (!scrollContainerRef.current || !itemsContainerRef.current || currentItems.length === 0) {
      return;
    }

    // Wait for transition to complete
    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      const itemsContainer = itemsContainerRef.current;
      if (!container || !itemsContainer) return;

      const containerHeight = container.clientHeight;
      const scrollHeight = itemsContainer.scrollHeight;
      const maxScroll = scrollHeight - containerHeight;

      // If content fits, no scrolling needed
      if (maxScroll <= 0) {
        return;
      }

      // Timing configuration
      const lingerAtTop = 2000; // 2 seconds at top
      const lingerAtBottom = 2000; // 2 seconds at bottom
      const totalCategoryTime = 8000; // 8 seconds total per category
      const scrollDuration = totalCategoryTime - lingerAtTop - lingerAtBottom; // Remaining time for scrolling

      let startTime: number | null = null;
      let isLingeringAtTop = true;
      let isLingeringAtBottom = false;
      let hasScrolled = false;

      const animateScroll = (timestamp: number) => {
        if (!container) return;

        if (startTime === null) {
          startTime = timestamp;
        }

        const elapsed = timestamp - startTime;

        if (isLingeringAtTop) {
          // Linger at top
          container.scrollTop = 0;
          if (elapsed >= lingerAtTop) {
            isLingeringAtTop = false;
            startTime = timestamp; // Reset timer for scroll phase
          }
        } else if (!hasScrolled || elapsed < scrollDuration) {
          // Continuous scroll down
          hasScrolled = true;
          const scrollProgress = Math.min(elapsed / scrollDuration, 1);
          container.scrollTop = scrollProgress * maxScroll;
          
          if (scrollProgress >= 1) {
            isLingeringAtBottom = true;
            startTime = timestamp; // Reset timer for bottom linger
          }
        } else if (isLingeringAtBottom) {
          // Linger at bottom
          container.scrollTop = maxScroll;
          if (elapsed >= lingerAtBottom) {
            // Animation complete, will be reset when category changes
            return;
          }
        }

        scrollAnimationRef.current = requestAnimationFrame(animateScroll);
      };

      // Reset scroll to top
      container.scrollTop = 0;
      startTime = null;
      isLingeringAtTop = true;
      isLingeringAtBottom = false;
      hasScrolled = false;

      scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }, 600); // Wait for fade transition to complete

    return () => {
      clearTimeout(timer);
      if (scrollAnimationRef.current !== null) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };
  }, [currentItems, currentCategoryIndex, isTransitioning]);

  // Auto-cycle through categories
  useEffect(() => {
    if (categories.length === 0) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCategoryIndex((prev) => (prev + 1) % categories.length);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 500);
    }, 8000); // Show each category for 8 seconds

    return () => clearInterval(interval);
  }, [categories.length]);

  return (
    <div className="h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex overflow-hidden">
      {/* Left Sidebar - 30% */}
      <div className="w-[30%] flex flex-col border-r-2 border-primary/20">
        {/* Weather Display - Full Height */}
        <div className="h-full">
          <WeatherDisplay compact={false} />
        </div>
      </div>

      {/* Right Side - 70% - Tabular Format with Fade */}
      <div className="w-[70%] relative overflow-hidden p-8">
        <div
          key={currentCategoryIndex}
          className={`h-full transition-opacity duration-500 ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Category Header */}
          <div className="mb-6">
            <h2 className="text-5xl font-bold text-primary border-b-2 border-primary/30 pb-3">
              {currentCategory}
            </h2>
          </div>

          {/* Items in Tabular Format with Scroll */}
          <div
            ref={scrollContainerRef}
            className="overflow-y-auto h-[calc(100%-120px)] hide-scrollbar"
          >
            <div ref={itemsContainerRef} className="grid grid-cols-1 gap-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  data-item
                  className="bg-card/80 backdrop-blur rounded-2xl p-6 border-2 border-primary/20 hover:border-primary/40 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-4xl font-bold mb-2">{item.name}</h3>
                      <p className="text-xl text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-4xl font-bold text-primary ml-4">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
