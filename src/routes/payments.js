import express from 'express'
import rateLimit from 'express-rate-limit'
import {
    initiateMobileMoney,
    verifyMobilePayment,
    verifySplitMobilePayments,
    initiateCardPayment,
    validateCardPayment,
    verifySplitCardPayments,
    handleFlutterwaveWebhook,
} from '../controllers/paymentControllers.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Debug endpoint to check Flutterwave configuration
router.get('/test-config', (req, res) => {
    const publicKeyExists = !!process.env.FLUTTERWAVE_PUBLIC_KEY
    const secretKeyExists = !!process.env.FLUTTERWAVE_SECRET_KEY
    
    res.json({
        status: publicKeyExists && secretKeyExists ? 'configured' : 'not_configured',
        publicKeyLoaded: publicKeyExists,
        secretKeyLoaded: secretKeyExists,
        publicKeyPreview: publicKeyExists ? process.env.FLUTTERWAVE_PUBLIC_KEY.substring(0, 20) + '...' : 'not_set',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    })
})

const paymentInitiationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 2,
    message: 'Too many payment initiation requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
})

// Moderate rate limiting for verification (5 requests per minute per IP)
const paymentVerificationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Too many verification requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
})

router.post('/mobile-money/initiate', protect, paymentInitiationLimiter, initiateMobileMoney)
router.get('/mobile-money/verify/:tx_ref', protect, paymentVerificationLimiter, verifyMobilePayment)
router.post('/mobile-money/verify-split', protect, paymentVerificationLimiter, verifySplitMobilePayments)
router.post('/card/initiate', protect, paymentInitiationLimiter, initiateCardPayment)
router.post('/card/validate', protect, paymentVerificationLimiter, validateCardPayment)
router.post('/card/verify-split', protect, paymentVerificationLimiter, verifySplitCardPayments)
router.post('/webhook/flutterwave', handleFlutterwaveWebhook)

export default router