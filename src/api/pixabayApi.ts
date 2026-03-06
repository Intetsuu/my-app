import axios from "axios";
import { IPixebayResponse } from "../@types/PixabayImage.types";

const PIXABAY_KEY = "54916804-fa67481800f7c1aa5d57dfd0c";

export const pixabayApi = axios.create({
  baseURL: "https://pixabay.com/api/",
  timeout: 5000,
});

export const fetchImages = async (query: string, perPage = 10) => {
  try {
    const response = await pixabayApi.get<IPixebayResponse>("", {
      params: {
        key: PIXABAY_KEY,
        q: query,
        image_type: "photo",
        per_page: perPage,
      },
    });
    console.log("response", response.data);
    console.log("response", response.data.hits);
    return response.data;
  } catch (error) {
    console.error("Error fetch pixabayApi", error);
    return [];
  }
};
