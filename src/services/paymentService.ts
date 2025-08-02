// src/services/paymentService.ts
import { SubscriptionPlan, PaymentData, RazorpayOptions, RazorpayResponse, Subscription } from '../types/payment';
import { supabase } from '../lib/supabaseClient';

declare global {
  interface Window {
    Razorpay: any; // Declare Razorpay to be available on the window object
  }
}

class PaymentService {
  // Get Razorpay key from environment variables
  private readonly RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_U7N6E8ot31tiej';
  
  // Coupon codes
  private readonly COUPON_FIRST100_CODE = 'first100';
  private readonly COUPON_WORTHYONE_CODE = 'worthyone';

  // Updated subscription plans - New structure
  private readonly plans: SubscriptionPlan[] = [
    {
      id: 'career_pro_max',
      name: '💎 Career Pro Max',
      price: 1999,
      duration: 'One-time Purchase',
      optimizations: 30,
      scoreChecks: 50,
      linkedinMessages: Infinity, // Unlimited
      guidedBuilds: 5,
      tag: 'Serious job seekers & job switchers',
      tagColor: 'text-purple-800 bg-purple-100',
      gradient: 'from-purple-500 to-indigo-500',
      icon: 'crown',
      features: [
        '✅ 3 Months LinkedIn Premium',
        '✅ 30 JD-Based Optimizations',
        '✅ 5 Guided Resume Builds',
        '✅ 50 Resume Score Checks',
        '✅ Unlimited LinkedIn Messages (1 Month)',
        '✅ 1 Resume Guidance Session (Live)',
        '✅ Job Application Tutorial Video'
      ],
      popular: true
    },
    {
      id: 'career_boost_plus',
      name: '⭐ Career Boost+',
      price: 1499,
      duration: 'One-time Purchase',
      optimizations: 15,
      scoreChecks: 30,
      linkedinMessages: Infinity, // Unlimited
      guidedBuilds: 3,
      tag: 'Active job seekers',
      tagColor: 'text-blue-800 bg-blue-100',
      gradient: 'from-blue-500 to-cyan-500',
      icon: 'zap',
      features: [
        '✅ 15 JD-Based Optimizations',
        '✅ 3 Guided Resume Builds',
        '✅ 30 Resume Score Checks',
        '✅ Unlimited LinkedIn Messages (1 Month)',
        '✅ 1 Resume Guidance Session (Live)'
      ]
    },
    {
      id: 'pro_resume_kit',
      name: '🔥 Pro Resume Kit',
      price: 999,
      duration: 'One-time Purchase',
      optimizations: 10,
      scoreChecks: 20,
      linkedinMessages: 100,
      guidedBuilds: 2,
      tag: 'Freshers & intern seekers',
      tagColor: 'text-orange-800 bg-orange-100',
      gradient: 'from-orange-500 to-red-500',
      icon: 'rocket',
      features: [
        '✅ 10 JD-Based Optimizations',
        '✅ 2 Guided Resume Builds',
        '✅ 20 Resume Score Checks',
        '✅ 100 LinkedIn Messages'
      ]
    },
    {
      id: 'smart_apply_pack',
      name: '⚡ Smart Apply Pack',
      price: 499,
      duration: 'One-time Purchase',
      optimizations: 5,
      scoreChecks: 10,
      linkedinMessages: 50,
      guidedBuilds: 1,
      tag: 'Targeted resume improvement',
      tagColor: 'text-green-800 bg-green-100',
      gradient: 'from-green-500 to-emerald-500',
      icon: 'target',
      features: [
        '✅ 5 JD-Based Optimizations',
        '✅ 2 Guided Resume Build',
        '✅ 10 Resume Score Checks',
        '✅ 50 LinkedIn Messages'
      ]
    },
    {
      id: 'resume_fix_pack',
      name: '🛠 Resume Fix Pack',
      price: 199,
      duration: 'One-time Purchase',
      optimizations: 2,
      scoreChecks: 2,
      linkedinMessages: 0,
      guidedBuilds: 0,
      tag: 'Quick fixes for job applications',
      tagColor: 'text-gray-800 bg-gray-100',
      gradient: 'from-gray-500 to-gray-700',
      icon: 'wrench',
      features: [
        '✅ 2 JD-Based Optimizations',
        '✅ 2 Resume Score Checks',
        '✅ 1 Guided Resume Build'
      ]
    },
    {
      id: 'lite_check',
      name: '🎯 Lite Check',
      price: 99,
      duration: 'One-time Purchase',
      optimizations: 1,
      scoreChecks: 2,
      linkedinMessages: 10,
      guidedBuilds: 0,
      tag: 'First-time premium users',
      tagColor: 'text-teal-800 bg-teal-100',
      gradient: 'from-teal-500 to-blue-500',
      icon: 'check_circle',
      features: [
        '✅ 1 JD-Based Optimization',
        '✅ 2 Resume Score Checks',
        '✅ 10 LinkedIn Messages'
      ]
    },
    {
      id: 'free_trial',
      name: '🧪 Free Trial',
      price: 0,
      duration: 'One-time Use',
      optimizations: 0, // No JD-based optimizations
      scoreChecks: 2,
      linkedinMessages: 5,
      guidedBuilds: 0,
      tag: 'New users just exploring',
      tagColor: 'text-yellow-800 bg-yellow-100',
      gradient: 'from-yellow-500 to-orange-500',
      icon: 'gift',
      features: [
        '✅ 2 Resume Score Checks',
        '✅ 5 LinkedIn Messages'
      ]
    }
  ];

