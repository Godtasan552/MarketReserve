import { EventEmitter } from 'events';

// Global Event Emitter for Real-time Notifications
const notificationEmitter = new EventEmitter();

const NOTIFICATION_EMITTER_KEY = Symbol.for('notification.emitter');

interface GlobalWithEmitter {
    [NOTIFICATION_EMITTER_KEY]: EventEmitter;
}

const globalStore = global as unknown as GlobalWithEmitter;

if (!globalStore[NOTIFICATION_EMITTER_KEY]) {
    globalStore[NOTIFICATION_EMITTER_KEY] = notificationEmitter;
}

export const getNotificationEmitter = () => globalStore[NOTIFICATION_EMITTER_KEY];

export const NOTIFICATION_EVENT = 'new_notification';
