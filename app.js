import dotenv from 'dotenv';
dotenv.config({ path: './.env.development' });

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import connectDB from './config/config.js';
import authRoutes from './routes/auth.js';
import globleRoutes from './routes/route.js';

const app = express();

connectDB();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api', globleRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
