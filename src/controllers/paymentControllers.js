import Flutterwave from 'flutterwave-node-v3'
import { generateTransactionReference } from '../utils/flwtxt_ref.js'
import asyncHandler from 'express-async-handler'
import dotenv from 'dotenv'

dotenv.config()

// Initialize Flutterwave with proper configuration
const flw = new Flutterwave(
    process.env.FLUTTERWAVE_PUBLIC_KEY, 
    process.env.FLUTTERWAVE_SECRET_KEY
)

// Constants
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const validatePaymentFields = (fields, requiredFields) => {
    const missingFields = requiredFields.filter(field => !fields[field])
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }
}



export const initiateMobileMoney = asyncHandler(async (req, res) => {
    const { amount, phone_number, email, tx_ref, network } = req.body

    // Validate required fields
    validatePaymentFields(
        { amount, phone_number, email, tx_ref, network },
        ['amount', 'phone_number', 'email', 'tx_ref', 'network']
    )

    if (!process.env.FLUTTERWAVE_PUBLIC_KEY || !process.env.FLUTTERWAVE_SECRET_KEY) {
        console.error('Flutterwave keys not configured')
        return res.status(500).json({
            status: 'failed',
            message: 'Payment gateway not configured. Please contact support.'
        })
    }

    const payload = {
        phone_number,
        network,
        amount,
        currency: 'UGX',
        redirect_url: `${FRONTEND_URL}/payment/success/${tx_ref}`,
        email,
        tx_ref,
    }

    console.log('Initiating Mobile Money payment:', { tx_ref, amount, phone_number, network })

    const response = await flw.MobileMoney.uganda(payload)

    console.log('Flutterwave Mobile Money Response:', JSON.stringify(response, null, 2))

    if (!response || response.status !== 'success') {
        console.error('Mobile Money payment failed:', response?.message || response)
        return res.status(400).json({
            status: 'failed',
            message: response?.message || 'Invalid response from payment gateway',
        })
    }

    if (response.meta?.authorization?.mode === 'otp') {
        return res.status(200).json({
            status: 'otp_required',
            flw_ref: response.data?.flw?.ref,
            message: 'OTP required to complete payment',
        })
    }

    if (response.meta?.authorization?.mode === 'redirect') {
        return res.status(200).json({
            status: 'success',
            redirectLink: response.meta.authorization.redirect,
        })
    }

    res.status(200).json({
        status: 'success',
        message: 'Payment initiated successfully',
    })
})

export const verifyMobilePayment = asyncHandler(async (req, res) => {
    const { tx_ref } = req.params

    if (!tx_ref) {
        return res.status(400).json({
            status: 'error',
            message: 'Transaction reference (tx_ref) is required',
        })
    }

    console.log(`Verifying payment for tx_ref: ${tx_ref}`)

    try {
        const response = await flw.Transaction.verify({ reference: tx_ref })

        console.log('Flutterwave Verification Response:', JSON.stringify(response, null, 2))

        const isSuccessful = 
            (response.status === 'success' && response.data?.status === 'successful') ||
            (response.data?.status === 'successful') ||
            (response.data?.status === 'completed') ||
            (response.status === 'success' && response.data?.amount)

        if (isSuccessful) {
            console.log(`Verification SUCCESS for tx_ref: ${tx_ref}, Amount: ${response.data?.amount}`)
            return res.status(200).json({
                status: 'verified',
                message: 'Payment confirmed and recorded',
                data: {
                    amount: response.data?.amount,
                    currency: response.data?.currency,
                    txRef: response.data?.tx_ref
                }
            })
        }

        console.error(`Verification FAILED for tx_ref: ${tx_ref}. Status: ${response.data?.status}`)
        return res.status(400).json({
            status: 'error',
            message: 'Payment verification failed',
            details: response.data?.status || 'Unknown status'
        })
    } catch (error) {
        console.error(`Verification error for tx_ref: ${tx_ref}:`, error.message)
        
       
        if (error.message && error.message.includes('"id"')) {
            return res.status(202).json({
                status: 'pending',
                message: 'Payment appears successful. Waiting for transaction confirmation. Please check your order status.',
                tx_ref: tx_ref
            })
        }

        return res.status(500).json({
            status: 'error',
            message: 'Error verifying payment. Payment may still be processing.',
            error: error.message
        })
    }
})

