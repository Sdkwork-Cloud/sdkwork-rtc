import 'rtc_call_session.dart';
import 'rtc_call_types.dart';
import 'rtc_call_controller.dart';
import 'rtc_data_source.dart';
import 'rtc_driver_manager.dart';
import 'rtc_signaling_adapter.dart';
import 'rtc_standard_contract.dart';

final class StandardRtcCallStack<TNativeClient> implements RtcCloseable {
  const StandardRtcCallStack({
    required this.driverManager,
    required this.dataSource,
    required this.mediaClient,
    required this.signaling,
    required this.callSession,
    required this.realtimeDispatcher,
  });

  final RtcDriverManager driverManager;
  final RtcDataSource dataSource;
  final RtcClient<TNativeClient> mediaClient;
  final RtcCallSignalingAdapter signaling;
  final StandardRtcCallSession<TNativeClient> callSession;
  final RtcSignalingRealtimeDispatcher realtimeDispatcher;

  @override
  Future<void> close() async {
    await callSession.close();
  }
}

final class CreateStandardRtcCallStackOptions {
  const CreateStandardRtcCallStackOptions({
    required this.sdk,
    required this.deviceId,
    Duration reconnectInterval = const Duration(seconds: 1),
    this.liveConnection,
    this.connectOptions,
    this.dataSourceOptions = const RtcDataSourceOptions(),
    this.driverManager,
  }) : reconnectInterval = reconnectInterval;

  final RtcSignalingClient sdk;
  final String deviceId;
  final Duration reconnectInterval;
  final RtcSignalingLiveConnection? liveConnection;
  final RtcSignalingConnectOptions? connectOptions;
  final RtcDataSourceOptions dataSourceOptions;
  final RtcDriverManager? driverManager;
}

final class StandardRtcCallControllerStack<TNativeClient>
    implements RtcCloseable {
  const StandardRtcCallControllerStack({
    required this.driverManager,
    required this.dataSource,
    required this.mediaClient,
    required this.signaling,
    required this.callSession,
    required this.realtimeDispatcher,
    required this.callController,
  });

  final RtcDriverManager driverManager;
  final RtcDataSource dataSource;
  final RtcClient<TNativeClient> mediaClient;
  final RtcCallSignalingAdapter signaling;
  final StandardRtcCallSession<TNativeClient> callSession;
  final RtcSignalingRealtimeDispatcher realtimeDispatcher;
  final StandardRtcCallController<TNativeClient> callController;

  @override
  Future<void> close() async {
    await callController.close();
  }
}

final class CreateStandardRtcCallControllerStackOptions {
  const CreateStandardRtcCallControllerStackOptions({
    required this.sdk,
    required this.deviceId,
    Duration reconnectInterval = const Duration(seconds: 1),
    this.watchConversationIds = const <String>[],
    this.liveConnection,
    this.connectOptions,
    this.dataSourceOptions = const RtcDataSourceOptions(),
    this.driverManager,
  }) : reconnectInterval = reconnectInterval;

  final RtcSignalingClient sdk;
  final String deviceId;
  final Duration reconnectInterval;
  final List<String> watchConversationIds;
  final RtcSignalingLiveConnection? liveConnection;
  final RtcSignalingConnectOptions? connectOptions;
  final RtcDataSourceOptions dataSourceOptions;
  final RtcDriverManager? driverManager;
}

Future<StandardRtcCallStack<TNativeClient>>
    createStandardRtcCallStack<TNativeClient>(
  CreateStandardRtcCallStackOptions options,
) async {
  final driverManager = options.driverManager ?? RtcDriverManager();
  final dataSource = RtcDataSource(
    options: options.dataSourceOptions,
    driverManager: driverManager,
  );
  final mediaClient = await dataSource.createClient<TNativeClient>();
  final realtimeDispatcher = RtcSignalingRealtimeDispatcher(
    CreateRtcSignalingAdapterOptions(
      sdk: options.sdk,
      deviceId: options.deviceId,
      reconnectInterval: options.reconnectInterval,
      liveConnection: options.liveConnection,
      connectOptions: options.connectOptions,
    ),
  );
  final signaling = createRtcSignalingAdapter(
    CreateRtcSignalingAdapterOptions(
      sdk: options.sdk,
      deviceId: options.deviceId,
      reconnectInterval: options.reconnectInterval,
      liveConnection: options.liveConnection,
      connectOptions: options.connectOptions,
      realtimeDispatcher: realtimeDispatcher,
    ),
  );
  final callSession = StandardRtcCallSession<TNativeClient>(
    mediaClient: mediaClient,
    signaling: signaling,
  );

  return StandardRtcCallStack<TNativeClient>(
    driverManager: driverManager,
    dataSource: dataSource,
    mediaClient: mediaClient,
    signaling: signaling,
    callSession: callSession,
    realtimeDispatcher: realtimeDispatcher,
  );
}

Future<StandardRtcCallControllerStack<TNativeClient>>
    createStandardRtcCallControllerStack<TNativeClient>(
  CreateStandardRtcCallControllerStackOptions options,
) async {
  final rtcStack = await createStandardRtcCallStack<TNativeClient>(
    CreateStandardRtcCallStackOptions(
      sdk: options.sdk,
      deviceId: options.deviceId,
      reconnectInterval: options.reconnectInterval,
      liveConnection: options.liveConnection,
      connectOptions: options.connectOptions,
      dataSourceOptions: options.dataSourceOptions,
      driverManager: options.driverManager,
    ),
  );

  final callController = await createStandardRtcCallController<TNativeClient>(
    CreateStandardRtcCallControllerOptions<TNativeClient>(
      sdk: options.sdk,
      callSession: rtcStack.callSession,
      deviceId: options.deviceId,
      reconnectInterval: options.reconnectInterval,
      watchConversationIds: options.watchConversationIds,
      liveConnection: options.liveConnection,
      connectOptions: options.connectOptions,
      signaling: rtcStack.signaling,
      realtimeDispatcher: rtcStack.realtimeDispatcher,
    ),
  );

  return StandardRtcCallControllerStack<TNativeClient>(
    driverManager: rtcStack.driverManager,
    dataSource: rtcStack.dataSource,
    mediaClient: rtcStack.mediaClient,
    signaling: rtcStack.signaling,
    callSession: rtcStack.callSession,
    realtimeDispatcher: rtcStack.realtimeDispatcher,
    callController: callController,
  );
}
