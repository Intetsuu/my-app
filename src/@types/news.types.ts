export interface IArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
}
export interface INewsApiResponse {
  status: string;
  totalResults: number;
  articles: IArticle[];
}
