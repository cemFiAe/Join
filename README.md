
````markdown
# 📝 Join – Kanban Project Management Tool

**Join** is a collaborative Kanban-style project management tool built by a group of students
at Developer Akademie GmbH.
It helps teams visualize and organize their tasks using a clean, intuitive interface with
real-time updates powered by Firebase Realtime Database.

> ⚠️ This project is for educational purposes and is not intended for commercial or extensive business use.

---

## 🚀 Features

- Drag-and-drop Kanban board with columns: To Do, In Progress, Await Feedback, Done  
- Add, edit, delete tasks with details like descriptions, due dates, priorities  
- Manage and assign contacts to tasks  
- Real-time synchronization using Firebase Realtime Database  
- User authentication via Firebase Authentication  
- Responsive design for desktop and mobile  
- Includes Legal Notice, Privacy Policy, and Help pages  

---

## 🛠️ Tech Stack

- JavaScript (Vanilla)  
- HTML5 & CSS3  
- Firebase Realtime Database & Authentication  

---

## 🔧 Firebase Configuration

To use your own Firebase setup, replace the config object in `firebase.js`
with your Firebase project credentials:

```js
const firebaseConfig = {
  apiKey: "AIzaSyDv82uEEOlU5I8YibKsHIaEv9ffhzNMaEA",
  authDomain: "join-7e2a3.firebaseapp.com",
  databaseURL: "https://join-7e2a3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "join-7e2a3",
  storageBucket: "join-7e2a3.firebasestorage.app",
  messagingSenderId: "730060662008",
  appId: "1:730060662008:web:da8166f25bbc6cf48d870d"
};
````

---

## 📦 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/cemFiAe/Join.git
cd Join
```

### 2. Run the app

Open `index.html` in your browser. For best results, use a local server or the Live Server extension in VS Code.

---

## 📁 Project Structure

```
Join/
├── index.html                # Main entry point
├── sign_up.html              # User registration page
├── script.js                 # Main JavaScript file
├── style.css                 # Main stylesheet
├── jsconfig.json             # JS configuration
├── package.json              # NPM dependencies
├── package-lock.json         # NPM lock file
├── README.md                 # This documentation
├── .vscode/                  # VS Code workspace settings (optional)
├── assets/                   # Images and static assets
├── JSDoc/                    # Generated documentation
├── node_modules/             # NPM packages (ignored in repository)
├── out/                      # Build output files
├── pages/                    # HTML pages (legal, help, etc.)
├── scripts/                  # JavaScript modules
└── styles/                   # CSS modules and stylesheets
```

---

## 📖 Help & Usage

The `help.html` page provides a detailed guide on how to:

* Navigate and use the Kanban board
* Create and assign contacts
* Add, move, and delete tasks
* Maintain your project workflow efficiently

For additional support, contact **[jurij.flat@gmx.de](mailto:jurij.flat@gmx.de)**.

---

## 👥 Team

* **Jurij Flat** — [jurij.flat@gmx.de](mailto:jurij.flat@gmx.de)
* **Çem Akgül** — [cem.akgul38@gmail.com](mailto:cem.akgul38@gmail.com)
* **Jasmin Ćatić** — [caticjasmin92@gmail.com](mailto:caticjasmin92@gmail.com)

---

## ⚖️ License & Legal Notice

This project is an educational exercise developed by the listed students as part of a web development bootcamp at Developer Akademie GmbH.

The design of Join is owned by Developer Akademie GmbH. Unauthorized use or reproduction of the design is prohibited.

The software is provided "as-is" without warranties or guarantees. The authors and Developer Akademie GmbH are not liable for any damages resulting from its use.

For full details, see the included [Legal Notice](pages/legal_notice.html) and [Privacy Policy](pages/privacy_policy.html).

---

## 🙏 Acknowledgements

* Developed at [Developer Akademie GmbH](https://www.developerakademie.com)
* Project organized using Trello  
* Designs created with Figma  
* Powered by Firebase Realtime Database

---

Feel free to explore, learn from, and build upon this project. For questions, feedback, or contributions, please contact the team.


