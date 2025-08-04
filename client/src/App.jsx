import React, { useContext } from 'react'
import {Routes, Route} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import 'react-toastify/dist/ReactToastify.css'
import Home from "./pages/Home";
import Result from "./pages/Result";
import BuyCredit from "./pages/BuyCredit";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './components/Login';
import { AppContext } from './context/AppContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);


const App = () => {
  const {showLogin} = useContext(AppContext)

  return (
    <div className='px-4 sm:px-10 md:px-14 lg:px-28 min-h-screen bg-gradient-to-b from-teal-50 to-cyan-50'>
      <ToastContainer position='bottom-right'/>
      <Navbar />
      {showLogin && <Login />}
      <Routes>
        <Route path='/' element={ <Home/> }/>
        <Route path='/result' element={ <Result /> }/>

      <Route 
          path='/buy' 
          element={
            <Elements stripe={stripePromise}>
              <BuyCredit />
            </Elements>
          } 
        />
      </Routes>
      <Footer/>
    </div>
  )
} 

export default App;