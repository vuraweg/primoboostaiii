import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  transactionId: string;
}

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  duration: string;
  optimizations: number;
  scoreChecks: number;
  linkedinMessages: number;
  guidedBuilds: number;
  durationInHours: number;
}

const plans: PlanConfig[] = [
  {
    id: "career_pro_max",
    name: "Career Pro Max",
    price: 1999,
    duration: "One-time Purchase",
    optimizations: 50,
    scoreChecks: 50,
    linkedinMessages: Infinity,
    guidedBuilds: 5,
    durationInHours: 24 * 365 * 10,
  },
  {
    id: "career_boost_plus",
    name: "Career Boost+",
    price: 1499,
    duration: "One-time Purchase",
    optimizations: 30,
    scoreChecks: 30,
    linkedinMessages: Infinity,
    guidedBuilds: 3,
    durationInHours: 24 * 365 * 10,
  },
  {
    id: "pro_resume_kit",
    name: "Pro Resume Kit",
    price: 999,
    duration: "One-time Purchase",
    optimizations: 20,
    scoreChecks: 20,
    linkedinMessages: 100,
    guidedBuilds: 2,
    durationInHours: 24 * 365 * 10,
  },
  {
    id: "smart_apply_pack",
    name: "Smart Apply Pack",
    price: 499,
    duration: "One-time Purchase",
    optimizations: 10,
    scoreChecks: 10,
    linkedinMessages: 50,
    guidedBuilds: 1,
    durationInHours: 24 * 365 * 10,
  },
  {
    id: "resume_fix_pack",
    name: "Resume Fix Pack",
    price: 199,
    duration: "One-time Purchase",
    optimizations: 5,
    scoreChecks: 2,
    linkedinMessages: 0,
    guidedBuilds: 0,
    durationInHours: 24 * 365 * 10,
  },
  {
    id: "lite_check",
    name: "Lite Check",
    price: 99,
    duration: "One-time Purchase",
    optimizations: 2,
    scoreChecks: 2,
    linkedinMessages: 10,
    guidedBuilds: 0,
    durationInHours: 24 * 365 * 10,
  },
];

