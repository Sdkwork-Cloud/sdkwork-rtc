from __future__ import annotations

from typing import Protocol, TypeVar


NativeClientT = TypeVar("NativeClientT")


class RtcStandardContract:
    symbol = "RtcStandardContract"


class RtcProviderDriver(Protocol[NativeClientT]):
    @property
    def provider_key(self) -> str:
        ...

    def create_client(self) -> "RtcClient[NativeClientT]":
        ...


class RtcDriverManager(Protocol[NativeClientT]):
    def resolve_driver(self, provider_key: str) -> RtcProviderDriver[NativeClientT]:
        ...


class RtcDataSource(Protocol[NativeClientT]):
    def create_client(self) -> "RtcClient[NativeClientT]":
        ...


class RtcClient(Protocol[NativeClientT]):
    def join(self) -> None:
        ...

    def leave(self) -> None:
        ...

    def publish(self, track_id: str) -> None:
        ...

    def unpublish(self, track_id: str) -> None:
        ...

    def mute_audio(self, muted: bool) -> None:
        ...

    def mute_video(self, muted: bool) -> None:
        ...

    def unwrap(self) -> NativeClientT | None:
        ...


class RtcRuntimeController(Protocol[NativeClientT]):
    def join(self) -> None:
        ...

    def leave(self) -> None:
        ...

    def publish(self, track_id: str) -> None:
        ...

    def unpublish(self, track_id: str) -> None:
        ...

    def mute_audio(self, muted: bool) -> None:
        ...

    def mute_video(self, muted: bool) -> None:
        ...
