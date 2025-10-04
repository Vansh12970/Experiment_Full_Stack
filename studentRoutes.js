const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/', studentController.getAllStudents);
router.get('/add', studentController.addStudentForm);
router.post('/add', studentController.addStudent);
router.get('/edit/:id', studentController.editStudentForm);
router.post('/edit/:id', studentController.updateStudent);
router.get('/delete/:id', studentController.deleteStudent);

module.exports = router;
