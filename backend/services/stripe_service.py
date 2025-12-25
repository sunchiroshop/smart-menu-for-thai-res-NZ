"""
Stripe Service for Payment Processing
"""

import os
import stripe
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', '')

class StripeService:
    """Service for handling Stripe payments and subscriptions"""
    
    def __init__(self):
        self.api_key = os.getenv('STRIPE_SECRET_KEY')
        if not self.api_key:
            print("⚠️ WARNING: STRIPE_SECRET_KEY not found. Payment features will not work.")
        else:
            stripe.api_key = self.api_key
    
    def create_checkout_session(
        self,
        price_id: str,
        user_id: str,
        user_email: str,
        plan_id: str,
        interval: str = 'monthly',
        success_url: str = None,
        cancel_url: str = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout Session
        
        Args:
            price_id: Stripe Price ID
            user_id: User ID from your system
            user_email: User email
            plan_id: Plan ID (basic, pro, enterprise)
            interval: Billing interval (monthly, yearly)
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect after cancelled payment
            
        Returns:
            Dictionary with session_id and checkout_url
        """
        try:
            if not self.api_key:
                raise Exception("Stripe API key not configured")
            
            # Default URLs
            if not success_url:
                success_url = os.getenv('FRONTEND_URL', 'http://localhost:3000') + '/checkout/success?session_id={CHECKOUT_SESSION_ID}'
            if not cancel_url:
                cancel_url = os.getenv('FRONTEND_URL', 'http://localhost:3000') + '/checkout/cancel'
            
            # Create Checkout Session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=user_email,
                client_reference_id=user_id,
                metadata={
                    'user_id': user_id,
                    'plan_id': plan_id,
                    'interval': interval,
                },
                subscription_data={
                    'metadata': {
                        'user_id': user_id,
                        'plan_id': plan_id,
                        'interval': interval,
                    }
                },
            )
            
            return {
                'session_id': session.id,
                'checkout_url': session.url,
            }
            
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create checkout session: {str(e)}")
    
    def verify_session(self, session_id: str) -> Dict[str, Any]:
        """
        Verify a Stripe Checkout Session
        
        Args:
            session_id: Stripe Checkout Session ID
            
        Returns:
            Dictionary with subscription details
        """
        try:
            if not self.api_key:
                raise Exception("Stripe API key not configured")
            
            # Retrieve the session
            session = stripe.checkout.Session.retrieve(session_id)
            
            if session.payment_status != 'paid':
                raise Exception("Payment not completed")
            
            # Get subscription details
            subscription = None
            if session.subscription:
                subscription = stripe.Subscription.retrieve(session.subscription)
            
            return {
                'session_id': session.id,
                'payment_status': session.payment_status,
                'customer_email': session.customer_details.email if session.customer_details else None,
                'amount_total': session.amount_total / 100,  # Convert from cents
                'currency': session.currency,
                'user_id': session.metadata.get('user_id'),
                'plan_id': session.metadata.get('plan_id'),
                'interval': session.metadata.get('interval'),
                'subscription_id': session.subscription,
                'subscription_status': subscription.status if subscription else None,
                'subscription': {
                    'id': subscription.id if subscription else None,
                    'status': subscription.status if subscription else None,
                    'current_period_start': datetime.fromtimestamp(subscription.current_period_start).isoformat() if subscription else None,
                    'current_period_end': datetime.fromtimestamp(subscription.current_period_end).isoformat() if subscription else None,
                    'plan_name': session.metadata.get('plan_id', '').title(),
                    'interval': session.metadata.get('interval'),
                    'amount': session.amount_total / 100,
                } if subscription else None,
            }
            
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to verify session: {str(e)}")
    
    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Cancel a Stripe Subscription
        
        Args:
            subscription_id: Stripe Subscription ID
            
        Returns:
            Dictionary with cancellation details
        """
        try:
            if not self.api_key:
                raise Exception("Stripe API key not configured")
            
            # Cancel the subscription
            subscription = stripe.Subscription.delete(subscription_id)
            
            return {
                'subscription_id': subscription.id,
                'status': subscription.status,
                'cancelled_at': datetime.fromtimestamp(subscription.canceled_at).isoformat() if subscription.canceled_at else None,
            }
            
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to cancel subscription: {str(e)}")
    
    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Get Stripe Subscription details
        
        Args:
            subscription_id: Stripe Subscription ID
            
        Returns:
            Dictionary with subscription details
        """
        try:
            if not self.api_key:
                raise Exception("Stripe API key not configured")
            
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            return {
                'subscription_id': subscription.id,
                'status': subscription.status,
                'current_period_start': datetime.fromtimestamp(subscription.current_period_start).isoformat(),
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end).isoformat(),
                'plan_id': subscription.metadata.get('plan_id'),
                'interval': subscription.metadata.get('interval'),
            }
            
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to get subscription: {str(e)}")
    
    def create_customer_portal_session(
        self,
        customer_id: str,
        return_url: str = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe Customer Portal Session
        (for managing subscriptions, payment methods, etc.)
        
        Args:
            customer_id: Stripe Customer ID
            return_url: URL to redirect after customer portal session
            
        Returns:
            Dictionary with portal_url
        """
        try:
            if not self.api_key:
                raise Exception("Stripe API key not configured")
            
            if not return_url:
                return_url = os.getenv('FRONTEND_URL', 'http://localhost:3000') + '/dashboard'
            
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            
            return {
                'portal_url': session.url,
            }

        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create portal session: {str(e)}")

    # =============================================
    # Payment Intent Methods (for one-time payments)
    # =============================================

    def create_payment_intent(
        self,
        amount: float,
        currency: str = 'nzd',
        order_id: str = None,
        restaurant_id: str = None,
        customer_email: str = None,
        description: str = None,
    ) -> Dict[str, Any]:
        """
        Create a Stripe Payment Intent for one-time order payments

        Args:
            amount: Amount in dollars (will be converted to cents)
            currency: Currency code (default: nzd)
            order_id: Order ID for metadata
            restaurant_id: Restaurant ID for metadata
            customer_email: Customer email (optional)
            description: Payment description

        Returns:
            Dictionary with client_secret and payment_intent_id
        """
        try:
            if not self.api_key:
                raise Exception("Stripe API key not configured")

            # Convert amount to cents
            amount_cents = int(amount * 100)

            # Build metadata
            metadata = {}
            if order_id:
                metadata['order_id'] = order_id
            if restaurant_id:
                metadata['restaurant_id'] = restaurant_id

            # Create Payment Intent parameters
            intent_params = {
                'amount': amount_cents,
                'currency': currency.lower(),
                'metadata': metadata,
                'automatic_payment_methods': {
                    'enabled': True,
                },
            }

            if description:
                intent_params['description'] = description

            if customer_email:
                intent_params['receipt_email'] = customer_email

            # Create the Payment Intent
            intent = stripe.PaymentIntent.create(**intent_params)

            return {
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'amount': amount,
                'currency': currency,
                'status': intent.status,
            }

        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create payment intent: {str(e)}")

    def retrieve_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """
        Retrieve a Payment Intent to check its status

        Args:
            payment_intent_id: Stripe Payment Intent ID

        Returns:
            Dictionary with payment details
        """
        try:
            if not self.api_key:
                raise Exception("Stripe API key not configured")

            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            return {
                'payment_intent_id': intent.id,
                'status': intent.status,
                'amount': intent.amount / 100,  # Convert from cents
                'currency': intent.currency,
                'order_id': intent.metadata.get('order_id'),
                'restaurant_id': intent.metadata.get('restaurant_id'),
                'receipt_url': intent.charges.data[0].receipt_url if intent.charges.data else None,
                'paid': intent.status == 'succeeded',
            }

        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to retrieve payment intent: {str(e)}")

    def confirm_payment(self, payment_intent_id: str, order_id: str = None) -> Dict[str, Any]:
        """
        Confirm/verify that a payment was successful

        Args:
            payment_intent_id: Stripe Payment Intent ID
            order_id: Order ID to verify (optional, for extra validation)

        Returns:
            Dictionary with verification result
        """
        try:
            if not self.api_key:
                raise Exception("Stripe API key not configured")

            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            # Verify order_id if provided
            if order_id and intent.metadata.get('order_id') != order_id:
                raise Exception("Order ID mismatch")

            is_paid = intent.status == 'succeeded'

            return {
                'payment_intent_id': intent.id,
                'status': intent.status,
                'paid': is_paid,
                'amount': intent.amount / 100,
                'currency': intent.currency,
                'order_id': intent.metadata.get('order_id'),
                'restaurant_id': intent.metadata.get('restaurant_id'),
                'receipt_url': intent.charges.data[0].receipt_url if intent.charges.data else None,
                'paid_at': datetime.now().isoformat() if is_paid else None,
            }

        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to confirm payment: {str(e)}")

    def create_refund(
        self,
        payment_intent_id: str,
        amount: float = None,
        reason: str = 'requested_by_customer'
    ) -> Dict[str, Any]:
        """
        Create a refund for a payment

        Args:
            payment_intent_id: Stripe Payment Intent ID
            amount: Refund amount in dollars (None for full refund)
            reason: Refund reason (duplicate, fraudulent, requested_by_customer)

        Returns:
            Dictionary with refund details
        """
        try:
            if not self.api_key:
                raise Exception("Stripe API key not configured")

            refund_params = {
                'payment_intent': payment_intent_id,
                'reason': reason,
            }

            if amount:
                refund_params['amount'] = int(amount * 100)  # Convert to cents

            refund = stripe.Refund.create(**refund_params)

            return {
                'refund_id': refund.id,
                'status': refund.status,
                'amount': refund.amount / 100,
                'currency': refund.currency,
                'payment_intent_id': payment_intent_id,
            }

        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create refund: {str(e)}")

    def construct_webhook_event(self, payload: bytes, sig_header: str) -> Any:
        """
        Construct and verify a Stripe webhook event

        Args:
            payload: Request body as bytes
            sig_header: Stripe-Signature header

        Returns:
            Verified Stripe Event object
        """
        try:
            webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
            if not webhook_secret:
                raise Exception("Stripe webhook secret not configured")

            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            return event

        except stripe.error.SignatureVerificationError as e:
            raise Exception(f"Invalid webhook signature: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to construct webhook event: {str(e)}")


# Create a singleton instance
stripe_service = StripeService()