  // Add-on products for individual purchases
  private readonly addOns = [
    {
      id: 'jd_optimization_single',
      name: 'JD-Based Optimization (1x)',
      price: 49,
      type: 'optimization',
      quantity: 1
    },
    {
      id: 'guided_resume_build_single',
      name: 'Guided Resume Build (1x)',
      price: 99,
      type: 'guided_build',
      quantity: 1
    },
    {
      id: 'resume_score_check_single',
      name: 'Resume Score Check (1x)',
      price: 19,
      type: 'score_check',
      quantity: 1
    },
    {
      id: 'linkedin_messages_50',
      name: 'LinkedIn Messages (50x)',
      price: 29,
      type: 'linkedin_messages',
      quantity: 50
    },
    {
      id: 'linkedin_optimization_single',
      name: 'LinkedIn Optimization (1x Review)',
      price: 199,
      type: 'linkedin_optimization',
      quantity: 1
    },
    {
      id: 'resume_guidance_session',
      name: 'Resume Guidance Session (Live)',
      price: 299,
      type: 'guidance_session',
      quantity: 1
    }
  ];

  // Get all add-ons
  getAddOns() {
    return this.addOns;
  }

  // Get add-on by ID
  getAddOnById(addOnId: string) {
    return this.addOns.find(addon => addon.id === addOnId) || null;
  }

