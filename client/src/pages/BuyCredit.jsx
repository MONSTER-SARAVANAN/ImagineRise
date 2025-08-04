import React, { useContext } from 'react';
import { assets, plans } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const BuyCredit = () => {
  const { user, backendUrl, loadCreditsData, token, setShowLogin } = useContext(AppContext);
  const navigate = useNavigate();

  // ✅ These hooks MUST be called at the top level
  const stripe = useStripe();
  const elements = useElements();

  const paymentStripe = async (planId) => {
    try {
      if (!user) {
        setShowLogin(true);
        return;
      }

      const { data } = await axios.post(`${backendUrl}/api/user/pay-stripe`, { planId }, {
        headers: { token }
      });

      if (data.success) {
        const cardElement = elements.getElement(CardElement);

        if (!stripe || !cardElement) {
          toast.error("Stripe has not loaded properly.");
          return;
        }

        const result = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user.name,
              email: user.email,
            },
          },
        });

        if (result.error) {
          toast.error(result.error.message);
        } else if (result.paymentIntent.status === 'succeeded') {
          const verify = await axios.post(`${backendUrl}/api/user/verify-stripe`, {
            paymentIntentId: result.paymentIntent.id
          }, { headers: { token } });

          if (verify.data.success) {
            loadCreditsData();
            navigate('/');
            toast.success("Credits added!");
          } else {
            toast.error("Verification failed");
          }
        }
      }
    } catch (error) {
      console.error("Stripe frontend error:", error);
      toast.error(error.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className='min-h-[80vh] text-center pt-14 mb-10'
    >
      <button className='border border-gray-400 px-10 py-2 rounded-full mb-6'>Our Plans</button>
      <h1 className='text-center text-3xl font-medium mb-6 sm:mb-10'>Choose the plan</h1>

      <div className='flex flex-wrap justify-center gap-6 text-left'>
        {plans.map((item, index) => (
          <div
            key={index}
            className='bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-600 hover:scale-105 transition-all duration-500'
          >
            <img width={40} src={assets.logo_icon} alt="" />
            <p className='mt-3 mb-1 font-semibold'>{item.id}</p>
            <p className='text-sm'>{item.desc}</p>
            <p className='mt-6'>
              <span className='text-3xl font-medium'>${item.price}</span> / {item.credits} credits
            </p>
            <button
              onClick={() => paymentStripe(item.id)}
              className='w-full bg-gray-800 text-white mt-8 text-sm rounded-md py-2.5 min-w-52'
            >
              {user ? 'Purchase' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>

      {/* ✅ Add CardElement for Stripe card input */}
      <div className='mt-10 max-w-md mx-auto p-4 border rounded'>
        <CardElement />
      </div>
    </motion.div>
  );
};

export default BuyCredit;
