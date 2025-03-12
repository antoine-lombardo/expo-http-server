package net.oxoc.expo.modules.httpserver



import androidx.core.os.bundleOf
import java.util.UUID;
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Enumerable
import io.ktor.http.HttpStatusCode
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.application.*
import io.ktor.server.request.httpMethod
import io.ktor.server.request.receive
import io.ktor.server.request.uri
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.time.Duration
import java.time.LocalDateTime



// ---------------------------------- //
//             Constants              //
// ---------------------------------- //

const val ON_REQUEST_EVENT_NAME   = "onRequest"
const val ON_LOG_EVENT_NAME       = "onLog"
const val ON_RUNNING_CHANGE_EVENT = "onRunningChange"
const val RESPONSE_WAIT_TIMEOUT = 25.0
const val SERVER_STOP_TIMEOUT   = 1000



class HttpServerModule : Module() {



  // ---------------------------------- //
  //         Module attributes          //
  // ---------------------------------- //


  companion object {
    private var server: NettyApplicationEngine? = null
    private var _isRunning: Boolean = false
    private val responses = mutableMapOf<String, HttpResponse>()
  }



  // ---------------------------------- //
  //           Module Enums             //
  // ---------------------------------- //


  /**
   * Error code returned to the Expo app.
   */
  private enum class ErrorCode(val value: Int): Enumerable {
    SUCCESS(0),
    ALREADY_RUNNING(1),
    PORT_USED(2),
    BAD_ARGUMENTS(3),
    UNKNOWN(4)
  }


  /**
   * HTTP methods defined in the Expo app.
   */
  private enum class HttpMethod(val value: Int): Enumerable {
    GET(0),
    POST(1),
    PUT(2),
    PATCH(3),
    DELETE(4),
    UNKNOWN(5)
  }



  // ---------------------------------- //
  //         Internal Structs           //
  // ---------------------------------- //

  /**
   * HTTP response data class
   */
  private class HttpResponse(
    val statusCode: Int,
    val statusDescription: String,
    val data: ByteArray,
    val headers: Map<String, String>
  )



  // ---------------------------------- //
  //         Module Functions           //
  // ---------------------------------- //


  /**
   * Starts the HTTP server.
   *
   * @param port  The port to listen to.
   * @param force Whether to force server restart if already running.
   * @return An error code.
   */
  private fun start(port: Int, force: Boolean): ErrorCode {

    // Handle non-null server object
    if (HttpServerModule.server != null) {
      if (!force) {
        return ErrorCode.ALREADY_RUNNING
      }
      try {
        HttpServerModule.server?.stop(1000, 1000)
        HttpServerModule.server = null
        HttpServerModule._isRunning = false
        onRunningChange()
      } catch (e: Exception) {
        return ErrorCode.UNKNOWN
      }
    }

    // Create a new server object
    HttpServerModule.server = embeddedServer(Netty, port = port) {
      routing {
        // Listen to all standard HTTP methods
        get("{...}")    { handleRequest(call) }
        post("{...}")   { handleRequest(call) }
        put("{...}")    { handleRequest(call) }
        patch("{...}")  { handleRequest(call) }
        delete("{...}") { handleRequest(call) }
      }
    }
    HttpServerModule.server?.environment?.monitor?.subscribe(ApplicationStarted) {
      HttpServerModule._isRunning = true
      onRunningChange()
    }
    HttpServerModule.server?.environment?.monitor?.subscribe(ApplicationStopped) {
      HttpServerModule._isRunning = false
      onRunningChange()
      HttpServerModule.server?.environment?.monitor?.unsubscribe(ApplicationStarted) {}
      HttpServerModule.server?.environment?.monitor?.unsubscribe(ApplicationStopped) {}
    }
    // Try to start the server
    try {
      HttpServerModule.server?.start(wait = false)
      return ErrorCode.SUCCESS
    } catch (e: Exception) {
      return ErrorCode.UNKNOWN
    }

  }



  /**
   * Stops the HTTP server.
   *
   * @return An error code.
   */
  private fun stop(): ErrorCode {

    if (HttpServerModule.server != null) {
      try {
        HttpServerModule.server?.stop(1000, 2000)
        HttpServerModule.server = null
        HttpServerModule._isRunning = false
        onRunningChange()
      } catch (e: Exception) {
        return ErrorCode.UNKNOWN
      }
    }
    return ErrorCode.SUCCESS

  }



