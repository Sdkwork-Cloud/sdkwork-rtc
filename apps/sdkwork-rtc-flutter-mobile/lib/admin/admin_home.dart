import 'package:flutter/material.dart';
import 'package:sdkwork_rtc_flutter_mobile_admin_core/sdkwork_rtc_flutter_mobile_admin_core.dart';

import '../bootstrap/admin_auth.dart';
import '../bootstrap/admin_services.dart';
import '../bootstrap/routes.dart';
import 'admin_shell.dart';

class AdminHome extends StatefulWidget {
  final RtcAdminSession session;

  const AdminHome({super.key, required this.session});

  @override
  State<AdminHome> createState() => _AdminHomeState();
}

class _AdminHomeState extends State<AdminHome> {
  late final RtcAdminServices _services = createAdminServices(session: widget.session);

  List<ProviderProfile> _profiles = [];
  List<ProviderConfigSchema> _schemas = [];
  List<ProviderAccount> _accounts = [];
  List<ProviderRoute> _routes = [];
  List<ProviderPluginDescriptor> _plugins = [];
  List<ProviderWebhookEvent> _webhookEvents = [];
  List<Room> _rooms = [];

  ProviderConfigSchema? _wizardSchema;
  ProviderPluginDescriptor? _selectedPlugin;
  ProviderProfile? _selectedProfile;

  ProviderQueryJob? _queryJobDetail;
  List<ProviderQuerySnapshot> _querySnapshots = [];
  String? _activeQueryJobId;
  ProviderQueryJobCreateCommand _queryJobForm = ProviderQueryJobCreateCommand(
    provider: 'volcengine',
    queryKind: 'room_state',
    roomId: '',
  );

  RoomFilterState _roomFilter = RoomFilterState();
  final Set<String> _selectedRoomIds = {};

  String? _error;
  String? _wizardError;
  String? _queryJobError;
  String? _capabilityError;
  bool _loading = false;
  bool _wizardSaving = false;
  bool _queryJobLoading = false;
  bool _capabilitySaving = false;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _runLoad(Future<void> Function() loader) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await loader();
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadDashboard() async {
    await _runLoad(() async {
      final results = await Future.wait([
        _services.profiles.list(),
        _services.schemas.listSchemas(),
      ]);
      setState(() {
        _profiles = results[0] as List<ProviderProfile>;
        _schemas = results[1] as List<ProviderConfigSchema>;
      });
    });
  }

  Future<void> _loadAccounts() async {
    await _runLoad(() async {
      final data = await _services.accounts.list();
      setState(() => _accounts = data);
    });
  }

  Future<void> _loadProfiles() async {
    await _runLoad(() async {
      final data = await _services.profiles.list();
      setState(() => _profiles = data);
    });
  }

  Future<void> _loadRoutes() async {
    await _runLoad(() async {
      final data = await _services.routes.list();
      setState(() => _routes = data);
    });
  }

  Future<void> _loadPlugins() async {
    await _runLoad(() async {
      final data = await _services.plugins.list();
      setState(() => _plugins = data);
    });
  }

  Future<void> _loadSchemas() async {
    await _runLoad(() async {
      final data = await _services.schemas.listSchemas();
      setState(() => _schemas = data);
    });
  }

  Future<void> _loadRooms() async {
    await _runLoad(() async {
      final data = await _services.rooms.list();
      setState(() => _rooms = data);
    });
  }

  Future<void> _loadWebhooks() async {
    await _runLoad(() async {
      final data = await _services.webhooks.listEvents();
      setState(() => _webhookEvents = data);
    });
  }

  Future<void> _handleWizardComplete(ProviderWizardResult result) async {
    setState(() {
      _wizardSaving = true;
      _wizardError = null;
    });
    try {
      await persistProviderWizard(toWizardServices(_services), result);
      setState(() => _wizardSchema = null);
      await Future.wait([_loadAccounts(), _loadProfiles(), _loadDashboard()]);
    } catch (error) {
      setState(() => _wizardError = error.toString());
    } finally {
      if (mounted) setState(() => _wizardSaving = false);
    }
  }

