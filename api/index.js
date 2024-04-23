import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' });

import connectDB from "../src/db/index.js";
import { app } from '../src/app.js'

app.get('/', (req ,res) => {
    return res.json({ msg : "Healthy"})
})


connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })







