export interface IPixabayImage {
  id: number;
  webformatURL: string;
  largeImageUrl: string;
  tags: string;
}

export interface IPixebayResponse {
  hits: IPixabayImage[];
}