  Future<void> _handleCapabilitySave(
    List<String> enabled,
    List<String> disabled,
  ) async {
    final profile = _selectedProfile;
    if (profile == null) return;

    setState(() {
      _capabilitySaving = true;
      _capabilityError = null;
    });
    try {
      await _services.profiles.configureCapabilities(profile.id, enabled, disabled);
      setState(() {
        _selectedPlugin = null;
        _selectedProfile = null;
      });
      await _loadProfiles();
    } catch (error) {
      setState(() => _capabilityError = error.toString());
    } finally {
      if (mounted) setState(() => _capabilitySaving = false);
    }
  }

  Future<void> _createQueryJob() async {
    setState(() {
      _queryJobLoading = true;
      _queryJobError = null;
    });
    try {
      final job = await _services.queryJobs.create(
        ProviderQueryJobCreateCommand(
          provider: _queryJobForm.provider,
          queryKind: _queryJobForm.queryKind,
          roomId: _queryJobForm.roomId?.isEmpty == true ? null : _queryJobForm.roomId,
          mediaSessionId: _queryJobForm.mediaSessionId,
          providerProfileId: _queryJobForm.providerProfileId,
          providerSessionId: _queryJobForm.providerSessionId,
        ),
      );
      final snapshots = await _services.queryJobs.listSnapshots(job.id);
      setState(() {
        _activeQueryJobId = job.id;
        _queryJobDetail = job;
        _querySnapshots = snapshots;
      });
    } catch (error) {
      setState(() => _queryJobError = error.toString());
    } finally {
      if (mounted) setState(() => _queryJobLoading = false);
    }
  }

  Future<void> _loadQueryJob() async {
    final jobId = _activeQueryJobId;
    if (jobId == null) return;

    setState(() {
      _queryJobLoading = true;
      _queryJobError = null;
    });
    try {
      final job = await _services.queryJobs.get(jobId);
      final snapshots = await _services.queryJobs.listSnapshots(jobId);
      setState(() {
        _queryJobDetail = job;
        _querySnapshots = snapshots;
      });
    } catch (error) {
      setState(() => _queryJobError = error.toString());
    } finally {
      if (mounted) setState(() => _queryJobLoading = false);
    }
  }

  void _ensureRouteData(AdminRoute route) {
    switch (route) {
      case AdminRoute.dashboard:
        if (_profiles.isEmpty && _schemas.isEmpty) _loadDashboard();
      case AdminRoute.accounts:
        if (_accounts.isEmpty) _loadAccounts();
      case AdminRoute.profiles:
        if (_profiles.isEmpty) _loadProfiles();
      case AdminRoute.routes:
        if (_routes.isEmpty) _loadRoutes();
      case AdminRoute.providers:
        if (_plugins.isEmpty) _loadPlugins();
      case AdminRoute.wizard:
        if (_schemas.isEmpty) _loadSchemas();
      case AdminRoute.rooms:
        if (_rooms.isEmpty) _loadRooms();
      case AdminRoute.webhooks:
        if (_webhookEvents.isEmpty) _loadWebhooks();
      case AdminRoute.queryJobs:
        break;
    }
  }

