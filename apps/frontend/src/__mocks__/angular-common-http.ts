export class HttpClient {
  get<T>(_url: string): T {
    throw new Error('HttpClient.get mock should not be called directly in unit tests.');
  }

  post<T>(_url: string, _body: unknown): T {
    throw new Error('HttpClient.post mock should not be called directly in unit tests.');
  }
}
