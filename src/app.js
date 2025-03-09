/*
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
  origin: 'process.env.CORS_ORIGIN',
  credentials: true
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// Routes import
import userRoutes from './routes/user.routes.js';

// Routes declaration
app.use('/api/v1/users', userRoutes);

export default app;
*/
// Updated app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN, // Removed quotes to use the actual environment variable
  credentials: true
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Routes import
import userRoutes from './routes/user.routes.js';

// Routes declaration
app.use('/api/v1/users', userRoutes);

export default app;