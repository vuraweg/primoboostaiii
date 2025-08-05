// src/components/payment/SubscriptionPlans.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Star,
  Zap,
  Crown,
  Clock,
  X, // Ensure X is imported
  Tag,
  Sparkles,
  ArrowRight,
  Info,
  ChevronLeft,
  ChevronRight,
  Timer,
  Target,
  Rocket,
  Briefcase,
  Infinity,
  CheckCircle,
  AlertCircle,
  Wrench,
  Gift,
  Plus,
} from 'lucide-react';
import { SubscriptionPlan } from '../../types/payment';
import { paymentService } from '../../services/paymentService';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface SubscriptionPlansProps {
  isOpen: boolean;
  onNavigateBack: () => void;
  onSubscriptionSuccess: () => void;
  // ADDED: onShowAlert prop
  onShowAlert: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', actionText?: string, onAction?: () => void) => void;
}

type AddOn = {
  id: string;
  name: string;
  price: number;
};

type AppliedCoupon = {
  code: string;
  discount: number; // In paise
  finalAmount: number; // In paise
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  isOpen,
  onNavigateBack,
  onSubscriptionSuccess,
  onShowAlert, // ADDED: Destructure onShowAlert
}) => {
  const { user } = useAuth();
  // MODIFIED: Change initial state to 'career_boost_plus'
  const [selectedPlan, setSelectedPlan] = useState<string>('career_boost_plus');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(2);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(0); // Stored in paise
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);
  const [loadingWallet, setLoadingWallet] = useState<boolean>(true);
  const [showAddOns, setShowAddOns] = useState<boolean>(false);
  const [selectedAddOns, setSelectedAddOns] = useState<{ [key: string]: number }>({});
  const carouselRef = useRef<HTMLDivElement>(null);

  const plans: SubscriptionPlan[] = paymentService.getPlans();
  const addOns: AddOn[] = paymentService.getAddOns();

  const allPlansWithAddOnOption = [
    ...plans,
    {
      id: 'addon_only_purchase',
      name: '🛒 Add-ons Only',
      price: 0,
      duration: 'One-time Purchase',
      optimizations: 0,
      scoreChecks: 0,
      linkedinMessages: 0,
      guidedBuilds: 0,
      tag: 'Buy individual features',
      tagColor: 'text-gray-800 bg-gray-100',
      gradient: 'from-gray-500 to-gray-700',
      icon: 'gift',
      features: [
        '✅ Purchase only what you need',
        '✅ No monthly commitment',
        '✅ Credits never expire',
        '✅ Mix and match features'
      ],
      popular: false
    },
    
  ];

  // REMOVED: The useEffect block that sets selectedPlan based on currentSlide.
  // This was causing the selected plan to be overwritten by the carousel's state.

  useEffect(() => {
    if (user && isOpen) {
      fetchWalletBalance();
    }
  }, [user, isOpen]);

  const fetchWalletBalance = async () => {
    if (!user) return;
    setLoadingWallet(true);
    try {
      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('amount, status')
        .eq('user_id', user.id);
      if (error) {
        console.error('Error fetching wallet balance:', error);
        return;
      }
      const completed = (transactions || []).filter((t: any) => t.status === 'completed');
      // Wallet balance is stored in Rupees in DB, convert to paise for internal use
      const balance = completed.reduce((sum: number, tr: any) => sum + parseFloat(tr.amount), 0) * 100;
      setWalletBalance(Math.max(0, balance));
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoadingWallet(false);
    }
  };

  if (!isOpen) return null;

  const getPlanIcon = (iconType: string) => {
    switch (iconType) {
      case 'crown':
        return <Crown className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'zap':
        return <Zap className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'rocket':
        return <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'target':
        return <Target className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'wrench':
        return <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'check_circle':
        return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'gift':
        return <Gift className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'briefcase':
        return <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'infinity':
        return <Infinity className="w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return <Star className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % allPlansWithAddOnOption.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allPlansWithAddOnOption.length) % allPlansWithAddOnOption.length);
  };

  const goToSlide = (index: number) => {
    // This function is currently empty, it should be implemented if you want to jump to a specific slide
    // For now, it's not used by the current carousel navigation.
    // If you intend to use it, you would set setCurrentSlide(index);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    // paymentService.applyCoupon returns amounts in paise
    const result = await paymentService.applyCoupon(selectedPlan, couponCode.trim(), user?.id || null);
    if (result.couponApplied) {
      setAppliedCoupon({
        code: result.couponApplied,
        discount: result.discountAmount,
        finalAmount: result.finalAmount,
      });
      setCouponError('');
      // ADDED: Show success alert for coupon application
      onShowAlert('Coupon Applied!', `Coupon "${result.couponApplied}" applied successfully. You saved ₹${(result.discount / 100).toFixed(2)}!`, 'success');
    } else {
      setCouponError(result.error || 'Invalid coupon code or not applicable to selected plan');
      setAppliedCoupon(null);
      // ADDED: Show error alert for coupon application failure
      onShowAlert('Coupon Error', result.error || 'Invalid coupon code or not applicable to selected plan', 'warning');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const selectedPlanData = allPlansWithAddOnOption.find((p) => p.id === selectedPlan);

  // Calculate add-ons total in paise
  const addOnsTotal = Object.entries(selectedAddOns).reduce((total, [addOnId, qty]) => {
    const addOn = paymentService.getAddOnById(addOnId);
    return total + (addOn ? addOn.price * 100 * qty : 0); // Multiply addOn.price by 100
  }, 0);

  // Plan price in paise
  let planPrice = (selectedPlanData?.price || 0) * 100; // Convert plan price to paise
  if (appliedCoupon) {
    planPrice = appliedCoupon.finalAmount; // appliedCoupon.finalAmount is already in paise
  }

  // Wallet deduction in paise
  const walletDeduction = useWalletBalance ? Math.min(walletBalance, planPrice) : 0; // walletBalance is in paise

  // Final plan price after wallet deduction, in paise
  const finalPlanPrice = Math.max(0, planPrice - walletDeduction);

  // Grand total in paise
  const grandTotal = finalPlanPrice + addOnsTotal;

  const handlePayment = async () => {
    if (!user || !selectedPlanData) return;
    setIsProcessing(true);

    // --- NEW LOG: Log walletDeduction before processing payment ---
    console.log('SubscriptionPlans: walletDeduction before payment processing:', walletDeduction);
    // --- END NEW LOG ---

    try {
      // Retrieve the session and access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('SubscriptionPlans: session object after getSession:', session);
      console.log('SubscriptionPlans: session.access_token after getSession:', session?.access_token);

      if (sessionError || !session || !session.access_token) {
        console.error('SubscriptionPlans: No active session found for payment:', sessionError);
        // Optionally, show an error message to the user or redirect to login
        onShowAlert('Authentication Required', 'Please log in to complete your purchase.', 'error', 'Sign In', () => {}); // Use onShowAlert
        setIsProcessing(false);
        return;
      }

      const accessToken = session.access_token;

      console.log('SubscriptionPlans: Value of accessToken before calling processPayment:', accessToken);

      if (grandTotal === 0) {
        // CRITICAL FIX: For zero-amount transactions, still call processFreeSubscription with selectedAddOns
        const result = await paymentService.processFreeSubscription(
          selectedPlan,
          user.id,
          appliedCoupon ? appliedCoupon.code : undefined,
          addOnsTotal, // addOnsTotal is already in paise
          selectedAddOns, // Pass selectedAddOns to processFreeSubscription
          selectedPlanData.price * 100, // Pass original plan price in paise
          walletDeduction // Pass walletDeduction
        );
        if (result.success) {
          // CRITICAL FIX: Refresh wallet balance after any successful payment
          await fetchWalletBalance();
          onSubscriptionSuccess();
          onShowAlert('Subscription Activated!', 'Your free plan has been activated successfully.', 'success'); // Use onShowAlert
        } else {
          console.error(result.error || 'Failed to activate free plan.');
          onShowAlert('Activation Failed', result.error || 'Failed to activate free plan.', 'error'); // Use onShowAlert
        }
      } else {
        const paymentData = {
          planId: selectedPlan,
          amount: grandTotal, // grandTotal is already in paise
          currency: 'INR',
        };
        const result = await paymentService.processPayment(
          paymentData,
          user.email,
          user.name,
          accessToken, // Pass the access token here
          appliedCoupon ? appliedCoupon.code : undefined,
          walletDeduction, // walletDeduction is already in paise
          addOnsTotal, // addOnsTotal is already in paise
          selectedAddOns // CRITICAL FIX: Pass selectedAddOns to processPayment
        );
        if (result.success) {
          // CRITICAL FIX: Refresh wallet balance after any successful payment
          await fetchWalletBalance();
          onSubscriptionSuccess();
          onShowAlert('Payment Successful!', 'Your subscription has been activated.', 'success'); // Use onShowAlert
        } else {
          console.error(result.error || 'Payment failed.');
          onShowAlert('Payment Failed', result.error || 'Payment processing failed. Please try again.', 'error'); // Use onShowAlert
        }
      }
    } catch (error) {
      console.error('Payment process error:', error);
      onShowAlert('Payment Error', error instanceof Error ? error.message : 'An unexpected error occurred during payment.', 'error'); // Use onShowAlert
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddOnQuantityChange = (addOnId: string, quantity: number) => {
    console.log('DEBUG: handleAddOnQuantityChange called for:', addOnId, 'with quantity:', quantity); // ADD THIS LINE
    setSelectedAddOns((prev) => ({
      ...prev,
      [addOnId]: Math.max(0, quantity),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl w-full max-w-7xl max-h-[95vh] overflow-y-auto flex flex-col">
        <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-3 sm:px-6 py-4 sm:py-8 border-b border-gray-100 flex-shrink-0">
          {/* Back button */}
          <button
            onClick={onNavigateBack}
            className="absolute top-2 sm:top-4 left-2 sm:left-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 z-10 min-w-[44px] min-h-[44px]"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* New X (close) button */}
          <button
            onClick={onNavigateBack}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 z-10 min-w-[44px] min-h-[44px]"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="text-center max-w-4xl mx-auto px-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-lg">
              <Sparkles className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-lg sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              🏆 Ultimate Resume & Job Prep Plans
            </h1>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-600 mb-3 sm:mb-6">
              AI-powered resume optimization with secure payment
            </p>
          </div>
        </div>

        <div className="p-3 sm:p-6 lg:p-8 overflow-y-auto flex-1">
          {/* Mobile Carousel */}
          <div className="block md:hidden mb-4 sm:mb-8">
            <div className="relative">
              <div className="overflow-hidden rounded-xl sm:rounded-3xl">
                <div
                  ref={carouselRef}
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {allPlansWithAddOnOption.map((plan, index) => (
                    <div key={plan.id} className="w-full flex-shrink-0 px-2 sm:px-4">
                      <div
                        className={`relative rounded-xl sm:rounded-3xl border-2 transition-all duration-300 ${
                          selectedPlan === plan.id
                            ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-100'
                            : 'border-gray-200'
                        } ${plan.popular ? 'ring-2 ring-green-500 ring-offset-4' : ''}`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {plan.popular && (
                          <div className="absolute -top-4 sm:-top-2 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs font-bold shadow-lg">
                              🏆 Most Popular
                            </span>
                          </div>
                        )}
                        <div className="p-3 sm:p-6">
                          <div className="text-center mb-3 sm:mb-6">
                            <div
                              className={`bg-gradient-to-r ${plan.gradient || ''} w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 text-white shadow-lg`}
                            >
                              {getPlanIcon(plan.icon || '')}
                            </div>
                            <div
                              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border mb-2 sm:mb-3 ${
                                plan.tagColor || ''
                              }`}
                            >
                              {plan.tag}
                            </div>
                            <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <div className="text-center mb-2 sm:mb-4">
                              <span className="text-xl sm:text-3xl font-bold text-gray-900">
                                ₹{plan.price}
                              </span>
                              <span className="text-gray-600 ml-1 text-xs sm:text-base">
                                /{plan.duration.toLowerCase()}
                              </span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-2xl p-2 sm:p-4 text-center mb-3 sm:mb-6">
                            <div className="text-lg sm:text-2xl font-bold text-indigo-600">{plan.optimizations}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Resume Credits</div>
                          </div>
                          <ul className="space-y-1 sm:space-y-3 mb-3 sm:mb-6 max-h-32 sm:max-h-none overflow-y-auto sm:overflow-visible">
                            {plan.features.slice(0, 4).map((feature: string, fi: number) => (
                              <li key={fi} className="flex items-start">
                                <Check className="w-3 h-3 sm:w-5 h-5 text-emerald-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 text-xs sm:text-sm break-words">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          {/* ADDED: Select Plan button for mobile carousel */}
                          <button
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`w-full py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-base min-h-[44px] mt-2 ${
                              selectedPlan === plan.id
                                ? `bg-gradient-to-r ${plan.gradient || ''} text-white shadow-lg transform scale-105`
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {selectedPlan === plan.id ? (
                              <span className="flex items-center justify-center">
                                <Check className="w-3 h-3 sm:w-5 h-5 mr-1 sm:mr-2" />
                                Selected
                              </span>
                            ) : (
                              'Select Plan'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={prevSlide}
                className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4 sm:w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4 sm:w-6 h-6" />
              </button>
              <div className="flex justify-center space-x-2 mt-3 sm:mt-6">
                {allPlansWithAddOnOption.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`w-2 h-2 sm:w-3 h-3 rounded-full transition-all duration-200 ${
                      idx === currentSlide ? 'bg-indigo-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-6 mb-4 lg:mb-8">
            {allPlansWithAddOnOption.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl lg:rounded-3xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                  selectedPlan === plan.id
                    ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-100'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-xl'
                } ${plan.popular ? 'ring-2 ring-green-500 ring-offset-4' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                 <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
  <span
    className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 lg:px-4 py-1 lg:py-2 rounded-full text-xs lg:text-sm font-bold shadow-lg"
    style={{ fontSize: '10px', lineHeight: '1rem' }}
  >
    <span className="mr-1 text-sm">🏆</span> Most Popular
  </span>
</div>


                )}
                <div className="p-3 lg:p-6">
                  <div className="text-center mb-3 lg:mb-6">
                    <div
                      className={`bg-gradient-to-r ${plan.gradient || ''} w-10 h-10 lg:w-16 h-16 rounded-lg lg:rounded-2xl flex items-center justify-center mx-auto mb-2 lg:mb-4 text-white shadow-lg`}
                    >
                      {getPlanIcon(plan.icon || '')}
                    </div>
                    <div
                      className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium border mb-1 lg:mb-3 ${
                        plan.tagColor || ''
                      }`}
                    >
                      {plan.tag}
                    </div>
                    <h3 className="text-sm lg:text-xl font-bold text-gray-900 mb-2 break-words">{plan.name}</h3>
                    <div className="text-center mb-2 lg:mb-4">
                      <span className="text-lg lg:text-3xl font-bold text-gray-900">₹{plan.price}</span>
                      <span className="text-gray-600 ml-1 text-xs lg:text-base">
                        /{plan.duration.toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg lg:rounded-2xl p-2 lg:p-4 text-center mb-3 lg:mb-6">
                    <div className="text-lg lg:text-2xl font-bold text-indigo-600">{plan.optimizations}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Resume Credits</div>
                  </div>
                  <ul className="space-y-1 lg:space-y-3 mb-3 lg:mb-6 max-h-24 lg:max-h-none overflow-y-auto lg:overflow-visible">
                    {plan.features.slice(0, 4).map((feature: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-3 h-3 lg:w-5 h-5 text-emerald-500 mr-1 lg:mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-xs lg:text-sm break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2 lg:py-3 px-2 lg:px-4 rounded-lg lg:rounded-xl font-semibold transition-all duration-300 text-xs lg:text-base min-h-[44px] ${
                      selectedPlan === plan.id
                        ? `bg-gradient-to-r ${plan.gradient || ''} text-white shadow-lg transform scale-105`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPlan === plan.id ? (
                      <span className="flex items-center justify-center">
                        <Check className="w-3 h-3 lg:w-5 h-5 mr-1 lg:mr-2" />
                        Selected
                      </span>
                    ) : (
                      'Select Plan'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="max-w-2xl mx-auto mt-4 sm:mt-6">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg sm:rounded-2xl p-3 sm:p-6 mb-3 sm:mb-6 border border-gray-200">
              <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Crown className="w-4 h-4 sm:w-5 h-5 mr-2 text-indigo-600" />
                Payment Summary
              </h3>
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Selected Plan:</span>
                  <span className="font-semibold break-words text-right">{selectedPlanData?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Credits:</span>
                  <span className="font-semibold">{selectedPlanData?.optimizations} Resume Credits</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Duration:</span>
                  <span className="font-semibold">{selectedPlanData?.duration}</span>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  {!appliedCoupon ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm min-h-[44px]"
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm min-h-[44px]"
                      >
                        Apply Coupon
                      </button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-green-800 font-medium text-sm">
                            Coupon "{appliedCoupon.code}" applied
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-green-600 hover:text-green-800 text-sm underline"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="text-green-700 text-sm mt-1">
                        You saved ₹{(appliedCoupon.discount / 100).toFixed(2)}!
                      </div>
                    </div>
                  )}
                  {couponError && (
                    <div className="text-red-600 text-sm flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {couponError}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-2 sm:pt-3 mt-3">
                  {/* Wallet balance section, now with a disable condition */}
                  {!loadingWallet && walletBalance > 0 && (
                    <div className={`mb-3 p-3 rounded-lg ${selectedPlan === 'addon_only_purchase' ? 'bg-gray-100 border-gray-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${selectedPlan === 'addon_only_purchase' ? 'text-gray-500' : 'text-green-800'}`}>Use Wallet Balance</span>
                        <button
                          onClick={() => setUseWalletBalance((prev) => !prev)}
                          disabled={selectedPlan === 'addon_only_purchase'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            useWalletBalance && selectedPlan !== 'addon_only_purchase' ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              useWalletBalance && selectedPlan !== 'addon_only_purchase' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {selectedPlan !== 'addon_only_purchase' && (
                        <div className="text-sm text-green-700">
                          Available: ₹{(walletBalance / 100).toFixed(2)}
                          {useWalletBalance && (
                            <span className="block mt-1">Using: ₹{(walletDeduction / 100).toFixed(2)}</span>
                          )}
                        </div>
                      )}
                      {/* Added message for add-on-only plan */}
                      {selectedPlan === 'addon_only_purchase' && (
                        <div className="text-sm text-gray-500 flex items-center mt-2">
                          <Info className="w-4 h-4 mr-2" />
                          <span>Wallet balance cannot be used for add-on only purchases.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {appliedCoupon && appliedCoupon.discount > 0 && (
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                      <span>Original Price:</span>
                      <span className="line-through">₹{selectedPlanData?.price}</span>
                    </div>
                  )}
                  {appliedCoupon && appliedCoupon.discount > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600 mb-2">
                      <span>Discount:</span>
                      <span>-₹{(appliedCoupon.discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {useWalletBalance && walletDeduction > 0 && (
                    <div className="flex justify-between items-center text-sm text-blue-600 mb-2">
                      <span>Wallet Balance Applied:</span>
                      <span>-₹{(walletDeduction / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-base sm:text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-indigo-600">₹{(grandTotal / 100).toFixed(2)}</span>
                  </div>
                  {addOnsTotal > 0 && (
                    <div className="text-sm text-gray-600 mt-2">
                      Plan: ₹{(finalPlanPrice / 100).toFixed(2)} + Add-ons: ₹{(addOnsTotal / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add-ons */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg sm:rounded-2xl p-3 sm:p-6 mb-3 sm:mb-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-xl font-semibold text-gray-900 flex items-center">
                  <Plus className="w-4 h-4 sm:w-5 h-5 mr-2 text-blue-600" />
                  🛒 Add-Ons (Optional)
                </h3>
                <button
                  onClick={() => setShowAddOns((prev) => !prev)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {showAddOns ? 'Hide' : 'Show'} Add-ons
                </button>
              </div>
              {showAddOns && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {addOns.map((addOn) => (
                    <div
                      key={addOn.id}
                      className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{addOn.name}</h4>
                          <p className="text-blue-600 font-semibold">₹{addOn.price}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleAddOnQuantityChange(addOn.id, (selectedAddOns[addOn.id] || 0) - 1)
                            }
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{selectedAddOns[addOn.id] || 0}</span>
                          <button
                            onClick={() =>
                              handleAddOnQuantityChange(addOn.id, (selectedAddOns[addOn.id] || 0) + 1)
                            }
                            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Button */}
            <div className="text-center px-2 sm:px-0">
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full max-w-md mx-auto py-3 sm:py-4 px-4 sm:px-8 rounded-lg sm:rounded-2xl font-bold text-sm sm:text-lg transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 min-h-[44px] ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-6 h-6 border-2 border-white border-t-transparent" />
                    <span className="break-words">Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-6 h-6 flex-shrink-0" />
                    <span className="break-words text-center">
                      {grandTotal === 0 ? 'Get Free Plan' : `Pay ₹${(grandTotal / 100).toFixed(2)} - Start Optimizing`}
                    </span>
                    <ArrowRight className="w-3 h-3 sm:w-5 h-5 flex-shrink-0" />
                  </>
                )}
              </button>
              <p className="text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4 flex items-center justify-center break-words px-4">
                <Info className="w-3 h-3 sm:w-4 h-4 mr-1 flex-shrink-0" />
                <span>Secure payment powered by Razorpay • 256-bit SSL encryption</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
