const express =require("express");
const zod =require("zod");
const jwt =require("jsonwebtoken")
const router =express.Router();
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const {User,Account,Transaction} =require("../models/User")




const signupSchema =zod.object({
    username:zod.string(),
    password:zod.string(),
    firstName:zod.string(),
    lastName:zod.string()
})

router.post("/signup", async (req,res)=>{
    const body =req.body;
    const {success}=signupSchema.safeParse(req.body);
    if(!success){
        return res.json({
            message:"email already /Incorect inputs"
        })
    }
    
    const user = await User.findOne({
        username:body.username
    })
    if(user ){
       return res.json({
        message:"email already taken  / Incorect inputs"
       })
    }
 

    const dbUser =await User.create(body);
    const dbAccount = await Account.create({
        userId: dbUser._id, // Use dbUser._id, not body._id
        username: body.username,
        balance: 0
    });
    const dbTransaction =await Transaction.create();

    const token =jwt.sign({userId:dbUser._id},JWT_SECRET)
    res.json({
        message:"User created successfully",
        token:token
    })
})


const loginSchema=zod.object({
    username:zod.string(),
    password:zod.string()
   })

router.post("/login", async(req,res)=>{
  
    
   const body= req.body 
   const {success} = loginSchema.safeParse(req.body)

   if (!success) {
    return res.json({
        message: "Invalid inputs"
    });
}

    
    
    const user = await User.findOne({username:body.username})



    if(!user){
        return res.status(411).json({
            message:"invalid username or password"
        })
    }

    if(   user.password !== body.password){
        return res.status(411).json({
            message:"invalid password or username"
        })
    }


    if(   user.password === body.password){
      const token =jwt.sign({userId:user._id},JWT_SECRET)
       return res.status(200).json({
        token:token,
        message:"login sucessfully"
      })
    }
   }
)

module.exports = router;





