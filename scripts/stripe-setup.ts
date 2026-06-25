import 'dotenv/config'
import Stripe from 'stripe'
import fs from 'fs'
import path from 'path'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-03-25.dahlia',
})

const plans = [
  { name: 'Starter', envKey: 'STRIPE_PRICE_STARTER', amount: 4900 },
  { name: 'Growth',  envKey: 'STRIPE_PRICE_GROWTH',  amount: 9900 },
  { name: 'Studio',  envKey: 'STRIPE_PRICE_STUDIO',  amount: 24900 },
]

async function run() {
  const updates: Record<string, string> = {}

  for (const plan of plans) {
    const product = await stripe.products.create({ name: plan.name })
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: 'usd',
      recurring: { interval: 'month' },
    })
    updates[plan.envKey] = price.id
    console.log(`${plan.name}: ${price.id}`)
  }

  const envPath = path.resolve(process.cwd(), '.env')
  let env = fs.readFileSync(envPath, 'utf8')
  for (const [key, val] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    env = regex.test(env) ? env.replace(regex, `${key}="${val}"`) : env + `\n${key}="${val}"`
  }
  fs.writeFileSync(envPath, env)
  console.log('Price IDs written to .env')
}

run().catch(console.error)
