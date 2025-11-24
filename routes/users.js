const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserActive,
  getUserStats
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// Protect all routes and require admin access
router.use(protect);
router.use(admin);

router.get('/', getUsers);
router.get('/stats/overview', getUserStats);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-active', toggleUserActive);

module.exports = router;