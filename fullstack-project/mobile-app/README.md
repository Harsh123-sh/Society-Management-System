# Society Mobile App

A React Native architecture for the society management platform.

## Apps

- Resident app
- Guard app
- Admin app

## Included modules

- Role-based navigation
- Visitor approvals
- Chat
- Payments
- AI assistant
- Push notifications
- QR scanning
- Face capture
- Emergency SOS
- Realtime socket synchronization

## Architecture

- Shared API layer talks to the existing Express backend
- Role-based navigators mount the right tab structure after login
- FCM registers device tokens with the backend
- Web Push is not used here; mobile uses FCM
- Socket.io keeps chat, approvals, visitor alerts, and SOS events in sync

## Next setup steps

- Install dependencies
- Add Firebase Android and iOS native config files
- Set `API_BASE_URL` in the environment or in `src/services/api.ts`
- Wire app signing and push certificates
