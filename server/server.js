import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoute.js'
import path from 'path';
import { fileURLToPath } from 'url';


const PORT = process.env.PORT
const app = express()

app.use(express.json());
app.use(cors());



app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)
app.get('/', (req, res)=> res.send("API Working"))

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

connectDB().then(()=> {
    app.listen(PORT, ()=> console.log('Server running on port '+ PORT));
}).catch(err => {
      console.error('❌ Failed to connect to DB', err);
})
