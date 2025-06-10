#  Knowledge Management System - Cloud Native Architecture

Ce projet regroupe plusieurs microservices dans le cadre d’un système de gestion des connaissances basé sur une architecture Cloud Native. Chaque service a une responsabilité précise et communique avec les autres via API.

## 📦 Services

### 🔐 Authentification Service
Gère l’authentification des utilisateurs à l’aide d’un annuaire **LDAP**.  
Il assure un accès sécurisé aux différentes fonctionnalités du système.

---

### 📚 Knowledge Service
Responsable de la **gestion centralisée des connaissances** :
- Création
- Organisation
- Consultation
- Suppression

**Port utilisé :** `8000`

---

### 🔔 Notification Service
Envoie des **notifications automatiques** (alertes internes) pour informer les utilisateurs des mises à jour.

**Port utilisé :** `8005`

---

### 📊 Analytics Service
Analyse les **interactions et données** générées dans le système :
- Consultations
- Évaluations par étoiles
- Génération de statistiques

**Port utilisé :** `8001`

---

### 📝 Evaluation Service
Permet l’**évaluation des connaissances** afin d’identifier les contenus obsolètes ou nécessitant une révision.

**Port utilisé :** `8005`

---

### 💬 Forum Discussions Service
Espace **collaboratif** permettant aux utilisateurs :
- D’échanger autour des connaissances
- Poser des questions
- Résoudre des problèmes

**Port utilisé :** `8008`

---

### 🎓 Training Service
Propose des **parcours de formation** ciblés selon les besoins utilisateurs, basés sur l’ontologie **ESCO**.

**Port utilisé :** `8007`

---

### 📩 Feedback Service
Permet de **recueillir les retours utilisateurs** concernant :
- L’expérience
- Les contenus
- Le système global

Ces retours permettent d'améliorer la qualité continue du système.

**Port utilisé :** `8003`

---



