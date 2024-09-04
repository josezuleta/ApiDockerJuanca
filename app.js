const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');

// Configuración de dotenv
dotenv.config();

// Configuración de la base de datos
var db = mysql.createConnection({
    host:'localhost',
    database:'mi_base_de_datos',
    user:'root',
    password:''
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Inicializa la aplicación
const app = express();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

// Limitar las solicitudes a la API
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10
    , // Límite de 2 solicitudes por IP
    message: 'Excediste el límite de peticiones, por favor intenta de nuevo más tarde.'
});
app.use(limiter);

// Configuración del motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.get('/index.ejs', (req, res) => {
    res.render('index.ejs');
});


app.get('/add-user', (req, res) => {
    res.render('add-user');
});

// Ruta para procesar el formulario de agregar usuario
app.post('/add-user', (req, res) => {
    const { name, phone, email } = req.body;
    const sql = 'INSERT INTO users (name, phone, email) VALUES (?, ?, ?)';
    db.query(sql, [name, phone, email], (err, results) => {
        if (err) throw err;
        res.redirect('/users'); // Redirige a la lista de usuarios después de agregar
    });
});


// Ruta para mostrar el formulario de edición de usuario
app.get('/edit-user/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.render('edit-user', { user: results[0] });
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    });
});

// Ruta para procesar el formulario de edición de usuario
app.post('/edit-user/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, email } = req.body;
    const sql = 'UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?';
    db.query(sql, [name, phone, email, id], (err, results) => {
        if (err) throw err;
        res.redirect('/users'); // Redirige a la lista de usuarios después de editar
    });
});




// Ruta para eliminar un usuario
app.get('/delete-user/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) throw err;
        res.redirect('/users'); // Redirige a la lista de usuarios después de eliminar
    });
});




// Ruta para listar usuarios
app.get('/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('list-users', { users: results });
    });
});

// Otras rutas...
// Inicia el servidor
app.listen(process.env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});
