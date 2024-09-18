const express =require('express');
const connectDB =require('./config/database_config')
const dotenv = require('dotenv');
const cors =require('cors');
const User =require('./models/User')
const router =require('./routes/index')

const app = express()
dotenv.config(); 
connectDB()


app.use(cors())
app.use(express.json())

app.use("/api/v1",router)




app.listen(3008,()=>{console.log("port lisiting on 3008")})