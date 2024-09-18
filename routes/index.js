const express =require('express');
const router =express.Router()
const userRouter = require('../controller/user');
const accountRoutes =require('../controller/account');

router.use('/user',userRouter),
router.use('/account',accountRoutes)


module.exports=router;