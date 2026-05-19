# Bella Napoli – React Frontend

Italian restaurant chat UI for **Luca** (waiter bot). Built with React, Bootstrap 5, and Socket.IO.

## Setup (offline)

1. Install [Node.js](https://nodejs.org/) (LTS).
2. Open a terminal in this `client` folder.
3. Run:

```bash
npm install
npm run dev
```

4. Start the backend in `../server` on port **3000** (`npm start`).
5. Open **http://localhost:5173** in the browser.

## Production build

```bash
npm run build
```

Output is in `dist/`. The backend can serve these static files after deployment.

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_SOCKET_URL` | Socket.IO server URL (default: same origin; dev proxy forwards to port 3000) |

## React components (separate files)

| File | Role |
|------|------|
| `NavbarComponent.jsx` | Brand, connection badge, Export / Reset |
| `ChatWindowComponent.jsx` | Chat card layout |
| `MessageList.jsx` | Scrollable message list |
| `MessageBubble.jsx` | User/bot bubbles + timestamps |
| `ChatInputBar.jsx` | Input + Send + Enter key |
| `QuickReplies.jsx` | Quick suggestion chips |
| `FooterStrip.jsx` | Page footer |
| `ExportModal.jsx` | Export confirmation dialog |

## Socket.IO events (backend contract)

| Event | Direction | Payload |
|-------|-----------|---------|
| `user_message` | client → server | `{ message: string }` |
| `send_message` | client → server | fallback for simple server |
| `bot_message` | server → client | `{ message, timestamp }` |
| `receive_message` | server → client | fallback (`text`, `time`) |
| `bot_typing` | server → client | `boolean` |
| `reset_conversation` | client → server | `{}` |