  Widget _buildRoute(AdminRoute route) {
    _ensureRouteData(route);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: MaterialBanner(
              content: Text(_error!),
              backgroundColor: Colors.red.shade50,
              actions: [TextButton(onPressed: () => setState(() => _error = null), child: const Text('Dismiss'))],
            ),
          ),
        Expanded(child: _buildRouteBody(route)),
      ],
    );
  }

  Widget _buildRouteBody(AdminRoute route) {
    switch (route) {
      case AdminRoute.dashboard:
        return ProviderHealthDashboard(
          profiles: _profiles,
          schemas: _schemas,
          onVerify: (profile) async {
            await _services.profiles.verify(profile.id, 'health');
            await _loadDashboard();
          },
          onRefresh: _loadDashboard,
        );

      case AdminRoute.accounts:
        return ProviderAccountList(
          accounts: _accounts,
          onSelect: (_) {},
          onDisable: (account) async {
            await _services.accounts.disable(account.id);
            await _loadAccounts();
          },
        );

      case AdminRoute.profiles:
        return ProviderProfileList(
          profiles: _profiles,
          onSelect: (profile) => setState(() => _selectedProfile = profile),
          onDisable: (profile) async {
            await _services.profiles.disable(profile.id);
            await _loadProfiles();
          },
          onVerify: (profile) async {
            await _services.profiles.verify(profile.id, 'health');
            await _loadProfiles();
          },
        );

      case AdminRoute.routes:
        return ProviderRouteList(
          routes: _routes,
          onDisable: (route) async {
            await _services.routes.disable(route.id);
            await _loadRoutes();
          },
        );

      case AdminRoute.providers:
        return _buildProvidersPage();

      case AdminRoute.wizard:
        return _buildWizardPage();

      case AdminRoute.rooms:
        return _buildRoomsPage();

      case AdminRoute.webhooks:
        return ProviderWebhookEventList(events: _webhookEvents);

      case AdminRoute.queryJobs:
        return _buildQueryJobsPage();
    }
  }

  Widget _buildProvidersPage() {
    if (_capabilityError != null) {
      return Column(
        children: [
          Text(_capabilityError!, style: const TextStyle(color: Colors.red)),
          ElevatedButton(onPressed: () => setState(() => _capabilityError = null), child: const Text('Dismiss')),
        ],
      );
    }

    if (_selectedPlugin == null) {
      return ProviderPluginList(
        plugins: _plugins,
        onSelect: (plugin) => setState(() {
          _selectedPlugin = plugin;
          _selectedProfile = null;
        }),
      );
    }

    final profileForCapability = _selectedProfile ??
        _profiles.where((p) => p.provider == _selectedPlugin!.providerKind).cast<ProviderProfile?>().firstOrNull;

    if (profileForCapability == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_selectedPlugin!.displayName),
          const SizedBox(height: 8),
          Text('No active provider profile found for ${_selectedPlugin!.providerKind}.'),
          const Text('Create one via the Setup Wizard first.'),
          TextButton(onPressed: () => setState(() => _selectedPlugin = null), child: const Text('Back')),
        ],
      );
    }

    final supported = mapPluginCapabilitiesToBackend([
      ..._selectedPlugin!.requiredCapabilities,
      ..._selectedPlugin!.optionalCapabilities,
    ]);
    final current = profileCapabilitiesToBackendKeys(profileForCapability.capabilities);

    return _CapabilityConfigPage(
      providerName: _selectedPlugin!.displayName,
      supportedCapabilities: supported,
      currentCapabilities: current,
      saving: _capabilitySaving,
      onSave: _handleCapabilitySave,
      onCancel: () => setState(() {
        _selectedPlugin = null;
        _selectedProfile = null;
      }),
    );
  }

  Widget _buildWizardPage() {
    if (_wizardError != null) {
      return Text(_wizardError!, style: const TextStyle(color: Colors.red));
    }
    if (_wizardSaving) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_wizardSchema == null) {
      return ListView(
        children: [
          const Text('Configure a new RTC provider step by step'),
          const SizedBox(height: 16),
          for (final schema in _schemas)
            Card(
              child: ListTile(
                title: Text(schema.displayName),
                subtitle: Text(schema.description),
                onTap: () => setState(() => _wizardSchema = schema),
              ),
            ),
        ],
      );
    }
    return _ProviderWizardPage(
      schema: _wizardSchema!,
      onComplete: _handleWizardComplete,
      onCancel: () => setState(() => _wizardSchema = null),
    );
  }

  Widget _buildRoomsPage() {
    final filtered = filterRooms(_rooms, _roomFilter);
    return Column(
      children: [
        RoomFilterWidget(
          filter: _roomFilter,
          onChanged: (value) => setState(() => _roomFilter = value),
          onReset: () => setState(() => _roomFilter = RoomFilterState()),
          totalCount: _rooms.length,
          filteredCount: filtered.length,
        ),
        const SizedBox(height: 8),
        Expanded(
          child: RoomListWidget(
            rooms: filtered,
            onSelect: (_) {},
            selectedIds: _selectedRoomIds,
            onToggleSelect: (id) => setState(() {
              if (_selectedRoomIds.contains(id)) {
                _selectedRoomIds.remove(id);
              } else {
                _selectedRoomIds.add(id);
              }
            }),
            onSelectAll: () => setState(() {
              if (_selectedRoomIds.length == filtered.length) {
                _selectedRoomIds.clear();
              } else {
                _selectedRoomIds
                  ..clear()
                  ..addAll(filtered.map((room) => room.id));
              }
            }),
            allSelected: filtered.isNotEmpty && _selectedRoomIds.length == filtered.length,
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(onPressed: _loadRooms, child: const Text('Refresh')),
        ),
      ],
    );
  }

  Widget _buildQueryJobsPage() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_queryJobError != null)
          Text(_queryJobError!, style: const TextStyle(color: Colors.red)),
        TextField(
          decoration: const InputDecoration(labelText: 'Provider'),
          controller: TextEditingController(text: _queryJobForm.provider)
            ..selection = TextSelection.collapsed(offset: _queryJobForm.provider.length),
          onChanged: (value) => _queryJobForm = ProviderQueryJobCreateCommand(
            provider: value,
            queryKind: _queryJobForm.queryKind,
            roomId: _queryJobForm.roomId,
            mediaSessionId: _queryJobForm.mediaSessionId,
            providerProfileId: _queryJobForm.providerProfileId,
          ),
        ),
        DropdownButtonFormField<String>(
          key: ValueKey(_queryJobForm.queryKind),
          initialValue: _queryJobForm.queryKind,
          decoration: const InputDecoration(labelText: 'Query Kind'),
          items: const [
            DropdownMenuItem(value: 'room_online_users', child: Text('room_online_users')),
            DropdownMenuItem(value: 'room_state', child: Text('room_state')),
            DropdownMenuItem(value: 'media_session_state', child: Text('media_session_state')),
            DropdownMenuItem(value: 'recording_artifacts', child: Text('recording_artifacts')),
            DropdownMenuItem(value: 'quality_samples', child: Text('quality_samples')),
          ],
          onChanged: (value) {
            if (value == null) return;
            setState(() {
              _queryJobForm = ProviderQueryJobCreateCommand(
                provider: _queryJobForm.provider,
                queryKind: value,
                roomId: _queryJobForm.roomId,
              );
            });
          },
        ),
        TextField(
          decoration: const InputDecoration(labelText: 'Room ID'),
          onChanged: (value) => _queryJobForm = ProviderQueryJobCreateCommand(
            provider: _queryJobForm.provider,
            queryKind: _queryJobForm.queryKind,
            roomId: value,
          ),
        ),
        TextField(
          decoration: const InputDecoration(labelText: 'Job ID'),
          controller: TextEditingController(text: _activeQueryJobId ?? ''),
          onChanged: (value) => setState(() => _activeQueryJobId = value.isEmpty ? null : value),
        ),
        Row(
          children: [
            ElevatedButton(
              onPressed: _queryJobLoading ? null : _createQueryJob,
              child: const Text('Create Job'),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: _queryJobLoading ? null : _loadQueryJob,
              child: const Text('Load Job'),
            ),
          ],
        ),
        if (_queryJobLoading) const LinearProgressIndicator(),
        const SizedBox(height: 8),
        Expanded(
          child: ProviderQueryJobPanel(
            job: _queryJobDetail,
            snapshots: _querySnapshots,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return AdminShell(builder: _buildRoute);
  }
}

