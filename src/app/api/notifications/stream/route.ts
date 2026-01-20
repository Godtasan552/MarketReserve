import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { getNotificationEmitter, NOTIFICATION_EVENT } from '@/lib/notification/events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const emitter = getNotificationEmitter();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keep-alive
      controller.enqueue('retry: 10000\n\n');

      const onNotification = (data: { userId: string; notification: unknown }) => {
        if (data.userId === userId) {
          controller.enqueue(`data: ${JSON.stringify(data.notification)}\n\n`);
        }
      };

      emitter.on(NOTIFICATION_EVENT, onNotification);

      // Clean up on close
      req.signal.addEventListener('abort', () => {
        emitter.off(NOTIFICATION_EVENT, onNotification);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
