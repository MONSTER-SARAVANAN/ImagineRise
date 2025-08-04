import userModel from "../models/userModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import Stripe from 'stripe';
import transactionModel from "../models/transactionModel.js"

const stripeInstance = new Stripe(process.env.STRIPE_KEY_SECRET);

const registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({ success:false, message: "Missing Details" });
        }
        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
            if (existingUser) {
                 return res.status(400).json({ success: false, message: "User already exists" });
                }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: "7d", // ✅ Optional: token expiry
        });
        res.status(201).json({success: true, token, user: {id: newUser._id,
                name: newUser.name,
                email: newUser.email,}})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}



const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Missing email or password" });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const userCredits = async (req,res)=> {
    try {
        const {userId} = req.body

        const user = await userModel.findById(userId)
        res.json({ success: true, credits: user.creditBalance, user:{name: user.name} })
    } catch (error) {
        console.error("user Credits:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// const userCredits = async (req, res) => {
// 	try {
// 		const userId = req.user?.id; // 🔐 safer: use authenticated user from middleware

// 		if (!userId) {
// 			return res.status(400).json({ success: false, message: "User ID is missing" });
// 		}

// 		const user = await userModel.findById(userId).select("creditBalance name");

// 		if (!user) {
// 			return res.status(404).json({ success: false, message: "User not found" });
// 		}

// 		res.json({
// 			success: true,
// 			credits: user.creditBalance || 0,
// 			user: { name: user.name },
// 		});
// 	} catch (error) {
// 		console.error("userCredits error:", error.message);
// 		res.status(500).json({ success: false, message: "Server error" });
// 	}
// };

// const stripeInstance = new stripe({
//     apiKey: process.env.STRIPE_KEY_SECRET,
//     apiVersion: '2020-08-27',
// })

// const  paymentStripe = async (req, res)=>{
//     try {
//         const {userId, planId} = req.body;

//         const userData = await userModel.findById(userId);

//         if(!userId || !planId){
//             return res.status(400).json({ success: false, message: "Missing userId, planId"})
//         }
//         let credits, plan, amount, date

//         switch (planId) {
//             case 'Basic':
//                 plan = 'Basic'
//                 credits = 100
//                 amount = 10
//                 break;
//             case 'Advanced':
//                 plan = 'Advanced'
//                 credits = 500
//                 amount = 50
//                 break;

//             case 'Business':
//                 plan = 'Business'
//                 credits = 5000
//                 amount = 250
//                 break;
//             default:
//                 return res.status(400).json({ success: false, message: "Invalid planId" });
//         }

//         date = Date.now();

//         const transactionData = 
//         {userId, plan, amount, credits, date
//         }
//         const newTransaction = await transactionModel.create(transactionData)

//         const options = {
//             amount: amount * 100,
//             currency: process.env.CURRENCY,
//             receipt: newTransaction._id,
//         }

//         await stripeInstance.orders.create(options, (error, order) => {
//             if(error){
//                 console.log(error);
//                 return res.status(500).json({ success: false, message: "Stripe order creation failed" });
//             }
//             res.status(200).json({ success: true, order})
//         })
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// }

const paymentStripe = async (req, res) => {
    try {
        const { userId, planId } = req.body;

        if (!userId || !planId) {
            return res.status(400).json({ success: false, message: "Missing userId or planId" });
        }

        const userData = await userModel.findById(userId);

        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let credits, plan, amount;
        switch (planId) {
            case 'Basic':
                plan = 'Basic';
                credits = 100;
                amount = 10;
                break;
            case 'Advanced':
                plan = 'Advanced';
                credits = 500;
                amount = 50;
                break;
            case 'Business':
                plan = 'Business';
                credits = 5000;
                amount = 250;
                break;
            default:
                return res.status(400).json({ success: false, message: "Invalid planId" });
        }

        const transaction = await transactionModel.create({
            userId,
            plan,
            amount,
            credits,
            date: Date.now(),
            payment: false
        });

        const paymentIntent = await stripeInstance.paymentIntents.create({
            amount: amount * 100,
            currency: process.env.CURRENCY || 'usd',
            metadata: {
                transactionId: transaction._id.toString(),
                userId: userId
            },
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Stripe payment error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// const verifyStripe = async (req, res)=> {
//     try {
//         const {stripe_order_id} = req.body;

//         const orderInfo = await stripeInstance.orders.fetch(stripe_order_id)

//         if(orderInfo.status === 'paid') {
//             const transactionData = await transactionModel.findById(orderInfo.receipt)
//             if(transactionData.payment) {
//                 return res.json({ success: false, message: 'Payment Failed' })
//             }
//             const userData = await userModel.findById(transactionData.userId)

//             const creditBalance = userData.creditBalance + transactionData.credits
//             await userModel.findByIdAndUpdate(userData._id, {creditBalance})

//             await transactionModel.findByIdAndUpdate(transactionData._id, {payment: true})

//             res.json({ success: true, message: "Credits Added"})
//         }else {
//            res.json({ success: false, message: "Payment Failed"})   
//         }
//     } catch (error) {
//         console.log(error);
//         res.json({ success: false, message: error.message });
//     }
// }

const verifyStripe = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            const transactionId = paymentIntent.metadata.transactionId;
            const transaction = await transactionModel.findById(transactionId);

            if (!transaction || transaction.payment) {
                return res.status(400).json({ success: false, message: "Invalid or already processed transaction" });
            }

            const user = await userModel.findById(transaction.userId);
            user.creditBalance = (user.creditBalance || 0) + transaction.credits;
            await user.save();

            transaction.payment = true;
            await transaction.save();

            res.status(200).json({ success: true, message: "Payment verified and credits added." });
        } else {
            res.status(400).json({ success: false, message: "Payment not successful" });
        }
    } catch (error) {
        console.error("Stripe verify error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export {registerUser, loginUser, userCredits, paymentStripe, verifyStripe}