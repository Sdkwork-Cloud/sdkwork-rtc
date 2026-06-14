class Room {
  final String id;
  final String tenantId;
  final String organizationId;
  final String ownerUserId;
  final String title;
  final String status;
  final String? createdAt;
  final String? updatedAt;

  Room({
    required this.id,
    required this.tenantId,
    required this.organizationId,
    required this.ownerUserId,
    required this.title,
    required this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory Room.fromJson(Map<String, dynamic> json) {
    return Room(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      organizationId: json['organizationId'] as String,
      ownerUserId: json['ownerUserId'] as String,
      title: json['title'] as String,
      status: json['status'] as String,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }
}

class RoomFilterState {
  final String search;
  final String status;
  final String ownerUserId;
  final String dateRange;

  RoomFilterState({
    this.search = '',
    this.status = 'all',
    this.ownerUserId = '',
    this.dateRange = 'all',
  });

  RoomFilterState copyWith({
    String? search,
    String? status,
    String? ownerUserId,
    String? dateRange,
  }) {
    return RoomFilterState(
      search: search ?? this.search,
      status: status ?? this.status,
      ownerUserId: ownerUserId ?? this.ownerUserId,
      dateRange: dateRange ?? this.dateRange,
    );
  }

  bool get hasActiveFilters =>
      search.isNotEmpty ||
      status != 'all' ||
      ownerUserId.isNotEmpty ||
      dateRange != 'all';
}

List<Room> filterRooms(List<Room> rooms, RoomFilterState filter) {
  var filtered = rooms;

  if (filter.search.isNotEmpty) {
    final searchLower = filter.search.toLowerCase();
    filtered = filtered.where((room) =>
      room.title.toLowerCase().contains(searchLower) ||
      room.id.toLowerCase().contains(searchLower) ||
      room.ownerUserId.toLowerCase().contains(searchLower)
    ).toList();
  }

  if (filter.status != 'all') {
    filtered = filtered.where((room) => room.status == filter.status).toList();
  }

  if (filter.ownerUserId.isNotEmpty) {
    filtered = filtered.where((room) => room.ownerUserId == filter.ownerUserId).toList();
  }

  return filtered;
}
