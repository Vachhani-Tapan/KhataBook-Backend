const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const itemRoutes = require('./routes/itemRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const reportRoutes = require('./routes/reportRoutes');
const partyRoutes = require('./routes/partyRoutes');
const path = require('path')

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health' , (req,res) => {
    res.json({status : 'OK' , message : 'Shop API is running'})
})

app.use('/api/auth' , authRoutes);
app.use('/api/items' , itemRoutes);
app.use('/api/upload' , uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/reports', reportRoutes);
app.use('/api/parties', partyRoutes);

app.use((err, req, res, next) => {
  console.error('Request error:', err.message);
  res.status(400).json({ message: err.message || 'Request failed' });
});

module.exports = app;