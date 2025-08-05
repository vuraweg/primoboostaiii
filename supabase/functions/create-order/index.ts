import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderRequest {
  planId: string
  couponCode?: string
  walletDeduction?: number
  addOnsTotal?: number
  amount: number // This 'amount' is the final calculated amount from the frontend
}

interface PlanConfig {
  id: string
  name: string
  price: number
  duration: string
  optimizations: number
  scoreChecks: number
  linkedinMessages: number
  guidedBuilds: number
  durationInHours: number
}

const plans: PlanConfig[] = [
  {
    id: 'career_pro_max',
    name: 'Career Pro Max',
    price: 1999,
    duration: 'One-time Purchase',
    optimizations: 50, // Updated
    scoreChecks: 50,
    linkedinMessages: Infinity, // Updated
    guidedBuilds: 5,
    durationInHours: 24 * 365 * 10
  },
  {
    id: 'career_boost_plus',
    name: 'Career Boost+',
    price: 1499,
    duration: 'One-time Purchase',
    optimizations: 30, // Updated
    scoreChecks: 30,
    linkedinMessages: Infinity, // Updated
    guidedBuilds: 3,
    durationInHours: 24 * 365 * 10
  },
  {
    id: 'pro_resume_kit',
    name: 'Pro Resume Kit',
    price: 999,
    duration: 'One-time Purchase',
    optimizations: 20, // Updated
    scoreChecks: 20,
    linkedinMessages: 100,
    guidedBuilds: 2,
    durationInHours: 24 * 365 * 10
  },
  {
    id: 'smart_apply_pack',
    name: 'Smart Apply Pack',
    price: 499,
    duration: 'One-time Purchase',
    optimizations: 10,
    scoreChecks: 10,
    linkedinMessages: 50,
    guidedBuilds: 1,
    durationInHours: 24 * 365 * 10
  },
  {
    id: 'resume_fix_pack',
    name: 'Resume Fix Pack',
    price: 199,
    duration: 'One-time Purchase',
    optimizations: 5,
    scoreChecks: 2,
    linkedinMessages: 0,
    guidedBuilds: 0,
    durationInHours: 24 * 365 * 10
  },
  {
    id: 'lite_check',
    name: 'Lite Check',
    price: 99,
    duration: 'One-time Purchase',
    optimizations: 2, // Updated
    scoreChecks: 2,
    linkedinMessages: 10,
    guidedBuilds: 0,
    durationInHours: 24 * 365 * 10
  }
]

