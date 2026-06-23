# LifeFlow Server

Express + MongoDB backend for the LifeFlow blood donation platform.

## Stack

- Node.js
- Express
- MongoDB
- Better Auth
- Stripe
- CORS
- dotenv
- nodemon

## Structure

```
src/
  config/        mongo + better-auth setup
  models/        collection accessors
  middlewares/   cors + jwt auth
  controllers/   request handlers
  routes/        express routers
  utils/         helpers + geo validation
  data/          blood groups + districts
index.js         app entry
```

## Run

```bash
npm install
npm run dev
```

## Env

```env
PORT=9000
CLIENT_URL=http://localhost:3000
MONGO_DB_URL=
BETTER_AUTH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```
