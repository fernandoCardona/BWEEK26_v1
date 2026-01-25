# API Documentation - Bears Week 2026
## AI Assistant & Personal Assistant Endpoints

---

## 🔐 Authentication

All API requests for the AI Assistant must include the `JWT` token in the `Authorization` header.

```http
Authorization: Bearer <token>
X-Chatbot-Channel: web | whatsapp | telegram
```

### 1. Login
`POST /api/v1/chatbot/auth/login`

**Body:**
```json
{
    "email": "user@example.com",
    "password": "password",
    "channel": "web"
}
```

**Alternative (WhatsApp/Telegram):**
```json
{
    "phone": "+34612345678",
    "password": "password",
    "channel": "whatsapp"
}
```

---

## 📦 Inventory & Products

### 1. Check stock
`GET /api/v1/inventory/check/{sku}`

### 2. Low stock alerts
`GET /api/v1/inventory/low-stock`

---

## 🎫 Ticketing & Events

### 1. List available events
`GET /api/v1/events/available`

### 2. Validate ticket QR
`GET /api/v1/tickets/{code}/validate`

---

## 👥 Leads & CRM

### 1. Create lead
`POST /api/v1/leads`

**Body:**
```json
{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "source": "chatbot_whatsapp",
    "interest": "events"
}
```

### 2. Check lead status
`GET /api/v1/leads/check?email=juan@example.com`

---

## 📢 Newsletter

### 1. Subscribe
`POST /api/v1/newsletter/subscribe`

### 2. Campaign list
`GET /api/v1/newsletter/campaigns`

---

## 🛡️ Admin Actions (super_admin only)

### 1. System metrics
`GET /api/v1/admin/metrics`

### 2. User management
`GET /api/v1/admin/users/{id}`
