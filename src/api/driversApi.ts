import { api } from "./axios";
import { IDriver } from "../@types/drivers.types";

export interface DriverInput {
  full_name: string;
  team_name: string;
  driver_number: number;
}

export const fetchDrivers = async (): Promise<IDriver[]> => {
  const response = await api.get<IDriver[]>("/drivers");
  return response.data;
};

export const fetchDriverByNumber = async (number: string): Promise<IDriver> => {
  const drivers = await fetchDrivers();

  const driver = drivers.find((item) => item.driver_number === Number(number));

  if (!driver) {
    throw new Error("Driver not found");
  }

  return driver;
};

export const createDriver = async (data: DriverInput): Promise<IDriver> => {
  const response = await api.post<IDriver>("/drivers", data);
  return response.data;
};

export const updateDriver = async (
  id: number,
  data: DriverInput,
): Promise<IDriver> => {
  const response = await api.put<IDriver>(`/drivers/${id}`, data);
  return response.data;
};

export const deleteDriver = async (id: number): Promise<void> => {
  await api.delete(`/drivers/${id}`);
};
