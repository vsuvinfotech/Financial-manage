export type AppRole = string;

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: AppRole;
      name: string;
      permissions: string[];
    }

    interface Request {
      user?: User;
    }
  }
}
