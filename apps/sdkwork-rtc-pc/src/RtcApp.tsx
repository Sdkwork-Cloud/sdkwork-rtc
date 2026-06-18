import { useMemo, useState } from "react";
import { AppLayout } from "@sdkwork/rtc-pc-shell";
import {
  MediaSessionRoomPage,
  MediaSessionsPage,
  createRtcMediaWorkspaceManifest,
} from "@sdkwork/rtc-pc-rtc";
import { readRtcIamSessionTokens, toRtcAppSession } from "@sdkwork/rtc-pc-core";

import { AppAuthGate } from "./AppAuthGate";
import { createAppServices } from "./bootstrap/appServices";
import { resolveEnvironment } from "./bootstrap/environment";

interface RtcAppProps {
  route: string;
}

function parseMediaSessionRoute(route: string): string | null {
  const match = route.match(/^\/rtc\/media-sessions\/([^/]+)$/u);
  return match?.[1] ?? null;
}

export function RtcApp({ route }: RtcAppProps) {
  const services = useMemo(() => createAppServices(), []);
  const environment = useMemo(() => resolveEnvironment(), []);
  const workspace = useMemo(() => createRtcMediaWorkspaceManifest(), []);
  const session = useMemo(() => toRtcAppSession(readRtcIamSessionTokens()), []);
  const [participantId, setParticipantId] = useState(session?.userId ?? "user");

  const sessionId = parseMediaSessionRoute(route);
  const activePath = route.startsWith("/rtc") ? route : workspace.routePath;

  const renderRoute = () => {
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

  return (
    <AppAuthGate>
      <AppLayout activePath={activePath}>{renderRoute()}</AppLayout>
    </AppAuthGate>
  );
}
