const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const multer = require('multer');
const path = require('path');
const QRCode = require('qrcode');
const basicAuth = require('basic-auth');
const fs = require('fs');

require('dotenv').config();

//Define URL
// const url = '/werkzeug';

// Setup Express.js
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MariaDB Pool-Verbindung
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});


//Auth für Admin
const auth = (req, res, next) => {
    const user = basicAuth(req);
    if (user && user.name === process.env.LOGIN_USER && user.pass === process.env.LOGIN_PASS) {
        return next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm="example"');
        return res.status(401).send('Authentication required.');
    }
};

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Static files (CSS, JS, Werkzeug-Bilder)
app.use('/werkzeug', express.static('public'));
app.use('/werkzeug/uploads', express.static('uploads'));

// Multer Setup für das Hochladen von Bildern
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Speichere Datei mit Zeitstempel
    }
});
const upload = multer({ storage: storage });

// ---------- FRONTEND ---------- //

// Startseite anzeigen
app.get('/werkzeug', (req, res) => {
    res.render('index');
});

// Route für die neue Suchseite
app.get('/werkzeug/suche', (req, res) => {
    res.render('suche');
});

// Seite für Werkzeugrückgabe anzeigen (mit QR-Code und Personalnummer-Abfrage)
app.get('/werkzeug/zurueckgeben', (req, res) => {
    res.render('zurueckgeben');
});

