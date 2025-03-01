export class ApiResponse {
  constructor(statusCode, data, message = "Data fetched successfully") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
