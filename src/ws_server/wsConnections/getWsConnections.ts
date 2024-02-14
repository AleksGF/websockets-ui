import { WebSocket } from 'ws';

class WsConnections {
  private static instance: WsConnections | null = null;
  public connections: Map<WebSocket, number> = new Map<WebSocket, number>();

  constructor() {
    if (!WsConnections.instance) {
      WsConnections.instance = this;
    }

    return WsConnections.instance;
  }

  setNewConnection(ws: WebSocket, index: number) {
    for (const [key, value] of this.connections) {
      if (value === index) {
        key.close();
        this.connections.delete(key);
        break;
      }
    }

    this.connections.set(ws, index);
  }

  clearInactiveConnections() {
    for (const [key, value] of this.connections) {
      if (key.readyState > 1) {
        this.connections.delete(key);
      }
    }
  }
}

export const getWsConnections = () => new WsConnections();
