import { ConnectionWidget } from "@ui/widgets/connection-widget";
import { ProfilesWidget } from "@ui/widgets/profiles-widget";
import { IpInfoWidget } from "@ui/widgets/ip-info-widget";

export function UIHomeScreen() {
  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          minHeight: "100vh",
        }}
      >
        <div style={{ width: 360 }}>
          <ProfilesWidget />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "0 24px",
          }}
        >
          <ConnectionWidget />
          <div>
            <IpInfoWidget />
          </div>
        </div>
      </div>
    </>
  );
}
