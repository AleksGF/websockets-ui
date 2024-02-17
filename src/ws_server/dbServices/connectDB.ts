import { RoomData, UserData, WinnerData } from '../types/commandTypes';

class DB {
  private static instance: DB | null = null;
  private users: (UserData & {
    index: number;
  })[] = [];
  private rooms: RoomData[] = [];
  private winners: WinnerData[] = [];

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

  async getWinners() {
    return this.winners;
  }
}

export const connectDB = () => new DB();
