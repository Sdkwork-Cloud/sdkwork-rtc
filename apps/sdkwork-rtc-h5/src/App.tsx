import { AuthGate } from "./AuthGate";
import { bootstrap } from "./bootstrap/runtime";

bootstrap();

export default function App() {
  return (
    <AuthGate>
      <div className="rtc-app">
        <h1>SDKWork RTC</h1>
        <p>Real-Time Communication</p>
      </div>
    </AuthGate>
  );
}