export const verifySplitMobilePayments = asyncHandler(async (req, res) => {
    const { baseRef, paymentChunks } = req.body

    if (!baseRef || !paymentChunks || !Array.isArray(paymentChunks)) {
        return res.status(400).json({
            status: 'error',
            message: 'baseRef and paymentChunks array are required',
        })
    }

    const verificationResults = []
    let totalVerified = 0

    for (const chunk of paymentChunks) {
        try {
            if (!chunk.tx_ref) {
                verificationResults.push({
                    tx_ref: chunk.tx_ref,
                    verified: false,
                    amount: chunk.amount,
                    reason: 'No tx_ref available for verification',
                })
                continue
            }

            console.log(`Verifying chunk ${chunk.chunkIndex} with tx_ref: ${chunk.tx_ref}`)

            const response = await flw.Transaction.verify({ reference: chunk.tx_ref })

            if (response.status === 'success' && response.data?.status === 'successful') {
                verificationResults.push({
                    tx_ref: chunk.tx_ref,
                    verified: true,
                    amount: chunk.amount,
                })
                totalVerified++
            } else {
                verificationResults.push({
                    tx_ref: chunk.tx_ref,
                    verified: false,
                    amount: chunk.amount,
                    reason: response.data?.status || 'Unknown error',
                })
            }
        } catch (error) {
            console.error(`Verification error for chunk ${chunk.chunkIndex}:`, error.message)
            verificationResults.push({
                tx_ref: chunk.tx_ref,
                verified: false,
                amount: chunk.amount,
                reason: error.message,
            })
        }
    }

    const allVerified = totalVerified === paymentChunks.length

    res.status(200).json({
        status: allVerified ? 'verified' : 'partial',
        baseRef,
        totalChunks: paymentChunks.length,
        verifiedChunks: totalVerified,
        verificationResults,
        message: allVerified
            ? 'All payment chunks verified successfully.'
            : `${totalVerified} of ${paymentChunks.length} chunks verified.`,
    })
})


export const initiateCardPayment = asyncHandler(async (req, res) => {
    const { amount, email, tx_ref, card_number, cvv, expiry_month, expiry_year, fullname, currency = 'UGX', pin } = req.body

    validatePaymentFields(
        { amount, email, tx_ref, card_number, cvv, expiry_month, expiry_year, fullname, pin },
        ['amount', 'email', 'tx_ref', 'card_number', 'cvv', 'expiry_month', 'expiry_year', 'fullname', 'pin']
    )

    const payload = {
        card_number,
        cvv,
        expiry_month,
        expiry_year,
        currency,
        email,
        fullname,
        tx_ref,
        amount,
        redirect_url: `${FRONTEND_URL}/payment/success/${tx_ref}`,
        authorization: {
            mode: 'pin',
        },
        pin,
    }

    console.log('Initiating Card payment:', { tx_ref, amount })

    const response = await flw.Charge.card(payload)

    console.log('Flutterwave Card Charge Response:', JSON.stringify(response, null, 2))

    if (!response || response.status !== 'success') {
        console.error('Card payment failed:', response?.message)
        return res.status(400).json({
            status: 'failed',
            message: response?.message || 'Card payment failed',
        })
    }

    // Check for redirect or OTP
    if (response.meta?.authorization?.mode === 'otp') {
        return res.status(200).json({
            status: 'otp_required',
            flw_ref: response.data?.flw?.ref,
            message: 'OTP required to complete payment',
        })
    }

    if (response.meta?.authorization?.mode === 'redirect') {
        return res.status(200).json({
            status: 'success',
            redirectLink: response.meta.authorization.redirect,
        })
    }

    res.status(200).json({
        status: 'success',
        message: 'Payment initiated successfully',
    })
})

