import http from 'http';
import WebSocket, { MessageEvent } from 'ws';
import { wsServer } from '../';
import { CommandType, RequestData } from '../types/commandTypes';
import { mockData } from './__mockData';

const ms = 500;

const originalLog = console.log;
console.log = jest.fn();

const wsUrl = 'ws://localhost:3000';

const httpServer = http
  .createServer()
  .on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
      wsServer.emit('connection', ws, request);
    });
  });

class Client {
  private readonly wsc: WebSocket;
  public index: number | null = null;

  constructor() {
    this.wsc = new WebSocket(wsUrl);
  }

  open() {
    return new Promise<void>((resolve) => {
      this.wsc.on('open', () => {
        resolve();
      });
    });
  }

  close() {
    return new Promise<void>((resolve) => {
      this.wsc.on('close', () => {
        resolve();
      });
      this.wsc.close();
    });
  }

  send(command: { type: CommandType; data: string; id: 0 } | null) {
    return new Promise<string[]>((resolve) => {
      const messages: string[] = [];

      const listener = ({ data: response }: MessageEvent) => {
        messages.push(response.toString());
      };

      if (command) this.wsc.send(JSON.stringify(command));

      this.wsc.addEventListener('message', listener);

      setTimeout(() => {
        this.wsc.removeEventListener('message', listener);
        resolve(messages);
      }, ms);
    });
  }
}

const user1 = new Client();
const user2 = new Client();
let indexRoom: number;

const getRequest = (
  type: CommandType,
  data: RequestData,
): { type: CommandType; data: string; id: 0 } => ({
  type,
  data: JSON.stringify(data),
  id: 0,
});

