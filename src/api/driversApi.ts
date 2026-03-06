import { api } from "./axios";
import { IDriver } from "../@types/drivers.types";

export const fetchDrivers = async (): Promise<IDriver[]> => {
  const response = await api.get<IDriver[]>("/drivers", {
    params: {
      session_key: "latest",
    },
  });

  return response.data;
};

export const fetchDriverByNumber = async (number: string): Promise<IDriver> => {
  const response = await api.get<IDriver[]>("/drivers", {
    params: {
      session_key: "latest",
      driver_number: number,
    },
  });

  return response.data[0];
};