serve(async (req) => {
  // Log function start
  console.log(`[${new Date().toISOString()}] - Function execution started.`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Retrieve addOnsTotal from the request body
    const body: OrderRequest = await req.json()
    const { planId, couponCode, walletDeduction, addOnsTotal, amount: frontendCalculatedAmount } = body // Capture frontend calculated amount
    console.log(`[${new Date().toISOString()}] - Request body parsed. planId: ${planId}, couponCode: ${couponCode}, walletDeduction: ${walletDeduction}, addOnsTotal: ${addOnsTotal}, frontendCalculatedAmount: ${frontendCalculatedAmount}`);

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    // Log after user authentication
    console.log(`[${new Date().toISOString()}] - User authentication complete. User ID: ${user?.id || 'N/A'}`);

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get plan details
    const plan = plans.find(p => p.id === planId)
    if (!plan) {
      throw new Error('Invalid plan selected')
    }

    // Calculate final amount based on plan price
    let finalAmount = plan.price
    let discountAmount = 0
    let appliedCoupon = null

    if (couponCode) {
      const normalizedCoupon = couponCode.toLowerCase().trim()
      
      // NEW: full_support coupon - free career_pro_max plan
      if (normalizedCoupon === 'fullsupport' && planId === 'career_pro_max') {
        finalAmount = 0
        discountAmount = plan.price
        appliedCoupon = 'fullsupport'
      }
      // first100 coupon - free lite_check plan only
      else if (normalizedCoupon === 'first100' && planId === 'lite_check') { // Updated planId
        finalAmount = 0
        discountAmount = plan.price
        appliedCoupon = 'first100'
      }
      // first500 coupon - 98% off lite_check plan only (NEW LOGIC)
      else if (normalizedCoupon === 'first500' && planId === 'lite_check') {
        // Check usage limit for first500 coupon
        const { count, error: countError } = await supabase
          .from('payment_transactions')
          .select('id', { count: 'exact' })
          .eq('coupon_code', 'first500')
          .in('status', ['success', 'pending']); // Count successful and pending uses

        if (countError) {
          console.error(`[${new Date().toISOString()}] - Error counting first500 coupon usage:`, countError);
          throw new Error('Failed to verify coupon usage. Please try again.');
        }

        if (count && count >= 500) {
          throw new Error('Coupon "first500" has reached its usage limit.');
        }

        discountAmount = Math.floor(plan.price * 0.98); // 98% off
        finalAmount = plan.price - discountAmount; // Should be 1 Rupee (99 - 98)
        appliedCoupon = 'first500';
      }
      // worthyone coupon - 50% off career_pro_max plan only
      else if (normalizedCoupon === 'worthyone' && planId === 'career_pro_max') { // Updated planId
        discountAmount = Math.floor(plan.price * 0.5)
        finalAmount = plan.price - discountAmount
        appliedCoupon = 'worthyone'
      }
    }

    // Apply wallet deduction
    if (walletDeduction && walletDeduction > 0) {
      finalAmount = Math.max(0, finalAmount - walletDeduction)
    }

    // Correctly add add-ons total to the final amount
    if (addOnsTotal && addOnsTotal > 0) {
      finalAmount += addOnsTotal
    }

    // IMPORTANT: Validate that the calculated finalAmount matches the frontend's calculation
    // This prevents tampering with the price on the client-side.
    if (finalAmount !== frontendCalculatedAmount) {
      console.error(`[${new Date().toISOString()}] - Price mismatch detected! Backend calculated: ${finalAmount}, Frontend sent: ${frontendCalculatedAmount}`);
      throw new Error('Price mismatch detected. Please try again.');
    }

    // --- NEW: Create a pending payment_transactions record ---
    console.log(`[${new Date().toISOString()}] - Creating pending payment_transactions record.`);
    console.log(`[${new Date().toISOString()}] - Inserting with coupon_code: ${appliedCoupon}, discount_amount: ${discountAmount}, final_amount: ${finalAmount}`); // ADDED LOG
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'pending', // Initial status
        amount: plan.price, // Original plan price
        currency: 'INR',
        coupon_code: appliedCoupon, // Save applied coupon code
        discount_amount: discountAmount, // Save discount amount
        final_amount: finalAmount, // Final amount after discounts/wallet/addons
        // payment_id and order_id will be updated by verify-payment function
      })
      .select('id') // Select the ID of the newly created row
      .single();

    if (transactionError) {
      console.error(`[${new Date().toISOString()}] - Error inserting pending transaction:`, transactionError);
      throw new Error('Failed to initiate payment transaction.');
    }
    const transactionId = transaction.id;
    console.log(`[${new Date().toISOString()}] - Pending transaction created with ID: ${transactionId}, coupon_code: ${appliedCoupon}`); // ADDED LOG
    // --- END NEW ---

    // Create Razorpay order
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured')
    }

    const orderData = {
      amount: finalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId: planId,
        planName: plan.name,
        originalAmount: plan.price,
        couponCode: appliedCoupon,
        discountAmount: discountAmount,
        walletDeduction: walletDeduction || 0,
        addOnsTotal: addOnsTotal || 0, // Add addOnsTotal to notes for record-keeping
        transactionId: transactionId // Pass the transactionId to Razorpay notes
      }
    }
    
    console.log(`[${new Date().toISOString()}] - Before making Razorpay API call with data: ${JSON.stringify(orderData)}`);

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    // Log after receiving response from Razorpay
    console.log(`[${new Date().toISOString()}] - Received response from Razorpay API. Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Razorpay API error:', errorText)
      // If Razorpay order creation fails, mark the pending transaction as failed
      await supabase.from('payment_transactions')
        .update({ status: 'failed' })
        .eq('id', transactionId);
      throw new Error('Failed to create payment order with Razorpay');
    }

    const order = await response.json()

    // Log before returning the final response
    console.log(`[${new Date().toISOString()}] - Returning final response. Order ID: ${order.id}, Transaction ID: ${transactionId}`);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: finalAmount,
        keyId: razorpayKeyId,
        currency: 'INR',
        transactionId: transactionId // Return the transactionId to the frontend
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error(`[${new Date().toISOString()}] - Error creating order:`, error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