  /**
   * Returns whether the server is running or not.
   *
   * @return Whether the server is running or not.
   */
  private fun isRunning(): Boolean {
    return (HttpServerModule.server != null && HttpServerModule._isRunning)
  }



  /**
   * Respond to a pending request.
   *
   * @param id                The request ID.
   * @param statusCode        The status code.
   * @param statusDescription The status description.
   * @param data              The response data.
   * @param headers           The response headers.
   * @return An error code.
   */
  private fun respond(id: String, statusCode: Int, statusDescription: String, data: ByteArray, headers: JavaScriptObject): ErrorCode {

    // Convert headers into Kotlin-compatible Map
    val tmpHeaders = mutableMapOf<String, String>()
    for (name in headers.getPropertyNames()) {
      tmpHeaders[name] = headers.getProperty(name).getString()
    }

    // Add response to queue
    HttpServerModule.responses[id] = HttpServerModule.HttpResponse(statusCode, statusDescription, data, tmpHeaders)

    return ErrorCode.SUCCESS

  }



  /**
   * Handles an incoming request.
   *
   * @param call The ApplicationCall object
   */
  private suspend fun handleRequest(call: ApplicationCall) {


    // Convert the HTTP method to the format used by the Expo app
    val expoMethod = when (call.request.httpMethod) {
      io.ktor.http.HttpMethod.Get    -> HttpMethod.GET
      io.ktor.http.HttpMethod.Post   -> HttpMethod.POST
      io.ktor.http.HttpMethod.Put    -> HttpMethod.PUT
      io.ktor.http.HttpMethod.Patch  -> HttpMethod.PATCH
      io.ktor.http.HttpMethod.Delete -> HttpMethod.DELETE
      else                           -> HttpMethod.UNKNOWN
    }


    // Convert the headers into an Expo compatible map
    val expoHeaders = mutableMapOf<String, String>()
    for (name in call.request.headers.names()) {
      val value = call.request.headers[name]
      if (value != null) { expoHeaders[name] = value }
    }


    // Create a unique ID
    val id = UUID.randomUUID().toString()


    // Forward the request to the Expo app
    this@HttpServerModule.sendEvent(
      ON_REQUEST_EVENT_NAME,
      bundleOf(
        "id" to id,
        "method" to expoMethod,
        "uri" to call.request.uri,
        "body" to call.receive<ByteArray>(),
        "headers" to expoHeaders
      )
    )


    // Wait until response received from the app or timeout reached
    val start = LocalDateTime.now()
    while (true) {

      // Return 500 if timeout reached
      val now = LocalDateTime.now()
      if (Duration.between(start, now).seconds > RESPONSE_WAIT_TIMEOUT) {
        return call.respondText("Internal server error.", status = HttpStatusCode(500, "Internal Server Error"))
      }

      // Return response from the app if received
      val response: HttpResponse? = responses[id]
      if (response != null) {
        for (header in response.headers.entries) { call.response.headers.append(header.key, header.value) }
        call.response.status(HttpStatusCode(response.statusCode, response.statusDescription))
        return call.respondBytes(response.data);
      }
    }
  }



  /**
   * Emits the isRunning state to all subscribers.
   */
  private fun onRunningChange() {

    this@HttpServerModule.sendEvent(
      ON_RUNNING_CHANGE_EVENT,
      bundleOf(
        "isRunning" to isRunning(),
      )
    )

  }




  /**
   * The HttpServer native module definition.
   */
  override fun definition() = ModuleDefinition {

    Name("HttpServer")

    Events(ON_REQUEST_EVENT_NAME, ON_RUNNING_CHANGE_EVENT, ON_LOG_EVENT_NAME)

    Function("start")     { a: Int, b: Boolean                                              -> return@Function start(a, b)            }
    Function("stop")      {                                                                 -> return@Function stop()                 }
    Function("respond")   { a: String, b: Int, c: String, d: ByteArray, e: JavaScriptObject -> return@Function respond(a, b, c, d, e) }
    Property("isRunning") {                                                                 -> return@Property isRunning()            }

  }
}