// Added Add-on products for individual purchases
const addOns = [
  {
    id: "jd_optimization_single",
    name: "JD-Based Optimization (1x)",
    price: 49,
    type: "optimization",
    quantity: 1,
  },
  {
    id: "guided_resume_build_single",
    name: "Guided Resume Build (1x)",
    price: 99,
    type: "guided_build",
    quantity: 1,
  },
  {
    id: "resume_score_check_single",
    name: "Resume Score Check (1x)",
    price: 19,
    type: "score_check",
    quantity: 1,
  },
  {
    id: "linkedin_messages_50",
    name: "LinkedIn Messages (50x)",
    price: 29,
    type: "linkedin_messages",
    quantity: 50,
  },
  {
    id: "linkedin_optimization_single",
    name: "LinkedIn Optimization (1x Review)",
    price: 199,
    type: "linkedin_optimization",
    quantity: 1,
  },
  {
    id: "resume_guidance_session",
    name: "Resume Guidance Session (Live)",
    price: 299,
    type: "guidance_session",
    quantity: 1,
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let transactionStatus = "failed";
  let subscriptionId: string | null = null;
  let transactionIdFromRequest: string | null = null;

  try {
    const requestBody: PaymentVerificationRequest = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = requestBody;
    transactionIdFromRequest = transactionId;
    console.log(`[${new Date().toISOString()}] - verify-payment received. transactionId: ${transactionIdFromRequest}`);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${razorpay_order_id}`,
      {
        headers: {
          "Authorization": `Basic ${auth}`,
        },
      },
    );

    if (!orderResponse.ok) {
      throw new Error("Failed to fetch order details");
    }

    const orderData = await orderResponse.json();
    const planId = orderData.notes.planId;
    const couponCode = orderData.notes.couponCode;
    const discountAmount = orderData.notes.discountAmount || 0;
    const walletDeduction = orderData.notes.walletDeduction || 0;
    const selectedAddOns = JSON.parse(orderData.notes.selectedAddOns || "{}");

    console.log(`[${new Date().toISOString()}] - Received selectedAddOns: ${JSON.stringify(selectedAddOns)}`);
    console.log(`[${new Date().toISOString()}] - walletDeduction retrieved from orderData.notes: ${walletDeduction}`);

    console.log(`[${new Date().toISOString()}] - Attempting to update payment_transactions record with ID: ${transactionId}`);
    const { data: updatedTransaction, error: updateTransactionError } = await supabase
      .from("payment_transactions")
      .update({
        payment_id: razorpay_payment_id,
        status: "success",
        order_id: razorpay_order_id,
        wallet_deduction_amount: walletDeduction / 100, // Correctly store in rupees
        coupon_code: couponCode,
        discount_amount: discountAmount,
      })
      .eq("id", transactionId)
      .select()
      .single();

    if (updateTransactionError) {
      console.error("Error updating payment transaction to success:", updateTransactionError);
      throw new Error("Failed to update payment transaction status.");
    }
    console.log(`[${new Date().toISOString()}] - Payment transaction updated to success. Record ID: ${updatedTransaction.id}, coupon_code: ${updatedTransaction.coupon_code}`);
    transactionStatus = "success";

    if (Object.keys(selectedAddOns).length > 0) {
      console.log(`[${new Date().toISOString()}] - Processing add-on credits for user: ${user.id}`);
      for (const addOnKey in selectedAddOns) {
        const quantity = selectedAddOns[addOnKey];
        console.log(`[${new Date().toISOString()}] - Processing add-on with key: ${addOnKey} and quantity: ${quantity}`);
        if (quantity > 0) {
          const addOn = addOns.find((a) => a.id === addOnKey);
          if (!addOn) {
            console.error(`[${new Date().toISOString()}] - Add-on with ID ${addOnKey} not found in configuration. Skipping.`);
            continue;
          }

          console.log(`[${new Date().toISOString()}] - Found addOn config: ${JSON.stringify(addOn)}`);
          console.log(`[${new Date().toISOString()}] - Looking up addon_type for type_key: ${addOn.type}`);
          const { data: addonType, error: addonTypeError } = await supabase
            .from("addon_types")
            .select("id")
            .eq("type_key", addOn.type)
            .single();

          if (addonTypeError || !addonType) {
            console.error(`[${new Date().toISOString()}] - Error finding addon_type for key ${addOn.type}:`, addonTypeError);
            continue;
          }
          console.log(`[${new Date().toISOString()}] - Found addon_type with ID: ${addonType.id} for key: ${addOn.type}`);

          console.log(`[${new Date().toISOString()}] - Preparing to insert add-on credits with values: user_id: ${user.id}, addon_type_id: ${addonType.id}, quantity: ${quantity}, transactionId: ${transactionId}`);
          const { error: creditInsertError } = await supabase
            .from("user_addon_credits")
            .insert({
              user_id: user.id,
              addon_type_id: addonType.id,
              quantity_purchased: quantity,
              quantity_remaining: quantity,
              payment_transaction_id: transactionId,
            });

          if (creditInsertError) {
            console.error(`[${new Date().toISOString()}] - Error inserting add-on credits for ${addOn.type}:`, creditInsertError);
          } else {
            console.log(`[${new Date().toISOString()}] - Successfully inserted ${quantity} credits for add-on: ${addOn.type}`);
          }
        }
      }
    }

    if (planId && planId !== "addon_only_purchase") {
      const { data: existingSubscription, error: existingSubError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("end_date", new Date().toISOString())
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSubError) {
        console.error("Error checking existing subscription:", existingSubError);
      }

      if (existingSubscription) {
        console.log(`[${new Date().toISOString()}] - Found existing active subscription, upgrading...`);
        await supabase
          .from("subscriptions")
          .update({
            status: "upgraded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSubscription.id);
      }
    }

    if (planId && planId !== "addon_only_purchase") {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) {
        throw new Error("Invalid plan");
      }

      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: "active",
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().getTime() + (plan.durationInHours * 60 * 60 * 1000)).toISOString(),
          optimizations_used: 0,
          optimizations_total: plan.optimizations,
          score_checks_used: 0,
          score_checks_total: plan.scoreChecks,
          linkedin_messages_used: 0,
          linkedin_messages_total: plan.linkedinMessages,
          guided_builds_used: 0,
          guided_builds_total: plan.guidedBuilds,
          payment_id: razorpay_payment_id,
          coupon_used: couponCode,
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error("Subscription creation error:", subscriptionError);
        throw new Error("Failed to create subscription");
      }
      subscriptionId = subscription.id;

      const { error: updateSubscriptionIdError } = await supabase
        .from("payment_transactions")
        .update({ subscription_id: subscription.id })
        .eq("id", transactionId);

      if (updateSubscriptionIdError) {
        console.error("Error updating payment transaction with subscription_id:", updateSubscriptionIdError);
      }
    } else {
      subscriptionId = null;
    }

    if (walletDeduction > 0) {
      console.log(`[${new Date().toISOString()}] - Attempting to record wallet deduction for user: ${user.id}`);
      console.log(`[${new Date().toISOString()}] - Wallet deduction amount for insert: ${-(walletDeduction / 100)}`);
      const { error: walletError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "purchase_use",
          amount: -(walletDeduction / 100),
          status: "completed",
          transaction_ref: razorpay_payment_id,
          redeem_details: {
            subscription_id: subscriptionId,
            plan_id: planId,
            original_amount: orderData.amount / 100,
            addons_purchased: selectedAddOns,
          },
        });

      if (walletError) {
        console.error(`[${new Date().toISOString()}] - Wallet deduction recording error:`, walletError);
      } else {
        console.log(`[${new Date().toISOString()}] - Wallet deduction successfully recorded.`);
      }
    }

    try {
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("referred_by")
        .eq("id", user.id)
        .single();

      if (!profileError && userProfile?.referred_by) {
        const { data: referrerProfile, error: referrerError } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("referral_code", userProfile.referred_by)
          .single();

        if (!referrerError && referrerProfile) {
          const totalPurchaseAmount = (orderData.amount / 100);
          const commissionAmount = Math.floor(totalPurchaseAmount * 0.1);

          if (commissionAmount > 0) {
            const { error: commissionError } = await supabase
              .from("wallet_transactions")
              .insert({
                user_id: referrerProfile.id,
                source_user_id: user.id,
                type: "referral",
                amount: commissionAmount,
                status: "completed",
                transaction_ref: `referral_${razorpay_payment_id}`,
                redeem_details: {
                  referred_user_id: user.id,
                  plan_purchased: planId,
                  total_purchase_amount: totalPurchaseAmount,
                  commission_rate: 0.1,
                  addons_included: selectedAddOns,
                },
              });

            if (commissionError) {
              console.error("Referral commission error:", commissionError);
            } else {
              console.log(`Referral commission of ₹${commissionAmount} credited to referrer successfully.`);
            }
          }
        }
      }
    } catch (referralError) {
      console.error("Referral processing error:", referralError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscriptionId,
        message: "Payment verified and credits granted successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    if (transactionIdFromRequest) {
      await supabase
        .from("payment_transactions")
        .update({ status: "failed" })
        .eq("id", transactionIdFromRequest);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});