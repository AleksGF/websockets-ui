import {
  AddShipsData,
  GameData,
  RoomData,
  UserData,
  WinnerData,
} from '../types/commandTypes';

class DB {
  private static instance: DB | null = null;
  private users: (UserData & {
    index: number;
  })[] = [];
  private rooms: RoomData[] = [];
  private winners: WinnerData[] = [];
  private games: GameData[] = [];

  constructor() {
    if (!DB.instance) {
      DB.instance = this;
    }

    return DB.instance;
  }

  async addUser({ name, password }: { name: string; password: string }) {
    const index = Math.max(...this.users.map((user) => user.index), -1) + 1;
    const user = { index, name, password };
    this.users.push(user);

    return user;
  }

  async getUserIndex(name: string) {
    return this.users.find((user) => user.name === name)?.index;
  }

  async checkPassword(index: number, password: string) {
    const user = this.users.find((user) => user.index === index);

    return user?.password === password;
  }

  async getAvailableRooms() {
    return this.rooms.filter((room) => room.roomUsers.length < 2);
  }

  async isUserInSomeRoom(index: number) {
    return (
      this.rooms.filter(
        (room) => !!room.roomUsers.find((user) => user.index === index),
      ).length > 0
    );
  }

  async isRoomAvailable(roomId: number) {
    return (
      this.rooms.find((room) => room.roomId === roomId)?.roomUsers.length === 1
    );
  }

  async isRoomReady(roomId: number) {
    return (
      this.rooms.find((room) => room.roomId === roomId)?.roomUsers.length === 2
    );
  }

  async createRoom(index: number) {
    const roomId = Math.max(...this.rooms.map((room) => room.roomId), -1) + 1;
    const name = this.users.find((user) => user.index === index)?.name ?? '';
    const roomUsers = [{ name, index }];

    this.rooms.push({ roomId, roomUsers });

    return await this.getAvailableRooms();
  }

  async addUserToRoom(index: number, roomId: number) {
    const user = this.users.find((user) => user.index === index) as UserData & {
      index: number;
    };
    const room = this.rooms.find((room) => room.roomId === roomId) as RoomData;

    room.roomUsers.push({ name: user.name, index: user.index });

    return await this.getAvailableRooms();
  }

  async getGameById(gameId: number) {
    return this.games.find((game) => game.idGame === gameId);
  }

  async createGame(roomId: number): Promise<GameData> {
    const idGame = Math.max(...this.games.map((game) => game.idGame), -1) + 1;
    const room = this.rooms.find((room) => room.roomId === roomId) as RoomData;
    const playersIds = room.roomUsers.map((user) => user.index);

    const game = {
      idGame,
      players: playersIds,
      turn: 0,
      shipsData: [null, null],
      ships: { '0': [], '1': [] },
      moves: { '0': new Set<number>(), '1': new Set<number>() },
    };
    this.games.push(game);

    return game;
  }

  async addShipsToGame(shipsData: AddShipsData, shipsArray: number[][]) {
    const { gameId, ships, indexPlayer } = shipsData;
    const game = this.games.find((game) => game.idGame === gameId) as GameData;
    game.shipsData[indexPlayer] = ships;
    game.ships[indexPlayer] = shipsArray;

    return game;
  }

  async removeShotShip(
    gameId: number,
    indexPlayer: number,
    indexes: [number, number],
  ) {
    const game = this.games.find((game) => game.idGame === gameId) as GameData;
    game.ships[indexPlayer] = game.ships[indexPlayer].map((ship, index) => {
      if (index !== indexes[0]) return ship;

      return ship.filter((_, ind) => ind !== indexes[1]);
    });

    return game.ships[indexPlayer];
  }

  async addPlayerMove(gameId: number, indexPlayer: number, move: number) {
    const game = this.games.find((game) => game.idGame === gameId) as GameData;
    game.moves[indexPlayer].add(move);
  }

  async toggleTurn(gameId: number) {
    const game = this.games.find((game) => game.idGame === gameId) as GameData;
    game.turn = (game.turn + 1) % 2;
  }

  async getWinners() {
    return this.winners;
  }
}

export const connectDB = () => new DB();
