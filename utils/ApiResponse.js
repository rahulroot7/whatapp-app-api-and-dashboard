class ApiResponse {
    constructor(statusCode, data, message = "Success",totalRecords = null,recordsPerPage=null) {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400,
        this.totalRecords = totalRecords,
        this.recordsPerPage =recordsPerPage
    }
}

module.exports =  ApiResponse 