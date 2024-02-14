class DB {
  private static instance: DB | null = null;
  public users: { index: number; name: string; password: string }[] = [];

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
}

export const connectDB = () => new DB();
