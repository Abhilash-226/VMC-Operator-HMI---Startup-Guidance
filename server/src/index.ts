import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { sessionRouter } from './routes/session.js';
import { checklistRouter } from './routes/checklist.js';
import { operationRouter } from './routes/operation.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: true, // Allow all origins for the assignment
  credentials: true // Allow cookies
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/session', sessionRouter);
app.use('/api/checklist', checklistRouter);
app.use('/api/operation', operationRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
