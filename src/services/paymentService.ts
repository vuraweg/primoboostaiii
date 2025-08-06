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
  private readonly RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID; // Removed hardcoded fallback
  
  // Coupon codes
  private readonly COUPON_FIRST100_CODE = 'first100';
  private readonly COUPON_WORTHYONE_CODE = 'worthyone';
  private readonly COUPON_FULL_SUPPORT_CODE = 'fullsupport'; // NEW: Full Support Coupon
  private readonly COUPON_FIRST500_CODE = 'first500'; // NEW: First 500 Coupon

  // Updated subscription plans - New structure
  private readonly plans: SubscriptionPlan[] = [
    {
      id: 'career_pro_max',
      name: '💎 Career Pro Max',
      price: 1999,
      duration: 'One-time Purchase',
      optimizations: 50, // Updated from 30
      scoreChecks: 50,
      linkedinMessages: 99999, // Unlimited
      guidedBuilds: 5,
      tag: 'Serious job seekers & job switchers',
      tagColor: 'text-purple-800 bg-purple-100',
      gradient: 'from-purple-500 to-indigo-500',
      icon: 'crown',
      features: [
        '✅ 3 Months LinkedIn Premium',
        '✅ 50 JD-Based Optimizations',
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
      optimizations: 30, // Updated
      scoreChecks: 30,
      linkedinMessages: 99999, // Updated
      guidedBuilds: 3,
      tag: 'Active job seekers',
      tagColor: 'text-blue-800 bg-blue-100',
      gradient: 'from-blue-500 to-cyan-500',
      icon: 'zap',
      features: [
        '✅ 30 JD-Based Optimizations',
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
      optimizations: 20, // Updated
      scoreChecks: 20,
      linkedinMessages: 100,
      guidedBuilds: 2,
      tag: 'Freshers & intern seekers',
      tagColor: 'text-orange-800 bg-orange-100',
      gradient: 'from-orange-500 to-red-500',
      icon: 'rocket',
      features: [
        '✅ 20 JD-Based Optimizations',
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
      optimizations: 10,
      scoreChecks: 10,
      linkedinMessages: 50,
      guidedBuilds: 1,
      tag: 'Targeted resume improvement',
      tagColor: 'text-green-800 bg-green-100',
      gradient: 'from-green-500 to-emerald-500',
      icon: 'target',
      features: [
        '✅ 10 JD-Based Optimizations',
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
      optimizations: 5,
      scoreChecks: 2,
      linkedinMessages: 0,
      guidedBuilds: 0,
      tag: 'Quick fixes for job applications',
      tagColor: 'text-gray-800 bg-gray-100',
      gradient: 'from-gray-500 to-gray-700',
      icon: 'wrench',
      features: [
        '✅ 5 JD-Based Optimizations',
        '✅ 2 Resume Score Checks',
        '✅ 1 Guided Resume Build'
      ]
    },
    {
      id: 'lite_check',
      name: '🎯 Lite Check',
      price: 99,
      duration: 'One-time Purchase',
      optimizations: 2, // Updated
      scoreChecks: 2,
      linkedinMessages: 10,
      guidedBuilds: 0,
      tag: 'First-time premium users',
      tagColor: 'text-teal-800 bg-teal-100',
      gradient: 'from-teal-500 to-blue-500',
      icon: 'check_circle',
      features: [
        '✅ 2 JD-Based Optimizations',
        '✅ 2 Resume Score Checks',
        '✅ 10 LinkedIn Messages'
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
  async applyCoupon(planId: string, couponCode: string, userId: string | null): Promise<{ finalAmount: number; discountAmount: number; couponApplied: string | null; error?: string }> {
    const plan = this.getPlanById(planId);
    if (!plan) {
      return { finalAmount: 0, discountAmount: 0, couponApplied: null, error: 'Plan not found.' };
    }

    const normalizedCoupon = couponCode.toLowerCase().trim();

    // Check if user has already used this coupon (frontend check)
    if (userId) {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['success', 'failed']) // MODIFIED: Check for both 'success' and 'failed' statuses
        .eq('coupon_code', normalizedCoupon)
        .limit(1);

      if (error) {
        console.error('Error checking coupon usage on frontend:', error);
        // Continue without applying coupon if there's a database error
        return {
          finalAmount: plan.price * 100, // Return in paise
          discountAmount: 0,
          couponApplied: null,
          error: 'Failed to verify coupon usage. Please try again.'
        };
      }

      if (data && data.length > 0) {
        return {
          finalAmount: plan.price * 100, // Return in paise
          discountAmount: 0,
          couponApplied: null,
          error: 'This coupon has already been used by your account.'
        };
      }
    }

    // NEW: full_support coupon - free career_pro_max plan
    if (normalizedCoupon === this.COUPON_FULL_SUPPORT_CODE && planId === 'career_pro_max') {
      return {
        finalAmount: 0,
        discountAmount: plan.price * 100, // Return in paise
        couponApplied: this.COUPON_FULL_SUPPORT_CODE
      };
    }

    // first100 coupon - free lite_check plan only
    if (normalizedCoupon === this.COUPON_FIRST100_CODE && planId === 'lite_check') {
      return {
        finalAmount: 0,
        discountAmount: plan.price * 100, // Return in paise
        couponApplied: this.COUPON_FIRST100_CODE
      };
    }

    // first500 coupon - 98% off lite_check plan only (NEW LOGIC)
    if (normalizedCoupon === this.COUPON_FIRST500_CODE && planId === 'lite_check') {
      const discountAmount = Math.floor(plan.price * 100 * 0.98); // Calculate in paise
      return {
        finalAmount: (plan.price * 100) - discountAmount, // Calculate in paise
        discountAmount: discountAmount,
        couponApplied: this.COUPON_FIRST500_CODE
      };
    }

    // worthyone coupon - 50% off career_pro_max plan only
    if (normalizedCoupon === this.COUPON_WORTHYONE_CODE && planId === 'career_pro_max') {
      const discountAmount = Math.floor(plan.price * 100 * 0.5); // Calculate in paise
      return {
        finalAmount: (plan.price * 100) - discountAmount, // Calculate in paise
        discountAmount: discountAmount,
        couponApplied: this.COUPON_WORTHYONE_CODE
      };
    }

    // Invalid or no coupon
    return {
      finalAmount: plan.price * 100, // Return in paise
      discountAmount: 0,
      couponApplied: null
    };
  }

  // Create Razorpay order via backend
  // Updated createOrder signature to include selectedAddOns
  private async createOrder(
    planId: string,
    grandTotal: number,
    addOnsTotal: number,
    couponCode?: string,
    walletDeduction?: number,
    selectedAddOns?: { [key: string]: number } // ADDED THIS PARAMETER
  ): Promise<{ orderId: string; amount: number; keyId: string; transactionId: string }> {
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
      console.log('createOrder: Access Token (first 10 chars):', session.access_token ? session.access_token.substring(0, 10) + '...' : 'N/A');
      // ADDED selectedAddOns to the log
      console.log('createOrder: Request Body:', { planId, amount: grandTotal, addOnsTotal, couponCode, walletDeduction, selectedAddOns });

      const response = await fetch(fullFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          amount: grandTotal, // Pass the grand total to the backend (already in paise)
          addOnsTotal,
          couponCode: couponCode || undefined,
          walletDeduction: walletDeduction || 0,
          selectedAddOns: selectedAddOns || {} // ADDED selectedAddOns HERE
        }),
      });

      console.log('createOrder: Received response from backend with status:', response.status, response.statusText);

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
   * Now accepts transactionId to update the pending record.
   */
  private async verifyPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    accessToken: string,
    transactionId: string // ADDED: transactionId parameter
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
          razorpay_signature,
          transactionId // ADDED: Pass transactionId to the backend
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
    accessToken: string,
    couponCode?: string,
    walletDeduction?: number,
    addOnsTotal?: number,
    selectedAddOns?: { [key: string]: number } // Ensure this parameter is here
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    console.log('processPayment: Function called with paymentData:', paymentData);
    // --- NEW LOG: Log walletDeduction received in processPayment ---
    console.log('processPayment: walletDeduction received:', walletDeduction);
    // --- END NEW LOG ---
    try {
      console.log('processPayment: Attempting to load Razorpay script...');
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        console.error('processPayment: Failed to load payment gateway script.');
        throw new Error('Failed to load payment gateway');
      }
      console.log('processPayment: Razorpay script loaded successfully.');

      console.log('processPayment: User session and access token obtained from calling component.');
      console.log('processPayment: User Access Token (first 10 chars):', accessToken ? accessToken.substring(0, 10) + '...' : 'N/A (undefined/null)');

      console.log('processPayment: Calling createOrder to initiate a new Razorpay order...');
      let orderData;
      try {
        orderData = await this.createOrder(
          paymentData.planId,
          paymentData.amount,
          addOnsTotal || 0,
          couponCode,
          walletDeduction,
          selectedAddOns // ADDED selectedAddOns HERE
        );
        console.log('processPayment: Order created successfully with Order ID:', orderData.orderId, 'Amount:', orderData.amount, 'Transaction ID:', orderData.transactionId);
        console.log('processPayment: Received orderData from backend:', orderData);
      } catch (createOrderError) {
        console.error('processPayment: Error creating order via backend:', createOrderError);
        throw new Error(`Failed to create payment order: ${createOrderError instanceof Error ? createOrderError.message : String(createOrderError)}`);
      }

      return new Promise((resolve) => {
        const options: RazorpayOptions = {
          key: orderData.keyId,
          amount: orderData.amount, // Amount is already in paise
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
                accessToken,
                orderData.transactionId // ADDED: Pass transactionId to verifyPayment
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
              // If user dismisses, mark the pending transaction as failed
              supabase.from('payment_transactions')
                .update({ status: 'failed' })
                .eq('id', orderData.transactionId)
                .then(({ error }) => {
                  if (error) console.error('Error updating pending transaction to failed on dismiss:', error);
                });
              resolve({ success: false, error: 'Payment cancelled by user' });
            },
          },
        };

        // NEW LOG: Inspect options object
        console.log('processPayment: Razorpay options object:', options);

        const razorpay = new window.Razorpay(options);
        // NEW LOG: Inspect razorpay instance
        console.log('processPayment: Razorpay instance created:', razorpay);

        console.log('processPayment: Attempting to open Razorpay modal...');
        razorpay.open();
        console.log('processPayment: Razorpay modal opened (or attempted to open).');
      });
    } catch (error) {
      console.error('Payment processing error in processPayment (outer catch block):', error);
      return { success: false, error: error instanceof Error ? error.message : 'Payment processing failed' };
    }
  }

  // New method to process free subscriptions
  async processFreeSubscription(
    planId: string,
    userId: string,
    couponCode?: string,
    addOnsTotal?: number,
    selectedAddOns?: { [key: string]: number },
    originalPlanPrice?: number, // NEW: Original plan price in paise
    walletDeduction?: number // NEW: Wallet deduction in paise
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      // CRITICAL FIX: Always create a payment_transactions record for zero-amount purchases
      // This prevents coupon reuse and ensures proper tracking
      const { data: transactionRecord, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          plan_id: planId === 'addon_only_purchase' ? null : planId,
          status: 'success', // Mark as successful immediately for free transactions
          amount: originalPlanPrice || 0, // Use originalPlanPrice in paise
          currency: 'INR',
          coupon_code: couponCode,
          // Calculate the discount amount. The final amount is 0, so discount is original price minus wallet deduction and addon costs
          discount_amount: ((originalPlanPrice || 0) + (addOnsTotal || 0)) - (walletDeduction || 0),
          final_amount: 0, // Final amount is 0
          wallet_deduction_amount: walletDeduction || 0, // Store wallet deduction in paise
          purchase_type: planId === 'addon_only_purchase' ? 'addon_only' : 'plan',
          payment_id: `free_${Date.now()}`, // Generate a unique payment ID for free transactions
          order_id: `order_free_${Date.now()}`,
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating free transaction record:', transactionError);
        throw new Error('Failed to record free transaction');
      }

      // CRITICAL FIX: Process add-on credits for free transactions too
      if (selectedAddOns && Object.keys(selectedAddOns).length > 0) {
        console.log('Processing add-on credits for free transaction...');
        for (const addOnId in selectedAddOns) {
          const quantity = selectedAddOns[addOnId];
          if (quantity > 0) {
            // NEW: Get the add-on configuration using its ID
            const addOnConfig = this.getAddOnById(addOnId);
            if (!addOnConfig) {
              console.error(`Add-on configuration not found for ID: ${addOnId}`);
              continue;
            }
            
            // Use the type property from the add-on config as the type_key
            const addOnTypeKey = addOnConfig.type;
            
            // Get addon type
            const { data: addonType, error: addonTypeError } = await supabase
              .from('addon_types')
              .select('id')
              .eq('type_key', addOnTypeKey)
              .single();

            if (addonTypeError || !addonType) {
              console.error(`Error finding addon_type for key ${addOnTypeKey}:`, addonTypeError);
              continue;
            }

            // Insert credits
            const { error: creditInsertError } = await supabase
              .from('user_addon_credits')
              .insert({
                user_id: userId,
                addon_type_id: addonType.id,
                quantity_purchased: quantity,
                quantity_remaining: quantity,
                payment_transaction_id: transactionRecord.id,
              });

            if (creditInsertError) {
              console.error(`Error inserting add-on credits for ${addOnTypeKey}:`, creditInsertError);
            } else {
              console.log(`Granted ${quantity} credits for add-on: ${addOnTypeKey}`);
            }
          }
        }
      }

      // NEW: Record wallet deduction in wallet_transactions table
      if (walletDeduction && walletDeduction > 0) {
        console.log(`Recording wallet deduction of ${walletDeduction} paise for user ${userId}`);
        const { error: walletError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: userId,
            type: 'purchase_use',
            amount: -(walletDeduction / 100), // Convert paise to rupees for wallet_transactions
            status: 'completed',
            transaction_ref: transactionRecord.id, // Link to the payment_transactions record
            redeem_details: {
              plan_id: planId,
              coupon_code: couponCode,
              addons_purchased: selectedAddOns,
              original_amount: originalPlanPrice,
              wallet_deduction: walletDeduction
            }
          });

        if (walletError) {
          console.error('Error recording wallet deduction:', walletError);
        } else {
          console.log('Wallet deduction successfully recorded.');
        }
      }

      // If it's an add-on only purchase, don't create a subscription
      if (planId === 'addon_only_purchase') {
        return { success: true, subscriptionId: undefined };
      }

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
          coupon_used: couponCode, // Pass couponCode here
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
      // Fetch all subscriptions for the user that are not cancelled
      const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          status,
          start_date,
          end_date,
          optimizations_used,
          optimizations_total,
          score_checks_used,
          score_checks_total,
          linkedin_messages_used,
          linkedin_messages_total,
          guided_builds_used,
          guided_builds_total,
          payment_id,
          coupon_used
        `)
        .eq('user_id', userId)
        .neq('status', 'cancelled'); // Exclude cancelled subscriptions

      if (subsError) {
        console.error('Error getting subscriptions:', subsError);
        return null;
      }

      // Fetch all add-on credits for the user
      const { data: addons, error: addonsError } = await supabase
        .from('user_addon_credits')
        .select(`
          id,
          addon_type_id,
          quantity_purchased,
          quantity_remaining,
          expires_at,
          addon_types(type_key) // Join to get the type_key
        `)
        .eq('user_id', userId)
        .gt('quantity_remaining', 0); // Only consider remaining credits

      if (addonsError) {
        console.error('Error getting add-on credits:', addonsError);
        return null;
      }

      // Initialize combined totals
      let combinedOptimizationsUsed = 0;
      let combinedOptimizationsTotal = 0;
      let combinedScoreChecksUsed = 0;
      let combinedScoreChecksTotal = 0;
      let combinedLinkedinMessagesUsed = 0;
      let combinedLinkedinMessagesTotal = 0;
      let combinedGuidedBuildsUsed = 0;
      let combinedGuidedBuildsTotal = 0;
      let latestEndDate: Date | null = null;
      let overallStatus: 'active' | 'expired' | 'cancelled' = 'expired'; // Default to expired if no credits

      // Aggregate credits from subscriptions
      for (const sub of subs) {
        combinedOptimizationsUsed += sub.optimizations_used;
        combinedOptimizationsTotal += sub.optimizations_total;
        combinedScoreChecksUsed += sub.score_checks_used;
        combinedScoreChecksTotal += sub.score_checks_total;
        combinedLinkedinMessagesUsed += sub.linkedin_messages_used;
        combinedLinkedinMessagesTotal += sub.linkedin_messages_total;
        combinedGuidedBuildsUsed += sub.guided_builds_used;
        combinedGuidedBuildsTotal += sub.guided_builds_total;

        const currentEndDate = new Date(sub.end_date);
        if (!latestEndDate || currentEndDate > latestEndDate) {
          latestEndDate = currentEndDate;
        }
      }

      // Aggregate credits from add-ons
      for (const addon of addons) {
        const typeKey = (addon.addon_types as { type_key: string }).type_key;
        const remaining = addon.quantity_remaining;

        switch (typeKey) {
          case 'optimization':
            combinedOptimizationsTotal += remaining;
            break;
          case 'score_check':
            combinedScoreChecksTotal += remaining;
            break;
          case 'linkedin_messages':
            combinedLinkedinMessagesTotal += remaining;
            break;
          case 'guided_build':
            combinedGuidedBuildsTotal += remaining;
            break;
          // Add other add-on types as needed
        }
        // Add-on credits don't typically have an 'end_date' that affects overall subscription status
        // unless they are time-limited. For now, we assume they are perpetual until used.
      }

      // Determine overall status based on combined remaining credits and end date
      const now = new Date();
      const hasRemainingCredits = 
        (combinedOptimizationsTotal - combinedOptimizationsUsed > 0) ||
        (combinedScoreChecksTotal - combinedScoreChecksUsed > 0) ||
        (combinedLinkedinMessagesTotal - combinedLinkedinMessagesUsed > 0) ||
        (combinedGuidedBuildsTotal - combinedGuidedBuildsUsed > 0);

      if (hasRemainingCredits && latestEndDate && latestEndDate > now) {
        overallStatus = 'active';
      } else if (hasRemainingCredits && (!latestEndDate || latestEndDate <= now)) {
        // If credits remain but all plans are expired, consider it active until credits are used
        overallStatus = 'active'; // Credits persist beyond plan end date
      } else {
        overallStatus = 'expired';
      }

      if (!hasRemainingCredits && subs.length === 0 && addons.length === 0) {
          return null; // No subscriptions or add-ons found
      }

      // Return a synthetic subscription object
      return {
        id: 'combined-subscription', // A unique ID for the combined view
        userId: userId,
        planId: 'combined', // Indicates this is a combined view
        status: overallStatus,
        startDate: subs.length > 0 ? subs[subs.length - 1].start_date : new Date().toISOString(), // Oldest start date from subs
        endDate: latestEndDate ? latestEndDate.toISOString() : new Date().toISOString(), // Latest end date
        optimizationsUsed: combinedOptimizationsUsed,
        optimizationsTotal: combinedOptimizationsTotal,
        scoreChecksUsed: combinedScoreChecksUsed,
        scoreChecksTotal: combinedScoreChecksTotal,
        linkedinMessagesUsed: combinedLinkedinMessagesUsed,
        linkedinMessagesTotal: combinedLinkedinMessagesTotal,
        guidedBuildsUsed: combinedGuidedBuildsUsed,
        guidedBuildsTotal: combinedGuidedBuildsTotal,
        paymentId: null, // Not applicable for combined
        couponUsed: null, // Not applicable for combined
      };

    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

// Helper function to get the addon_type_id
private async getAddonTypeId(typeKey: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('addon_types')
      .select('id')
      .eq('type_key', typeKey)
      .single();
    if (error) {
      console.error(`Error fetching addon_type_id for ${typeKey}:`, error);
      return null;
    }
    return data?.id || null;
}

// Helper function to decrement add-on credits
private async decrementAddonCredit(userId: string, addonTypeKey: string): Promise<boolean> {
    const addonTypeId = await this.getAddonTypeId(addonTypeKey);
    if (!addonTypeId) {
      console.log(`[${new Date().toISOString()}] - decrementAddonCredit: Add-on type ID not found for key: ${addonTypeKey}`);
      return false; // Add-on type not found
    }

    // Find an add-on credit with remaining quantity
    console.log(`[${new Date().toISOString()}] - decrementAddonCredit: Fetching add-on credit for user: ${userId}, type: ${addonTypeKey}`);
    const { data: addonCredit, error: fetchError } = await supabase
      .from('user_addon_credits')
      .select('id, quantity_remaining')
      .eq('user_id', userId)
      .eq('addon_type_id', addonTypeId)
      .gt('quantity_remaining', 0)
      .order('expires_at', { ascending: true, nullsFirst: false }) // Prioritize expiring soonest
      .limit(1)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (fetchError) {
      console.error(`[${new Date().toISOString()}] - decrementAddonCredit: Error fetching add-on credit for ${addonTypeKey}:`, fetchError);
      return false; // Error fetching add-on credits
    }
    if (!addonCredit) {
      console.log(`[${new Date().toISOString()}] - decrementAddonCredit: No add-on credits available for ${addonTypeKey}.`);
      return false; // No add-on credits available
    }

    console.log(`[${new Date().toISOString()}] - decrementAddonCredit: Found add-on credit ID: ${addonCredit.id}, current remaining: ${addonCredit.quantity_remaining}`);

    // Decrement quantity_remaining
    const { error: updateError } = await supabase
      .from('user_addon_credits')
      .update({ quantity_remaining: addonCredit.quantity_remaining - 1 })
      .eq('id', addonCredit.id);

    if (updateError) {
      console.error(`[${new Date().toISOString()}] - decrementAddonCredit: Error decrementing add-on credit for ${addonTypeKey}:`, updateError);
      return false;
    }
    console.log(`[${new Date().toISOString()}] - decrementAddonCredit: Successfully decremented add-on credit for ${addonTypeKey}. New remaining: ${addonCredit.quantity_remaining - 1}`);
    return true;
}

  // Use optimization (decrement count)
  async useOptimization(userId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
    try {
      // Try to use add-on credit first
      const usedAddon = await this.decrementAddonCredit(userId, 'optimization');
      if (usedAddon) {
        const updatedCombinedSubscription = await this.getUserSubscription(userId);
        const totalRemaining = (updatedCombinedSubscription?.optimizationsTotal || 0) - (updatedCombinedSubscription?.optimizationsUsed || 0);
        return { success: true, remaining: totalRemaining };
      }

      // Fallback to subscription credits if no add-on credits were used
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          optimizations_used,
          optimizations_total
        `)
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('end_date', { ascending: false }); // Prioritize newer plans for usage

      if (error) {
        console.error('Error fetching subscriptions for usage:', error);
        return { success: false, remaining: 0, error: 'Failed to fetch subscriptions for usage.' };
      }

      if (!data || data.length === 0) {
        return { success: false, remaining: 0, error: 'No active subscription found.' };
      }

      let totalRemaining = 0;
      let subscriptionToUpdate: { id: string; optimizations_used: number; optimizations_total: number } | null = null;

      // Find a subscription with remaining credits to decrement
      for (const sub of data) {
        const remainingInSub = sub.optimizations_total - sub.optimizations_used;
        if (remainingInSub > 0) {
          subscriptionToUpdate = sub;
          break; // Found a sub to use
        }
      }

      if (!subscriptionToUpdate) {
        return { success: false, remaining: 0, error: 'No optimizations remaining across all plans.' };
      }

      // Decrement the chosen subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          optimizations_used: subscriptionToUpdate.optimizations_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionToUpdate.id);

      if (updateError) {
        console.error('Error using optimization:', updateError);
        return { success: false, remaining: 0, error: updateError.message };
      }

      // Recalculate total remaining across all plans after update
      const updatedCombinedSubscription = await this.getUserSubscription(userId);
      totalRemaining = (updatedCombinedSubscription?.optimizationsTotal || 0) - (updatedCombinedSubscription?.optimizationsUsed || 0);

      return { success: true, remaining: totalRemaining };
    } catch (error: any) {
      console.error('Error using optimization:', error);
      return { success: false, remaining: 0, error: error.message };
    }
  }

  // Use score check (decrement count)
  async useScoreCheck(userId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
    try {
      // Try to use add-on credit first
      const usedAddon = await this.decrementAddonCredit(userId, 'score_check');
      if (usedAddon) {
        const updatedCombinedSubscription = await this.getUserSubscription(userId);
        const totalRemaining = (updatedCombinedSubscription?.scoreChecksTotal || 0) - (updatedCombinedSubscription?.scoreChecksUsed || 0);
        return { success: true, remaining: totalRemaining };
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          score_checks_used,
          score_checks_total
        `)
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('end_date', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions for usage:', error);
        return { success: false, remaining: 0, error: 'Failed to fetch subscriptions for usage.' };
      }

      if (!data || data.length === 0) {
        return { success: false, remaining: 0, error: 'No active subscription found.' };
      }

      let totalRemaining = 0;
      let subscriptionToUpdate: { id: string; score_checks_used: number; score_checks_total: number } | null = null;

      for (const sub of data) {
        const remainingInSub = sub.score_checks_total - sub.score_checks_used;
        if (remainingInSub > 0) {
          subscriptionToUpdate = sub;
          break;
        }
      }

      if (!subscriptionToUpdate) {
        return { success: false, remaining: 0, error: 'No score checks remaining across all plans.' };
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          score_checks_used: subscriptionToUpdate.score_checks_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionToUpdate.id);

      if (updateError) {
        console.error('Error using score check:', updateError);
        return { success: false, remaining: 0, error: updateError.message };
      }

      const updatedCombinedSubscription = await this.getUserSubscription(userId);
      totalRemaining = (updatedCombinedSubscription?.scoreChecksTotal || 0) - (updatedCombinedSubscription?.scoreChecksUsed || 0);

      return { success: true, remaining: totalRemaining };
    } catch (error: any) {
      console.error('Error using score check:', error);
      return { success: false, remaining: 0, error: error.message };
    }
  }

  // Use LinkedIn message (decrement count)
  async useLinkedInMessage(userId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
    try {
      // Try to use add-on credit first
      const usedAddon = await this.decrementAddonCredit(userId, 'linkedin_messages');
      if (usedAddon) {
        const updatedCombinedSubscription = await this.getUserSubscription(userId);
        const totalRemaining = (updatedCombinedSubscription?.linkedinMessagesTotal || 0) - (updatedCombinedSubscription?.linkedinMessagesUsed || 0);
        return { success: true, remaining: totalRemaining };
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          linkedin_messages_used,
          linkedin_messages_total
        `)
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('end_date', { ascending: false });

      if (error) {
        console.log('Error fetching subscriptions for usage:', error);
        return { success: false, remaining: 0, error: 'Failed to fetch subscriptions for usage.' };
      }

      if (!data || data.length === 0) {
        return { success: false, remaining: 0, error: 'No active subscription found.' };
      }

      let totalRemaining = 0;
      let subscriptionToUpdate: { id: string; linkedin_messages_used: number; linkedin_messages_total: number } | null = null;

      for (const sub of data) {
        const remainingInSub = sub.linkedin_messages_total - sub.linkedin_messages_used;
        if (remainingInSub > 0) {
          subscriptionToUpdate = sub;
          break;
        }
      }

      if (!subscriptionToUpdate) {
        return { success: false, remaining: 0, error: 'No LinkedIn messages remaining across all plans.' };
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          linkedin_messages_used: subscriptionToUpdate.linkedin_messages_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionToUpdate.id);

      if (updateError) {
        console.error('Error using LinkedIn message:', updateError);
        return { success: false, remaining: 0, error: updateError.message };
      }

      const updatedCombinedSubscription = await this.getUserSubscription(userId);
      totalRemaining = (updatedCombinedSubscription?.linkedinMessagesTotal || 0) - (updatedCombinedSubscription?.linkedinMessagesUsed || 0);

      return { success: true, remaining: totalRemaining };
    } catch (error: any) {
      console.error('Error using LinkedIn message:', error);
      return { success: false, remaining: 0, error: error.message };
    }
  }

  // Use guided build (decrement count)
  async useGuidedBuild(userId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
    console.log(`[${new Date().toISOString()}] - useGuidedBuild: Called for userId:`, userId);
    try {
      // Try to use add-on credit first
      const usedAddon = await this.decrementAddonCredit(userId, 'guided_build');
      console.log(`[${new Date().toISOString()}] - useGuidedBuild: Addon used result:`, usedAddon);

      if (usedAddon) {
        const updatedCombinedSubscription = await this.getUserSubscription(userId);
        const totalRemaining = (updatedCombinedSubscription?.guidedBuildsTotal || 0) - (updatedCombinedSubscription?.guidedBuildsUsed || 0);
        console.log(`[${new Date().toISOString()}] - useGuidedBuild: Returning success: true, remaining:`, totalRemaining, ' (from add-on)');
        return { success: true, remaining: totalRemaining };
      }

      console.log(`[${new Date().toISOString()}] - useGuidedBuild: No add-on credits used. Attempting to fetch subscriptions for usage...`);
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          guided_builds_used,
          guided_builds_total
        `)
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('end_date', { ascending: false });

      console.log(`[${new Date().toISOString()}] - useGuidedBuild: Subscriptions fetch result - Data:`, data, 'Error:', error);

      if (error) {
        console.error(`[${new Date().toISOString()}] - useGuidedBuild: Error fetching subscriptions:`, error);
        return { success: false, remaining: 0, error: 'Failed to fetch subscriptions for usage.' };
      }

      if (!data || data.length === 0) {
        console.log(`[${new Date().toISOString()}] - useGuidedBuild: No active subscription found for guided build decrement.`);
        return { success: false, remaining: 0, error: 'No active subscription found.' };
      }

      let subscriptionToUpdate: { id: string; guided_builds_used: number; guided_builds_total: number } | null = null;

      for (const sub of data) {
        const remainingInSub = sub.guided_builds_total - sub.guided_builds_used;
        if (remainingInSub > 0) {
          subscriptionToUpdate = sub;
          break;
        }
      }

      if (!subscriptionToUpdate) {
        console.log(`[${new Date().toISOString()}] - useGuidedBuild: No guided build credits remaining across all plans.`);
        return { success: false, remaining: 0, error: 'No guided builds remaining across all plans.' };
      }

      console.log(`[${new Date().toISOString()}] - useGuidedBuild: Found subscription to update:`, subscriptionToUpdate.id, 'Current used:', subscriptionToUpdate.guided_builds_used, 'Total:', subscriptionToUpdate.guided_builds_total);

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          guided_builds_used: subscriptionToUpdate.guided_builds_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionToUpdate.id);

      console.log(`[${new Date().toISOString()}] - useGuidedBuild: Subscription update result. Error:`, updateError);

      if (updateError) {
        console.error(`[${new Date().toISOString()}] - useGuidedBuild: Error updating subscription usage:`, updateError);
        return { success: false, remaining: subscriptionToUpdate.guided_builds_total - subscriptionToUpdate.guided_builds_used, error: updateError.message };
      }

      const updatedCombinedSubscription = await this.getUserSubscription(userId);
      console.log(`[${new Date().toISOString()}] - useGuidedBuild: Updated combined subscription after decrement:`, updatedCombinedSubscription);

      const totalRemaining = (updatedCombinedSubscription?.guidedBuildsTotal || 0) - (updatedCombinedSubscription?.guidedBuildsUsed || 0);
      console.log(`[${new Date().toISOString()}] - useGuidedBuild: Returning success: true, remaining:`, totalRemaining);

      return { success: true, remaining: totalRemaining };
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] - useGuidedBuild: Unexpected error:`, error);
      return { success: false, remaining: 0, error: error.message || 'An unexpected error occurred.' };
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
      const existingSubscription = await this.getUserSubscription(userId);
      if (existingSubscription) {
        return { success: false, error: 'User already has an active subscription' };
      }
      return { success: false, error: 'Free trial is no longer available. Please choose a paid plan.' };
    } catch (error) {
      console.error('Error activating free trial:', error);
      return { success: false, error: 'Failed to activate free trial' };
    }
  }
}

export const paymentService = new PaymentService();
