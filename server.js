require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running 🚀' });
});

// port (IMPORTANT for Railway)
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
