const express =require('express')
const router =express.Router()
const {User,Account,Transaction}=require('../models/User')
const {Auth}=require('../utils/middleware')
const { default: mongoose } = require('mongoose')
const ObjectId =require('mongoose')
const { number } = require('zod')



router.get("/balance", Auth, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

   console.log(account)
    res.json({
        balance: account.balance
    })
});

router.get("/info",Auth,async(req,res)=>{
    const account = await User.findById( req.userId)
    console.log(account)
    res.json(account)
})

// router.post("/add-money",Auth,async (req,res)=>{
//     const {amount} = req.body
//     const userId = req.userId
//     const account = await Account.find({userId})
//     console.log(account)
//     await Account.updateOne({userId:req.userId},{$inc:{balance:+amount}})

//     if (!amount || isNaN(amount) || Number(amount) <= 0) {
//         return res.status(400).json({ message: "Invalid amount" });
//       }
//     if (!account) {
//         return res.status(404).json({ message: "Account not found" });
//       }
//       const updatedAccount = await Account.findOne({ userId });
//     res.json({
//         message: `Successfully added $${amount} to the account`,
//         newBalance: updatedAccount.balance 
//       });
// })






router.post("/add-money", Auth, async (req, res) => {
    const { amount } = req.body;
    const userId = req.userId;
  
    // Ensure amount is a valid number
    const numAmount = Number(amount);
  
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
  
    try {
      const account = await Account.findOne({ userId });
  
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
  
      // Use the numAmount in the update operation
      await Account.updateOne(
        { userId: req.userId },
        { $inc: { balance: numAmount } }
      );
  
      const updatedAccount = await Account.findOne({ userId });
  
      res.json({
        message: `Successfully added $${numAmount.toFixed(2)} to the account`,
        newBalance: updatedAccount.balance
      });
    } catch (error) {
      console.error("Error adding money:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


router.post("/transfer",Auth,async(req,res)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    const {amount,to}=req.body

    const account = await Account.findOne({userId:req.userId}).session(session)


    if(!account || account.balance < amount ){
        await session.abortTransaction()
        return res.status(200).json({
            message:"Insufficient balance"
        })
    }

    const toAccount = await Account.findOne({userId:to}).session(session);


    if(!toAccount){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Invalid account"
        })
    }

    await Account.updateOne({userId:req.userId},{$inc:{balance:-amount}}).session(session)
    await Account.updateOne({userId:to},{$inc:{balance:amount}}).session(session)

    await session.commitTransaction();

    res.json({
        message:"Transfer successful"
    })
})

router.get("/bulk",Auth,async(req,res)=>{
 const filter =req.query.filter || "";
 const users =await User.find({
    $or:[{
        firstName:{
            "$regex":filter
        }
    },{
        lastName:{
            "$regex":filter
        }
    }
    ]
 })

 const filteredUsers = users.filter(user => user._id.toString() !== req.userId);

 // Respond with the filtered users
 res.json({
   users: filteredUsers.map(user => ({
     username: user.username,
     firstName: user.firstName,
     lastName: user.lastName,
     _id: user._id
   }))
 });

})


router.get('/recent-transactions', Auth, async (req, res) => {
  try {
    const userId = req.userId; // Assuming Auth middleware sets userId

    const recentTransactions = await Transaction.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    })
      .sort({ timestamp: -1 }) // Sort by most recent first
      .limit(10) // Limit to 10 most recent transactions
      .populate('fromUserId', 'username')
      .populate('toUserId', 'username');

    const formattedTransactions = recentTransactions.map(transaction => ({
      id: transaction._id,
      type: transaction.fromUserId._id.toString() === userId ? 'payment' : 'receive',
      otherParty: transaction.fromUserId._id.toString() === userId 
        ? transaction.toUserId.username 
        : transaction.fromUserId.username,
      amount: transaction.amount,
      timestamp: transaction.timestamp
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;