  // Load Razorpay script
  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Get all subscription plans
  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  // Get plan by ID
  getPlanById(planId: string): SubscriptionPlan | null {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  // Apply coupon code
  applyCoupon(planId: string, couponCode: string): { finalAmount: number; discountAmount: number; couponApplied: string | null } {
    const plan = this.getPlanById(planId);
    if (!plan) {
      return { finalAmount: 0, discountAmount: 0, couponApplied: null };
    }

    const normalizedCoupon = couponCode.toLowerCase().trim();

    // first100 coupon - free starter plan only
    if (normalizedCoupon === this.COUPON_FIRST100_CODE && planId === 'starter') {
      return {
        finalAmount: 0,
        discountAmount: plan.price,
        couponApplied: this.COUPON_FIRST100_CODE
      };
    }

    // worthyone coupon - 50% off any plan
    if (normalizedCoupon === this.COUPON_WORTHYONE_CODE) {
      const discountAmount = Math.floor(plan.price * 0.5);
      return {
        finalAmount: plan.price - discountAmount,
        discountAmount: discountAmount,
        couponApplied: this.COUPON_WORTHYONE_CODE
      };
    }

    // Invalid or no coupon
    return {
      finalAmount: plan.price,
      discountAmount: 0,
      couponApplied: null
    };
  }

  // Create Razorpay order via backend
  private async createOrder(planId: string, grandTotal: number, addOnsTotal: number, couponCode?: string, walletDeduction?: number): Promise<{ orderId: string; amount: number; keyId: string }> {
    console.log('createOrder: Function called to create a new order.');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('createOrder: User not authenticated.');
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.error('createOrder: Supabase URL not configured.');
        throw new Error('Supabase URL not configured');
      }
      
      const fullFunctionUrl = `${supabaseUrl}/functions/v1/create-order`;
      console.log('createOrder: Calling backend function at:', fullFunctionUrl);

      const response = await fetch(fullFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          amount: grandTotal, // Pass the grand total to the backend
          addOnsTotal,
          couponCode: couponCode || undefined,
          walletDeduction: walletDeduction || 0
        }),
      });

      console.log('createOrder: Received response from backend with status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('createOrder: Backend returned an error:', errorData);
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderResult = await response.json();
      console.log('createOrder: Order created successfully with Order ID:', orderResult.orderId);
      return orderResult;
    } catch (error) {
      console.error('createOrder: Error creating order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verifies a Razorpay payment by calling a Supabase Edge Function.
   */
  private async verifyPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    accessToken: string
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    console.log('verifyPayment: STARTING FUNCTION EXECUTION (with explicit access token).');
    try {
      console.log('verifyPayment: Checking provided access token parameter...');
      if (!accessToken) {
        console.error('verifyPayment: Access token NOT provided as a parameter. Throwing error.');
        throw new Error('User not authenticated: Access token missing');
      }
      console.log('verifyPayment: Access Token explicitly provided and present.');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.error('verifyPayment: Supabase URL is not configured. Throwing error.');
        throw new Error('Supabase URL not configured');
      }

      const fullFunctionUrl = `${supabaseUrl}/functions/v1/verify-payment`;
      console.log('verifyPayment: Full function URL for fetch:', fullFunctionUrl);
      console.log('📱 Full function URL for mobile (using VITE_SUPABASE_URL):', fullFunctionUrl);

      const response = await fetch(fullFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        }),
      });

      console.log('verifyPayment: Received response from verify-payment Edge Function. Status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('verifyPayment: Edge Function error response:', errorData);
        throw new Error(errorData.error || 'Payment verification failed');
      }

      const finalResult = await response.json();
      console.log('verifyPayment: Final verification result:', finalResult);
      return finalResult;
    } catch (error) {
      console.error('verifyPayment: Caught error in main try-catch block:', error);
      return { success: false, error: 'Payment verification failed due to network or server error.' };
    }
  }

  // Process payment
  async processPayment(
    paymentData: PaymentData,
    userEmail: string,
    userName: string,
    couponCode?: string,
    walletDeduction?: number,
    addOnsTotal?: number
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    console.log('processPayment: Function called with paymentData:', paymentData);
    try {
      // Load Razorpay script
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        console.error('processPayment: Failed to load payment gateway script.');
        throw new Error('Failed to load payment gateway');
      }
      console.log('processPayment: Razorpay script loaded successfully.');

      console.log('processPayment: Attempting to get user session for payment processing...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('processPayment: Raw getSession result:', { sessionData: session });

      if (!session || !session.access_token) {
        console.error('processPayment: User not authenticated or access token missing. Aborting payment process.');
        throw new Error('User not authenticated for payment processing. Please log in again.');
      }
      const userAccessToken = session.access_token;
      console.log('processPayment: User session and access token obtained.');

      // Create order via backend, now passing grandTotal and addOnsTotal
      const orderData = await this.createOrder(paymentData.planId, paymentData.amount, addOnsTotal || 0, couponCode, walletDeduction);
      console.log('processPayment: Order created successfully:', orderData.orderId, 'Amount:', orderData.amount);

      return new Promise((resolve) => {
        const options: RazorpayOptions = {
          key: orderData.keyId,
          amount: orderData.amount, // Amount in smallest currency unit (paise)
          currency: paymentData.currency,
          name: 'Resume Optimizer',
          description: `Subscription for ${this.getPlanById(paymentData.planId)?.name}`,
          order_id: orderData.orderId,
          handler: async (response: RazorpayResponse) => {
            console.log('Razorpay handler fired. Response:', response);
            try {
              console.log('Attempting to verify payment with Supabase Edge Function...');
              const verificationResult = await this.verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature,
                userAccessToken
              );
              console.log('Verification result from verifyPayment:', verificationResult);
              resolve(verificationResult);
            } catch (error) {
              console.error('Error during payment verification in handler:', error);
              console.error('Detailed verification error:', error instanceof Error ? error.message : String(error));
              resolve({ success: false, error: 'Payment verification failed' });
            }
          },
          prefill: {
            name: userName,
            email: userEmail,
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: () => {
              console.log('Razorpay modal dismissed by user.');
              resolve({ success: false, error: 'Payment cancelled by user' });
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        console.log('processPayment: Razorpay modal opened.');
      });
    } catch (error) {
      console.error('Payment processing error in processPayment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Payment processing failed' };
    }
  }

  // New method to process free subscriptions
  async processFreeSubscription(planId: string, userId: string, couponCode?: string, addOnsTotal?: number): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const plan = this.getPlanById(planId);
      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      const now = new Date();
      let endDate = new Date(now);

      // Determine end date based on plan duration
      if (plan.duration.toLowerCase().includes('lifetime')) {
        endDate.setFullYear(now.getFullYear() + 100);
      } else if (plan.duration.toLowerCase().includes('year')) {
        const years = parseInt(plan.duration.split(' ')[0]);
        endDate.setFullYear(now.getFullYear() + years);
      } else if (plan.duration.toLowerCase().includes('month')) {
        const months = parseInt(plan.duration.split(' ')[0]);
        endDate.setMonth(now.getMonth() + months);
      } else {
        endDate.setFullYear(now.getFullYear() + 1);
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          optimizations_used: 0,
          optimizations_total: plan.optimizations,
          score_checks_used: 0,
          score_checks_total: plan.scoreChecks,
          linkedin_messages_used: 0,
          linkedin_messages_total: plan.linkedinMessages,
          guided_builds_used: 0,
          guided_builds_total: plan.guidedBuilds,
          payment_id: null,
          coupon_used: couponCode || null,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating free subscription:', error);
        throw new Error(error.message || 'Failed to create free subscription');
      }

      return { success: true, subscriptionId: data.id };

    } catch (error) {
      console.error('Error in processFreeSubscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to process free subscription' };
    }
  }

  // Get user's active subscription from Supabase
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          optimizations_used,
          optimizations_total,
          score_checks_used,
          score_checks_total,
          linkedin_messages_used,
          linkedin_messages_total,
          guided_builds_used,
          guided_builds_total
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error getting subscription:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        planId: data.plan_id,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        optimizationsUsed: data.optimizations_used,
        optimizationsTotal: data.optimizations_total,
        paymentId: data.payment_id,
        couponUsed: data.coupon_used,
        scoreChecksUsed: data.score_checks_used,
        scoreChecksTotal: data.score_checks_total,
        linkedinMessagesUsed: data.linkedin_messages_used,
        linkedinMessagesTotal: data.linkedin_messages_total,
        guidedBuildsUsed: data.guided_builds_used,
        guidedBuildsTotal: data.guided_builds_total
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  // Use optimization (decrement count)
  async useOptimization(userId: string): Promise<{ success: boolean; remaining: number }> {
    try {
      // Get active subscription
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return { success: false, remaining: 0 };
      }

      const remaining = subscription.optimizationsTotal - subscription.optimizationsUsed;
      
      if (remaining <= 0) {
        return { success: false, remaining: 0 };
      }

      // Update optimization count
      const { error } = await supabase
        .from('subscriptions')
        .update({  
          optimizations_used: subscription.optimizationsUsed + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) {
        console.error('Error using optimization:', error);
        return { success: false, remaining: 0 };
      }

      return { success: true, remaining: remaining - 1 };
    } catch (error) {
      console.error('Error using optimization:', error);
      return { success: false, remaining: 0 };
    }
  }

  // Check if user can optimize
  async canOptimize(userId: string): Promise<{ canOptimize: boolean; remaining: number; subscription?: Subscription }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return { canOptimize: false, remaining: 0 };
      }

      const remaining = subscription.optimizationsTotal - subscription.optimizationsUsed;
      
      return {  
        canOptimize: remaining > 0,  
        remaining,
        subscription
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { canOptimize: false, remaining: 0 };
    }
  }

  // Get subscription history
  async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          optimizations_used,
          optimizations_total,
          score_checks_used,
          score_checks_total,
          linkedin_messages_used,
          linkedin_messages_total,
          guided_builds_used,
          guided_builds_total,
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting subscription history:', error);
        return [];
      }

      return data.map(sub => ({
        id: sub.id,
        userId: sub.user_id,
        planId: sub.plan_id,
        status: sub.status,
        startDate: sub.start_date,
        endDate: sub.end_date,
        optimizationsUsed: sub.optimizations_used,
        optimizationsTotal: sub.optimizations_total,
        paymentId: sub.payment_id,
        couponUsed: sub.coupon_used,
        scoreChecksUsed: sub.score_checks_used,
        scoreChecksTotal: sub.score_checks_total,
        linkedinMessagesUsed: sub.linkedin_messages_used,
        linkedinMessagesTotal: sub.linkedin_messages_total,
        guidedBuildsUsed: sub.guided_builds_used,
        guidedBuildsTotal: sub.guided_builds_total
      }));
    } catch (error) {
      console.error('Error getting subscription history:', error);
      return [];
    }
  }

  // Get payment transactions
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting payment history:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId);

      if (error) {
        console.error('Error cancelling subscription:', error);
        return { success: false, error: 'Failed to cancel subscription' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  // Activate free trial for new users
  async activateFreeTrial(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already has an active subscription
      const existingSubscription = await this.getUserSubscription(userId);
      if (existingSubscription) {
        return { success: false, error: 'User already has an active subscription' };
      }

      // Create free trial subscription
      const result = await this.processFreeSubscription('free_trial', userId);
      return result;
    } catch (error) {
      console.error('Error activating free trial:', error);
      return { success: false, error: 'Failed to activate free trial' };
    }
  }
}

export const paymentService = new PaymentService();
// Payment types for the application
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  optimizations: number;
  scoreChecks: number;
  linkedinMessages: number;
  guidedBuilds: number;
  tag: string;
  tagColor: string;
  gradient: string;
  icon: string;
  features: string[];
  popular?: boolean;
}

export interface PaymentData {
  planId: string;
  amount: number;
  currency: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  optimizationsUsed: number;
  optimizationsTotal: number;
  paymentId: string | null;
  couponUsed: string | null;
  scoreChecksUsed: number;
  scoreChecksTotal: number;
  linkedinMessagesUsed: number;
  linkedinMessagesTotal: number;
  guidedBuildsUsed: number;
  guidedBuildsTotal: number;
}
