# Werkzeug-Verwaltung

Werkzeugverwaltung zum Ausleihen von Werkzeug.

## Inhaltsverzeichnis
- [Einführung](#einführung)
- [Verzeichnisstruktur](#verzeichnisstruktur)
- [Installationsanleitung](#installationsanleitung)
- [Nutzung](#nutzung)
- [Mitwirkende](#mitwirkende)
- [Lizenz](#lizenz)

## Einführung
Dieses Projekt dient der Verwaltung und dem Ausleihen von Werkzeugen. Es bietet eine benutzerfreundliche Oberfläche und eine effiziente Verwaltung der Werkzeugbestände in der Luftfahrtbranche.

### Funktionen:

1. Hauptseite: Zeigt eine Historie von ausgeliehenem Werkzeug.
![image](https://github.com/user-attachments/assets/9e4cb6ca-d562-41cf-ad66-99d722989085)
2. Ausleihen über QR-Code oder Werkzeug ID
![image](https://github.com/user-attachments/assets/2b065581-1962-4860-997c-89f2bd859dc4)
3. Ausleihen über Suche
![image](https://github.com/user-attachments/assets/6a8330ee-2e39-4fe5-b0e0-9565c35b9162)
4. Zurückgeben von Werkzeug über QR oder Personalnummer
![image](https://github.com/user-attachments/assets/06fdaf56-2b03-4dd1-aca7-574bb21c4672)

Es wird der Lagerort des Werkzeugs angezeigt.

5. Auswertung je LFZ
![image](https://github.com/user-attachments/assets/f0b39aa6-5b1b-45b2-b184-35980bac9657)
6. Auswertung je Pers. Nr
![image](https://github.com/user-attachments/assets/8eeca90d-4377-42dd-a89c-2ba8c29ae333)
7. Verwaltungstools
![image](https://github.com/user-attachments/assets/8361d0e7-b324-4e5f-837f-3d30a28d282a)
QR-Code zum Markieren des Werkzeugs beinhaltet eine eindeutige DB-ID
->ToDo: LBA Anforderung erfüllen und Firmen Namen zur Identifizierung mit in den QR Code packen






## Verzeichnisstruktur
Die Verzeichnisstruktur des Projekts ist wie folgt aufgebaut:
.
```
├── public
│ ├── css
│ ├── js
│ └── images
├── src
│ ├── views
│ ├── controllers
│ └── models
├── .gitignore
├── package.json
└── README.md
```

- **public**: Beinhaltet statische Dateien wie CSS, JavaScript und Bilder.
- **src**: Hier befindet sich der Quellcode des Projekts, unterteilt in Views, Controller und Modelle.
- **.gitignore**: Listet Dateien und Verzeichnisse auf, die von Git ignoriert werden sollen.
- **package.json**: Beinhaltet Projektinformationen und Abhängigkeiten.
- **README.md**: Diese Datei.

## Installationsanleitung
Repository klonen:
 ```bash
git clone https://github.com/Krankenkasse/Werkzeug-Verwaltung.git
 ```
Abhängigkeiten installieren:
```bash
npm install
```
## Nutzung
Starten der Anwendung:
```bash
npm start
```
Die Anwendung ist nun unter http://localhost:3000 erreichbar.

## Mitwirkende
[Krankenkasse](https://github.com/Krankenkasse)
## Lizenz
Dieses Projekt ist lizenziert unter der [Other License](LICENSE).
