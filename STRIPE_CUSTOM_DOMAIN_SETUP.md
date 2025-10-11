# Stripe Custom Domain Integration

## Overview

Timeline Alchemy now supports custom Stripe checkout domains for a more professional payment experience. The custom domain `pay.timeline-alchemy.nl` has been integrated into the payment flow.

## Configuration

### Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
# Stripe Custom Checkout Domain (optional)
NEXT_PUBLIC_STRIPE_CHECKOUT_DOMAIN=pay.timeline-alchemy.nl
```

### Stripe Dashboard Setup

1. **Enable Custom Domains** in your Stripe Dashboard
2. **Add Domain**: `pay.timeline-alchemy.nl`
3. **Configure DNS**: Point the domain to Stripe's servers
4. **SSL Certificate**: Stripe will automatically provision SSL

## Implementation Details

### API Integration

The custom domain is automatically applied to all checkout sessions when the environment variable is set:

```typescript
// app/api/stripe/create-checkout-session/route.ts
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
  // Custom domain integration
  ...(process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_DOMAIN && {
    custom_domain: process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_DOMAIN,
  }),
  // ... other options
})
```

### Library Helper

The Stripe library helper function also supports custom domains:

```typescript
// lib/stripe.ts
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  customDomain?: string // Optional custom domain parameter
) {
  // Implementation with custom domain support
}
```

## Benefits

### Professional Branding
- ✅ Custom domain: `pay.timeline-alchemy.nl`
- ✅ Consistent branding across payment flow
- ✅ Increased user trust and confidence

### Technical Advantages
- ✅ SSL certificate automatically managed by Stripe
- ✅ No additional server configuration required
- ✅ Seamless integration with existing payment flow

## Usage

### Automatic Integration
When `NEXT_PUBLIC_STRIPE_CHECKOUT_DOMAIN` is set, all checkout sessions automatically use the custom domain.

### Fallback Behavior
If the environment variable is not set, checkout sessions will use the default Stripe checkout domain.

## Testing

### Local Development
```bash
# Set in .env.local
NEXT_PUBLIC_STRIPE_CHECKOUT_DOMAIN=pay.timeline-alchemy.nl
```

### Production Deployment
Ensure the environment variable is set in your production environment (Vercel, etc.).

## Security Considerations

- ✅ Custom domain is managed by Stripe
- ✅ SSL certificate is automatically provisioned
- ✅ All security features of Stripe checkout are maintained
- ✅ PCI compliance is handled by Stripe

## Troubleshooting

### Domain Not Working
1. Verify DNS configuration points to Stripe
2. Check Stripe Dashboard for domain status
3. Ensure environment variable is correctly set
4. Verify SSL certificate is provisioned

### Fallback to Default Domain
If custom domain fails, Stripe will automatically fall back to the default checkout domain.

## Support

For issues with custom domain setup, refer to:
- [Stripe Custom Domain Documentation](https://stripe.com/docs/payments/checkout/custom-domains)
- [Stripe Support](https://support.stripe.com/)

---

**Status**: ✅ Integrated and Ready for Production
**Domain**: `pay.timeline-alchemy.nl`
**Last Updated**: December 2024
