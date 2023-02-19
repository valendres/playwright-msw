import { client } from './client';

export type User = { name: string };

export const getUsers = async () => {
  const res = await client.get<User[]>('/users');
  return res.data;
};
