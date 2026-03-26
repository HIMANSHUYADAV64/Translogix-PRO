# TransLogix Backend API

Backend API server for TransLogix Fleet Management SaaS.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example` and fill in your credentials

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get single vehicle
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/vehicle/:vehicleId` - Get drivers by vehicle
- `POST /api/drivers` - Create driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Maintenance
- `GET /api/maintenance` - Get all maintenance records
- `GET /api/maintenance/vehicle/:vehicleId` - Get maintenance by vehicle
- `POST /api/maintenance` - Create maintenance record
- `PUT /api/maintenance/:id` - Update maintenance record
- `DELETE /api/maintenance/:id` - Delete maintenance record

### Tyres
- `GET /api/tyres/vehicle/:vehicleId` - Get tyres by vehicle
- `POST /api/tyres` - Create tyre record
- `PUT /api/tyres/:id` - Update tyre record
- `DELETE /api/tyres/:id` - Delete tyre record

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/vehicle/:vehicleId` - Get trips by vehicle
- `POST /api/trips` - Create trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/vehicle/:vehicleId` - Get payments by vehicle
- `POST /api/payments` - Create payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Subscriptions
- `GET /api/subscriptions/current` - Get current subscription
- `GET /api/subscriptions/history` - Get billing history
- `POST /api/subscriptions/create-order` - Create Razorpay order
- `POST /api/subscriptions/webhook` - Razorpay webhook handler

## Authentication

All endpoints (except webhook) require Firebase ID token in Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Environment Variables

See `.env.example` for required environment variables.

## Cron Jobs

- Subscription reminders: Daily at 9 AM
- Maintenance reminders: Daily at 10 AM
- Insurance reminders: Daily at 11 AM
