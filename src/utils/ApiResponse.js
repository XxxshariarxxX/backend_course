class ApiResponse {
  constructor(status, message = 'Success', data) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.success = statuscode < 400;
  }
}
export { ApiResponse };