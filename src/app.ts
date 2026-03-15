
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.get('/version', (req, res) => {
  res.status(200).json({ version: '1.0.0' });
});

if (process.env.NODE_ENV === 'development') {
  app.get('/debug', (req, res) => {
    res.status(200).json({ 
        message: 'Debug mode is on',
        env: process.env
     });
  });
}

export default app;