class _CapabilityConfigPage extends StatefulWidget {
  final String providerName;
  final List<String> supportedCapabilities;
  final Map<String, bool> currentCapabilities;
  final bool saving;
  final Future<void> Function(List<String> enabled, List<String> disabled) onSave;
  final VoidCallback onCancel;

  const _CapabilityConfigPage({
    required this.providerName,
    required this.supportedCapabilities,
    required this.currentCapabilities,
    required this.saving,
    required this.onSave,
    required this.onCancel,
  });

  @override
  State<_CapabilityConfigPage> createState() => _CapabilityConfigPageState();
}

class _CapabilityConfigPageState extends State<_CapabilityConfigPage> {
  late final Map<String, bool> _values = Map<String, bool>.from(widget.currentCapabilities);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Configure Capabilities - ${widget.providerName}',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Expanded(
          child: ListView(
            children: widget.supportedCapabilities.map((capability) {
              return SwitchListTile(
                title: Text(capability),
                value: _values[capability] ?? false,
                onChanged: (value) => setState(() => _values[capability] = value),
              );
            }).toList(),
          ),
        ),
        Row(
          children: [
            ElevatedButton(
              onPressed: widget.saving
                  ? null
                  : () {
                      final enabled = <String>[];
                      final disabled = <String>[];
                      for (final entry in _values.entries) {
                        if (entry.value) {
                          enabled.add(entry.key);
                        } else {
                          disabled.add(entry.key);
                        }
                      }
                      widget.onSave(enabled, disabled);
                    },
              child: const Text('Save'),
            ),
            TextButton(onPressed: widget.onCancel, child: const Text('Cancel')),
          ],
        ),
      ],
    );
  }
}

