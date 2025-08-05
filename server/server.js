import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoute.js'
import path from 'path';
import { fileURLToPath } from 'url';


const PORT = process.env.PORT || 4000
const app = express()

app.use(express.json());
app.use(cors({
  origin: '*', // or 'http://localhost:5173' or your frontend domain
  methods: ['GET', 'POST'],
  credentials: true
}));



app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)
// app.get('/', (req, res)=> res.send("API Working"))

if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}s

connectDB().then(()=> {
    app.listen(PORT, ()=> console.log('Server running on port '+ PORT));
}).catch(err => {
      console.error('❌ Failed to connect to DB', err);
})
