class PaginatedListResult<T> {
  final List<T> items;
  final String? nextCursor;

  const PaginatedListResult({
    required this.items,
    this.nextCursor,
  });
}
