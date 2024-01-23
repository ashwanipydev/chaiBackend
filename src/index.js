// require('dotenv').config({path: './env'}) //it is also fine but consistency is not maintenable.


import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`⚙ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MONGO DB Connection failed!!!", error);
})





















/**
import { express }  from "express";
const app = express()

( async()=>{ //Many time you will see that in professional code it starts with semi column.
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log('ERORR: ', error);
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error('ERROR: ', error)
        throw err
    }
})()
 */