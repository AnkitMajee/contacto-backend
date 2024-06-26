const express = require('express');
const { createContact, editContact, searchContact } = require('../controllers/contactController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create', authMiddleware, createContact);
router.put('/edit', authMiddleware, editContact);
router.post('/search', authMiddleware, searchContact);

module.exports = router;
