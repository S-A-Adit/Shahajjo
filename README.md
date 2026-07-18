# Shahajjo (সহজ্জো) 🤝

**Shahajjo** (translates to *"Help"* in Bengali) is a local domestic help matching platform designed to connect households (Customers) with trusted local domestic workers (Workers) such as cleaners, cooks, babysitters, and caregivers. 

---

## 📋 The Problem Statement

In developing nations like Bangladesh, finding reliable domestic help is a fragmented, offline, and trust-deficient process:
1. **Inefficient Matching**: Customers rely heavily on word-of-mouth references, which limits options, takes time, and results in poor pricing transparency.
2. **Economic Vulnerability**: Domestic workers lack a centralized platform to showcase their skills, set fair hourly rates, and find consistent employment near their locations.
3. **Accessibility and Digital Divide**: Many domestic workers do not have continuous internet access or use high-end smartphones. Traditional apps fail to address this limitation.
4. **Safety & Verification**: There is no easy way to track ratings, reviews, or historical performance of workers.

### **The Shahajjo Solution**
Shahajjo bridges these gaps by offering:
* **Location-Based Matching**: Connecting customers with nearby workers using GPS coordinates to minimize worker commute times.
* **Bilingual Interface**: Supporting both **English** and **Bengali (বাংলা)** to ensure ease of use for workers of all literacy levels.
* **SMS-First Approach (Mocked)**: Integrating an alert system that simulates SMS notifications to reach workers offline.
* **Fair Pricing**: Allowing workers to list their preferred hourly rates (`৳/hr`) and years of experience.

---

## 🛠️ Architecture & Tech Stack

The application is structured as a monorepo consisting of:

### **Frontend** (`/frontend`)
* **Framework**: React 19 + Vite
* **Styling**: Tailwind CSS
* **Routing**: React Router DOM (v7)
* **Internationalization**: Custom lightweight bilingual system (EN/BN)
* **Icons**: Lucide React

### **Backend** (`/backend`)
* **Runtime**: Node.js + Express
* **Database**: SQLite (managed locally via `database.db`)
* **State & Testing**: Jest for API endpoint verification
* **Features**: Cookie-based authentication, matching algorithms based on location and service category, and a mock SMS dispatch service.

---

## 🚀 Getting Started

### **Prerequisites**
* [Node.js](https://nodejs.org/) (v18+)
* Git

### **Setup Instructions**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/S-A-Adit/Shahajjo.git
   cd Shahajjo
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   # Set up environmental variables if needed (defaults to port 5000)
   npm start
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Testing

To run the API and logic tests in the backend, execute:
```bash
cd backend
npm test
```
