const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// REST API Endpoints Modern
router.get('/api/laporan', (req, res) => reportController.getAll(req, res));
router.get('/api/stats', (req, res) => reportController.getStats(req, res));
router.post('/api/laporan/disposisi/:index', (req, res) => reportController.disposisi(req, res));
router.post('/api/laporan/balas/:index', (req, res) => reportController.balas(req, res));
router.post('/api/laporan/update-status/:index', (req, res) => reportController.updateStatus(req, res));
router.delete('/api/laporan/:index', (req, res) => reportController.delete(req, res));

// Endpoint kompatibilitas mundur (Legacy Routes)
router.post('/disposisi/:index', (req, res) => reportController.disposisi(req, res));
router.post('/balas/:index', (req, res) => reportController.balas(req, res));
router.post('/update-status/:index', (req, res) => reportController.updateStatus(req, res));
router.delete('/hapus/:index', (req, res) => reportController.delete(req, res));

module.exports = router;
