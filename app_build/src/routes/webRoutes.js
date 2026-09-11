const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Route utama untuk dashboard
router.get('/dashboard', (req, res) => dashboardController.renderDashboard(req, res));
router.get('/', (req, res) => res.redirect('/dashboard'));

module.exports = router;