export const validateCardPayment = asyncHandler(async (req, res) => {
    const { flw_ref, otp } = req.body

    if (!flw_ref || !otp) {
        return res.status(400).json({
            status: 'error',
            message: 'flw_ref and otp are required',
        })
    }

    console.log(`Validating OTP for flw_ref: ${flw_ref}`)

    const response = await flw.Charge.validate({
        flw_ref,
        otp,
    })

    console.log('OTP Validation Response:', JSON.stringify(response, null, 2))

    if (response.status === 'success') {
        console.log(`OTP Validation SUCCESS for flw_ref: ${flw_ref}`)
        return res.status(200).json({
            status: 'success',
            message: 'Payment validated successfully',
        })
    }

    console.error(`OTP Validation FAILED for flw_ref: ${flw_ref}. Status: ${response.data?.status}`)
    res.status(400).json({
        status: 'failed',
        message: response?.message || 'OTP validation failed',
    })
})

export const verifySplitCardPayments = asyncHandler(async (req, res) => {
    const { baseRef, paymentCardChunks } = req.body

    if (!baseRef || !paymentCardChunks || !Array.isArray(paymentCardChunks)) {
        return res.status(400).json({
            status: 'error',
            message: 'baseRef and paymentCardChunks array are required',
        })
    }

    const verificationResults = []
    let totalVerified = 0

    for (const cardChunk of paymentCardChunks) {
        try {
            if (!cardChunk.tx_ref) {
                verificationResults.push({
                    tx_ref: cardChunk.tx_ref,
                    verified: false,
                    amount: cardChunk.amount,
                    reason: 'No tx_ref available for verification',
                })
                continue
            }

            console.log(`Verifying card chunk ${cardChunk.chunkIndex} with tx_ref: ${cardChunk.tx_ref}`)

            const response = await flw.Transaction.verify({ reference: cardChunk.tx_ref })

            if (response.status === 'success' && response.data?.status === 'successful') {
                verificationResults.push({
                    tx_ref: cardChunk.tx_ref,
                    verified: true,
                    amount: cardChunk.amount,
                })
                totalVerified++
            } else {
                verificationResults.push({
                    tx_ref: cardChunk.tx_ref,
                    verified: false,
                    amount: cardChunk.amount,
                    reason: response.data?.status || 'Unknown error',
                })
            }
        } catch (error) {
            console.error(`Verification error for card chunk ${cardChunk.chunkIndex}:`, error.message)
            verificationResults.push({
                tx_ref: cardChunk.tx_ref,
                verified: false,
                amount: cardChunk.amount,
                reason: error.message,
            })
        }
    }

    const allVerified = totalVerified === paymentCardChunks.length

    res.status(200).json({
        status: allVerified ? 'verified' : 'partial',
        baseRef,
        totalChunks: paymentCardChunks.length,
        verifiedChunks: totalVerified,
        verificationResults,
        message: allVerified
            ? 'All payment chunks verified successfully'
            : `${totalVerified} of ${paymentCardChunks.length} chunks verified`,
    })
})


export const handleFlutterwaveWebhook = asyncHandler(async (req, res) => {
    const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || 'default_secret'
    
    // Get the hash from header
    const hash = req.headers['verifi-hash']
    
    if (!hash) {
        console.warn('Webhook received without verification hash')
        return res.status(400).json({
            status: 'error',
            message: 'Missing verification hash'
        })
    }
    
    const payload = req.body
    console.log('Flutterwave Webhook Received:', JSON.stringify(payload, null, 2))

    
    if (!payload || !payload.data) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid webhook payload'
        })
    }

    const { data } = payload
    const txRef = data.tx_ref
    const status = data.status
    const amount = data.amount

    console.log(`Webhook: Processing payment ${txRef} with status: ${status}`)

    // Only mark as paid if status is successful
    if (status === 'successful') {
        // Import Order model here to avoid circular dependencies
        const Order = (await import('../models/Order.js')).default

        try {
            console.log(`Webhook: Payment ${txRef} confirmed as successful. Amount: ${amount}`)
            
            return res.status(200).json({
                status: 'success',
                message: 'Webhook processed successfully'
            })
        } catch (error) {
            console.error('Error processing webhook:', error)
            return res.status(500).json({
                status: 'error',
                message: 'Error processing payment notification'
            })
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Webhook received'
    })
})