# Shopify Announcement Banner App (MERN Stack)

A professional Shopify application that enables merchants to display a floating announcement banner on all pages of their storefront. The application is built using the MERN stack and utilizes Shopify Shop Metafields to securely bridge backend settings to the storefront without using deprecated ScriptTags.

---

## 🚀 Features

1.  **Merchant Dashboard (React & Shopify Polaris)**:
    *   Sleek settings interface built with Polaris components.
    *   Real-time status indicators checking MongoDB database connectivity.
    *   Form validations and error notifications.
2.  **Robust Backend & Database (Node.js & MongoDB)**:
    *   **Mongoose ODM**: Handles database schema validations.
    *   **Audit History**: Automatically saves every announcement update with a timestamp in a MongoDB Atlas database to maintain a full history.
    *   **Shopify GraphQL API Integration**: Securely updates the `my_app.announcement` Shop metafield.
3.  **Storefront Embed (Theme App Extension)**:
    *   **App Embed Block**: Injects a floating announcement banner at the bottom of the `<body>` on every page.
    *   **Liquid Integration**: Reads metafields dynamically via Liquid: `{{ shop.metafields.my_app.announcement.value }}`.
    *   **Interactive Controls**: Includes smooth vanilla CSS and a JavaScript dismiss (`×`) button.
    *   **Theme Customizer Controls**: Allows merchants to change the banner background and text colors directly in the Shopify Theme Editor.

---

## 🛠️ Technology Stack

*   **Frontend**: React, Shopify Polaris, React Router v7 / Remix
*   **Backend**: Node.js (React Router Actions and Loaders)
*   **Database**: MongoDB Atlas (Cloud), Mongoose ODM
*   **Shopify Integration**: Shopify CLI v3, Shopify Admin GraphQL API, App Embed Blocks (Liquid)

---

## ⚙️ Local Development Setup

Follow these steps to run the project locally on your machine:

### 1. Prerequisites
*   Node.js (version 20 or higher)
*   Shopify Partner Account
*   A Shopify Development Store

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd shopify-announcement-app/announcement-banner-app
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root of the `announcement-banner-app` folder and add your MongoDB connection string:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@<your-cluster>.mongodb.net/announcement_db?retryWrites=true&w=majority"
```
*(Make sure to replace `<username>` and `<password>` with your database user credentials).*

### 5. Run the Local Server
Start the Shopify CLI local server:
```bash
npm run dev
```
Select your partner account and development store when prompted. The CLI will automatically configure your Shopify App credentials and tunnel your local server.

---

## 🎨 Activating the Storefront Banner

Once the local server is running:
1.  Go to your **Shopify Store Admin** -> **Online Store** -> **Themes**.
2.  Click **Customize** (or **Edit theme**) next to your active theme.
3.  On the far-left sidebar, click the **App Embeds** tab (puzzle piece / stacked boxes icon).
4.  Toggle **Announcement Banner** to **ON**.
5.  *(Optional)* Customize the colors in the settings panel.
6.  Click **Save** in the top-right corner.
7.  Verify the banner floats at the top of your online store!

---

## 🗃️ Database Audit Schema
Logs are stored in the `announcements` collection using the following schema:
```javascript
{
  text: String,       // The announcement message
  shop: String,       // The shop domain (e.g. quickstart-xxxx.myshopify.com)
  createdAt: Date     // Timestamp of when the announcement was saved
}
```
