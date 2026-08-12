import { useMemo, useState } from "react";
import { AppLayout } from "@sdkwork/rtc-h5-shell";
import {
  MediaSessionRoomPage,
  MediaSessionsPage,
  createRtcMediaWorkspaceManifest,
} from "@sdkwork/rtc-h5-rtc";
import { RtcCallPage } from "@sdkwork/rtc-h5-call";
import { readRtcIamSessionTokens, toRtcAppSession } from "@sdkwork/rtc-h5-core";

import { createAppServices } from "./bootstrap/appServices";
import { resolveEnvironment } from "./bootstrap/environment";

interface RtcAppProps {
  route: string;
}

function parseMediaSessionRoute(route: string): string | null {
  const match = route.match(/^\/rtc\/media-sessions\/([^/]+)$/u);
  return match?.[1] ?? null;
}

function parseCallRoute(route: string): "video" | "voice" | null {
  const match = route.match(/^\/rtc\/calls\/(video|voice)$/u);
  return (match?.[1] as "video" | "voice" | undefined) ?? null;
}

export function RtcApp({ route }: RtcAppProps) {
  const services = useMemo(() => createAppServices(), []);
  const environment = useMemo(() => resolveEnvironment(), []);
  const workspace = useMemo(() => createRtcMediaWorkspaceManifest(), []);
  const session = useMemo(() => toRtcAppSession(readRtcIamSessionTokens()), []);
  const [participantId, setParticipantId] = useState(session?.userId ?? "user");

  const sessionId = parseMediaSessionRoute(route);
  const callType = parseCallRoute(route);
  const activePath = route.startsWith("/rtc") ? route : workspace.routePath;

  const renderRoute = () => {
    // Demo call surface: real signaling is injected by the host application
    // (IM H5 adapter implements RtcCallSignalingPort). Without signaling the
    // page is fail-closed and shows the typed unavailable state.
    if (callType) {
      return (
        <RtcCallPage
          type={callType}
          targetName={session?.userId ?? "Demo User"}
          onExit={() => {
            window.location.hash = "#/rtc/media-sessions";
          }}
        />
      );
    }

    if (sessionId) {
      return (
        <MediaSessionRoomPage
          services={services}
          sessionId={sessionId}
          participantId={participantId}
          displayName={session?.userId ?? participantId}
          onParticipantIdChange={setParticipantId}
        />
      );
    }

    if (route === "/rtc/media-sessions" || route === workspace.routePath) {
      return (
        <MediaSessionsPage
          services={services}
          defaultMediaMode={environment.defaultMediaMode}
          onOpenSession={(id) => {
            window.location.hash = `#/rtc/media-sessions/${id}`;
          }}
        />
      );
    }

    return (
      <div>
        <h2>Page Not Found</h2>
        <p>Unknown RTC route: {route}</p>
        <a href="#/rtc/media-sessions">Go to Media Sessions</a>
      </div>
    );
  };

  return <AppLayout activePath={activePath}>{renderRoute()}</AppLayout>;
}