describe('WS Server:', () => {
  beforeAll((done) => {
    httpServer.listen(4000, async () => {
      await user1.open();
      await user2.open();
      done();
    });
  }, 15000);

  afterAll(async () => {
    await user1.close();
    await user2.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        wsServer.close();
        resolve();
      });
    });
    console.log = originalLog;
  });

  it('should register users', async () => {
    let responses = await user1.send(
      getRequest(CommandType.REG, mockData.user1),
    );

    // User1 registration response
    expect(responses.length).toBe(3);
    expect(JSON.parse(responses[0]).type).toBe(CommandType.REG);
    expect(JSON.parse(responses[0]).id).toBe(0);
    expect(JSON.parse(JSON.parse(responses[0]).data)).toEqual({
      name: mockData.user1.name,
      index: expect.any(Number),
      error: false,
    });

    user1.index = JSON.parse(JSON.parse(responses[0]).data).index;

    responses = await user2.send(getRequest(CommandType.REG, mockData.user2));

    expect(responses.length).toBe(3);

    // User2 registration response
    expect(JSON.parse(responses[0]).type).toBe(CommandType.REG);
    expect(JSON.parse(responses[0]).id).toBe(0);
    expect(JSON.parse(JSON.parse(responses[0]).data)).toEqual({
      name: mockData.user2.name,
      index: expect.any(Number),
      error: false,
    });

    user2.index = JSON.parse(JSON.parse(responses[0]).data).index;

    // Update Room response
    expect(JSON.parse(responses[1]).type).toBe(CommandType.UPDATE_ROOM);
    expect(JSON.parse(responses[1]).id).toBe(0);
    expect(JSON.parse(JSON.parse(responses[1]).data)).toEqual([]);

    // Update winners response
    expect(JSON.parse(responses[2]).type).toBe(CommandType.UPDATE_WINNERS);
    expect(JSON.parse(responses[2]).id).toBe(0);
    expect(JSON.parse(JSON.parse(responses[2]).data)).toEqual([]);
  });

  it('should create room', async () => {
    let responses = (
      await Promise.all([
        user1.send(getRequest(CommandType.CREATE_ROOM, '')),
        user2.send(null),
      ])
    ).flat();

    expect(responses.length).toBe(2);
    expect(responses[0]).toEqual(responses[1]);
    expect(JSON.parse(responses[0]).type).toBe(CommandType.UPDATE_ROOM);
    expect(JSON.parse(responses[0]).id).toBe(0);
    expect(JSON.parse(JSON.parse(responses[0]).data)).toEqual([
      {
        roomId: expect.any(Number),
        roomUsers: [
          {
            name: mockData.user1.name,
            index: user1.index,
          },
        ],
      },
    ]);

    indexRoom = JSON.parse(JSON.parse(responses[0]).data)[0].roomId;
  });

  it('should add user to room', async () => {
    let responses = (
      await Promise.all([
        user1.send(null),
        user2.send(
          getRequest(CommandType.ADD_USER_TO_ROOM, {
            indexRoom,
          }),
        ),
      ])
    ).flat();

    expect(responses.length).toBe(4);

    const updateRoomResponses = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.UPDATE_ROOM);

    expect(updateRoomResponses).toHaveLength(2);
    expect(updateRoomResponses[0]).toEqual(updateRoomResponses[1]);
    expect(JSON.parse(updateRoomResponses[0].data)).toEqual([]);

    const createGameResponses = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.CREATE_GAME);

    expect(createGameResponses).toHaveLength(2);
    expect(JSON.parse(createGameResponses[0].data)).toEqual({
      idGame: expect.any(Number),
      idPlayer: expect.any(Number),
    });
    expect(JSON.parse(createGameResponses[1].data)).toEqual({
      idGame: expect.any(Number),
      idPlayer: expect.any(Number),
    });
    expect(JSON.parse(createGameResponses[0].data).idGame).toBe(
      JSON.parse(createGameResponses[1].data).idGame,
    );
    expect(JSON.parse(createGameResponses[0].data).idPlayer).not.toBe(
      JSON.parse(createGameResponses[1].data).idPlayer,
    );
  });

  it('should add ships', async () => {});

  it('should make random attack', async () => {});

  it('should handle missed attack', async () => {});

  it('should handle result attack', async () => {});

  it('should handle win attack', async () => {});
  //   // *** Add user to room ***
  //   // *** Add ships ***
  //   // *** Random attack ***
  //   // *** Attacks ***
  // it('', async () => {
  //   let responses: string[];
  //
  //   // *** Register users ***
  //   // First user
  //   responses = await user1.send(getRequest(CommandType.REG, mockData.user1));
  //
  //   expect(responses.length).toBe(3);
  //   expect(JSON.parse(responses[0]).type).toBe(CommandType.REG);
  //   expect(JSON.parse(responses[0]).id).toBe(0);
  //   expect(JSON.parse(JSON.parse(responses[0]).data)).toEqual({
  //     name: mockData.user1.name,
  //     index: expect.any(Number),
  //     error: false,
  //   });
  //
  //   user1.index = JSON.parse(JSON.parse(responses[0]).data).index;
  //
  //   // Second user
  //   responses = await user2.send(getRequest(CommandType.REG, mockData.user2));
  //
  //   expect(responses.length).toBe(3);
  //   expect(JSON.parse(responses[0]).type).toBe(CommandType.REG);
  //   expect(JSON.parse(responses[0]).id).toBe(0);
  //   expect(JSON.parse(JSON.parse(responses[0]).data)).toEqual({
  //     name: mockData.user2.name,
  //     index: expect.any(Number),
  //     error: false,
  //   });
  //
  //   user2.index = JSON.parse(JSON.parse(responses[0]).data).index;
  //
  //   // Update Room response
  //   expect(JSON.parse(responses[1]).type).toBe(CommandType.UPDATE_ROOM);
  //   expect(JSON.parse(responses[1]).id).toBe(0);
  //   expect(JSON.parse(JSON.parse(responses[1]).data)).toEqual([]);
  //
  //   // Update winners response
  //   expect(JSON.parse(responses[2]).type).toBe(CommandType.UPDATE_WINNERS);
  //   expect(JSON.parse(responses[2]).id).toBe(0);
  //   expect(JSON.parse(JSON.parse(responses[2]).data)).toEqual([]);
  //
  //   // *** Create room ***
  //   //responses = await user1.send(getRequest(CommandType.CREATE_ROOM, ''));
  //   responses = (
  //     await Promise.all([
  //       user1.send(getRequest(CommandType.CREATE_ROOM, '')),
  //       user2.send(null),
  //     ])
  //   ).flat();
  //
  //   expect(responses.length).toBe(2);
  //   expect(JSON.parse(responses[0]).type).toBe(CommandType.UPDATE_ROOM);
  //   expect(JSON.parse(responses[1]).type).toBe(CommandType.UPDATE_ROOM);
  //   expect(JSON.parse(responses[0]).id).toBe(0);
  //   expect(JSON.parse(responses[1]).id).toBe(0);
  //   expect(responses[0]).toEqual(responses[1]);
  //   expect(JSON.parse(JSON.parse(responses[0]).data)).toEqual([
  //     {
  //       roomId: expect.any(Number),
  //       roomUsers: [
  //         {
  //           name: mockData.user1.name,
  //           index: user1.index,
  //         },
  //       ],
  //     },
  //   ]);
  //

  //
  //   // *** Close connections ***
  // });
});
