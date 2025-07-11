import axios, { Method } from "axios";

const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8090/api/desktop-app/"
    : "https://spy-duck.com/api/desktop-app/";

export class ApiFetchError extends Error {
  constructor(
    message: string,
    private readonly _details: any,
  ) {
    super(message);
    this.name = "MyError";
  }

  get details() {
    return this._details;
  }
}

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      throw new ApiFetchError(error.response.data.message, error.response.data);
    }
    return Promise.reject(error);
  },
);

export { axiosClient };