// Seite für Werkzeugausleihe anzeigen (mit Bild)
app.get('/werkzeug/ausleihen', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const werkzeuge = await conn.query('SELECT * FROM werkzeug');
        conn.release();
        res.render('ausleihen', { werkzeuge });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Seite für Werkzeugrückgabe anzeigen (mit Bild)
app.get('/werkzeug/zurueckgeben', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const werkzeuge = await conn.query('SELECT * FROM werkzeug');
        conn.release();
        res.render('zurueckgeben', { werkzeuge });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Seite für Kalibrierungsauswertung anzeigen
app.get('/werkzeug/kalibrierung', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const werkzeuge = await conn.query(
            `SELECT * FROM werkzeug WHERE kalibrierpflichtig = true AND kalibrierzeitraum <= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) order by kalibrierzeitraum;`
        );
        conn.release();

        const formattedWerkzeuge = werkzeuge.map(werkzeug => ({
            ...werkzeug,
            kalibrierzeitraum: formatDate(new Date(werkzeug.kalibrierzeitraum))
        }));

        // Übergib die formatierten Daten an die EJS-Ansicht
        res.render('kalibrierung', { werkzeuge: formattedWerkzeuge });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/werkzeug/logout', (req, res) => {
    res.set('WWW-Authenticate', 'Basic realm="example"');
    return res.status(401).send('Logged out');
});

// Admin-Seite anzeigen
app.use('/werkzeug/admin', auth);

app.get('/werkzeug/admin', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const werkzeuge = await conn.query('SELECT * FROM werkzeug');
        conn.release();
        res.render('admin', { werkzeuge });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Werkzeug anlegen (Admin)
app.post('/werkzeug/admin/werkzeug/neu', upload.single('bild'), async (req, res) => {
    console.log(req.file);  // Gibt den Dateinamen und Pfad der hochgeladenen Datei aus
    const { name, lagerort, kalibrierzeitraum, kalibrierpflichtig } = req.body;
    const bild = req.file ? req.file.filename : null;
    try {
        const conn = await pool.getConnection();
        await conn.query(
            `INSERT INTO werkzeug (name, lagerort, kalibrierzeitraum, kalibrierpflichtig, bild) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, lagerort, kalibrierzeitraum || null, kalibrierpflichtig === 'true', bild]
        );
        conn.release();
        res.redirect('/werkzeug/admin');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Werkzeug editieren (Admin)
app.post('/werkzeug/admin/werkzeug/edit/:id', upload.single('bild'), async (req, res) => {
    const { name, lagerort,  kalibrierzeitraum, kalibrierpflichtig } = req.body;
    const bild = req.file ? req.file.filename : req.body.bildAlt;
    try {
        const conn = await pool.getConnection();
        await conn.query(
            `UPDATE werkzeug 
             SET name = ?, lagerort = ?,  kalibrierzeitraum = ?, kalibrierpflichtig = ?, bild = ? 
             WHERE id = ?`,
            [name, lagerort, kalibrierzeitraum || null, kalibrierpflichtig === 'true', bild, req.params.id]
        );
        conn.release();
        res.redirect('/werkzeug/admin');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Werkzeug löschen (Admin)
app.post('/werkzeug/admin/werkzeug/delete/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        await conn.query('DELETE FROM werkzeug WHERE id = ?', [req.params.id]);
        conn.release();
        res.redirect('/admin');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Seite für Auswertung pro LFZ anzeigen
app.get('/werkzeug/auswertung/lfz', (req, res) => {
    res.render('auswertung_lfz');
});

// Seite für Auswertung pro Personalnummer anzeigen
app.get('/werkzeug/auswertung/personal', (req, res) => {
    res.render('auswertung_personal');
});

// ---------- BACKEND-API ---------- //

// Auswertung: Werkzeuge pro LFZ
app.get('/werkzeug/api/auswertung/lfz/:lfz_kennzeichen', async (req, res) => {
    const lfz_kennzeichen = req.params.lfz_kennzeichen.toLowerCase();
    try {
        const conn = await pool.getConnection();
        const werkzeuge = await conn.query(
            `SELECT a.*, w.lagerort, w.kalibrierzeitraum, w.name 
            FROM ausleihe a
            JOIN werkzeug w ON a.werkzeug_id = w.id
            WHERE a.lfz_kennzeichen = ? AND a.rueckgabe_datum IS NULL;`,
            [lfz_kennzeichen]
        );
        conn.release();
        console.log(werkzeuge);
        // write sql query to console

        res.status(200).json(werkzeuge);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// Auswertung: Werkzeuge pro Personalnummer
app.get('/werkzeug/api/auswertung/personal/:personalnummer', async (req, res) => {
    const personalnummer = req.params.personalnummer;
    console.log(personalnummer);
    console.log(req.params);
    try {
        const conn = await pool.getConnection();
        const werkzeuge = await conn.query(
            `SELECT a.*, w.lagerort, w.kalibrierzeitraum, w.name 
            FROM ausleihe a
            JOIN werkzeug w ON a.werkzeug_id = w.id
            WHERE a.personalnummer = ? AND a.rueckgabe_datum IS NULL;`,
            [personalnummer]
        );
        conn.release();
        res.status(200).json(werkzeuge);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// Werkzeug ausleihen
app.post('/werkzeug/api/werkzeug/ausleihen', async (req, res) => {
    let { werkzeug_id, lfz_kennzeichen, personalnummer } = req.body;
    console.log(req.body);
    console.log(lfz_kennzeichen.toLowerCase());

    lfz_kennzeichen = lfz_kennzeichen.toLowerCase();

    if (!werkzeug_id || !lfz_kennzeichen || !personalnummer) {
        res.status(400).json({ error: 'Fehlende Parameter' });
        return;
    }
    //checken ob schon ausgeliehen
    try {
        const conn = await pool.getConnection();
        const result = await conn.query(
            `SELECT * FROM ausleihe 
             WHERE werkzeug_id = ? AND rueckgabe_datum IS NULL`,
            [werkzeug_id]
        );
        conn.release();
        if (result.length > 0) {
            const lfz_kennzeichen = result[0].lfz_kennzeichen;
            const personalnummer = result[0].personalnummer;
            res.status(208).json({ success: false, message: 'Werkzeug bereits ausgeliehen an LFZ: ' + lfz_kennzeichen + ' von Personalnummer: ' + personalnummer });
            return;
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
        return;
    }

    try {
        const conn = await pool.getConnection();
        await conn.query(
            `INSERT INTO ausleihe (werkzeug_id, lfz_kennzeichen, personalnummer, ausleihe_datum) 
             VALUES (?, ?, ?, NOW())`,
            [werkzeug_id, lfz_kennzeichen.toLowerCase(), personalnummer]
        );
        conn.release();
        const conn2 = await pool.getConnection();
        const result = await conn2.query(
            `Select kalibrierzeitraum from werkzeug where id = ?`,
            [werkzeug_id]);
        conn2.release();

        res.status(200).json({ success: true, message: 'Werkzeug erfolgreich ausgeliehen', kalibrierzeitraum: result[0].kalibrierzeitraum });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

//get name by db id
app.get('/werkzeug/api/werkzeug/id/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const name = await conn.query('SELECT name FROM werkzeug WHERE id = ?', [req.params.id]);
        conn.release();
        res.send(name[0].name);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});


//Get image to werkzeug
app.get('/werkzeug/api/werkzeug/image/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const werkzeug = await conn.query('SELECT bild FROM werkzeug WHERE id = ?', [req.params.id]);
        conn.release();
        if (!werkzeug[0].bild) {
            res.status(200).json({ error: 'Werkzeug nicht gefunden' });
            return;
        }
        res.sendFile(path.join(__dirname, 'uploads', werkzeug[0].bild));
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// Werkzeug nach Personalnummer anzeigen
app.get('/werkzeug/api/ausgeliehene-werkzeuge/:personalnummer', async (req, res) => {
    const personalnummer = req.params.personalnummer;
    try {
        const conn = await pool.getConnection();
        const werkzeuge = await conn.query(
            `SELECT w.id, w.name, w.bild, a.ausleihe_datum
             FROM ausleihe a 
             JOIN werkzeug w ON a.werkzeug_id = w.id
             WHERE a.personalnummer = ? AND a.rueckgabe_datum IS NULL`,
            [personalnummer]
        );
        conn.release();
        res.json(werkzeuge);  // Gebe die Werkzeuge im JSON-Format zurück
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// Werkzeug per QR-Code zurückgeben
app.post('/werkzeug/api/werkzeug/zurueckgeben', async (req, res) => {
    const { werkzeug_id, personalnummer } = req.body;

    try {
        const conn = await pool.getConnection();
        const result = await conn.query(
            `UPDATE ausleihe SET rueckgabe_datum = NOW() 
             WHERE werkzeug_id = ? AND personalnummer = ? AND rueckgabe_datum IS NULL`,
            [werkzeug_id, personalnummer]
        );
        conn.release();

        if (result.affectedRows === 0) {
            res.json({ success: false, message: 'Ausleihdatum nicht gefunden!' });
        } else {
            const conn = await pool.getConnection();
            const result = await conn.query(
                `Select lagerort from werkzeug where id = ?`,
                [werkzeug_id]);
            conn.release();
            if (result[0].lagerort === null) {
                res.json({ success: true, message: 'Werkzeug erfolgreich zurückgegeben. Lagerort: ' + 'noch nicht definiert' });
            } else {
                res.json({ success: true, message: 'Werkzeug erfolgreich zurückgegeben. <b>Lagerort: ' + result[0].lagerort + '</b>' });
            }
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// QR-Code generieren und als Bild senden
app.get('/werkzeug/api/qrcode/:werkzeug_id/', async (req, res) => {
    const werkzeug_id = req.params.werkzeug_id;
    QRCode.toDataURL(werkzeug_id, { errorCorrectionLevel: 'H' }, (err, url) => {
        if (err) {
            console.log(err);
            res.status(500).send('Fehler beim Generieren des QR-Codes');
            return;
        }
        const img = Buffer.from(url.split(',')[1], 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        res.end(img);
    });
});

// Neue API-Route für die Suche
app.get('/werkzeug/api/suche', async (req, res) => {
    const { name } = req.query;
    try {
        const conn = await pool.getConnection();
        const werkzeuge = await conn.query(
            'SELECT * FROM werkzeug WHERE name LIKE ?',
            [`%${name}%`]
        );
        conn.release();
        res.json(werkzeuge);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

//Historie
app.get('/werkzeug/api/historie', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const historie = await conn.query(
            `SELECT a.*, w.kalibrierzeitraum, w.name, w.bild FROM ausleihe a JOIN werkzeug w 
            ON a.werkzeug_id = w.id order by a.ausleihe_datum desc limit 10;`
        );
        conn.release();
        res.json(historie);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// Server starten
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});