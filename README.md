# LifeFlow Server
## Live Link
[https://life-flow-server-taupe.vercel.app/](https://life-flow-server-taupe.vercel.app/)

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
PORT=4000
CLIENT_URL=http:https://life-flow-client.vercel.app/
MONGO_DB_URL=
BETTER_AUTH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
BETTER_AUTH_URL=https://life-flow-server-taupe.vercel.app/
```
