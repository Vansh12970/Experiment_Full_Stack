const Student = require('../models/Student');

// Get all students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find();
        res.render('index', { students });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Render Add Student Form
exports.addStudentForm = (req, res) => {
    res.render('addStudent');
};

// Add a new student
exports.addStudent = async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.redirect('/');
    } catch (err) {
        res.status(400).send(err.message);
    }
};

// Render Edit Student Form
exports.editStudentForm = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).send('Student not found');
        res.render('editStudent', { student });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Update student
exports.updateStudent = async (req, res) => {
    try {
        await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.redirect('/');
    } catch (err) {
        res.status(400).send(err.message);
    }
};

// Delete student
exports.deleteStudent = async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        res.status(500).send(err.message);
    }
};
