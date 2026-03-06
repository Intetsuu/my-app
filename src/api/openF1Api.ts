import axios from "axios";
import { IDriverTiming } from "../@types/driverTiming.types";

export const openF1Api = axios.create({
  baseURL: "https://api.openf1.org/v1",
  timeout: 5000,
});

export const fetchLiveTiming = async () => {
  try {
    const response = await openF1Api.get<IDriverTiming[]>("/intervals", {
      params: {
        session_key: "9165",
      },
    });

    const data = response.data;

    const latestDrivers: Record<number, IDriverTiming> = {};

    data.forEach((item) => {
      latestDrivers[item.driver_number] = item;
    });

    const drivers = Object.values(latestDrivers);

    drivers.sort((a, b) => {
      if (a.gap_to_leader === null) return -1;
      if (b.gap_to_leader === null) return 1;
      return a.gap_to_leader - b.gap_to_leader;
    });

    return drivers.map((driver, index) => ({
      ...driver,
      position: index + 1,
    }));
  } catch (error) {
    console.error("Error fetching", error);
    return [];
  }
};
