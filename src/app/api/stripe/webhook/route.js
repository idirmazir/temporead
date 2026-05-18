import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Use service role key for webhook — bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const userId = subscription.metadata.supabase_user_id

        if (userId) {
          await supabase.from('profiles').update({
            is_pro: true,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            stripe_status: subscription.status,
          }).eq('id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata.supabase_user_id
        const active = ['active', 'trialing'].includes(subscription.status)

        if (userId) {
          await supabase.from('profiles').update({
            is_pro: active,
            stripe_status: subscription.status,
          }).eq('id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata.supabase_user_id

        if (userId) {
          await supabase.from('profiles').update({
            is_pro: false,
            stripe_subscription_id: null,
            stripe_status: 'canceled',
          }).eq('id', userId)
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
