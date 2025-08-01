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
        }}
      >
        <div
          style={{
            width: 360,
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ProfilesWidget />
        </div>
        <ConnectionWidget />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
          }}
        ></div>
      </div>
    </>
  );
}
