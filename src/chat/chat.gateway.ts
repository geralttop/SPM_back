import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import type { IncomingMessage } from 'http';
import { WebSocket, type Server } from 'ws';
@Injectable()
@WebSocketGateway({
    path: '/chat',
    transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ChatGateway.name);
    private readonly socketsByUser = new Map<number, Set<WebSocket>>();
    @WebSocketServer()
    server!: Server;
    constructor(private readonly jwtService: JwtService) { }
    handleConnection(client: WebSocket, req: IncomingMessage) {
        try {
            const host = req.headers.host ?? 'localhost';
            const url = new URL(req.url ?? '', `http://${host}`);
            const token = url.searchParams.get('access_token');
            if (!token) {
                client.close(4001, 'Unauthorized');
                return;
            }
            const payload = this.jwtService.verify<{
                sub: number;
            }>(token);
            const userId = Number(payload.sub);
            if (!Number.isFinite(userId)) {
                client.close(4001, 'Unauthorized');
                return;
            }
            (client as WebSocket & {
                userId?: number;
            }).userId = userId;
            let set = this.socketsByUser.get(userId);
            if (!set) {
                set = new Set();
                this.socketsByUser.set(userId, set);
            }
            set.add(client);
        }
        catch {
            client.close(4001, 'Unauthorized');
        }
    }
    handleDisconnect(client: WebSocket) {
        const uid = (client as WebSocket & {
            userId?: number;
        }).userId;
        if (uid === undefined)
            return;
        const set = this.socketsByUser.get(uid);
        if (!set)
            return;
        set.delete(client);
        if (set.size === 0) {
            this.socketsByUser.delete(uid);
        }
    }
    emitToUser(userId: number, event: string, data: unknown) {
        const set = this.socketsByUser.get(userId);
        if (!set?.size)
            return;
        const payload = JSON.stringify({ event, data });
        for (const socket of set) {
            if (socket.readyState === WebSocket.OPEN) {
                try {
                    socket.send(payload);
                }
                catch (e) {
                    this.logger.warn(`send to user ${userId} failed: ${e}`);
                }
            }
        }
    }
}
