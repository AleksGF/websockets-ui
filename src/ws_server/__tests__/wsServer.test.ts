import http from 'http';
import WebSocket, { MessageEvent } from 'ws';
import { wsServer } from '../';
import { CommandType, RequestData, ShipData } from '../types/commandTypes';
import { mockData } from './__mockData';

const responseWaitTimeout = 200; //ms
const maxTestDuration = 10000; //ms

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
      }, responseWaitTimeout);
    });
  }
}

const user1 = new Client();
const user2 = new Client();
let indexRoom: number;
let gameId: number;
let random1: { x: number; y: number };
let random2: { x: number; y: number };
let movesToWin: { x: number; y: number }[];

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
    httpServer.listen(0, async () => {
      await user1.open();
      await user2.open();
      done();
    });
  }, maxTestDuration);

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

    expect(JSON.parse(responses[0]).type).toBe(CommandType.REG);
    expect(JSON.parse(responses[0]).id).toBe(0);
    expect(JSON.parse(JSON.parse(responses[0]).data)).toEqual({
      name: mockData.user2.name,
      index: expect.any(Number),
      error: false,
    });

    user2.index = JSON.parse(JSON.parse(responses[0]).data).index;

    expect(JSON.parse(responses[1]).type).toBe(CommandType.UPDATE_ROOM);
    expect(JSON.parse(responses[1]).id).toBe(0);
    expect(JSON.parse(JSON.parse(responses[1]).data)).toEqual([]);

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
    expect(updateRoomResponses[0].id).toBe(0);
    expect(JSON.parse(updateRoomResponses[0].data)).toEqual([]);

    const createGameResponses = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.CREATE_GAME);

    expect(createGameResponses).toHaveLength(2);
    expect(createGameResponses[0].id).toBe(0);
    expect(createGameResponses[1].id).toBe(0);
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

    gameId = JSON.parse(createGameResponses[0].data).idGame;
  });

  it('should add ships', async () => {
    let responses = (
      await Promise.all([
        user1.send(
          getRequest(CommandType.ADD_SHIPS, {
            gameId,
            ships: mockData.ships1 as ShipData[],
            indexPlayer: user1.index as number,
          }),
        ),
        user2.send(
          getRequest(CommandType.ADD_SHIPS, {
            gameId,
            ships: mockData.ships2 as ShipData[],
            indexPlayer: user2.index as number,
          }),
        ),
      ])
    ).flat();

    expect(responses.length).toBe(4);

    const startGameResponses = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.START_GAME);
    expect(startGameResponses).toHaveLength(2);
    expect(startGameResponses[0].id).toBe(0);
    expect(startGameResponses[1].id).toBe(0);
    expect(startGameResponses[0]).not.toEqual(startGameResponses[1]);
    expect(
      JSON.parse(
        startGameResponses.filter(
          (response) =>
            JSON.parse(response.data).currentPlayerIndex === user1.index,
        )[0].data,
      ),
    ).toEqual({
      ships: mockData.ships1,
      currentPlayerIndex: user1.index,
    });
    expect(
      JSON.parse(
        startGameResponses.filter(
          (response) =>
            JSON.parse(response.data).currentPlayerIndex === user2.index,
        )[0].data,
      ),
    ).toEqual({
      ships: mockData.ships2,
      currentPlayerIndex: user2.index,
    });

    const turnResponses = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.TURN);
    expect(turnResponses).toHaveLength(2);
    expect(turnResponses[0]).toEqual(turnResponses[1]);
    expect(turnResponses[0].id).toBe(0);
    expect(JSON.parse(turnResponses[0].data)).toEqual({
      currentPlayer: 0,
    });
  });

  it('should make random attack', async () => {
    let responses = await user1.send(
      getRequest(CommandType.RANDOM_ATTACK, {
        gameId,
        indexPlayer: user1.index as number,
      }),
    );

    let attackResponse = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.ATTACK)[0];
    expect(attackResponse.id).toBe(0);
    expect(JSON.parse(attackResponse.data)).toEqual({
      position: {
        x: expect.any(Number),
        y: expect.any(Number),
      },
      currentPlayer: user1.index,
      status: expect.stringMatching(/miss|shot|kill/),
    });
    random1 = {
      x: JSON.parse(attackResponse.data).position.x,
      y: JSON.parse(attackResponse.data).position.y,
    };

    let turnResponse = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.TURN)[0];
    expect(turnResponse.id).toBe(0);
    expect(JSON.parse(turnResponse.data)).toEqual({
      currentPlayer: expect.any(Number),
    });

    if (JSON.parse(turnResponse.data).currentPlayer === user1.index) {
      responses = await user1.send(
        getRequest(CommandType.ATTACK, {
          gameId,
          x: random1.x === 0 ? 1 : 0,
          y: 1,
          indexPlayer: user1.index as number,
        }),
      );

      turnResponse = responses
        .map((response) => JSON.parse(response))
        .filter((response) => response.type === CommandType.TURN)[0];
      expect(JSON.parse(turnResponse.data)).toEqual({
        currentPlayer: user2.index,
      });
    }

    responses = await user2.send(
      getRequest(CommandType.RANDOM_ATTACK, {
        gameId,
        indexPlayer: user2.index as number,
      }),
    );

    attackResponse = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.ATTACK)[0];
    expect(attackResponse.id).toBe(0);
    expect(JSON.parse(attackResponse.data)).toEqual({
      position: {
        x: expect.any(Number),
        y: expect.any(Number),
      },
      currentPlayer: user2.index,
      status: expect.stringMatching(/miss|shot|kill/),
    });
    random2 = {
      x: JSON.parse(attackResponse.data).position.x,
      y: JSON.parse(attackResponse.data).position.y,
    };

    turnResponse = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.TURN)[0];
    expect(turnResponse.id).toBe(0);
    expect(JSON.parse(turnResponse.data)).toEqual({
      currentPlayer: expect.any(Number),
    });

    if (JSON.parse(turnResponse.data).currentPlayer === user2.index) {
      responses = await user2.send(
        getRequest(CommandType.ATTACK, {
          gameId,
          x: random2.x === 0 ? 1 : 0,
          y: 1,
          indexPlayer: user2.index as number,
        }),
      );

      turnResponse = responses
        .map((response) => JSON.parse(response))
        .filter((response) => response.type === CommandType.TURN)[0];
      expect(JSON.parse(turnResponse.data)).toEqual({
        currentPlayer: user1.index,
      });
    }
  });

  it('should handle missed attack', async () => {
    let responses = await user1.send(
      getRequest(CommandType.ATTACK, {
        gameId,
        x: random1.x === 0 ? 1 : 0,
        y: 1,
        indexPlayer: user1.index as number,
      }),
    );

    expect(responses).toHaveLength(2);

    let attackResponse = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.ATTACK)[0];
    expect(attackResponse.id).toBe(0);
    expect(JSON.parse(attackResponse.data)).toEqual({
      position: {
        x: random1.x === 0 ? 1 : 0,
        y: 1,
      },
      currentPlayer: user1.index,
      status: 'miss',
    });

    let turnResponse = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.TURN)[0];
    expect(turnResponse.id).toBe(0);
    expect(JSON.parse(turnResponse.data)).toEqual({
      currentPlayer: user2.index,
    });

    responses = await user2.send(
      getRequest(CommandType.ATTACK, {
        gameId,
        x: random2.x === 0 ? 1 : 0,
        y: 1,
        indexPlayer: user2.index as number,
      }),
    );

    expect(responses).toHaveLength(2);

    attackResponse = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.ATTACK)[0];
    expect(attackResponse.id).toBe(0);
    expect(JSON.parse(attackResponse.data)).toEqual({
      position: {
        x: random2.x === 0 ? 1 : 0,
        y: 1,
      },
      currentPlayer: user2.index,
      status: 'miss',
    });

    turnResponse = responses
      .map((response) => JSON.parse(response))
      .filter((response) => response.type === CommandType.TURN)[0];
    expect(turnResponse.id).toBe(0);
    expect(JSON.parse(turnResponse.data)).toEqual({
      currentPlayer: user1.index,
    });
  });

  it(
    'should handle result attack',
    async () => {
      movesToWin = mockData.user1MovesToWin.filter(
        (move) => !(move.x === random1.x && move.y === random1.y),
      );
      const moves = movesToWin.slice(1);

      for await (const move of moves) {
        const responses = await user1.send(
          getRequest(CommandType.ATTACK, {
            gameId,
            x: move.x,
            y: move.y,
            indexPlayer: user1.index as number,
          }),
        );

        for (const response of responses
          .map((response) => JSON.parse(response))
          .filter((response) => response.type === CommandType.TURN)) {
          expect(JSON.parse(response.data)).toEqual({
            currentPlayer: user1.index,
          });
        }
      }
    },
    maxTestDuration,
  );

  it(
    'should handle win attack',
    async () => {
      const finishMove = movesToWin[0];

      const responses = (
        await Promise.all([
          user1.send(
            getRequest(CommandType.ATTACK, {
              gameId,
              x: finishMove.x,
              y: finishMove.y,
              indexPlayer: user1.index as number,
            }),
          ),
          user2.send(null),
        ])
      ).flat();

      const finishResponses = responses
        .map((response) => JSON.parse(response))
        .filter((response) => response.type === CommandType.FINISH);

      expect(finishResponses).toHaveLength(2);
      expect(finishResponses[0]).toEqual(finishResponses[1]);
      expect(finishResponses[0].id).toBe(0);
      expect(JSON.parse(finishResponses[0].data)).toEqual({
        winPlayer: user1.index,
      });

      const updateWinnersResponses = responses
        .map((response) => JSON.parse(response))
        .filter((response) => response.type === CommandType.UPDATE_WINNERS);

      expect(updateWinnersResponses).toHaveLength(2);
      expect(updateWinnersResponses[0]).toEqual(updateWinnersResponses[1]);
      expect(updateWinnersResponses[0].id).toBe(0);

      expect(JSON.parse(updateWinnersResponses[0].data)).toEqual([
        {
          name: mockData.user1.name,
          wins: 1,
        },
      ]);
    },
    maxTestDuration,
  );
});
