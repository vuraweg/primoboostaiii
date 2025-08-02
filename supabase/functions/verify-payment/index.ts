import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentVerificationRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface PlanConfig {
  id: string
  name: string
  price: number
  duration: string
  optimizations: number
  durationInHours: number
}

const plans: PlanConfig[] = [
  {
    id: 'career_pro_max',
    name: 'Career Pro Max',
    price: 1999,
    duration: 'One-time Purchase',
    optimizations: 30,
    durationInHours: 24 * 365 * 10 // 10 years for lifetime
  },
  {
    id: 'career_boost_plus',
    name: 'Career Boost+',
    price: 1499,
    duration: 'One-time Purchase',
    optimizations: 15,
    durationInHours: 24 * 365 * 10 // 10 years for anytime use
  },
  {
    id: 'pro_resume_kit',
    name: 'Pro Resume Kit',
    price: 999,
    duration: 'One-time Purchase',
    optimizations: 10,
    durationInHours: 24 * 365 * 10 // 10 years for anytime use
  },
  {
    id: 'smart_apply_pack',
    name: 'Smart Apply Pack',
    price: 499,
    duration: 'One-time Purchase',
    optimizations: 5,
    durationInHours: 24 * 365 * 10 // 10 years for anytime use
  },
  {
    id: 'resume_fix_pack',
    name: 'Resume Fix Pack',
    price: 199,
    duration: 'One-time Purchase',
    optimizations: 2,
    durationInHours: 24 * 365 * 10 // 10 years
  },
  {
    id: 'lite_check',
    name: 'Lite Check',
    price: 99,
    duration: 'One-time Purchase',
    optimizations: 1,
    durationInHours: 24 * 365 * 10 // 10 years
  },
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    duration: 'One-time Use',
    optimizations: 0,
    durationInHours: 24 * 365 * 10 // 10 years
  }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature }: PaymentVerificationRequest = await req.json()

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

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Verify payment signature
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret not configured')
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature')
    }

    // Get order details from Razorpay
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    
    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch order details')
    }

    const orderData = await orderResponse.json()
    const planId = orderData.notes.planId
    const couponCode = orderData.notes.couponCode
    const discountAmount = orderData.notes.discountAmount || 0
    const walletDeduction = orderData.notes.walletDeduction || 0 // This comes as an integer representing paise

    // Get plan configuration
    const plan = plans.find(p => p.id === planId)
    if (!plan) {
      throw new Error('Invalid plan')
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (plan.durationInHours * 60 * 60 * 1000))

    // Create subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        optimizations_used: 0,
        optimizations_total: plan.optimizations,
        score_checks_used: 0,
        score_checks_total: 50, // Default value since scoreChecks is not in PlanConfig
        linkedin_messages_used: 0,
        linkedin_messages_total: 999999, // Default value since linkedinMessages is not in PlanConfig
        guided_builds_used: 0,
        guided_builds_total: 5, // Default value since guidedBuilds is not in PlanConfig
        payment_id: razorpay_payment_id,
        coupon_used: couponCode
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError)
      throw new Error('Failed to create subscription')
    }

    // Create payment transaction record
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'success',
        coupon_code: couponCode,
        discount_amount: discountAmount,
        final_amount: orderData.amount
      })

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      // Don't throw error here as subscription is already created
    }

    // Record wallet usage if applicable
    if (walletDeduction > 0) {
      // NEW LOG: Confirm walletDeduction value before insertion
      console.log('Attempting to record wallet deduction:', {
        userId: user.id,
        walletDeduction: walletDeduction, // This is still in paise
        negativeAmount: -(walletDeduction / 100) // Convert to rupees for better readability in log
      });

      const { error: walletError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'purchase_use',
          amount: -(walletDeduction / 100), // Convert paise to rupees (as your UI expects rupees for balance)
          status: 'completed',
          transaction_ref: razorpay_payment_id,
          activity_details: {
            subscription_id: subscription.id,
            plan_id: planId,
            // original_amount in paise from orderData + walletDeduction in paise
            original_amount: (orderData.amount / 100) + (walletDeduction / 100)
          }
        })
        .throwOnError(); // NEW: Explicitly throw on error for logging

      if (walletError) {
        console.error('Wallet deduction recording error (after throwOnError):', walletError);
        // The .throwOnError() should handle this, but keeping for explicit catch context
      } else {
        console.log('Wallet deduction successfully recorded.');
      }
    }

    // Handle referral commission (10% of original plan price)
    try {
      // Get user profile to check if they were referred
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('referred_by')
        .eq('id', user.id)
        .single()

      if (!profileError && userProfile?.referred_by) {
        // Find the referrer's profile using the referral code
        const { data: referrerProfile, error: referrerError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('referral_code', userProfile.referred_by)
          .single()

        if (!referrerError && referrerProfile) {
          // Calculate 10% commission on original plan price
          // Ensure plan.price is in rupees, commission should also be in rupees
          const commissionAmount = Math.floor(plan.price * 0.1) // This seems to be in rupees already

          // Add commission to referrer's wallet
          const { error: commissionError } = await supabase
            .from('wallet_transactions')
            .insert({
              user_id: referrerProfile.id,
              source_user_id: user.id,
              type: 'referral',
              amount: commissionAmount, // Assuming this is already in rupees
              status: 'completed',
              transaction_ref: `referral_${razorpay_payment_id}`,
              activity_details: {
                referred_user_id: user.id,
                plan_purchased: planId,
                plan_amount: plan.price,
                commission_rate: 0.1
              }
            })
            .throwOnError(); // NEW: Explicitly throw on error for logging

          if (commissionError) {
            console.error('Referral commission error (after throwOnError):', commissionError);
          } else {
            console.log(`Referral commission of ₹${commissionAmount} credited to referrer successfully.`);
          }
        }
      }
    } catch (referralError) {
      console.error('Referral processing error:', referralError);
      // Don't fail the payment if referral processing fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscription.id,
        message: 'Payment verified and subscription created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Inside the if (walletDeduction > 0) block
      // NEW LOG: Confirm walletDeduction value before insertion
      console.log('Attempting to record wallet deduction:', {
        userId: user.id,
        walletDeduction: walletDeduction, // This is still in paise
        negativeAmount: -(walletDeduction / 100) // Convert to rupees for better readability in log
      });

      const { error: walletError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'purchase_use',
          amount: -(walletDeduction / 100), // Convert paise to rupees (as your UI expects rupees for balance)
          status: 'completed',
          transaction_ref: razorpay_payment_id,
          activity_details: {
            subscription_id: subscription.id,
            plan_id: planId,
            original_amount: (orderData.amount / 100) + (walletDeduction / 100)
          }
        })
        .throwOnError(); // <--- THIS LINE IS CRUCIAL

      if (walletError) {
        console.error('Wallet deduction recording error (after throwOnError):', walletError);
        // The .throwOnError() should handle this, but keeping for explicit catch context
      } else {
        console.log('Wallet deduction successfully recorded.');
      }