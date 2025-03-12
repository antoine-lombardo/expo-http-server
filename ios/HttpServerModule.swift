import ExpoModulesCore
import Telegraph



// ---------------------------------- //
//             Constants              //
// ---------------------------------- //

let ON_REQUEST_EVENT_NAME    = "onRequest"
let ON_LOG_EVENT_NAME        = "onLog"
let ON_RUNNING_CHANGE_EVENT  = "onRunningChange"
let RESPONSE_WAIT_TIMEOUT = 25.0



public class HttpServerModule: Module {
    
    
    
    // ---------------------------------- //
    //         Module attributes          //
    // ---------------------------------- //
    
    
    private static var server: Server? = nil
    private static var responses: [String: HTTPResponse] = [:]
    private static let queue: DispatchQueue = .init(label: "responses-queue")
    
    
    
    // ---------------------------------- //
    //           Module Enums             //
    // ---------------------------------- //
    
    
    /// Error code returned to the Expo app.
    public enum ErrorCode: Int, Enumerable {
        case SUCCESS
        case ALREADY_RUNNING
        case PORT_USED
        case BAD_ARGUMENTS
        case UNKNOWN
    }
    
    
    /// HTTP methods defined in the Expo app.
    public enum HttpMethod: Int, Enumerable {
        case GET
        case POST
        case PUT
        case PATCH
        case DELETE
        case UNKNOWN
    }
    
    
    
    // ---------------------------------- //
    //         Module Functions           //
    // ---------------------------------- //
    
    
    /**
        Starts the HTTP server.

        - Parameter port:  The port to listen to.
        - Parameter force: Whether to force server restart if already running.

        - Returns: An error code.
    */
    private func start(port: Int, force: Bool) -> ErrorCode {
        
        // Handle non-nil server object
        if HttpServerModule.server != nil {
            if HttpServerModule.server!.isRunning {
                if !force {
                    return ErrorCode.ALREADY_RUNNING
                }
                HttpServerModule.server!.stop(immediately: true);
            }
            HttpServerModule.server = nil
        }
        
        // Create a new server object
        HttpServerModule.server = Server()
        
        // Listen to all standard HTTP methods
        HttpServerModule.server?.route(HTTPMethod.GET, "*", handleRequest)
        HttpServerModule.server?.route(HTTPMethod.POST, "*", handleRequest)
        HttpServerModule.server?.route(HTTPMethod.PUT, "*", handleRequest)
        HttpServerModule.server?.route(HTTPMethod.PATCH, "*", handleRequest)
        HttpServerModule.server?.route(HTTPMethod.DELETE, "*", handleRequest)
        
        // Try to start the server
        do {
            try HttpServerModule.server?.start(port: port)
            onRunningChange()
            return ErrorCode.SUCCESS
        } catch {
            onRunningChange()
            return ErrorCode.UNKNOWN
        }
    }
    
    
    
    /**
        Stops the HTTP server.

        - Returns: An error code.
    */
    private func stop() -> ErrorCode {

        if HttpServerModule.server != nil {
            if HttpServerModule.server!.isRunning {
                HttpServerModule.server!.stop(immediately: true);
            }
            HttpServerModule.server = nil
        }
        onRunningChange()
        return ErrorCode.SUCCESS
        
    }
    
    
    
    /**
        Returns whether the server is running or not.

        - Returns: Whether the server is running or not.
    */
    private func isRunning() -> Bool {

        if HttpServerModule.server != nil && HttpServerModule.server!.isRunning {
            return true
        } else {
            return false
        }
        
    }
    
    
    
    /**
        Respond to a pending request.
     
        - Parameter id:                The request ID.
        - Parameter statusCode:        The status code.
        - Parameter statusDescription: The status description.
        - Parameter data:              The response data.
        - Parameter headers:           The response headers.

        - Returns: An error code.
    */
    private func respond(id: String, statusCode: Int, statusDescription: String, data: Data, headers: JavaScriptObject) -> ErrorCode {

        // Convert headers into Telegraph-compatible dictionary
        var tmpHeaders: [HTTPHeaderName: String] = [:]
        for (name) in headers.getPropertyNames() { tmpHeaders[HTTPHeaderName(stringLiteral: name)] = headers.getProperty(name).getString() }
        
        // Add response to queue
        HttpServerModule.queue.sync {
            HttpServerModule.responses[id] = HTTPResponse(HTTPStatus(code: statusCode, phrase: statusDescription), headers: tmpHeaders, body: data)
        }
        
        return ErrorCode.SUCCESS
        
    }
    
    
    
    /**
        Handles an incoming request.

        - Parameter request: The incoming request

        - Returns: The response to the request.
    */
    private func handleRequest(request: HTTPRequest) -> HTTPResponse {
        
        // Convert the HTTP method to the format used by the Expo app
        var expoMethod: HttpMethod = .UNKNOWN
        switch request.method {
            case .GET:    expoMethod = .GET
            case .POST:   expoMethod = .POST
            case .PUT:    expoMethod = .PUT
            case .PATCH:  expoMethod = .PATCH
            case .DELETE: expoMethod = .DELETE
            default:      expoMethod = .UNKNOWN
        }
        
        
        // Convert the headers into an Expo compatible dictionary
        var expoHeaders = [String: String]()
        for (name, value) in request.headers { expoHeaders[name.description.lowercased()] = value }
        
        
        // Create a unique ID
        let id = UUID().uuidString
        
        
        // Forward the request to the Expo app
        sendEvent(
            ON_REQUEST_EVENT_NAME,
            [
                "id": id,
                "method": expoMethod.rawValue,
                "uri": request.uri.string,
                "body": request.body,
                "headers": expoHeaders,
            ]
        )
        
        
        // Wait until response received from the app or timeout reached
        let start = NSDate.init()
        while (true) {
            
            // Return 500 if timeout reached
            let now = NSDate.init()
            if CFDateGetTimeIntervalSinceDate(now, start) > RESPONSE_WAIT_TIMEOUT {
                return HTTPResponse(HTTPStatus.internalServerError, content: "Internal server error.")
            }
            
            // Return response from the app if received
            var response: HTTPResponse? = nil
            HttpServerModule.queue.sync {
                if HttpServerModule.responses[id] != nil {
                    response = HttpServerModule.responses[id]
                    HttpServerModule.responses.removeValue(forKey: id)
                }
            }
            if response != nil {
                return response!
            }
        }
    }
    
    
    
    /**
        Emits the isRunning state to all subscribers.
    */
    private func onRunningChange() {
        
        sendEvent(
            ON_RUNNING_CHANGE_EVENT,
            [
                "isRunning": isRunning(),
            ]
        )
        
    }
    
    


    
    /**
        The HttpServer native module definition.
    */
    public func definition() -> ModuleDefinition {
        

        Name("HttpServer")
        
        Events(ON_REQUEST_EVENT_NAME, ON_RUNNING_CHANGE_EVENT, ON_LOG_EVENT_NAME)
        
        Function("start")     { (a: Int, b: Bool                                           ) -> ErrorCode in return start(port: a, force: b)                                                  }
        Function("stop")      { (                                                          ) -> ErrorCode in return stop()                                                                    }
        Function("respond")   { (a: String, b: Int, c: String, d: Data, e: JavaScriptObject) -> ErrorCode in return respond(id: a, statusCode: b, statusDescription: c, data: d, headers: e)  }
        Property("isRunning") { (                                                          ) -> Bool      in return isRunning()                                                               }
        
    }
}