class _ProviderWizardPage extends StatefulWidget {
  final ProviderConfigSchema schema;
  final ValueChanged<ProviderWizardResult> onComplete;
  final VoidCallback onCancel;

  const _ProviderWizardPage({
    required this.schema,
    required this.onComplete,
    required this.onCancel,
  });

  @override
  State<_ProviderWizardPage> createState() => _ProviderWizardPageState();
}

class _ProviderWizardPageState extends State<_ProviderWizardPage> {
  int _step = 0;
  final Map<String, dynamic> _accountValues = {};
  final Map<String, dynamic> _applicationValues = {};
  final Map<String, dynamic> _profileValues = {};

  @override
  Widget build(BuildContext context) {
    final steps = ['Account', 'Application', 'Profile', 'Review'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('${widget.schema.displayName} Setup (${steps[_step]})'),
        const SizedBox(height: 8),
        Expanded(
          child: _step < 3
              ? ProviderSchemaForm(
                  schema: widget.schema,
                  values: _valuesForStep(_step),
                  onChanged: _updateValuesForStep,
                  section: _sectionForStep(_step),
                )
              : Text(
                  'Review configuration for ${widget.schema.provider} before saving.',
                ),
        ),
        Row(
          children: [
            if (_step > 0)
              TextButton(onPressed: () => setState(() => _step -= 1), child: const Text('Back')),
            if (_step < 3)
              ElevatedButton(onPressed: () => setState(() => _step += 1), child: const Text('Next'))
            else
              ElevatedButton(onPressed: _submit, child: const Text('Complete')),
            TextButton(onPressed: widget.onCancel, child: const Text('Cancel')),
          ],
        ),
      ],
    );
  }

  Map<String, dynamic> _valuesForStep(int step) {
    switch (step) {
      case 0:
        return _accountValues;
      case 1:
        return _applicationValues;
      case 2:
        return _profileValues;
      default:
        return {};
    }
  }

  void _updateValuesForStep(Map<String, dynamic> values) {
    setState(() {
      switch (_step) {
        case 0:
          _accountValues
            ..clear()
            ..addAll(values);
        case 1:
          _applicationValues
            ..clear()
            ..addAll(values);
        case 2:
          _profileValues
            ..clear()
            ..addAll(values);
      }
    });
  }

  String _sectionForStep(int step) {
    switch (step) {
      case 0:
        return 'account';
      case 1:
        return 'application';
      case 2:
        return 'profile';
      default:
        return 'account';
    }
  }

  void _submit() {
    widget.onComplete(
      ProviderWizardResult(
        account: ProviderAccountCommand(
          provider: widget.schema.provider,
          code: (_accountValues['code'] ?? widget.schema.provider).toString(),
          name: (_accountValues['name'] ?? widget.schema.displayName).toString(),
          environment: (_accountValues['environment'] ?? 'production').toString(),
        ),
        application: ProviderApplicationCommand(
          code: (_applicationValues['code'] ?? '${widget.schema.provider}-app').toString(),
          name: (_applicationValues['name'] ?? widget.schema.displayName).toString(),
          environment: (_applicationValues['environment'] ?? 'production').toString(),
          providerApplicationId:
              (_applicationValues['providerApplicationId'] ?? 'default-app-id').toString(),
          providerApplicationIdKind:
              (_applicationValues['providerApplicationIdKind'] ?? 'app_id').toString(),
          configSnapshot: Map<String, dynamic>.from(_applicationValues),
        ),
        credentials: const [],
        profile: ProviderProfileCommand(
          provider: widget.schema.provider,
          code: (_profileValues['code'] ?? widget.schema.provider).toString(),
          name: (_profileValues['name'] ?? widget.schema.displayName).toString(),
          isDefault: _profileValues['isDefault'] as bool? ?? false,
          priority: (_profileValues['priority'] as num?)?.toInt() ?? 100,
          environment: (_profileValues['environment'] ?? 'production').toString(),
          capabilities: const {},
          configSnapshot: Map<String, dynamic>.from(_profileValues),
        ),
      ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    if (!iterator.moveNext()) return null;
    return iterator.current;
  }
}
